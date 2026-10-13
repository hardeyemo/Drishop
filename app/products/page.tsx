import type { Metadata } from "next";
import { z } from "zod";
import { getCategories, listProducts, SORT_OPTIONS, type ListParams } from "@/lib/data/catalog";
import { ProductGrid } from "@/components/product-card";
import { Pagination } from "@/components/pagination";
import { EmptyState } from "@/components/empty-state";

export const metadata: Metadata = { title: "All products" };

type RawParams = Record<string, string | string[] | undefined>;

const sortValues = SORT_OPTIONS.map((o) => o.value) as [string, ...string[]];
const optInt = z.coerce.number().int().min(0).max(100_000_000).optional().catch(undefined);

const schema = z.object({
  q: z.string().trim().max(80).optional().catch(undefined),
  category: z.string().trim().max(80).optional().catch(undefined),
  sort: z.enum(sortValues).catch("featured"),
  min: optInt,
  max: optInt,
  stock: z.literal("1").optional().catch(undefined),
  deals: z.literal("1").optional().catch(undefined),
  page: z.coerce.number().int().min(1).max(500).catch(1),
});

function parse(raw: RawParams): ListParams {
  const flat = Object.fromEntries(Object.entries(raw).map(([k, v]) => [k, Array.isArray(v) ? v[0] : v]));
  // Empty form fields arrive as "" and should mean "not set".
  for (const k of Object.keys(flat)) if (flat[k] === "") delete flat[k];
  const p = schema.parse(flat);
  return {
    q: p.q || undefined,
    category: p.category || undefined,
    sort: p.sort as ListParams["sort"],
    minNaira: p.min,
    maxNaira: p.max,
    inStock: p.stock === "1",
    deals: p.deals === "1",
    page: p.page,
  };
}

function hrefFor(params: ListParams, page: number) {
  const sp = new URLSearchParams();
  if (params.q) sp.set("q", params.q);
  if (params.category) sp.set("category", params.category);
  if (params.sort !== "featured") sp.set("sort", params.sort);
  if (params.minNaira !== undefined) sp.set("min", String(params.minNaira));
  if (params.maxNaira !== undefined) sp.set("max", String(params.maxNaira));
  if (params.inStock) sp.set("stock", "1");
  if (params.deals) sp.set("deals", "1");
  if (page > 1) sp.set("page", String(page));
  const qs = sp.toString();
  return qs ? `/products?${qs}` : "/products";
}

export default async function ProductsPage({ searchParams }: { searchParams: Promise<RawParams> }) {
  const params = parse(await searchParams);
  const [result, categories] = await Promise.all([listProducts(params), getCategories()]);
  const activeCategory = categories.find((c) => c.slug === params.category);

  const heading = params.q
    ? `Results for “${params.q}”`
    : activeCategory
      ? activeCategory.name
      : params.deals
        ? "Deals"
        : "All products";

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 lg:px-8">
      <h1 className="font-display text-3xl font-extrabold tracking-tight sm:text-4xl">{heading}</h1>
      <p className="mt-2 text-sm text-neutral-600" aria-live="polite">
        {result.total} {result.total === 1 ? "product" : "products"}
      </p>

      <div className="mt-8">
        {result.products.length > 0 ? (
          <>
            <ProductGrid products={result.products} priorityCount={4} />
            <Pagination
              page={result.page}
              totalPages={result.totalPages}
              hrefFor={(n) => hrefFor(params, n)}
            />
          </>
        ) : (
          <EmptyState
            title="No products found"
            body="Try another search or browse the full Shopora collection."
            actionHref="/products"
            actionLabel="Clear filters"
          />
        )}
      </div>
    </div>
  );
}
