import { getHomeProducts } from "@/lib/data/catalog";
import { ProductGrid } from "@/components/product-card";
import { EmptyState } from "@/components/empty-state";
import { HeroProductCarousel } from "@/components/hero-product-carousel";
import { FirstOrderOffer } from "@/components/first-order-offer";
import { getUser } from "@/lib/auth";
import { getFirstOrderOfferStatus } from "@/lib/checkout/first-order-offer";
import { FridayDealsBanner } from "@/components/friday-deals-banner";
import Link from "next/link";

// The homepage countdown and promotion eligibility are time-sensitive.
export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [products, user] = await Promise.all([getHomeProducts(), getUser()]);
  const offerStatus = await getFirstOrderOfferStatus(user?.id);

  return (
    <>
      <section className="relative overflow-hidden bg-[#edf2ff] px-3 py-4 sm:px-5 sm:py-7 lg:px-8">
        <div aria-hidden="true" className="pointer-events-none absolute -left-24 top-12 h-72 w-72 rounded-full bg-[#ffd34e]/20 blur-3xl" />
        <div className="relative mx-auto max-w-7xl">
          <HeroProductCarousel products={products
            .filter((product) => product.totalStock > 0 && product.imageUrl)
            .slice(0, 12)} />
        </div>
        <div className="mx-auto mt-4 max-w-7xl">
          <FridayDealsBanner />
        </div>
        <FirstOrderOffer status={offerStatus} className="mx-auto mt-4 max-w-7xl" />
      </section>
      <main className="mx-auto max-w-7xl px-3 py-7 sm:px-5 sm:py-12 lg:px-8">
        {products.length > 0 ? (
          <>
            <div className="mb-4 flex items-end justify-between gap-3 sm:mb-6">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-700">Made for everyday</p>
                <h1 className="mt-1 font-display text-2xl font-extrabold tracking-tight text-blue-950 sm:text-3xl">Shop our collection</h1>
              </div>
              <Link href="/products" className="shrink-0 rounded-lg px-3 py-2 text-sm font-semibold text-blue-800 transition-colors hover:bg-blue-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-800">
                View all
              </Link>
            </div>
            <ProductGrid products={products} compact returnTo="/" />
          </>
        ) : (
          <EmptyState title="No products yet" body="Run supabase/seed.sql for sample data, or add products from the admin dashboard once it is built." />
        )}
      </main>
    </>
  );
}
