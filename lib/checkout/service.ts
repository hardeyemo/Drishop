import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";
import { FREE_SHIPPING_THRESHOLD_KOBO, RESERVATION_MINUTES } from "@/lib/site-config";
import { formatNaira } from "@/lib/format";
import type { Quote } from "@/lib/checkout/types";
import { consolidateQuoteItems, verifyQuoteResult, type QuoteRpcResult } from "@/lib/checkout/quote-validation";

export class CheckoutError extends Error {
  constructor(
    public code: string,
    message: string,
    public field: "cart" | "discount" | "shipping" | "address" = "cart",
    public variantId?: string,
  ) {
    super(message);
  }
}

type RpcResult = QuoteRpcResult & {
  order_id?: string;
  order_number?: string;
  existing?: boolean;
};

type CallArgs = {
  userId: string;
  email: string;
  items: { variantId: string; quantity: number }[];
  address: Record<string, string>;
  code?: string;
  notes?: string;
  idempotencyKey?: string;
};

async function variantLabel(admin: SupabaseClient, variantId?: string): Promise<string> {
  if (!variantId) return "An item in your cart";
  const { data } = await admin
    .from("product_variants")
    .select("name, product:products(name)")
    .eq("id", variantId)
    .maybeSingle();
  const row = data as unknown as { name: string; product: { name: string } | null } | null;
  if (!row?.product) return "An item in your cart";
  return row.name && row.name !== "Default" ? `${row.product.name} (${row.name})` : row.product.name;
}

async function toCheckoutError(
  admin: SupabaseClient,
  error: { message: string; details?: string | null },
): Promise<CheckoutError> {
  const detail = error.details ?? undefined;
  switch (error.message) {
    case "EMPTY_CART":
      return new CheckoutError("EMPTY_CART", "Your cart is empty.");
    case "CART_TOO_LARGE":
      return new CheckoutError("CART_TOO_LARGE", "Your cart is too large to check out in one order. Remove some items.");
    case "MINIMUM_CART_SUBTOTAL":
      return new CheckoutError("MINIMUM_CART_SUBTOTAL", "Your merchandise subtotal must be at least ₦10,000 to check out.");
    case "INVALID_QUANTITY":
      return new CheckoutError("INVALID_QUANTITY", "One of your items has an invalid quantity. Update your cart.", "cart", detail);
    case "ITEM_UNAVAILABLE":
      return new CheckoutError(
        "ITEM_UNAVAILABLE",
        `${await variantLabel(admin, detail)} is no longer available. Remove it from your cart.`,
        "cart",
        detail,
      );
    case "OUT_OF_STOCK":
      return new CheckoutError(
        "OUT_OF_STOCK",
        `${await variantLabel(admin, detail)} doesn't have enough stock for the quantity in your cart. Lower the quantity or remove it.`,
        "cart",
        detail,
      );
    case "INVALID_DISCOUNT": {
      if (detail === "used_up") return new CheckoutError("INVALID_DISCOUNT", "That code has reached its usage limit.", "discount");
      if (detail?.startsWith("min_order:")) {
        const min = Number(detail.split(":")[1]);
        return new CheckoutError("INVALID_DISCOUNT", `Spend at least ${formatNaira(min)} to use this code.`, "discount");
      }
      return new CheckoutError("INVALID_DISCOUNT", "That code isn't valid.", "discount");
    }
    case "SHIPPING_UNAVAILABLE":
      return new CheckoutError("SHIPPING_UNAVAILABLE", "We don't deliver to that state yet.", "shipping");
    case "FIRST_ORDER_OFFER_RESERVED":
      return new CheckoutError("FIRST_ORDER_OFFER_RESERVED", `Your free-delivery offer is reserved for a pending order${detail ? ` ${detail}` : ""}. Complete or cancel that order before starting another checkout.`, "cart");
    case "INVALID_ADDRESS":
      return new CheckoutError("INVALID_ADDRESS", "Check your delivery details and try again.", "address");
    default:
      console.error("create_order failed", error);
      return new CheckoutError("UNKNOWN", "Something went wrong. Please try again.");
  }
}

async function callCreateOrder(args: CallArgs, dryRun: boolean): Promise<RpcResult> {
  const admin = createAdminClient();
  const { data, error } = await admin.rpc("create_order", {
    p_user_id: args.userId,
    p_email: args.email,
    p_items: args.items.map((i) => ({ variant_id: i.variantId, quantity: i.quantity })),
    p_address: args.address,
    p_discount_code: args.code || null,
    p_notes: args.notes || null,
    p_free_shipping_threshold_kobo: FREE_SHIPPING_THRESHOLD_KOBO,
    p_reservation_minutes: RESERVATION_MINUTES,
    p_dry_run: dryRun,
    p_idempotency_key: args.idempotencyKey ?? null,
  });

  if (error) {
    // Two identical submissions raced: the unique index let one win. Return the winner.
    if (error.code === "23505" && args.idempotencyKey) {
      const { data: existing } = await admin
        .from("orders")
        .select("id, order_number")
        .eq("user_id", args.userId)
        .eq("idempotency_key", args.idempotencyKey)
        .maybeSingle();
      if (existing) return { order_id: existing.id, order_number: existing.order_number, existing: true };
    }
    throw await toCheckoutError(admin, error);
  }
  return data as RpcResult;
}

/** Authoritative prices, stock check, discount and shipping. Writes nothing. */
export async function priceCart(args: Omit<CallArgs, "address" | "notes" | "idempotencyKey"> & { state?: string }): Promise<Quote> {
  const requestedItems = consolidateQuoteItems(args.items);
  const res = await callCreateOrder({ ...args, items: requestedItems, address: args.state ? { state: args.state } : {} }, true);
  const verification = verifyQuoteResult(res, requestedItems, Boolean(args.state));
  if (!verification.quote) {
    console.error("[checkout] Server quote failed integrity verification", {
      reason: verification.reason,
      requestedLineCount: requestedItems.length,
      returnedLineCount: Array.isArray(res.lines) ? res.lines.length : null,
    });
    throw new CheckoutError("INVALID_QUOTE", "We couldn't verify current prices. Please refresh checkout.");
  }
  return verification.quote;
}

/** Creates the order and reserves stock atomically. */
export async function createOrder(args: CallArgs): Promise<{ orderId: string; orderNumber: string }> {
  // Free any expired reservations first so their stock is available to this customer.
  await createAdminClient().rpc("release_expired_orders");
  const res = await callCreateOrder(args, false);
  if (!res.order_id || !res.order_number) throw new CheckoutError("UNKNOWN", "Something went wrong. Please try again.");
  return { orderId: res.order_id, orderNumber: res.order_number };
}

export async function cancelUnpaidOrder(orderId: string, note: string): Promise<boolean> {
  const { data, error } = await createAdminClient().rpc("cancel_order", { p_order_id: orderId, p_note: note });
  if (error) {
    console.error("cancel_order failed", error);
    return false;
  }
  return data === true;
}
