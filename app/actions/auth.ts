"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getSiteUrl } from "@/lib/env";
import { safeNext } from "@/lib/safe-redirect";
import type { ActionState } from "@/lib/action-state";
import { forgotSchema, loginSchema, newPasswordSchema, registerSchema } from "@/lib/validation/auth";

const str = (v: FormDataEntryValue | null) => (typeof v === "string" ? v : "");

export async function login(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const raw = { email: str(formData.get("email")), password: str(formData.get("password")) };
  const parsed = loginSchema.safeParse(raw);
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors, values: { email: raw.email } };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) {
    const unconfirmed = error.message.toLowerCase().includes("not confirmed");
    return {
      error: unconfirmed
        ? "Confirm your email first. Check your inbox for the link we sent."
        : "Incorrect email or password.",
      values: { email: raw.email },
    };
  }
  redirect(safeNext(formData.get("next")));
}

export async function register(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const raw = {
    fullName: str(formData.get("fullName")),
    email: str(formData.get("email")),
    password: str(formData.get("password")),
    confirm: str(formData.get("confirm")),
  };
  const values = { fullName: raw.fullName, email: raw.email };
  const parsed = registerSchema.safeParse(raw);
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors, values };

  const next = safeNext(formData.get("next"), "/");
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: { full_name: parsed.data.fullName },
      emailRedirectTo: `${getSiteUrl()}/auth/callback?next=${encodeURIComponent(next)}`,
    },
  });
  if (error) {
    const exists = error.message.toLowerCase().includes("already registered");
    return {
      error: exists
        ? "An account with this email already exists. Try signing in instead."
        : "We couldn't create your account. Please try again in a moment.",
      values,
    };
  }
  // Email confirmation on: no session yet. Off: the user is already signed in.
  if (data.session) redirect(next);
  return { ok: true, message: "Check your email. We sent a link to confirm your account." };
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}

export async function requestPasswordReset(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = forgotSchema.safeParse({ email: str(formData.get("email")) });
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors };

  const supabase = await createClient();
  await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${getSiteUrl()}/auth/callback?next=${encodeURIComponent("/account/security")}`,
  });
  // Same answer whether or not the account exists, so this can't be used to probe for emails.
  return { ok: true, message: "If an account exists for that email, we've sent a link to reset your password." };
}

export async function updatePassword(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = newPasswordSchema.safeParse({
    password: str(formData.get("password")),
    confirm: str(formData.get("confirm")),
  });
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/account/security");

  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) return { error: "We couldn't update your password. Sign in again and retry." };
  return { ok: true, message: "Password updated." };
}
