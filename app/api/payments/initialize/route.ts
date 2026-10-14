import { NextResponse } from "next/server";
import { z } from "zod";
import { getUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const schema = z.object({ orderNumber: z.string().regex(/^SHP-\d{4,}$/) });

export async function POST(request: Request) {
  const user = await getUser();
  if (!user?.email) return NextResponse.json({ error: "Sign in to pay for this order." }, { status: 401 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid order." }, { status: 400 });

  const supabase = await createClient();
  const { data: order } = await supabase.from("orders")
    .select("id,order_number,status,total_kobo,currency,expires_at")
    .eq("order_number", parsed.data.orderNumber).maybeSingle();
  if (!order) return NextResponse.json({ error: "Order not found." }, { status: 404 });
  if (order.status !== "pending" || (order.expires_at && Date.parse(order.expires_at) <= Date.now())) {
    return NextResponse.json({ error: "This order is no longer available for payment." }, { status: 409 });
  }

  const secret = process.env.PAYSTACK_SECRET_KEY;
  if (!secret) return NextResponse.json({ error: "Online payments are not configured." }, { status: 503 });
  const admin = createAdminClient();
  const { data: activePayment } = await admin.from("payments").select("authorization_url")
    .eq("order_id", order.id).eq("provider", "paystack").eq("status", "initialized").maybeSingle();
  if (activePayment?.authorization_url) return NextResponse.json({ authorizationUrl: activePayment.authorization_url });
  if (activePayment) return NextResponse.json({ error: "Payment setup is already in progress. Retry in a few seconds." }, { status: 409 });

  const reference = `drishop_${crypto.randomUUID().replaceAll("-", "")}`;
  const { error: reserveError } = await admin.from("payments").insert({ order_id: order.id, provider: "paystack", reference,
    amount_kobo: order.total_kobo, currency: order.currency, status: "initialized" });
  if (reserveError) {
    if (reserveError.code === "23505") return NextResponse.json({ error: "Payment setup is already in progress. Retry in a few seconds." }, { status: 409 });
    console.error("Could not reserve Paystack reference", reserveError);
    return NextResponse.json({ error: "Payment could not be prepared. Please retry." }, { status: 500 });
  }
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? new URL(request.url).origin;
  const response = await fetch("https://api.paystack.co/transaction/initialize", {
    method: "POST",
    headers: { Authorization: `Bearer ${secret}`, "Content-Type": "application/json" },
    body: JSON.stringify({ email: user.email, amount: order.total_kobo, currency: order.currency, reference,
      callback_url: `${siteUrl}/api/payments/verify` }),
    cache: "no-store",
  });
  const result = await response.json().catch(() => null);
  if (!response.ok || !result?.status || !result.data?.authorization_url) {
    console.error("Paystack initialization failed", result?.message ?? response.status);
    await admin.from("payments").update({ status: "failed" }).eq("reference", reference);
    return NextResponse.json({ error: "Payment could not start. Open your order and retry." }, { status: 502 });
  }

  const { error } = await admin.from("payments").update({ authorization_url: result.data.authorization_url })
    .eq("reference", reference).eq("status", "initialized");
  if (error) {
    console.error("Could not save Paystack reference", error);
    return NextResponse.json({ error: "Payment could not be prepared. Please retry." }, { status: 500 });
  }
  return NextResponse.json({ authorizationUrl: result.data.authorization_url });
}
