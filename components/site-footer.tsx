import Link from "next/link";
import { ArrowRight, Heart, ShieldCheck, ShoppingBag } from "lucide-react";
import { getCategories } from "@/lib/data/catalog";
import { SITE_NAME } from "@/lib/site-config";
import { SupportContact } from "@/components/support-contact";

export async function SiteFooter() {
  const categories = await getCategories().catch(() => []);
  const popularCategories = categories.filter((category) => !category.parentId).slice(0, 6);

  return (
    <footer className="mt-20 border-t border-emerald-950/10">
      <div className="bg-[#075c46] text-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-7 sm:flex-row sm:items-center sm:justify-between lg:px-8">
          <div>
            <p className="font-display text-xl font-extrabold sm:text-2xl">A better way to find your everyday favourites.</p>
            <p className="mt-1 text-sm text-white/80">Browse the marketplace and discover something useful today.</p>
          </div>
          <Link href="/products" className="inline-flex h-10 shrink-0 items-center justify-center gap-2 self-start rounded-full bg-white px-5 text-sm font-bold text-emerald-950 transition-colors hover:bg-[#fff1c2] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white sm:self-center">
            Start shopping <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>

      <div className="bg-[#f0f7f2]">
        <div className="mx-auto grid max-w-7xl gap-9 px-4 py-10 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr] lg:gap-12 lg:px-8 lg:py-12">
          <div>
            <Link href="/" className="inline-block font-display text-2xl font-extrabold tracking-tight text-emerald-950 focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-800">
              {SITE_NAME}<span className="text-[#d79a00]">.</span>
            </Link>
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-slate-600">Shop phones, fashion, home essentials and more. Pay securely and get your order delivered across Nigeria.</p>
            <div className="mt-5 flex flex-wrap gap-2 text-xs font-semibold text-emerald-950">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-2"><ShieldCheck className="h-4 w-4 text-emerald-700" /> Secure checkout</span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-2"><ShoppingBag className="h-4 w-4 text-emerald-700" /> Local marketplace</span>
            </div>
          </div>

          <nav aria-label="Shop">
            <h2 className="text-sm font-extrabold text-emerald-950">Shop</h2>
            <ul className="mt-4 space-y-3 text-sm text-slate-600">
              <li><Link href="/products" className="transition-colors hover:text-emerald-800">All products</Link></li>
              <li><Link href="/products?deals=1" className="transition-colors hover:text-emerald-800">Deals</Link></li>
              <li><Link href="/products?sort=newest" className="transition-colors hover:text-emerald-800">New arrivals</Link></li>
              <li><Link href="/cart" className="transition-colors hover:text-emerald-800">Shopping cart</Link></li>
            </ul>
          </nav>

          <nav aria-label="Popular categories">
            <h2 className="text-sm font-extrabold text-emerald-950">Popular categories</h2>
            <ul className="mt-4 space-y-3 text-sm text-slate-600">
              {popularCategories.map((category) => (
                <li key={category.slug}><Link href={`/products?category=${category.slug}`} className="transition-colors hover:text-emerald-800">{category.name}</Link></li>
              ))}
            </ul>
          </nav>

          <nav aria-label="Your Drishop">
            <h2 className="text-sm font-extrabold text-emerald-950">Your Drishop</h2>
            <ul className="mt-4 space-y-3 text-sm text-slate-600">
              <li><Link href="/account" className="transition-colors hover:text-emerald-800">My account</Link></li>
              <li><Link href="/account/wishlist" className="inline-flex items-center gap-2 transition-colors hover:text-emerald-800"><Heart className="h-4 w-4" /> Wishlist</Link></li>
              <li><Link href="/checkout" className="transition-colors hover:text-emerald-800">Secure checkout</Link></li>
              <li><Link href="/login" className="transition-colors hover:text-emerald-800">Sign in or create account</Link></li>
              <li><Link href="/contact" className="transition-colors hover:text-emerald-800">Contact Us</Link></li>
              <li><Link href="/help" className="transition-colors hover:text-emerald-800">Help / FAQ</Link></li>
            </ul>
          </nav>
        </div>

        <div className="mx-auto max-w-7xl px-4 pb-8 lg:px-8">
          <SupportContact compact />
        </div>

        <div className="border-t border-emerald-950/10 bg-[#e5f0e9]">
          <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-4 text-xs text-slate-600 sm:flex-row sm:items-center sm:justify-between lg:px-8">
            <span>© {new Date().getFullYear()} {SITE_NAME}. All rights reserved.</span>
            <span>Prices are shown in Nigerian naira.</span>
            <nav aria-label="Legal" className="flex flex-wrap gap-x-4 gap-y-1">
              <Link href="/terms" className="hover:text-emerald-900">Terms and Conditions</Link>
              <Link href="/cookies" className="hover:text-emerald-900">Cookie Policy</Link>
            </nav>
          </div>
        </div>
      </div>
    </footer>
  );
}
