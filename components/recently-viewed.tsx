"use client";

import * as React from "react";
import Link from "next/link";
import { ProductImage } from "@/components/product-image";
import { formatNaira } from "@/lib/format";

type Viewed = { slug: string; name: string; imageUrl: string | null; imageAlt: string | null; priceKobo: number };
const KEY = "drishop-recently-viewed";

export function RecentlyViewed({ product }: { product: Viewed }) {
  const [items, setItems] = React.useState<Viewed[]>([]);
  React.useEffect(() => {
    try {
      const previous: Viewed[] = JSON.parse(localStorage.getItem(KEY) ?? "[]");
      const next = [product, ...previous.filter((item) => item.slug !== product.slug)].slice(0, 6);
      localStorage.setItem(KEY, JSON.stringify(next));
      window.dispatchEvent(new Event("drishop:recently-viewed"));
      setItems(next.filter((item) => item.slug !== product.slug));
    } catch {
      setItems([]);
    }
  }, [product]);

  if (!items.length) return null;
  return (
    <section className="mt-12 border-t border-line pt-8" aria-label="Recently viewed products">
      <h2 className="mb-4 font-display text-xl font-bold">Recently viewed</h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {items.map((item) => (
          <Link key={item.slug} href={`/products/${item.slug}`} className="group rounded-xl border border-slate-200 p-2 transition hover:-translate-y-0.5 hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-800">
            <div className="relative aspect-square overflow-hidden rounded-lg bg-[#f5f7fb]"><ProductImage url={item.imageUrl} alt={item.imageAlt} name={item.name} sizes="(min-width:1024px) 16vw, 50vw" className="transition-transform duration-300 group-hover:scale-105" /></div>
            <p className="mt-2 line-clamp-2 text-sm font-semibold">{item.name}</p>
            <p className="mt-1 text-sm font-extrabold text-blue-950">{formatNaira(item.priceKobo)}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}
