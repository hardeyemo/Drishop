import type { ProductCardData } from "@/lib/types";
import { discountPercent, formatNaira } from "@/lib/format";
import { ProductImage } from "@/components/product-image";
import { RatingStars } from "@/components/rating-stars";
import { WishlistButton } from "@/components/wishlist-button";
import { ProductCardAction } from "@/components/product-card-action";

export function ProductCard({ product, priority }: { product: ProductCardData; priority?: boolean }) {
  const off = discountPercent(product.minPriceKobo, product.compareAtKobo);
  const soldOut = product.totalStock === 0;

  return (
    <article className="group relative flex flex-col rounded-2xl border border-slate-200 bg-white p-2.5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-lg hover:shadow-blue-950/10 sm:p-3">
      <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-[#f5f7fb]">
        <ProductImage
          url={product.imageUrl}
          alt={product.imageAlt}
          name={product.name}
          priority={priority}
          sizes="(min-width:1024px) 22vw, (min-width:640px) 33vw, 50vw"
          className="transition-transform duration-300 group-hover:scale-[1.03] motion-reduce:transition-none"
        />
        {off > 0 && !soldOut ? (
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
        ) : null}
      </div>
      <div className="mt-2.5 flex flex-1 flex-col gap-1 px-1 pb-1">
        {product.brand ? <p className="truncate text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">{product.brand}</p> : null}
        <h3 className="line-clamp-2 min-h-9 text-sm font-semibold leading-snug text-slate-900">{product.name}</h3>
        {product.description ? <p className="line-clamp-1 text-xs leading-5 text-slate-500">{product.description}</p> : null}
        <RatingStars value={product.ratingAvg} count={product.ratingCount} />
        <div className="mt-auto flex flex-wrap items-center justify-between gap-2 pt-1">
          <p className="flex min-w-0 flex-wrap items-baseline gap-1.5">
            <span className="font-display text-base font-extrabold tracking-tight text-blue-950 sm:text-lg">{formatNaira(product.minPriceKobo)}</span>
            {product.compareAtKobo ? <span className="text-[11px] text-neutral-500 line-through">{formatNaira(product.compareAtKobo)}</span> : null}
          </p>
          <ProductCardAction product={product} />
        </div>
      </div>
    </article>
  );
}

export function ProductGrid({ products, priorityCount = 0 }: { products: ProductCardData[]; priorityCount?: number }) {
  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-4">
      {products.map((p, i) => (
        <ProductCard key={p.id} product={p} priority={i < priorityCount} />
      ))}
    </div>
  );
}
