import Link from "next/link";
import { ChevronDown, Heart, MapPin, User } from "lucide-react";
import { getCategories } from "@/lib/data/catalog";
import { getUser } from "@/lib/auth";
import { SITE_NAME } from "@/lib/site-config";
import { CartButton } from "@/components/cart-button";
import { MobileNav } from "@/components/mobile-nav";
import { SearchForm } from "@/components/search-form";
import { DepartmentMenu } from "@/components/department-menu";
import { DepartmentLinks } from "@/components/department-links";

const actionLink =
  "inline-flex min-h-10 shrink-0 items-center justify-center gap-1.5 rounded-lg px-2 text-white transition-colors hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white sm:gap-2 sm:px-2.5";

export async function SiteHeader() {
  // The header must still render if the database is unreachable; the page itself reports the error.
  const [categories, user] = await Promise.all([getCategories().catch(() => []), getUser()]);
  const signedIn = Boolean(user);

  return (
    <header className="sticky top-0 z-40 border-b border-emerald-950/10 bg-white shadow-[0_3px_18px_rgba(6,78,59,0.12)]">
      <div className="bg-[#075c46] text-white">
        <div className="relative mx-auto flex min-h-[4.25rem] max-w-[1600px] items-center gap-2 px-3 sm:gap-4 sm:px-5 lg:px-7">
          <MobileNav categories={categories} signedIn={signedIn} buttonClassName="text-white md:hidden" />
          <Link href="/" className="shrink-0 font-display text-[1.35rem] font-extrabold tracking-tight text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white sm:text-[1.65rem]">
            {SITE_NAME}<span className="text-[#ffd34e]">.</span>
          </Link>

          <Link href="/products" className="hidden h-11 shrink-0 items-center gap-2 rounded-full bg-[#054b3b] px-3 text-left transition-colors hover:bg-[#033c2f] focus-visible:outline focus-visible:outline-2 focus-visible:outline-white lg:flex">
            <MapPin className="h-5 w-5 text-[#ffd34e]" />
            <span className="leading-tight"><span className="block text-[11px] text-white/75">Shopping in</span><span className="block text-xs font-bold">Nigeria</span></span>
            <ChevronDown className="ml-1 h-4 w-4" />
          </Link>

          <SearchForm inputId="site-search-desktop" className="hidden min-w-0 flex-1 md:block" />

          <div className="ml-auto flex shrink-0 items-center gap-0.5 sm:gap-1">
            <Link href="/account/wishlist" aria-label="Wishlist" className={actionLink}>
              <Heart className="h-5 w-5" />
              <span className="hidden text-left leading-tight lg:block"><span className="block text-[11px] text-white/75">Your</span><span className="block text-xs font-bold">Wishlist</span></span>
            </Link>
            <Link href={signedIn ? "/account" : "/login"} aria-label={signedIn ? "My account" : "Sign in to your account"} className={actionLink}>
              <User className="h-5 w-5" />
              <span className="hidden text-left leading-tight lg:block"><span className="block text-[11px] text-white/75">{signedIn ? "Welcome back" : "Sign in"}</span><span className="block text-xs font-bold">Account</span></span>
            </Link>
            <CartButton className="!text-white hover:!bg-white/10 focus-visible:!outline-white" badgeClassName="!bg-[#ffd34e] !text-emerald-950" showLabel />
          </div>
        </div>

        <div className="px-3 pb-3 md:hidden sm:px-5">
          <SearchForm inputId="site-search-mobile" />
        </div>
      </div>

      <nav aria-label="Shop departments" className="scrollbar-none overflow-x-auto bg-[#e9f4ee]">
        <div className="mx-auto flex h-11 w-max min-w-full max-w-[1600px] items-center gap-2 px-3 text-xs sm:gap-2.5 sm:px-5 lg:px-7">
          <DepartmentMenu categories={categories} />
          <DepartmentLinks categories={categories} />
        </div>
      </nav>
    </header>
  );
}
