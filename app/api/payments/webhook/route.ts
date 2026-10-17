import { createHmac, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendOrderEmail } from "@/lib/email";

export async function POST(request: Request) {
  const secret = process.env.PAYSTACK_SECRET_KEY;
  if (!secret) return NextResponse.json({ error: "Unavailable" }, { status: 503 });
  const raw = await request.text();
  const signature = request.headers.get("x-paystack-signature") ?? "";
  const expected = createHmac("sha512", secret).update(raw).digest("hex");
  const providedBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);
  if (providedBuffer.length !== expectedBuffer.length || !timingSafeEqual(providedBuffer, expectedBuffer)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }
  let event: { event?: string; data?: { id?: number; reference?: string; status?: string; amount?: number; currency?: string } };
  try { event = JSON.parse(raw); }
  catch { return NextResponse.json({ error: "Invalid event payload" }, { status: 400 }); }
  if (event.event !== "charge.success" || !event.data?.reference || !event.data.id) return NextResponse.json({ received: true });

  const db = createAdminClient();
  const eventId = String(event.data.id);
  const { error: insertError } = await db.from("webhook_events").insert({
    provider: "paystack", event_id: eventId, event_type: event.event, payload: event,
  });
  if (insertError?.code === "23505") return NextResponse.json({ received: true });
  if (insertError) return NextResponse.json({ error: "Could not record event" }, { status: 500 });

  const { data: payment } = await db.from("payments").select("order_id,amount_kobo,currency")
    .eq("provider", "paystack").eq("reference", event.data.reference).maybeSingle();
  if (payment && event.data.status === "success" && event.data.amount === payment.amount_kobo && event.data.currency === payment.currency) {
    const { data, error } = await db.rpc("confirm_paystack_payment", {
      p_reference: event.data.reference, p_transaction_id: eventId, p_raw: event.data,
    });
    if (error) return NextResponse.json({ error: "Could not confirm payment" }, { status: 500 });
    if (data === true) await sendOrderEmail(payment.order_id, "paid");
  }
  await db.from("webhook_events").update({ processed_at: new Date().toISOString() })
    .eq("provider", "paystack").eq("event_id", eventId);
  return NextResponse.json({ received: true });
}
