import "server-only";
import { createClient } from "@/lib/supabase/server";
import { CARD_SELECT, toCard, type CardRow } from "@/lib/data/catalog";
import type { ProductCardData } from "@/lib/types";

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
  const { data, error } = await supabase
    .from("wishlists")
    .select(`created_at, product:products(${CARD_SELECT})`)
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw new Error(`Wishlist query failed: ${error.message}`);
  // Inactive products come back null under RLS; drop them.
  return ((data ?? []) as unknown as { product: CardRow | null }[])
    .filter((r) => r.product)
    .map((r) => toCard(r.product as CardRow));
}
