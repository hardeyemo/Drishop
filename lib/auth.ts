import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export const getUser = cache(async () => {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return user;
  } catch {
    return null;
  }
});

export type Profile = {
  id: string;
  email: string;
  fullName: string;
  phone: string;
  role: "customer" | "admin";
};

export const getProfile = cache(async (): Promise<Profile | null> => {
  const user = await getUser();
  if (!user) return null;
  const supabase = await createClient();
  const { data } = await supabase.from("profiles").select("full_name,phone,role").eq("id", user.id).maybeSingle();
  if (!data) return null;
  return {
    id: user.id,
    email: user.email ?? "",
    fullName: data.full_name ?? "",
    phone: data.phone ?? "",
    role: data.role === "admin" ? "admin" : "customer",
  };
});

export async function requireUser(next = "/account") {
  const user = await getUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(next)}`);
  return user;
}

/** Authorisation for admin pages and actions. Always check here too, never rely on the UI hiding links. */
export async function requireAdmin() {
  const profile = await getProfile();
  if (!profile) redirect("/login?next=/admin");
  if (profile.role !== "admin") redirect("/");
  return profile;
}
