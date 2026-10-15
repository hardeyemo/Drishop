"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/auth";
import type { ActionState } from "@/lib/action-state";
import { profileSchema } from "@/lib/validation/auth";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSupabaseEnv } from "@/lib/env";

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

export async function deleteAccount(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await getUser();
  if (!user) return { error: "Your session has expired. Sign in again." };

  if (formData.get("confirmation") !== "DELETE MY ACCOUNT") {
    return { fieldErrors: { confirmation: ["Type DELETE MY ACCOUNT exactly to confirm."] } };
  }
  const password = String(formData.get("password") ?? "");
  const emailIdentity = user.app_metadata?.provider === "email"
    || (user.identities ?? []).some((identity) => identity.provider === "email");

  if (emailIdentity) {
    if (!password || password.length > 72) {
      return { fieldErrors: { password: ["Enter your current password to confirm account deletion."] } };
    }
    const { url, anonKey } = getSupabaseEnv();
    const verifier = createSupabaseClient(url, anonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { error } = await verifier.auth.signInWithPassword({ email: user.email ?? "", password });
    if (error) return { fieldErrors: { password: ["That password is incorrect."] } };
  } else {
    const lastSignIn = user.last_sign_in_at ? Date.parse(user.last_sign_in_at) : 0;
    if (!lastSignIn || Date.now() - lastSignIn > 10 * 60 * 1000) {
      return { error: "For your security, sign out and sign back in with your identity provider, then retry account deletion." };
    }
  }

  const supabase = await createClient();
  const { data: profile, error: profileError } = await supabase
    .from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (profileError || !profile) return { error: "We couldn't verify your account. Please try again." };
  if (profile.role === "admin") {
    const { count, error } = await createAdminClient().from("profiles")
      .select("id", { count: "exact", head: true }).eq("role", "admin");
    if (error || (count ?? 0) <= 1) {
      return { error: "The last administrator account can't be deleted. Promote another administrator first." };
    }
  }

  const { error } = await createAdminClient().auth.admin.deleteUser(user.id);
  if (error) return { error: "We couldn't delete your account. Please try again or contact support." };
  try { await supabase.auth.signOut(); } catch { /* The auth user is already deleted; the browser will clear local data next. */ }
  revalidatePath("/account");
  return { ok: true, message: "Your account has been deleted." };
}
