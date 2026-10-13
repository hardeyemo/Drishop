import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";
import { FREE_SHIPPING_THRESHOLD_KOBO, RESERVATION_MINUTES } from "@/lib/site-config";
import { formatNaira } from "@/lib/format";
import type { Quote } from "@/lib/checkout/types";

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

type RpcLine = {
  variant_id: string;
  product_id: string;
  slug: string;
  product_name: string;
  variant_name: string | null;
  sku: string;
  unit_price_kobo: number;
  quantity: number;
  line_total_kobo: number;
  stock: number;
};

type RpcResult = {
  order_id?: string;
  order_number?: string;
  existing?: boolean;
  lines?: RpcLine[];
  subtotal_kobo?: number;
  discount_kobo?: number;
  shipping_kobo?: number | null;
  total_kobo?: number;
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
  const res = await callCreateOrder({ ...args, address: args.state ? { state: args.state } : {} }, true);
  const lines = res.lines;
  const integer = (value: unknown): value is number => Number.isSafeInteger(value) && (value as number) >= 0;
  if (!Array.isArray(lines) || lines.length !== args.items.length
      || !integer(res.subtotal_kobo) || !integer(res.discount_kobo)
      || !(res.shipping_kobo === null || integer(res.shipping_kobo)) || !integer(res.total_kobo)) {
    throw new CheckoutError("INVALID_QUOTE", "We couldn't verify current prices. Please refresh checkout.");
  }
  const normalized = lines.map((l) => ({
      variantId: l.variant_id,
      productId: l.product_id,
      slug: l.slug,
      productName: l.product_name,
      variantName: l.variant_name,
      sku: l.sku,
      unitPriceKobo: l.unit_price_kobo,
      quantity: l.quantity,
      lineTotalKobo: l.line_total_kobo,
      stock: l.stock,
    }));
  const validLines = normalized.every((line) => Number.isSafeInteger(line.unitPriceKobo) && line.unitPriceKobo > 0
    && Number.isSafeInteger(line.quantity) && line.quantity > 0
    && Number.isSafeInteger(line.lineTotalKobo) && line.lineTotalKobo === line.unitPriceKobo * line.quantity
    && Number.isSafeInteger(line.stock) && line.stock >= line.quantity
    && args.items.some((item) => item.variantId === line.variantId && item.quantity === line.quantity));
  const subtotal = res.subtotal_kobo;
  const discount = res.discount_kobo;
  const shipping = res.shipping_kobo;
  const total = res.total_kobo;
  if (!validLines || normalized.reduce((sum, line) => sum + line.lineTotalKobo, 0) !== subtotal
      || discount > subtotal || (args.state ? shipping === null : shipping !== null)
      || total !== subtotal - discount + (shipping ?? 0)) {
    throw new CheckoutError("INVALID_QUOTE", "We couldn't verify current prices. Please refresh checkout.");
  }
  return { lines: normalized, subtotalKobo: subtotal, discountKobo: discount, shippingKobo: shipping, totalKobo: total };
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
