import type { ProductCardData } from "@/lib/types";
import { discountPercent, formatNaira } from "@/lib/format";
import { ProductImage } from "@/components/product-image";
import { RatingStars } from "@/components/rating-stars";
import { WishlistButton } from "@/components/wishlist-button";
import { ProductCardAction } from "@/components/product-card-action";
import Link from "next/link";

export function ProductCard({ product, priority, returnTo = "/products", compact = false }: { product: ProductCardData; priority?: boolean; returnTo?: string; compact?: boolean }) {
  const off = discountPercent(product.minPriceKobo, product.compareAtKobo);
  const soldOut = product.totalStock === 0;

  return (
    <article className={`group relative flex min-w-0 flex-col border border-slate-200 bg-white ${compact
      ? "rounded-none p-1 shadow-none transition-colors duration-200 hover:border-blue-300 sm:rounded-none sm:p-1"
      : "rounded-xl p-1.5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-lg hover:shadow-blue-950/10 sm:rounded-xl sm:p-2"}`}>
      <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-[#f5f7fb]">
        <Link href={`/products/${product.slug}?from=${encodeURIComponent(returnTo)}`} aria-label={`View ${product.name}`} className="absolute inset-0 block focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-800">
        <ProductImage
          url={product.imageUrl}
          alt={product.imageAlt}
          name={product.name}
          priority={priority}
          sizes="(min-width:1024px) 22vw, (min-width:640px) 33vw, 50vw"
          className="transition-transform duration-300 group-hover:scale-[1.03] motion-reduce:transition-none"
        />
        {product.fridayDeal && !soldOut ? (
          <span className="absolute left-2 top-2 rounded-full bg-[#075c46] px-2.5 py-1 text-[11px] font-extrabold text-white shadow-sm">
            Friday deal
          </span>
        ) : off > 0 && !soldOut ? (
          <span className="absolute left-2 top-2 rounded-full bg-amber-300 px-2.5 py-1 text-[11px] font-extrabold text-amber-950 shadow-sm">
            -{off}%
          </span>
        ) : null}
        <div className="absolute right-2 top-2 z-10">
          <WishlistButton productId={product.id} initialSaved={false} signedIn={false} loginHref={`/login?next=${encodeURIComponent(`/products/${product.slug}`)}`} compact />
        </div>
        {soldOut ? (
          <span className="absolute inset-x-0 bottom-0 bg-ink/85 py-1.5 text-center text-xs font-medium text-white">
            Out of stock
          </span>
        ) : product.totalStock <= 3 ? (
          <span className="absolute inset-x-0 bottom-0 bg-amber-100/95 py-1.5 text-center text-xs font-semibold text-amber-950">Only {product.totalStock} left</span>
        ) : product.totalStock <= 10 ? (
          <span className="absolute inset-x-0 bottom-0 bg-white/90 py-1.5 text-center text-xs font-semibold text-blue-950">Selling fast</span>
        ) : null}
        </Link>
      </div>
      <div className="mt-1.5 flex min-w-0 flex-1 flex-col gap-1 px-0.5 pb-0.5 sm:mt-2 sm:px-0.5">
        {product.brand ? <p className="truncate text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">{product.brand}</p> : null}
        <Link href={`/products/${product.slug}?from=${encodeURIComponent(returnTo)}`} className="rounded-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-800"><h3 className="line-clamp-2 min-h-9 break-words text-[13px] font-semibold leading-snug text-slate-900 sm:text-sm">{product.name}</h3></Link>
        {product.description ? <p className="line-clamp-1 text-xs leading-5 text-slate-500">{product.description}</p> : null}
        <RatingStars value={product.ratingAvg} count={product.ratingCount} />
        <div className="mt-auto flex flex-wrap items-center justify-between gap-2 pt-1">
          <p className="flex min-w-0 flex-wrap items-baseline gap-1.5">
            <span className="break-all font-display text-sm font-extrabold tracking-tight text-blue-950 sm:text-lg">{formatNaira(product.minPriceKobo)}</span>
            {product.compareAtKobo ? <span className="text-[11px] text-neutral-500 line-through">{formatNaira(product.compareAtKobo)}</span> : null}
          </p>
          <ProductCardAction product={product} />
        </div>
      </div>
    </article>
  );
}

export function ProductGrid({ products, priorityCount = 0, returnTo = "/products", compact = false }: { products: ProductCardData[]; priorityCount?: number; returnTo?: string; compact?: boolean }) {
  return (
    <div className={`grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 2xl:grid-cols-6 ${compact ? "gap-0" : "gap-2.5 sm:gap-3 lg:gap-3.5"}`}>
      {products.map((p, i) => (
        <ProductCard key={p.id} product={p} priority={i < priorityCount} returnTo={returnTo} compact={compact} />
      ))}
    </div>
  );
}
