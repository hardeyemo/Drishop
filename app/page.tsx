import { getHomeProducts } from "@/lib/data/catalog";
import { ProductGrid } from "@/components/product-card";
import { EmptyState } from "@/components/empty-state";
import { HeroProductCarousel } from "@/components/hero-product-carousel";
import { FirstOrderOffer } from "@/components/first-order-offer";
import { getUser } from "@/lib/auth";
import { getFirstOrderOfferStatus } from "@/lib/checkout/first-order-offer";
import { FridayDealsBanner } from "@/components/friday-deals-banner";

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
          <ProductGrid products={products} compact returnTo="/" />
        ) : (
          <EmptyState title="No products yet" body="Run supabase/seed.sql for sample data, or add products from the admin dashboard once it is built." />
        )}
      </main>
    </>
  );
}
