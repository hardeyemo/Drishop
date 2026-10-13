import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatNaira } from "@/lib/format";

const escapeHtml = (value: string) => value.replace(/[&<>"']/g, (char) => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;",
}[char]!));

/** Sends one idempotent transactional email for an order event through Resend. */
export async function sendOrderEmail(orderId: string, event: "paid" | "shipped") {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  if (!apiKey || !from) return;
  const db = createAdminClient();
  const { data: claimed, error: claimError } = await db.rpc("claim_order_email", { p_order_id: orderId, p_event: event });
  if (claimError || !claimed) {
    if (claimError) console.error("Could not claim order email", claimError.message);
    return;
  }
  const { data: order } = await db.from("orders").select("email,order_number,total_kobo").eq("id", orderId).maybeSingle();
  if (!order) {
    await db.from("email_notifications").update({ status: "failed" }).eq("id", claimed);
    return;
  }
  const subject = event === "paid" ? `Payment confirmed for ${order.order_number}` : `Your order ${order.order_number} has shipped`;
  const detail = event === "paid"
    ? `We have confirmed your payment of ${formatNaira(order.total_kobo)}.`
    : "Your order is on its way. Sign in to view tracking updates.";
  const origin = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const html = `<p>Thanks for shopping with Shopora.</p><p>${escapeHtml(detail)}</p><p>Order <strong>${escapeHtml(order.order_number)}</strong></p><p><a href="${origin}/account/orders/${encodeURIComponent(order.order_number)}">View your order</a></p>`;
  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST", headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from, to: [order.email], subject, html }), cache: "no-store",
    });
    await db.from("email_notifications").update({ status: response.ok ? "sent" : "failed" }).eq("id", claimed);
    if (!response.ok) console.error("Order email failed", response.status);
  } catch (error) {
    await db.from("email_notifications").update({ status: "failed" }).eq("id", claimed);
    console.error("Order email failed", error);
  }
}
