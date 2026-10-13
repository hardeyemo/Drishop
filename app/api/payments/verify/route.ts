import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendOrderEmail } from "@/lib/email";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const reference = url.searchParams.get("reference") ?? "";
  const admin = createAdminClient();
  const { data: payment } = await admin.from("payments").select("id,order_id,amount_kobo,currency")
    .eq("provider", "paystack").eq("reference", reference).maybeSingle();
  if (!payment || !process.env.PAYSTACK_SECRET_KEY) return NextResponse.redirect(new URL("/account", url.origin));

  const response = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
    headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` }, cache: "no-store",
  });
  const result = await response.json().catch(() => null);
  let paid = false;
  if (response.ok && result?.status && result.data?.status === "success"
      && result.data.amount === payment.amount_kobo && result.data.currency === payment.currency
      && result.data.reference === reference) {
    const { data, error } = await admin.rpc("confirm_paystack_payment", {
      p_reference: reference,
      p_transaction_id: String(result.data.id),
      p_raw: result.data,
    });
    if (error) console.error("Could not confirm Paystack payment", error.message);
    paid = data === true;
    if (paid) await sendOrderEmail(payment.order_id, "paid");
  }
  const { data: order } = await admin.from("orders").select("order_number").eq("id", payment.order_id).maybeSingle();
  if (!order) return NextResponse.redirect(new URL("/account", url.origin));
  return NextResponse.redirect(new URL(`/account/orders/${order.order_number}?payment=${paid ? "success" : "pending"}`, url.origin));
}
