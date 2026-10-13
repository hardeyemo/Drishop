"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { sendOrderEmail } from "@/lib/email";

const orderSchema = z.object({
  orderId: z.string().uuid(),
  status: z.enum(["processing", "shipped", "delivered"]),
  carrier: z.string().trim().max(80).optional(),
  trackingNumber: z.string().trim().max(120).optional(),
});

export async function updateOrderStatus(formData: FormData) {
  await requireAdmin();
  const parsed = orderSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return;
  const db = await createClient();
  const { data: order } = await db.from("orders").select("id,status,order_number").eq("id", parsed.data.orderId).maybeSingle();
  if (!order) return;
  const transitions: Record<string, string[]> = { paid: ["processing"], processing: ["shipped"], shipped: ["delivered"] };
  if (!transitions[order.status]?.includes(parsed.data.status)) return;
  const { error } = await db.from("orders").update({
    status: parsed.data.status,
    carrier: parsed.data.carrier || null,
    tracking_number: parsed.data.trackingNumber || null,
  }).eq("id", order.id).eq("status", order.status);
  if (error) return;
  await db.from("order_events").insert({ order_id: order.id, status: parsed.data.status,
    note: `Status updated by Shopora admin${parsed.data.trackingNumber ? `; tracking ${parsed.data.trackingNumber}` : ""}.` });
  if (parsed.data.status === "shipped") await sendOrderEmail(order.id, "shipped");
  revalidatePath("/admin");
  revalidatePath(`/account/orders/${order.order_number}`);
}

export async function toggleProductStatus(formData: FormData) {
  await requireAdmin();
  const parsed = z.object({ productId: z.string().uuid(), active: z.enum(["true", "false"]) })
    .safeParse(Object.fromEntries(formData));
  if (!parsed.success) return;
  const db = await createClient();
  await db.from("products").update({ is_active: parsed.data.active === "true" }).eq("id", parsed.data.productId);
  revalidatePath("/admin");
  revalidatePath("/products");
}
