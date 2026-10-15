import Link from "next/link";
import { ProductImage } from "@/components/product-image";
import { formatNaira } from "@/lib/format";
import type { ProductCardData } from "@/lib/types";

function ProductRun({ products, duplicate = false }: { products: ProductCardData[]; duplicate?: boolean }) {
  return (
    <div className="hero-product-run" aria-hidden={duplicate || undefined}>
      {products.map((product) => (
        <Link
          key={product.id}
          href={`/products/${product.slug}`}
          tabIndex={duplicate ? -1 : undefined}
          className="hero-product-tile group"
        >
          <div className="relative aspect-square overflow-hidden rounded-xl bg-white/90">
            <ProductImage
              url={product.imageUrl}
              alt={product.imageAlt}
              name={product.name}
              sizes="(min-width:768px) 10rem, 7rem"
              className="object-contain p-2 transition-transform duration-300 group-hover:scale-105 motion-reduce:transition-none"
            />
          </div>
          <p className="mt-2 line-clamp-1 text-xs font-semibold text-blue-950 sm:text-sm">{product.name}</p>
          <p className="mt-0.5 text-xs font-extrabold text-blue-800 sm:text-sm">{formatNaira(product.minPriceKobo)}</p>
        </Link>
      ))}
    </div>
  );
}

export function HeroProductCarousel({ products }: { products: ProductCardData[] }) {
  if (!products.length) return null;
  return (
    <div className="relative mx-auto mt-4 max-w-7xl rounded-2xl border border-blue-100 bg-white/70 px-3 py-3 shadow-sm sm:mt-5 sm:px-5 sm:py-4">
      <h2 className="mb-2 font-display text-sm font-bold text-blue-950 sm:mb-3 sm:text-base">Popular finds</h2>
      <div className="hero-product-carousel" role="region" aria-label="Popular products, scrolling from right to left">
        <div className="hero-product-track">
          <ProductRun products={products} />
          <ProductRun products={products} duplicate />
        </div>
      </div>
    </div>
  );
}
