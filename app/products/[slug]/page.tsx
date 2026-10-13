import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getProductBySlug, getRelatedProducts } from "@/lib/data/catalog";
import { getUser } from "@/lib/auth";
import { isWishlisted } from "@/lib/data/account";
import { WishlistButton } from "@/components/wishlist-button";
import { ProductGallery } from "@/components/product-gallery";
import { ProductPurchase } from "@/components/product-purchase";
import { ProductGrid } from "@/components/product-card";
import { RatingStars } from "@/components/rating-stars";
import { SectionHeader } from "@/components/section-header";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug).catch(() => null);
  if (!product) return { title: "Product not found" };
  return {
    title: product.name,
    description: product.description?.slice(0, 155) ?? undefined,
  };
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();
  const [related, user] = await Promise.all([getRelatedProducts(product.categorySlug, product.id), getUser()]);
  const saved = user ? await isWishlisted(user.id, product.id) : false;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 lg:px-8">
      <nav aria-label="Breadcrumb" className="mb-6 text-sm text-neutral-500">
        <ol className="flex flex-wrap items-center gap-2">
          <li><Link href="/" className="hover:text-ink">Home</Link></li>
          {product.categorySlug ? (
            <li className="flex items-center gap-2">
              <span aria-hidden="true">/</span>
              <Link href={`/products?category=${product.categorySlug}`} className="hover:text-ink">
                {product.categoryName}
              </Link>
            </li>
          ) : null}
          <li className="flex items-center gap-2" aria-current="page">
            <span aria-hidden="true">/</span>
            <span className="text-ink">{product.name}</span>
          </li>
        </ol>
      </nav>

      <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
        <ProductGallery images={product.images} name={product.name} />
        <div>
          {product.brand ? <p className="text-sm text-neutral-500">{product.brand}</p> : null}
          <h1 className="mt-1 font-display text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl">
            {product.name}
          </h1>
          <div className="mt-3">
            <RatingStars value={product.ratingAvg} count={product.ratingCount} />
          </div>
          <div className="mt-6 border-t border-line pt-6">
            {/* Remount when the product changes so variant/quantity state resets. */}
            <ProductPurchase key={product.id} product={product} />
            <div className="mt-4">
              <WishlistButton
                productId={product.id}
                initialSaved={saved}
                signedIn={Boolean(user)}
                loginHref={`/login?next=${encodeURIComponent(`/products/${product.slug}`)}`}
              />
            </div>
          </div>
          {product.description ? (
            <section className="mt-8 border-t border-line pt-6">
              <h2 className="font-display text-lg font-bold">About this product</h2>
              <p className="mt-2 max-w-prose leading-relaxed text-neutral-700">{product.description}</p>
            </section>
          ) : null}
        </div>
      </div>

      {related.length > 0 ? (
        <section className="mt-20">
          <SectionHeader title="You may also like" href={`/products?category=${product.categorySlug}`} />
          <ProductGrid products={related} />
        </section>
      ) : null}
    </div>
  );
}
