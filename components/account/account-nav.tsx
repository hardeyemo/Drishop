"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const links = [
  { href: "/account", label: "Profile" },
  { href: "/account/wishlist", label: "Wishlist" },
  { href: "/account/security", label: "Password" },
];

export function AccountNav() {
  const pathname = usePathname();
  return (
    <nav aria-label="Account" className="flex gap-1 overflow-x-auto md:flex-col">
      {links.map((l) => {
        const active = pathname === l.href;
        return (
          <Link
            key={l.href}
            href={l.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "whitespace-nowrap rounded-md px-3 py-2 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-gold-deep",
              active ? "bg-ink font-medium text-white" : "hover:bg-surface",
            )}
          >
            {l.label}
          </Link>
        );
      })}
    </nav>
  );
}
