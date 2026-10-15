"use client";

import * as React from "react";
import Link from "next/link";
import { X, Trash2 } from "lucide-react";
import { getRecentlyViewedProducts } from "@/app/actions/recently-viewed";
import { ProductImage } from "@/components/product-image";
import { Button } from "@/components/ui/button";
import { formatNaira } from "@/lib/format";
import type { ProductCardData } from "@/lib/types";

const STORAGE_KEY = "drishop-recently-viewed";
type CachedProduct = { slug: string; name: string; imageUrl: string | null; imageAlt: string | null; priceKobo: number };

function readHistory(): CachedProduct[] {
  try {
    const raw: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
    if (!Array.isArray(raw)) return [];
    const seen = new Set<string>();
    return raw.flatMap((value): CachedProduct[] => {
      if (!value || typeof value !== "object") return [];
      const item = value as Partial<CachedProduct>;
      if (typeof item.slug !== "string" || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(item.slug)
          || typeof item.name !== "string" || typeof item.priceKobo !== "number"
          || !Number.isSafeInteger(item.priceKobo) || item.priceKobo < 0 || seen.has(item.slug)) return [];
      seen.add(item.slug);
      return [{
        slug: item.slug,
        name: item.name.slice(0, 200),
        imageUrl: typeof item.imageUrl === "string" ? item.imageUrl : null,
        imageAlt: typeof item.imageAlt === "string" ? item.imageAlt.slice(0, 300) : null,
        priceKobo: item.priceKobo,
      }];
    }).slice(0, 6);
  } catch {
    return [];
  }
}

function writeHistory(items: CachedProduct[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  window.dispatchEvent(new Event("drishop:recently-viewed"));
}

export function RecentlyViewedHistory() {
  const [cached, setCached] = React.useState<CachedProduct[]>([]);
  const [current, setCurrent] = React.useState<ProductCardData[]>([]);

  const refresh = React.useCallback(() => {
    const next = readHistory();
    setCached(next);
    if (!next.length) {
      setCurrent([]);
      return;
    }
    getRecentlyViewedProducts(next.map((item) => item.slug)).then(setCurrent).catch(() => setCurrent([]));
  }, []);

  React.useEffect(() => {
    refresh();
    window.addEventListener("storage", refresh);
    window.addEventListener("drishop:recently-viewed", refresh);
    return () => {
      window.removeEventListener("storage", refresh);
      window.removeEventListener("drishop:recently-viewed", refresh);
    };
  }, [refresh]);

  function remove(slug: string) {
    const next = cached.filter((item) => item.slug !== slug);
    writeHistory(next);
  }

  function clear() {
    writeHistory([]);
  }

  if (!cached.length) {
    return <div className="rounded-2xl border border-dashed border-line bg-surface/50 px-5 py-10 text-center">
      <h3 className="font-display text-lg font-bold">No recently viewed products</h3>
      <p className="mt-2 text-sm text-neutral-600">Products you open will appear here on this device.</p>
      <Link href="/products" className="mt-4 inline-flex min-h-11 items-center font-semibold text-blue-800 underline underline-offset-2">Browse products</Link>
    </div>;
  }

  const currentBySlug = new Map(current.map((product) => [product.slug, product]));
  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-neutral-600">Saved on this device · {cached.length} {cached.length === 1 ? "product" : "products"}</p>
        <Button variant="outline" size="sm" onClick={clear}><Trash2 className="h-4 w-4" /> Clear history</Button>
      </div>
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {cached.map((item) => {
          const product = currentBySlug.get(item.slug);
          const name = product?.name ?? item.name;
          return (
            <li key={item.slug} className="relative min-w-0 rounded-xl border border-line bg-white p-2 shadow-sm sm:p-3">
              <Button variant="ghost" size="icon" className="absolute right-2 top-2 z-10 h-9 w-9 rounded-full bg-white/90 shadow-sm" onClick={() => remove(item.slug)} aria-label={`Remove ${name} from recently viewed`}>
                <X className="h-4 w-4" />
              </Button>
              {product ? <Link href={`/products/${product.slug}`} className="group block rounded-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-800">
                <div className="relative aspect-square overflow-hidden rounded-lg bg-[#f5f7fb]"><ProductImage url={product.imageUrl} alt={product.imageAlt} name={name} sizes="(min-width:1024px) 23vw, 50vw" className="transition-transform duration-300 group-hover:scale-105 motion-reduce:transition-none" /></div>
                <p className="mt-2 line-clamp-2 min-h-10 text-sm font-semibold">{name}</p>
                <p className="mt-1 font-display text-sm font-extrabold text-blue-950">{formatNaira(product.minPriceKobo)}</p>
              </Link> : <div>
                <div className="relative aspect-square overflow-hidden rounded-lg bg-[#f5f7fb]"><ProductImage url={item.imageUrl} alt={item.imageAlt} name={name} sizes="(min-width:1024px) 23vw, 50vw" /></div>
                <p className="mt-2 line-clamp-2 min-h-10 text-sm font-semibold">{name}</p>
                <p className="mt-1 text-xs text-neutral-600">Currently unavailable · Last seen {formatNaira(item.priceKobo)}</p>
              </div>}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
