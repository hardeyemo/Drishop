"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Category } from "@/lib/types";
import { resolveActiveDepartment } from "@/lib/data/active-department";

export function DepartmentLinks({ categories }: { categories: Category[] }) {
  const pathname = usePathname();
  const [active, setActive] = React.useState<string | null>(null);
  const roots = categories.filter((category) => !category.parentId);

  React.useEffect(() => {
    const sync = () => setActive(resolveActiveDepartment(window.location.pathname, window.location.search, categories));
    const onDepartmentSelect = (event: Event) => {
      const key = (event as CustomEvent<string>).detail;
      setActive(categories.some((category) => category.slug === key) ? key : null);
    };
    sync();
    window.addEventListener("popstate", sync);
    window.addEventListener("drishop:department-select", onDepartmentSelect);
    return () => {
      window.removeEventListener("popstate", sync);
      window.removeEventListener("drishop:department-select", onDepartmentSelect);
    };
  }, [categories, pathname]);

  const inactive = "bg-white/85 text-emerald-950";
  const activeDepartment = "bg-[#075c46] text-white";
  return <>
    <Link href="/products?deals=1" aria-current={active === "deals" ? "page" : undefined} onClick={() => setActive("deals")} className={`inline-flex h-8 shrink-0 items-center rounded-full px-3 font-bold focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-800 ${active === "deals" ? "bg-[#ffd34e] text-emerald-950" : inactive}`}>Deals</Link>
    {roots.map((category) => <Link key={category.slug} href={`/products?category=${encodeURIComponent(category.slug)}`} aria-current={active === category.slug ? "page" : undefined} onClick={() => setActive(category.slug)} className={`inline-flex h-8 shrink-0 items-center rounded-full px-3 font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-800 ${active === category.slug ? activeDepartment : inactive}`}>
      {category.name}
    </Link>)}
  </>;
}
