"use client";

import * as React from "react";
import Link from "next/link";
import { Check, Minus, Plus } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { useCart } from "@/components/cart-provider";
import { discountPercent, formatNaira } from "@/lib/format";
import { MAX_QTY_PER_LINE } from "@/lib/site-config";
import { cn } from "@/lib/utils";
import type { ProductDetail } from "@/lib/types";

function stockLabel(stock: number) {
  if (stock <= 0) return { text: "Out of stock", tone: "text-red-700" };
  if (stock <= 5) return { text: `Only ${stock} left`, tone: "text-amber-700" };
  return { text: "In stock", tone: "text-green-700" };
}

export function ProductPurchase({ product }: { product: ProductDetail }) {
  const { add } = useCart();
  const firstAvailable = product.variants.find((v) => v.stock > 0) ?? product.variants[0];
  const [variantId, setVariantId] = React.useState(firstAvailable?.id);
  const [qty, setQty] = React.useState(1);
  const [added, setAdded] = React.useState(false);
  const [cartError, setCartError] = React.useState("");
  const [adding, setAdding] = React.useState(false);

  const variant = product.variants.find((v) => v.id === variantId);
  if (!variant) {
    return <p className="text-sm text-neutral-600">This product is not available right now.</p>;
  }

  const max = Math.max(1, Math.min(variant.stock, MAX_QTY_PER_LINE));
  const off = discountPercent(variant.priceKobo, variant.compareAtKobo);
  const stock = stockLabel(variant.stock);
  const showVariants = product.variants.length > 1;

  async function onAdd() {
    if (!variant || variant.stock <= 0 || adding) return;
    setAdding(true);
    setCartError("");
    setAdded(false);
    const result = await add(
      {
        variantId: variant.id,
        productId: product.id,
        slug: product.slug,
        name: product.name,
        variantName: product.variants.length > 1 ? variant.name : null,
        priceKobo: variant.priceKobo,
        imageUrl: product.imageUrl,
        maxQuantity: Math.min(variant.stock, MAX_QTY_PER_LINE),
        availableStock: variant.stock,
      },
      qty,
    );
    if (result.ok) setAdded(true);
    else setCartError(result.error ?? "We couldn't add this item to your cart.");
    setAdding(false);
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="flex flex-wrap items-baseline gap-3">
          <span className="font-display text-4xl font-extrabold tracking-tight">{formatNaira(variant.priceKobo)}</span>
          {variant.compareAtKobo ? (
            <span className="text-base text-neutral-500 line-through">{formatNaira(variant.compareAtKobo)}</span>
          ) : null}
          {off > 0 ? <span className="rounded bg-gold px-2 py-0.5 text-sm font-bold">Save {off}%</span> : null}
        </p>
        <p className={cn("mt-2 text-sm font-medium", stock.tone)}>{stock.text}</p>
      </div>

      {showVariants ? (
        <fieldset>
          <legend className="mb-2 text-sm font-medium">Option</legend>
          <div className="flex flex-wrap gap-2">
            {product.variants.map((v) => {
              const selected = v.id === variant.id;
              return (
                <button
                  key={v.id}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => {
                    setVariantId(v.id);
                    setQty(1);
                    setAdded(false);
                  }}
                  className={cn(
                    "rounded-md border px-4 py-2 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-deep",
                    selected ? "border-ink bg-ink text-white" : "border-ink/20 hover:border-ink",
                    v.stock <= 0 && !selected && "text-neutral-400 line-through",
                  )}
                >
                  {v.name}
                </button>
              );
            })}
          </div>
        </fieldset>
      ) : null}

      <div className="flex flex-wrap items-center gap-3">
        <div className="inline-flex h-12 items-center rounded-md border border-ink/20" role="group" aria-label="Quantity">
          <Button
            variant="ghost"
            size="icon"
            className="h-full rounded-r-none"
            aria-label="Decrease quantity"
            disabled={qty <= 1 || variant.stock <= 0}
            onClick={() => setQty((q) => Math.max(1, q - 1))}
          >
            <Minus className="h-4 w-4" />
          </Button>
          <span className="w-10 text-center text-sm font-medium tabular-nums" aria-live="polite">
            {variant.stock <= 0 ? 0 : qty}
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="h-full rounded-l-none"
            aria-label="Increase quantity"
            disabled={qty >= max || variant.stock <= 0}
            onClick={() => setQty((q) => Math.min(max, q + 1))}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        <Button variant="gold" size="lg" className="flex-1 sm:flex-none sm:min-w-56" disabled={variant.stock <= 0 || adding} onClick={onAdd}>
          {variant.stock <= 0 ? "Out of stock" : adding ? "Adding…" : "Add to cart"}
        </Button>
      </div>

      <div aria-live="polite" className="min-h-6 text-sm">
        {cartError ? <p role="alert" className="text-red-700">{cartError}</p> : null}
        {added ? (
          <p className="flex items-center gap-2 font-medium">
            <Check className="h-4 w-4 text-green-700" /> Added to your cart.
            <Link href="/cart" className={buttonVariants({ variant: "ghost", size: "sm", className: "underline" })}>
              View cart
            </Link>
          </p>
        ) : null}
      </div>
    </div>
  );
}
