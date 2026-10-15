import "server-only";
import { createClient } from "@/lib/supabase/server";
import { CARD_SELECT, toCard, type CardRow } from "@/lib/data/catalog";
import type { ProductCardData } from "@/lib/types";
import { hasFridayDealSchema } from "@/lib/data/friday-deal-schema";

export async function isWishlisted(userId: string, productId: string): Promise<boolean> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("wishlists")
    .select("product_id")
    .eq("user_id", userId)
    .eq("product_id", productId)
    .maybeSingle();
  return Boolean(data);
}

export async function getWishlist(userId: string): Promise<ProductCardData[]> {
  const supabase = await createClient();
  const cardSelect = await hasFridayDealSchema(supabase)
    ? CARD_SELECT
    : CARD_SELECT.replace(",friday_deal_price_kobo", "");
  const { data, error } = await supabase
    .from("wishlists")
    .select(`created_at, product:products(${cardSelect})`)
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw new Error(`Wishlist query failed: ${error.message}`);
  // Inactive products come back null under RLS; drop them.
  return ((data ?? []) as unknown as { product: CardRow | null }[])
    .filter((r) => r.product)
    .map((r) => toCard(r.product as CardRow));
}

export async function getUnreadNotificationCount(userId: string): Promise<number> {
  const supabase = await createClient();
  const { count, error } = await supabase.from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId).is("read_at", null);
  if (error) return 0;
  return count ?? 0;
}
