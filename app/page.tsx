import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { getHomeSections } from "@/lib/data/catalog";
import { formatNaira } from "@/lib/format";
import { ProductGrid } from "@/components/product-card";
import { ProductImage } from "@/components/product-image";
import { SectionHeader } from "@/components/section-header";
import { EmptyState } from "@/components/empty-state";

export default async function HomePage() {
  const sections = await getHomeSections();
  const heroCandidates = [...sections.featured, ...sections.bestSellers, ...sections.newArrivals]
    .filter((product, index, products) => products.findIndex((candidate) => candidate.id === product.id) === index)
    .filter((product) => !/\b(shoes?|footwear|sneakers?|sandals?|boots?)\b/i.test(`${product.name} ${product.categoryName ?? ""}`));
  const spotlight = heroCandidates.find((product) => /\b(phones?|laptops?|electronics?|appliances?)\b/i.test(`${product.name} ${product.categoryName ?? ""}`))
    ?? heroCandidates[0];

  const rails = [
    { title: "Popular right now", href: "/products?sort=best-selling", items: sections.bestSellers },
    { title: "Todayâ€™s deals", href: "/products?deals=1", items: sections.deals },
    { title: "Fresh arrivals", href: "/products?sort=newest", items: sections.newArrivals },
    { title: "Featured finds", href: "/products?sort=featured", items: sections.featured },
  ];
  const hasProducts = rails.some((rail) => rail.items.length > 0);

  return (
    <>
      <section className="relative overflow-hidden bg-[#edf2ff] px-3 py-4 sm:px-5 sm:py-7 lg:px-8">
        <div aria-hidden="true" className="pointer-events-none absolute -left-24 top-12 h-72 w-72 rounded-full bg-[#ffd34e]/20 blur-3xl" />
        <div className="relative mx-auto grid max-w-7xl overflow-hidden rounded-[2rem] bg-gradient-to-br from-[#0c328f] via-[#174fc9] to-[#397cff] shadow-2xl shadow-blue-950/20 md:grid-cols-[1.02fr_0.98fr]">
          <div className="relative flex min-h-[22rem] flex-col justify-center overflow-hidden px-6 py-9 text-white sm:min-h-[27rem] sm:px-10 sm:py-12 lg:px-14">
            <div aria-hidden="true" className="absolute -right-24 -top-28 h-80 w-80 rounded-full border-[42px] border-white/[0.07] sm:-right-12 sm:h-[26rem] sm:w-[26rem]" />
            <p className="relative mb-5 inline-flex w-fit items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3.5 py-2 text-[11px] font-bold uppercase tracking-[0.16em] text-white sm:text-xs">
              <Sparkles className="h-4 w-4 text-[#ffd34e]" /> Your next great find starts here
            </p>
            <h1 className="relative max-w-xl font-display text-[2.65rem] font-extrabold leading-[0.98] tracking-tight sm:text-6xl lg:text-[4.35rem]">
              Good finds.<br />
              <span className="text-[#ffd34e]">Great days.</span>
            </h1>
            <p className="relative mt-5 max-w-md text-sm leading-relaxed text-blue-50/90 sm:text-base">
              From everyday essentials to can&apos;t-miss tech, find more of what you love in one easy shop.
            </p>
            <div className="relative mt-7 flex flex-wrap gap-3">
              <Link href="/products" className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-[#ffd34e] px-6 text-sm font-extrabold text-blue-950 shadow-lg shadow-blue-950/15 transition-transform hover:-translate-y-0.5 hover:bg-[#ffe078] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white">
                Start exploring <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/products?deals=1" className="inline-flex h-12 items-center justify-center rounded-full border border-white/35 px-5 text-sm font-bold text-white transition-colors hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white">
                Shop deals
              </Link>
            </div>
          </div>

          {spotlight ? (
            <Link href={`/products/${spotlight.slug}`} className="group relative isolate block min-h-[18rem] overflow-hidden bg-gradient-to-br from-[#ffe7a1] via-[#fff4d4] to-[#ffd780] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-4px] focus-visible:outline-blue-950 sm:min-h-[22rem] md:min-h-[27rem]">
              <div aria-hidden="true" className="absolute left-1/2 top-1/2 h-[19rem] w-[19rem] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/70 bg-white/25 shadow-[0_0_0_24px_rgba(255,255,255,0.16),0_0_0_50px_rgba(255,255,255,0.1)] sm:h-[24rem] sm:w-[24rem]" />
              <div className="absolute left-4 top-4 z-10 rounded-full bg-white px-3.5 py-2 text-[10px] font-extrabold uppercase tracking-[0.14em] text-blue-950 shadow-md sm:left-6 sm:top-6 sm:text-xs">
                <span className="mr-1.5 inline-block h-2 w-2 rounded-full bg-[#f28b21]" />In the spotlight
              </div>
              <div className="absolute right-4 top-4 z-10 rounded-full bg-[#174fc9] px-3.5 py-2 text-xs font-extrabold text-white shadow-lg sm:right-6 sm:top-6 sm:text-sm">
                {formatNaira(spotlight.minPriceKobo)}
              </div>
              <div className="absolute inset-0 flex items-center justify-center px-5 pb-12 pt-12 sm:px-8 sm:pb-14">
                <div className="relative h-full min-h-48 w-full max-w-xl transition-transform duration-500 group-hover:scale-[1.04] motion-reduce:transition-none">
                  <ProductImage url={spotlight.imageUrl} alt={spotlight.imageAlt} name={spotlight.name} priority sizes="(min-width:768px) 46vw, 100vw" className="object-contain p-5 drop-shadow-[0_22px_24px_rgba(22,39,83,0.18)] sm:p-8" />
                </div>
              </div>
              <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-3 bg-white/95 px-5 py-4 backdrop-blur-sm sm:px-7 sm:py-5">
                <div className="min-w-0">
                  <p className="text-[10px] font-extrabold uppercase tracking-[0.15em] text-blue-700 sm:text-[11px]">{spotlight.brand ?? spotlight.categoryName ?? "Featured find"}</p>
                  <p className="mt-1 line-clamp-1 font-display text-base font-bold text-blue-950 sm:text-lg">{spotlight.name}</p>
                </div>
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#174fc9] text-white transition-transform group-hover:translate-x-1"><ArrowRight className="h-5 w-5" /></span>
              </div>
            </Link>
          ) : (
            <div className="flex min-h-[18rem] items-center justify-center bg-gradient-to-br from-[#ffe7a1] to-[#fff4d4] p-8 text-center text-blue-950 md:min-h-[27rem]">
              <div><Sparkles className="mx-auto h-9 w-9 text-[#e29a00]" /><p className="mt-3 font-display text-2xl font-bold">Your next great find is waiting.</p><Link href="/products" className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-blue-800">Browse the shop <ArrowRight className="h-4 w-4" /></Link></div>
            </div>
          )}
        </div>
      </section>
      <main className="mx-auto max-w-7xl space-y-12 px-4 py-9 sm:space-y-16 sm:py-12 lg:px-8">
        {hasProducts ? rails.filter((rail) => rail.items.length > 0).map((rail) => (
          <section key={rail.title}>
            <SectionHeader title={rail.title} href={rail.href} linkLabel="View all" />
            <ProductGrid products={rail.items.slice(0, 4)} />
          </section>
        )) : (
          <EmptyState title="No products yet" body="Run supabase/seed.sql for sample data, or add products from the admin dashboard once it is built." />
        )}
      </main>
    </>
  );
}
