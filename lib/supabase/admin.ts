import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseEnv } from "@/lib/env";

/**
 * Service-role client. Bypasses RLS: use ONLY in server code, only for operations the app
 * has already authorised, and never pass its results through unfiltered.
 */
export function createAdminClient(): SupabaseClient {
  const { url } = getSupabaseEnv();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set. Add it to .env.local (server only).");
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}
