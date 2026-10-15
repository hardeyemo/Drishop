"use client";

import * as React from "react";
import Link from "next/link";
import { getRecentlyViewedProducts } from "@/app/actions/recently-viewed";
import { ProductImage } from "@/components/product-image";
import { ProductCardAction } from "@/components/product-card-action";
import { formatNaira } from "@/lib/format";
import type { ProductCardData } from "@/lib/types";

const STORAGE_KEY = "drishop-recently-viewed";

export function CartRecentlyViewed() {
  const [products, setProducts] = React.useState<ProductCardData[]>([]);

  React.useEffect(() => {
    let active = true;
    try {
      const stored: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
      const slugs = Array.isArray(stored)
        ? [...new Set(stored.flatMap((item) =>
          item && typeof item === "object" && typeof item.slug === "string" ? [item.slug] : [],
        ))].slice(0, 6)
        : [];
      if (slugs.length) {
        getRecentlyViewedProducts(slugs).then((result) => {
          if (active) setProducts(result);
        }).catch(() => {
          if (active) setProducts([]);
        });
      }
    } catch {
      setProducts([]);
    }
    return () => { active = false; };
  }, []);

  if (!products.length) return null;
  return (
    <section className="mt-8 border-t border-line pt-6 sm:mt-10 sm:pt-8" aria-label="Recently viewed products">
      <h2 className="mb-4 font-display text-lg font-bold sm:text-xl">Recently Viewed Products</h2>
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
        {products.map((product) => (
          <article key={product.id} className="flex min-w-0 flex-col rounded-xl border border-slate-200 bg-white p-2 shadow-sm transition-shadow hover:shadow-md">
            <Link href={`/products/${product.slug}`} className="group min-w-0 rounded-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-800">
              <div className="relative aspect-square overflow-hidden rounded-lg bg-[#f5f7fb]">
                <ProductImage url={product.imageUrl} alt={product.imageAlt} name={product.name} sizes="(min-width:1280px) 16vw, (min-width:768px) 25vw, 50vw" className="transition-transform duration-300 group-hover:scale-105 motion-reduce:transition-none" />
              </div>
              <p className="mt-2 line-clamp-2 min-h-10 text-xs font-semibold leading-snug text-slate-900 sm:text-sm">{product.name}</p>
            </Link>
            <div className="mt-auto flex min-w-0 items-center justify-between gap-1 pt-2">
              <p className="min-w-0 break-words font-display text-sm font-extrabold text-blue-950 sm:text-base">{formatNaira(product.minPriceKobo)}</p>
              <ProductCardAction product={product} />
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
