import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";

let warnedAboutMissingMigration = false;
const SCHEMA_CACHE_MS = 60_000;
let cachedSchema: { value: boolean; expiresAt: number } | null = null;
let pendingSchemaCheck: Promise<boolean> | null = null;

/** Detect rollout lag so real catalogue data remains available before migration 0009. */
export async function hasFridayDealSchema(db: SupabaseClient): Promise<boolean> {
  if (cachedSchema && cachedSchema.expiresAt > Date.now()) return cachedSchema.value;
  if (pendingSchemaCheck) return pendingSchemaCheck;

  pendingSchemaCheck = (async () => {
    const { error } = await db.from("product_variants").select("friday_deal_price_kobo").limit(0);
    if (!error) {
      cachedSchema = { value: true, expiresAt: Date.now() + SCHEMA_CACHE_MS };
      return true;
    }

    const missingColumn = error.code === "42703"
      || (error.code === "PGRST204" && error.message.includes("friday_deal_price_kobo"));
    if (!missingColumn) {
      console.error("[catalogue] Could not verify Friday deal schema", { code: error.code ?? "unknown" });
      throw new Error("Could not load catalogue data.");
    }

    if (!warnedAboutMissingMigration) {
      console.warn("[catalogue] Friday deals are disabled until Supabase migration 0009 is applied.");
      warnedAboutMissingMigration = true;
    }
    cachedSchema = { value: false, expiresAt: Date.now() + SCHEMA_CACHE_MS };
    return false;
  })();

  try {
    return await pendingSchemaCheck;
  } finally {
    pendingSchemaCheck = null;
  }
}
