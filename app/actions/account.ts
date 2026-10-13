"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/auth";
import type { ActionState } from "@/lib/action-state";
import { profileSchema } from "@/lib/validation/auth";

export async function updateProfile(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await getUser();
  if (!user) return { error: "Your session has expired. Sign in again." };

  const raw = {
    fullName: String(formData.get("fullName") ?? ""),
    phone: String(formData.get("phone") ?? ""),
  };
  const parsed = profileSchema.safeParse(raw);
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors, values: raw };

  // Runs as the signed-in user, so RLS limits this to their own row (and the role guard blocks role edits).
  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({ full_name: parsed.data.fullName, phone: parsed.data.phone || null })
    .eq("id", user.id);
  if (error) return { error: "We couldn't save your changes. Please try again.", values: raw };

  revalidatePath("/account");
  return { ok: true, message: "Profile saved.", values: raw };
}

export type WishlistResult = { ok: boolean; saved?: boolean; needsSignIn?: boolean };

export async function toggleWishlist(productId: string): Promise<WishlistResult> {
  if (!z.string().uuid().safeParse(productId).success) return { ok: false };
  const user = await getUser();
  if (!user) return { ok: false, needsSignIn: true };

  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("wishlists")
    .select("product_id")
    .eq("user_id", user.id)
    .eq("product_id", productId)
    .maybeSingle();

  const { error } = existing
    ? await supabase.from("wishlists").delete().eq("user_id", user.id).eq("product_id", productId)
    : await supabase.from("wishlists").insert({ user_id: user.id, product_id: productId });
  if (error) return { ok: false };

  revalidatePath("/account/wishlist");
  return { ok: true, saved: !existing };
}
