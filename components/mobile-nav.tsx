"use client";

import * as React from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";

type Item = { name: string; slug: string };

export function MobileNav({ categories, signedIn, buttonClassName = "" }: { categories: Item[]; signedIn: boolean; buttonClassName?: string }) {
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <div className="md:hidden">
      <button
        type="button"
        aria-expanded={open}
        aria-controls="mobile-nav-panel"
        aria-label={open ? "Close menu" : "Open menu"}
        onClick={() => setOpen((o) => !o)}
        className={`inline-flex h-10 w-10 items-center justify-center rounded-lg text-current transition-colors hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white ${buttonClassName}`}
      >
        {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>
      {open ? (
        <nav
          id="mobile-nav-panel"
          aria-label="Categories"
          className="absolute inset-x-0 top-full max-h-[70vh] overflow-y-auto border-b border-line bg-white px-4 pb-6 pt-2 shadow-lg"
        >
          <ul className="divide-y divide-line">
            <li>
              <Link href="/products" onClick={() => setOpen(false)} className="block py-3 font-medium">
                All products
              </Link>
            </li>
            <li>
              <Link href="/products?deals=1" onClick={() => setOpen(false)} className="block py-3 font-medium text-gold-deep">
                Deals
              </Link>
            </li>
            <li>
              <Link href={signedIn ? "/account" : "/login"} onClick={() => setOpen(false)} className="block py-3 font-medium">
                {signedIn ? "My account" : "Sign in or create account"}
              </Link>
            </li>
            {categories.map((c) => (
              <li key={c.slug}>
                <Link
                  href={`/products?category=${c.slug}`}
                  onClick={() => setOpen(false)}
                  className="block py-3"
                >
                  {c.name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      ) : null}
    </div>
  );
}
