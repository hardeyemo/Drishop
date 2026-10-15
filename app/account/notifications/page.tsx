import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { NotificationList, type AccountNotification } from "@/components/account/notification-list";

export const metadata: Metadata = { title: "Notifications" };

export default async function NotificationsPage() {
  const user = await requireUser("/account/notifications");
  const supabase = await createClient();
  const { data, error } = await supabase.from("notifications")
    .select("id,title,body,href,read_at,created_at")
    .eq("user_id", user.id).order("created_at", { ascending: false }).limit(100);
  if (error) throw new Error("Could not load notifications.");

  return (
    <section aria-labelledby="notifications-heading">
      <h2 id="notifications-heading" className="font-display text-xl font-bold">Notifications</h2>
      <p className="mb-5 mt-1 text-sm text-neutral-600">Updates about your orders and account.</p>
      <NotificationList initialItems={(data ?? []) as AccountNotification[]} />
    </section>
  );
}
