"use server";

import { createPublicClient } from "@/lib/supabase/public";
import { toCard, type CardRow, CARD_SELECT } from "@/lib/data/catalog";

export async function getRecentlyViewedProducts(slugs: unknown) {
  if (!Array.isArray(slugs)) return [];
  const safeSlugs = [...new Set(slugs.filter((slug): slug is string =>
    typeof slug === "string" && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug),
  ))].slice(0, 6);
  if (!safeSlugs.length) return [];

  const db = createPublicClient();
  const { data, error } = await db.from("products").select(CARD_SELECT)
    .eq("is_active", true).gt("total_stock", 0).in("slug", safeSlugs);
  if (error) return [];

  const bySlug = new Map(((data ?? []) as unknown as CardRow[]).map((row) => [row.slug, toCard(row)]));
  return safeSlugs.flatMap((slug) => bySlug.has(slug) ? [bySlug.get(slug)!] : []);
}
