"use server";

import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { MAX_QTY_PER_LINE } from "@/lib/site-config";
import type { CartItem } from "@/lib/cart/types";
import { isFridayDealActive } from "@/lib/friday-deals";
import { hasFridayDealSchema } from "@/lib/data/friday-deal-schema";

const lineSchema = z.object({ variantId: z.string().uuid(), quantity: z.number().int().min(1).max(MAX_QTY_PER_LINE) });
const linesSchema = z.array(lineSchema).max(50);

export type CartActionResult =
  | { ok: true; authenticated: boolean; items: CartItem[]; warning?: string }
  | { ok: false; authenticated: boolean; error: string };

type CartRow = { id: string };
type VariantRow = {
  id: string;
  product_id: string;
  name: string;
  price_kobo: number;
  friday_deal_price_kobo?: number | null;
  stock_quantity: number;
  product: {
    id: string;
    name: string;
    slug: string;
    images: { url: string; alt: string | null; sort_order: number }[];
  } | null;
};

function unavailableItem(variantId: string, quantity: number): CartItem {
  return {
    variantId,
    productId: "",
    slug: "",
    name: "Unavailable item",
    variantName: null,
    priceKobo: 0,
    imageUrl: null,
    quantity,
    maxQuantity: 1,
    availableStock: 0,
    unavailable: true,
  };
}

async function getOrCreateCart(db: SupabaseClient, userId: string): Promise<CartRow> {
  const { data: found, error: findError } = await db.from("carts").select("id").eq("user_id", userId).maybeSingle();
  if (findError) throw findError;
  if (found) return found;

  const { data: created, error: createError } = await db.from("carts").insert({ user_id: userId }).select("id").single();
  if (!createError && created) return created;
  // Concurrent first requests can race against the one-cart-per-customer unique key.
  if (createError?.code === "23505") {
    const { data: raced, error } = await db.from("carts").select("id").eq("user_id", userId).maybeSingle();
    if (!error && raced) return raced;
  }
  throw createError ?? new Error("Could not create cart.");
}

async function getVariant(db: SupabaseClient, variantId: string) {
  const hasFridayDeals = await hasFridayDealSchema(db);
  const { data, error } = await db.from("product_variants")
    .select(`id,product_id,name,price_kobo,${hasFridayDeals ? "friday_deal_price_kobo," : ""}stock_quantity,product:products!inner(id,name,slug,images:product_images(url,alt,sort_order))`)
    .eq("id", variantId)
    .eq("is_active", true)
    .maybeSingle();
  if (error) throw error;
  return (data ?? null) as unknown as VariantRow | null;
}

async function readCart(db: SupabaseClient, cartId: string): Promise<CartItem[]> {
  const { data: rows, error } = await db.from("cart_items")
    .select("variant_id,quantity")
    .eq("cart_id", cartId)
    .order("created_at");
  if (error) throw error;
  if (!rows?.length) return [];

  const ids = rows.map((row) => row.variant_id);
  const hasFridayDeals = await hasFridayDealSchema(db);
  const { data: variants, error: variantsError } = await db.from("product_variants")
    .select(`id,product_id,name,price_kobo,${hasFridayDeals ? "friday_deal_price_kobo," : ""}stock_quantity,product:products!inner(id,name,slug,images:product_images(url,alt,sort_order))`)
    .in("id", ids)
    .eq("is_active", true);
  if (variantsError) throw variantsError;
  const byId = new Map(((variants ?? []) as unknown as VariantRow[]).map((variant) => [variant.id, variant]));

  return rows.map((row) => {
    const variant = byId.get(row.variant_id);
    if (!variant?.product) return unavailableItem(row.variant_id, row.quantity);
    const image = [...(variant.product.images ?? [])].sort((a, b) => a.sort_order - b.sort_order)[0];
    const stock = Math.max(0, variant.stock_quantity);
    const dealPrice = variant.friday_deal_price_kobo;
    const fridayDeal = isFridayDealActive() && stock > 0 && dealPrice != null && dealPrice < variant.price_kobo;
    return {
      variantId: variant.id,
      productId: variant.product_id,
      slug: variant.product.slug,
      name: variant.product.name,
      variantName: variant.name === "Default" ? null : variant.name,
      priceKobo: fridayDeal ? dealPrice : variant.price_kobo,
      imageUrl: image?.url ?? null,
      quantity: row.quantity,
      maxQuantity: Math.max(1, Math.min(stock, MAX_QTY_PER_LINE)),
      availableStock: stock,
      unavailable: stock === 0,
    } satisfies CartItem;
  });
}

function errorMessage(error: unknown) {
  const code = (error as { code?: string } | null)?.code;
  if (code === "42P01" || code === "PGRST205") return "Saved carts are not set up yet. Apply supabase/migrations/0005_carts.sql and try again.";
  console.error("Cart action failed", error);
  return "We couldn't sync your cart. Your current items are still available in this browser; try again.";
}

/** Authenticated carts live in Supabase; the returned prices and stock are always read from the database. */
export async function loadCart(guestInput: unknown): Promise<CartActionResult> {
  const user = await getUser();
  if (!user) return { ok: true, authenticated: false, items: [] };

  const parsed = linesSchema.safeParse(guestInput);
  if (!parsed.success) return { ok: false, authenticated: true, error: "The saved browser cart is invalid. Remove it and try again." };

  try {
    const db = await createClient();
    const cart = await getOrCreateCart(db, user.id);
    let warning = "";

    if (parsed.data.length) {
      const uniqueLines = [...new Map(parsed.data.map((line) => [line.variantId, line])).values()];
      const existingResult = await db.from("cart_items").select("variant_id,quantity").eq("cart_id", cart.id);
      if (existingResult.error) throw existingResult.error;
      const existing = new Map((existingResult.data ?? []).map((line) => [line.variant_id, line.quantity]));

      const activeResult = await db.from("product_variants")
        .select(`id,product_id,name,price_kobo,${await hasFridayDealSchema(db) ? "friday_deal_price_kobo," : ""}stock_quantity,product:products!inner(id,name,slug)`)
        .in("id", uniqueLines.map((line) => line.variantId))
        .eq("is_active", true);
      if (activeResult.error) throw activeResult.error;
      const active = new Map(((activeResult.data ?? []) as unknown as VariantRow[]).map((variant) => [variant.id, variant]));
      const validRows: { cart_id: string; variant_id: string; quantity: number }[] = [];
      const staleRows: { cart_id: string; variant_id: string; quantity: number }[] = [];

      for (const line of uniqueLines) {
        const prior = existing.get(line.variantId) ?? 0;
        const variant = active.get(line.variantId);
        if (!variant) {
          // Keep disabled but still-existing variants visible as removable stale items.
          staleRows.push({ cart_id: cart.id, variant_id: line.variantId, quantity: Math.max(prior, line.quantity) });
          continue;
        }
        const stock = Math.max(0, variant.stock_quantity);
        const quantity = stock > 0
          ? Math.min(Math.max(prior, line.quantity), stock, MAX_QTY_PER_LINE)
          : Math.max(prior, line.quantity);
        if (quantity !== line.quantity && prior < line.quantity) warning = "Some guest-cart quantities were adjusted to current stock limits.";
        validRows.push({ cart_id: cart.id, variant_id: line.variantId, quantity });
      }

      if (validRows.length) {
        const { error } = await db.from("cart_items").upsert(validRows, { onConflict: "cart_id,variant_id" });
        if (error) throw error;
      }
      for (const row of staleRows) {
        const { error } = await db.from("cart_items").upsert(row, { onConflict: "cart_id,variant_id" });
        if (error?.code === "23503") {
          warning = "An item from your guest cart no longer exists and could not be synced.";
        } else if (error) throw error;
      }
    }

    return { ok: true, authenticated: true, items: await readCart(db, cart.id), warning: warning || undefined };
  } catch (error) {
    return { ok: false, authenticated: true, error: errorMessage(error) };
  }
}

async function authenticatedCart() {
  const user = await getUser();
  if (!user) return null;
  const db = await createClient();
  return { db, cart: await getOrCreateCart(db, user.id) };
}

export async function addCartItem(input: unknown): Promise<CartActionResult> {
  const parsed = lineSchema.safeParse(input);
  if (!parsed.success) return { ok: false, authenticated: true, error: "Choose a valid item and quantity." };
  try {
    const session = await authenticatedCart();
    if (!session) return { ok: false, authenticated: false, error: "Sign in again to sync your cart." };
    const { db, cart } = session;
    const variant = await getVariant(db, parsed.data.variantId);
    if (!variant?.product) return { ok: false, authenticated: true, error: "This item is no longer available." };
    const { data: current, error: currentError } = await db.from("cart_items")
      .select("quantity").eq("cart_id", cart.id).eq("variant_id", variant.id).maybeSingle();
    if (currentError) throw currentError;
    if (!current) {
      const { count, error: countError } = await db.from("cart_items")
        .select("variant_id", { count: "exact", head: true }).eq("cart_id", cart.id);
      if (countError) throw countError;
      if ((count ?? 0) >= 50) return { ok: false, authenticated: true, error: "Your cart has reached the 50-item checkout limit." };
    }
    const quantity = (current?.quantity ?? 0) + parsed.data.quantity;
    if (variant.stock_quantity < quantity) {
      return { ok: false, authenticated: true, error: `Only ${variant.stock_quantity} of this item are currently in stock.` };
    }
    if (quantity > MAX_QTY_PER_LINE) return { ok: false, authenticated: true, error: `You can add up to ${MAX_QTY_PER_LINE} of an item.` };
    const { error } = await db.from("cart_items").upsert({ cart_id: cart.id, variant_id: variant.id, quantity }, { onConflict: "cart_id,variant_id" });
    if (error) throw error;
    return { ok: true, authenticated: true, items: await readCart(db, cart.id) };
  } catch (error) {
    return { ok: false, authenticated: true, error: errorMessage(error) };
  }
}

export async function setCartItemQuantity(input: unknown): Promise<CartActionResult> {
  const parsed = lineSchema.safeParse(input);
  if (!parsed.success) return { ok: false, authenticated: true, error: "Choose a valid quantity." };
  try {
    const session = await authenticatedCart();
    if (!session) return { ok: false, authenticated: false, error: "Sign in again to sync your cart." };
    const { db, cart } = session;
    const variant = await getVariant(db, parsed.data.variantId);
    if (!variant?.product) return { ok: false, authenticated: true, error: "This item is no longer available. Remove it from your cart." };
    if (variant.stock_quantity <= 0) return { ok: false, authenticated: true, error: "This item is out of stock. Remove it from your cart." };
    const quantity = Math.min(parsed.data.quantity, variant.stock_quantity, MAX_QTY_PER_LINE);
    const { error } = await db.from("cart_items").update({ quantity })
      .eq("cart_id", cart.id).eq("variant_id", variant.id);
    if (error) throw error;
    return { ok: true, authenticated: true, items: await readCart(db, cart.id),
      warning: quantity !== parsed.data.quantity ? `Quantity adjusted to ${quantity}, the current stock limit.` : undefined };
  } catch (error) {
    return { ok: false, authenticated: true, error: errorMessage(error) };
  }
}

export async function removeCartItem(variantId: unknown): Promise<CartActionResult> {
  const parsed = z.string().uuid().safeParse(variantId);
  if (!parsed.success) return { ok: false, authenticated: true, error: "Choose a valid cart item." };
  try {
    const session = await authenticatedCart();
    if (!session) return { ok: false, authenticated: false, error: "Sign in again to sync your cart." };
    const { db, cart } = session;
    const { error } = await db.from("cart_items").delete().eq("cart_id", cart.id).eq("variant_id", parsed.data);
    if (error) throw error;
    return { ok: true, authenticated: true, items: await readCart(db, cart.id) };
  } catch (error) {
    return { ok: false, authenticated: true, error: errorMessage(error) };
  }
}

export async function clearSavedCart(): Promise<{ ok: boolean; error?: string }> {
  try {
    const session = await authenticatedCart();
    if (!session) return { ok: true };
    const { error } = await session.db.from("cart_items").delete().eq("cart_id", session.cart.id);
    if (error) throw error;
    return { ok: true };
  } catch (error) {
    return { ok: false, error: errorMessage(error) };
  }
}
