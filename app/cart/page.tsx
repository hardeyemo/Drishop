"use client";

import Link from "next/link";
import { Minus, Plus, Trash2 } from "lucide-react";
import { useCart } from "@/components/cart-provider";
import { Button, buttonVariants } from "@/components/ui/button";
import { ProductImage } from "@/components/product-image";
import { EmptyState } from "@/components/empty-state";
import { formatNaira } from "@/lib/format";

export default function CartPage() {
  const { items, hydrated, pending, error, count, subtotalKobo, setQuantity, remove } = useCart();

  if (!hydrated) {
    return (
      <div className="mx-auto max-w-5xl px-3 py-7 sm:px-4 sm:py-10" role="status" aria-label="Loading cart">
        <div className="h-9 w-40 animate-pulse rounded bg-surface" />
        <div className="mt-8 h-40 animate-pulse rounded-xl bg-surface" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-3 py-7 sm:px-5 sm:py-9 lg:px-8 lg:py-10">
      <h1 className="font-display text-2xl font-extrabold tracking-tight sm:text-3xl">Your cart</h1>
      {error ? <p role="alert" className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</p> : null}
      {pending ? <p className="mt-3 text-xs text-neutral-500" role="status">Syncing cart…</p> : null}

      {items.length === 0 ? (
        <div className="mt-8">
          <EmptyState
            title="Your cart is empty"
            body="Find something you like and add it here."
            actionHref="/products"
            actionLabel="Browse products"
          />
        </div>
      ) : (
        <div className="mt-6 grid gap-6 sm:mt-8 sm:gap-10 lg:grid-cols-[1fr_320px]">
          <ul className="divide-y divide-line border-y border-line">
            {items.map((item) => (
              <li key={item.variantId} className="flex min-w-0 gap-3 py-4 sm:gap-4 sm:py-5">
                <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-surface sm:h-24 sm:w-24">
                  <ProductImage url={item.imageUrl} name={item.name} sizes="96px" />
                </div>
                <div className="flex min-w-0 flex-1 flex-col">
                  {item.unavailable || !item.slug ? <p className="font-medium">{item.name}</p> : (
                    <Link href={`/products/${item.slug}`} className="line-clamp-2 font-medium hover:underline">{item.name}</Link>
                  )}
                  {item.variantName ? <p className="text-sm text-neutral-500">{item.variantName}</p> : null}
                  <p className="mt-1 break-all font-display text-sm font-bold sm:text-base">{formatNaira(item.priceKobo)}</p>
                  {item.unavailable ? <p className="mt-1 text-xs text-red-700">No longer available. Remove this item to continue.</p>
                    : item.quantity > item.availableStock ? <p className="mt-1 text-xs text-amber-700">Only {item.availableStock} currently in stock. Reduce the quantity.</p> : null}
                  <div className="mt-auto flex flex-wrap items-center justify-between gap-2 pt-3">
                    <div className="inline-flex h-11 items-center rounded-md border border-ink/20" role="group" aria-label={`Quantity for ${item.name}`}>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-full rounded-r-none"
                        aria-label="Decrease quantity"
                        disabled={item.quantity <= 1 || pending || item.unavailable}
                        onClick={() => setQuantity(item.variantId, item.quantity - 1)}
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <span className="w-9 text-center text-sm tabular-nums" aria-live="polite">{item.quantity}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-full rounded-l-none"
                        aria-label="Increase quantity"
                        disabled={pending || item.unavailable || item.quantity >= Math.min(item.maxQuantity, item.availableStock)}
                        onClick={() => setQuantity(item.variantId, item.quantity + 1)}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    <Button variant="ghost" size="sm" disabled={pending} onClick={() => remove(item.variantId)} aria-label={`Remove ${item.name}`}>
                      <Trash2 className="h-4 w-4" /> Remove
                    </Button>
                  </div>
                </div>
              </li>
            ))}
          </ul>

          <aside className="h-fit rounded-2xl border border-line p-4 sm:p-6 lg:sticky lg:top-40" aria-label="Order summary">
            <h2 className="font-display text-lg font-bold">Summary</h2>
            <dl className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <dt>Items ({count})</dt>
                <dd className="tabular-nums">{formatNaira(subtotalKobo)}</dd>
              </div>
              <div className="flex justify-between text-neutral-600">
                <dt>Delivery</dt>
                <dd>Calculated at checkout</dd>
              </div>
            </dl>
            <p className="mt-4 flex items-baseline justify-between border-t border-line pt-4">
              <span className="font-medium">Subtotal</span>
              <span className="font-display text-2xl font-extrabold tabular-nums">{formatNaira(subtotalKobo)}</span>
            </p>
            <Link href="/checkout" className={buttonVariants({ variant: "gold", size: "lg", className: "mt-5 w-full" })}>
              Checkout
            </Link>
            <Link href="/products" className={buttonVariants({ variant: "outline", className: "mt-2 w-full" })}>
              Continue shopping
            </Link>
          </aside>
        </div>
      )}
    </div>
  );
}
