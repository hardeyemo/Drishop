"use client";

import * as React from "react";
import { Loader2, Plus } from "lucide-react";
import { useCart } from "@/components/cart-provider";
import type { ProductCardData, ProductCardVariant } from "@/lib/types";

export function ProductCardAction({ product }: { product: ProductCardData }) {
  const { add, pending } = useCart();
  const [added, setAdded] = React.useState(false);
  const [error, setError] = React.useState("");
  const availableVariants = product.variants.filter((variant) => variant.stock > 0);
  const [variantId, setVariantId] = React.useState(availableVariants[0]?.id ?? "");
  const variant = availableVariants.find((entry) => entry.id === variantId) ?? availableVariants[0];

  if (product.totalStock <= 0 || availableVariants.length === 0 || !variant) {
    return <button type="button" disabled aria-label={`Out of stock: ${product.name}`} className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-slate-100 text-slate-400"><Plus className="h-4 w-4" /></button>;
  }

  async function onAdd(selected: ProductCardVariant) {
    if (pending) return;
    setError("");
    setAdded(false);
    const result = await add({
      variantId: selected.id,
      productId: product.id,
      slug: product.slug,
      name: product.name,
      variantName: product.variants.length > 1 ? selected.name : null,
      priceKobo: selected.priceKobo,
      imageUrl: product.imageUrl,
      maxQuantity: Math.min(selected.stock, 10),
      availableStock: selected.stock,
    }, 1);
    if (result.ok) setAdded(true);
    else setError(result.error ?? "Could not add this item.");
  }

  return (
    <div className="relative z-10 flex min-w-0 shrink-0 items-center gap-1 sm:gap-1.5">
      {availableVariants.length > 1 ? (
        <label className="block min-w-0">
          <span className="sr-only">Choose an option for {product.name}</span>
          <select
            value={variant.id}
            onChange={(event) => {
              setVariantId(event.target.value);
              setAdded(false);
              setError("");
            }}
            className="h-9 max-w-16 rounded-lg border border-slate-300 bg-white px-1 text-[11px] font-medium text-slate-700 outline-none transition focus:border-blue-700 focus:ring-2 focus:ring-blue-700/15 sm:h-10 sm:max-w-28 sm:px-1.5"
          >
            {availableVariants.map((option) => (
              <option key={option.id} value={option.id}>{option.name}</option>
            ))}
          </select>
        </label>
      ) : null}
      <button type="button" aria-label={`${added ? "Added" : "Add"} ${product.name} to cart`} title={added ? "Added to cart" : "Add to cart"} disabled={pending} onClick={() => void onAdd(variant)} className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#174fc9] text-white shadow-sm transition-colors hover:bg-blue-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-800 disabled:cursor-wait disabled:opacity-70">
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-5 w-5" />}
      </button>
      <span aria-live="polite" className="sr-only">{added ? "Added to cart." : error}</span>
    </div>
  );
}
