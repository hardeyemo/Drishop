"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

const idSchema = z.string().uuid();

export async function markNotificationRead(id: string) {
  const parsed = idSchema.safeParse(id);
  const user = await getUser();
  if (!parsed.success || !user) return { ok: false };
  const supabase = await createClient();
  const { error } = await supabase.from("notifications").update({ read_at: new Date().toISOString() })
    .eq("id", parsed.data).eq("user_id", user.id).is("read_at", null);
  if (error) return { ok: false };
  revalidatePath("/account/notifications");
  revalidatePath("/account", "layout");
  return { ok: true };
}

export async function deleteNotification(id: string) {
  const parsed = idSchema.safeParse(id);
  const user = await getUser();
  if (!parsed.success || !user) return { ok: false };
  const supabase = await createClient();
  const { error } = await supabase.from("notifications").delete()
    .eq("id", parsed.data).eq("user_id", user.id);
  if (error) return { ok: false };
  revalidatePath("/account/notifications");
  revalidatePath("/account", "layout");
  return { ok: true };
}
