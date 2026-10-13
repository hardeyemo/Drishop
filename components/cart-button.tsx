"use client";

import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import { useCart } from "@/components/cart-provider";

export function CartButton({ className = "", badgeClassName = "", showLabel = false }: { className?: string; badgeClassName?: string; showLabel?: boolean }) {
  const { count, hydrated } = useCart();
  const shown = hydrated ? count : 0;
  return (
    <Link
      href="/cart"
      aria-label={shown ? `Cart, ${shown} ${shown === 1 ? "item" : "items"}` : "Cart, empty"}
      className={`relative inline-flex h-10 min-w-10 items-center justify-center gap-1.5 rounded-lg px-2 text-ink transition-colors hover:bg-surface focus-visible:outline focus-visible:outline-2 focus-visible:outline-gold-deep ${showLabel ? "lg:px-2.5" : ""} ${className}`}
    >
      <ShoppingCart className="h-5 w-5" />
      {showLabel ? <span className="hidden text-xs font-bold lg:inline">Cart</span> : null}
      {shown > 0 ? (
        <span className={`absolute right-0 top-0 flex h-5 min-w-5 items-center justify-center rounded-full bg-gold px-1 text-[11px] font-bold text-ink ${badgeClassName}`}>
          {shown}
        </span>
      ) : null}
    </Link>
  );
}
