"use server";

import { revalidatePath } from "next/cache";
import { z, type ZodError } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/auth";
import { CheckoutError, cancelUnpaidOrder, createOrder, priceCart } from "@/lib/checkout/service";
import type { PlaceOrderResult, QuoteResult } from "@/lib/checkout/types";
import { placeOrderSchema, quoteSchema } from "@/lib/validation/checkout";
import { getFirstOrderOfferStatus, type FirstOrderOfferStatus } from "@/lib/checkout/first-order-offer";

export async function getCurrentFirstOrderOfferStatus(): Promise<FirstOrderOfferStatus> {
  const user = await getUser();
  return getFirstOrderOfferStatus(user?.id);
}

function fieldErrorsFrom(error: ZodError) {
  const out: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[issue.path.length - 1] ?? "form");
    (out[key] ??= []).push(issue.message);
  }
  return out;
}

export async function quoteCheckout(input: unknown): Promise<QuoteResult> {
  try {
    const user = await getUser();
    if (!user) return { ok: false, error: "Sign in to continue.", field: "cart" };

    const parsed = quoteSchema.safeParse(input);
    if (!parsed.success) {
      return { ok: false, error: "Your cart has an invalid item. Go back to your cart and try again.", field: "cart" };
    }
    const quote = await priceCart({
      userId: user.id,
      email: user.email ?? "",
      items: parsed.data.items,
      code: parsed.data.code,
      state: parsed.data.state,
    });
    return { ok: true, quote };
  } catch (e) {
    if (e instanceof CheckoutError) return { ok: false, error: e.message, field: e.field, variantId: e.variantId,
      offerReserved: e.code === "FIRST_ORDER_OFFER_RESERVED" };
    console.error("quoteCheckout failed during session or price lookup:", e instanceof Error ? e.name : "Unknown server error");
    return { ok: false, error: "We couldn't verify prices right now. Please retry in a moment.", field: "cart" };
  }
}

export async function placeOrder(input: unknown): Promise<PlaceOrderResult> {
  const user = await getUser();
  if (!user || !user.email) return { ok: false, error: "Your session has expired. Sign in again.", field: "cart" };

  const parsed = placeOrderSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Check the highlighted fields.",
      field: "address",
      fieldErrors: fieldErrorsFrom(parsed.error),
    };
  }
  const { items, address, discountCode, notes, saveAddress, idempotencyKey } = parsed.data;

  let orderNumber: string;
  try {
    const order = await createOrder({
      userId: user.id,
      email: user.email,
      items,
      address: {
        recipient_name: address.recipientName,
        phone: address.phone,
        line1: address.line1,
        line2: address.line2 ?? "",
        city: address.city,
        state: address.state,
        country: "NG",
      },
      code: discountCode,
      notes,
      idempotencyKey,
    });
    orderNumber = order.orderNumber;
  } catch (e) {
    if (e instanceof CheckoutError) return { ok: false, error: e.message, field: e.field, variantId: e.variantId,
      offerReserved: e.code === "FIRST_ORDER_OFFER_RESERVED" };
    console.error("placeOrder failed", e);
    return { ok: false, error: "Something went wrong. Please try again.", field: "cart" };
  }

  // Best effort: a failure here must not undo an order that was placed successfully.
  if (saveAddress) {
    try {
      const supabase = await createClient();
      const { count } = await supabase.from("addresses").select("id", { count: "exact", head: true }).eq("user_id", user.id);
      if ((count ?? 0) < 10) {
        await supabase.from("addresses").insert({
          user_id: user.id,
          recipient_name: address.recipientName,
          phone: address.phone,
          line1: address.line1,
          line2: address.line2 || null,
          city: address.city,
          state: address.state,
          is_default: (count ?? 0) === 0,
        });
      }
    } catch (e) {
      console.error("save address failed", e);
    }
  }

  revalidatePath("/account/orders");
  return { ok: true, orderNumber };
}

export async function cancelOrder(orderId: string): Promise<{ ok: boolean; message?: string }> {
  const user = await getUser();
  if (!user) return { ok: false, message: "Your session has expired. Sign in again." };
  if (!z.string().uuid().safeParse(orderId).success) return { ok: false, message: "Order not found." };

  // Ownership check as the signed-in user: RLS only returns their own orders.
  const supabase = await createClient();
  const { data: order } = await supabase.from("orders").select("id, status, order_number").eq("id", orderId).maybeSingle();
  if (!order) return { ok: false, message: "Order not found." };
  if (order.status !== "pending") return { ok: false, message: "This order can no longer be cancelled." };

  const done = await cancelUnpaidOrder(order.id, "Cancelled by customer");
  if (!done) return { ok: false, message: "This order can no longer be cancelled." };

  revalidatePath(`/account/orders/${order.order_number}`);
  return { ok: true };
}
