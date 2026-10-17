import "server-only";
import { cache } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createPublicClient } from "@/lib/supabase/public";
import type { Category, ProductCardData, ProductDetail } from "@/lib/types";
import { isFridayDealActive } from "@/lib/friday-deals";
import { hasFridayDealSchema } from "@/lib/data/friday-deal-schema";
import { categoryDescendantIds } from "@/lib/data/category-tree";

// Keep the initial catalogue page large enough to show the original seeded set
// (18 products) together while retaining pagination for larger catalogues.
export const PAGE_SIZE = 24;

export const SORT_OPTIONS = [
  { value: "featured", label: "Featured" },
  { value: "newest", label: "Newest" },
  { value: "best-selling", label: "Best selling" },
  { value: "rating", label: "Top rated" },
  { value: "price-asc", label: "Price: low to high" },
  { value: "price-desc", label: "Price: high to low" },
] as const;
export type SortKey = (typeof SORT_OPTIONS)[number]["value"];

export type ListParams = {
  q?: string;
  category?: string;
  sort: SortKey;
  minNaira?: number;
  maxNaira?: number;
  inStock?: boolean;
  deals?: boolean;
  page: number;
};

export type CardRow = {
  id: string;
  name: string;
  slug: string;
  brand: string | null;
  description: string | null;
  min_price_kobo: number;
  compare_at_kobo: number | null;
  total_stock: number;
  rating_avg: number;
  rating_count: number;
  category: { name: string; slug: string } | null;
  images: { url: string; alt: string | null; sort_order: number }[];
  variants: {
    id: string;
    name: string;
    price_kobo: number;
    friday_deal_price_kobo?: number | null;
    stock_quantity: number;
    is_active: boolean;
  }[];
};

export const CARD_SELECT =
  "id,name,slug,brand,description,min_price_kobo,compare_at_kobo,total_stock,rating_avg,rating_count,category:categories(name,slug),images:product_images(url,alt,sort_order),variants:product_variants(id,name,price_kobo,friday_deal_price_kobo,stock_quantity,is_active)";
const LEGACY_CARD_SELECT = CARD_SELECT.replace(",friday_deal_price_kobo", "");

export function toCard(row: CardRow): ProductCardData {
  const first = [...(row.images ?? [])].sort((a, b) => a.sort_order - b.sort_order)[0];
  const dealWindowActive = isFridayDealActive();
  const variants = (row.variants ?? [])
    .filter((variant) => variant.is_active)
    .map((variant) => {
      const fridayDeal = dealWindowActive && variant.stock_quantity > 0
        && variant.friday_deal_price_kobo != null
        && variant.friday_deal_price_kobo < variant.price_kobo;
      return {
        id: variant.id,
        name: variant.name,
        priceKobo: fridayDeal ? variant.friday_deal_price_kobo! : variant.price_kobo,
        stock: variant.stock_quantity,
        fridayDeal,
        regularPriceKobo: variant.price_kobo,
      };
    })
    .sort((a, b) => a.priceKobo - b.priceKobo);
  const cheapestVariant = variants[0];
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    brand: row.brand,
    description: row.description,
    minPriceKobo: cheapestVariant?.priceKobo ?? row.min_price_kobo,
    compareAtKobo: cheapestVariant?.fridayDeal ? cheapestVariant.regularPriceKobo : row.compare_at_kobo,
    fridayDeal: variants.some((variant) => variant.fridayDeal),
    totalStock: row.total_stock,
    ratingAvg: Number(row.rating_avg),
    ratingCount: row.rating_count,
    imageUrl: first?.url ?? null,
    imageAlt: first?.alt ?? null,
    categoryName: row.category?.name ?? null,
    categorySlug: row.category?.slug ?? null,
    variants: variants.map(({ id, name, priceKobo, stock, fridayDeal }) => ({ id, name, priceKobo, stock, fridayDeal })),
  };
}

function fail(error: { message: string } | null): asserts error is null {
  if (error) throw new Error(`Catalogue query failed: ${error.message}`);
}

export const getCategories = cache(async (): Promise<Category[]> => {
  const db = createPublicClient();
  const { data, error } = await db
    .from("categories")
    .select("id,name,slug,description,parent_id")
    .eq("is_active", true)
    .order("sort_order")
    .order("name");
  fail(error);
  return (data ?? []).map((c) => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
    description: c.description,
    parentId: c.parent_id,
  }));
});

async function resolveCategoryIds(db: SupabaseClient, slug: string): Promise<string[] | null> {
  const { data: cat } = await db
    .from("categories")
    .select("id")
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle();
  if (!cat) return null;
  const { data: categories } = await db
    .from("categories")
    .select("id,parent_id")
    .eq("is_active", true);
  return categoryDescendantIds((categories ?? []).map((category) => ({
    id: category.id,
    parentId: category.parent_id,
  })), cat.id);
}

export async function listProducts(params: ListParams) {
  const db = createPublicClient();
  const hasFridayDeals = await hasFridayDealSchema(db);
  const empty = { products: [] as ProductCardData[], total: 0, page: params.page, totalPages: 0 };

  let query = db
    .from("products")
    .select(hasFridayDeals ? CARD_SELECT : LEGACY_CARD_SELECT, { count: "exact" })
    .eq("is_active", true);

  if (params.category) {
    const ids = await resolveCategoryIds(db, params.category);
    if (!ids) return empty;
    query = query.in("category_id", ids);
  }
  if (params.q) {
    // Strip characters that have meaning in PostgREST filter syntax or LIKE patterns.
    const term = params.q.replace(/[%_,()*\\]/g, " ").trim();
    if (term) query = query.or(`name.ilike.%${term}%,brand.ilike.%${term}%`);
  }
  if (params.minNaira !== undefined) query = query.gte("min_price_kobo", params.minNaira * 100);
  if (params.maxNaira !== undefined) query = query.lte("min_price_kobo", params.maxNaira * 100);
  if (params.inStock) query = query.gt("total_stock", 0);
  if (params.deals) query = query.not("compare_at_kobo", "is", null);

  switch (params.sort) {
    case "newest":
      query = query.order("created_at", { ascending: false });
      break;
    case "best-selling":
      query = query.order("units_sold", { ascending: false });
      break;
    case "rating":
      query = query.order("rating_avg", { ascending: false }).order("rating_count", { ascending: false });
      break;
    case "price-asc":
      query = query.order("min_price_kobo", { ascending: true });
      break;
    case "price-desc":
      query = query.order("min_price_kobo", { ascending: false });
      break;
    default:
      query = query.order("is_featured", { ascending: false }).order("units_sold", { ascending: false });
  }
  query = query.order("id"); // stable pagination

  const from = (params.page - 1) * PAGE_SIZE;
  const { data, error, count } = await query.range(from, from + PAGE_SIZE - 1);
  fail(error);

  const total = count ?? 0;
  return {
    products: ((data ?? []) as unknown as CardRow[]).map(toCard),
    total,
    page: params.page,
    totalPages: Math.ceil(total / PAGE_SIZE),
  };
}

export async function getHomeProducts() {
  const db = createPublicClient();
  const hasFridayDeals = await hasFridayDealSchema(db);
  const select = hasFridayDeals ? CARD_SELECT : LEGACY_CARD_SELECT;
  const pageSize = 500;
  const rows: CardRow[] = [];
  for (let from = 0; ; from += pageSize) {
    const { data, error } = await db.from("products").select(select)
      .eq("is_active", true)
      .order("is_featured", { ascending: false })
      .order("units_sold", { ascending: false })
      .order("id")
      .range(from, from + pageSize - 1);
    fail(error);
    const batch = (data ?? []) as unknown as CardRow[];
    rows.push(...batch);
    if (batch.length < pageSize) break;
  }
  // ProductCardData applies the real, time-gated variant deal price when configured.
  return rows.map(toCard);
}

export async function getProductBySlug(slug: string): Promise<ProductDetail | null> {
  const db = createPublicClient();
  const hasFridayDeals = await hasFridayDealSchema(db);
  const { data, error } = await db
    .from("products")
    .select(
      `id,name,slug,brand,description,min_price_kobo,compare_at_kobo,total_stock,rating_avg,rating_count,category:categories(name,slug),images:product_images(url,alt,sort_order),variants:product_variants(id,sku,name,price_kobo,compare_at_price_kobo,${hasFridayDeals ? "friday_deal_price_kobo," : ""}stock_quantity,is_active)`,
    )
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle();
  fail(error);
  if (!data) return null;

  const row = data as unknown as Omit<CardRow, "variants"> & {
    description: string | null;
    category: { name: string; slug: string } | null;
    variants: {
      id: string;
      sku: string;
      name: string;
      price_kobo: number;
      compare_at_price_kobo: number | null;
      friday_deal_price_kobo?: number | null;
      stock_quantity: number;
      is_active: boolean;
    }[];
  };
  const card = toCard(row);
  return {
    ...card,
    description: row.description,
    categorySlug: row.category?.slug ?? null,
    images: [...row.images]
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((i) => ({ url: i.url, alt: i.alt })),
    variants: row.variants
      .filter((v) => v.is_active)
      .sort((a, b) => a.price_kobo - b.price_kobo)
      .map((v) => {
        const dealPrice = v.friday_deal_price_kobo;
        const fridayDeal = isFridayDealActive() && v.stock_quantity > 0
          && dealPrice != null && dealPrice < v.price_kobo;
        return {
          id: v.id,
          sku: v.sku,
          name: v.name,
          priceKobo: fridayDeal ? dealPrice : v.price_kobo,
          compareAtKobo: fridayDeal ? v.price_kobo : v.compare_at_price_kobo,
          stock: v.stock_quantity,
          fridayDeal,
        };
      }),
  };
}

export async function getRelatedProducts(categorySlug: string | null, excludeId: string) {
  if (!categorySlug) return [];
  const db = createPublicClient();
  const hasFridayDeals = await hasFridayDealSchema(db);
  const ids = await resolveCategoryIds(db, categorySlug);
  if (!ids) return [];
  const { data, error } = await db
    .from("products")
    .select(hasFridayDeals ? CARD_SELECT : LEGACY_CARD_SELECT)
    .eq("is_active", true)
    .in("category_id", ids)
    .neq("id", excludeId)
    .order("units_sold", { ascending: false })
    .limit(4);
  fail(error);
  return ((data ?? []) as unknown as CardRow[]).map(toCard);
}
