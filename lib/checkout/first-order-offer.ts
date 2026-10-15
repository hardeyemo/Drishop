import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";

export type FirstOrderOfferStatus = "anonymous" | "eligible" | "reserved" | "used";

/** The database is authoritative for offer eligibility; this helper is for truthful UI messaging only. */
export async function getFirstOrderOfferStatus(userId: string | null | undefined): Promise<FirstOrderOfferStatus> {
  if (!userId) return "anonymous";
  const db = createAdminClient();
  const [paidResult, paidAtResult, reservedResult, legacyPendingResult] = await Promise.all([
    db.from("orders").select("id").eq("user_id", userId)
      .in("status", ["paid", "processing", "shipped", "delivered", "refunded"]).limit(1),
    db.from("orders").select("id").eq("user_id", userId).not("paid_at", "is", null).limit(1),
    db.from("orders").select("order_number").eq("user_id", userId)
      .eq("status", "pending")
      .gt("expires_at", new Date().toISOString()).limit(1),
    db.from("orders").select("order_number").eq("user_id", userId)
      .eq("status", "pending").is("expires_at", null).limit(1),
  ]);
  if (paidResult.error || paidAtResult.error || reservedResult.error || legacyPendingResult.error) {
    throw new Error("Could not check first-order delivery eligibility.");
  }
  if (paidResult.data?.length || paidAtResult.data?.length) return "used";
  if (reservedResult.data?.length || legacyPendingResult.data?.length) return "reserved";
  return "eligible";
}
