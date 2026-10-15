"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const links = [
  { href: "/account", label: "Profile" },
  { href: "/account/wishlist", label: "Wishlist" },
  { href: "/account/notifications", label: "Notifications" },
  { href: "/account/recently-viewed", label: "Recently viewed" },
  { href: "/account/security", label: "Password" },
  { href: "/account/privacy", label: "Privacy & deletion" },
];

export function AccountNav({ unreadCount = 0 }: { unreadCount?: number }) {
  const pathname = usePathname();
  return (
    <nav aria-label="Account" className="scrollbar-none -mx-1 flex gap-1 overflow-x-auto px-1 pb-1 md:mx-0 md:flex-col md:overflow-visible md:px-0 md:pb-0">
      {links.map((l) => {
        const active = pathname === l.href;
        return (
          <Link
            key={l.href}
            href={l.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "inline-flex min-h-11 shrink-0 items-center whitespace-nowrap rounded-lg px-3 py-2 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-gold-deep",
              active ? "bg-ink font-medium text-white" : "hover:bg-surface",
            )}
          >
            {l.label}
            {l.href === "/account/notifications" && unreadCount > 0 ? (
              <span className="ml-2 inline-flex min-w-5 items-center justify-center rounded-full bg-[#ffd34e] px-1.5 py-0.5 text-[11px] font-bold text-blue-950" aria-label={`${unreadCount} unread`}>
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            ) : null}
          </Link>
        );
      })}
    </nav>
  );
}
