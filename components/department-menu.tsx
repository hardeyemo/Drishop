"use client";

import * as React from "react";
import Link from "next/link";
import { ChevronDown, LayoutGrid } from "lucide-react";
import type { Category } from "@/lib/types";
import { useCart } from "@/components/cart-provider";

function categoryHref(slug: string) { return `/products?category=${encodeURIComponent(slug)}`; }

export function DepartmentMenu({ categories }: { categories: Category[] }) {
  const [open, setOpen] = React.useState(false);
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [position, setPosition] = React.useState({ left: 12, top: 0 });
  const rootRef = React.useRef<HTMLDivElement>(null);
  const buttonRef = React.useRef<HTMLButtonElement>(null);
  const { items } = useCart();
  const roots = categories.filter((category) => !category.parentId);
  const children = (id: string) => categories.filter((category) => category.parentId === id);
  const findRoot = (slug: string | null) => {
    let category = categories.find((entry) => entry.slug === slug);
    while (category?.parentId) category = categories.find((entry) => entry.id === category?.parentId);
    return category?.id ?? null;
  };
  const selectCategory = (slug: string) => {
    const rootId = findRoot(slug);
    const root = categories.find((category) => category.id === rootId);
    if (root) window.dispatchEvent(new CustomEvent("drishop:department-select", { detail: root.slug }));
    setOpen(false);
  };
  const selected = roots.find((category) => category.id === selectedId) ?? null;
  const slugsFor = (category: Category): Set<string> => {
    const slugs = new Set([category.slug]);
    for (const child of children(category.id)) for (const slug of slugsFor(child)) slugs.add(slug);
    return slugs;
  };
  const countFor = (category: Category) => {
    const slugs = slugsFor(category);
    return items.reduce((total, item) => total + (item.categorySlug && slugs.has(item.categorySlug) ? item.quantity : 0), 0);
  };

  const openMenu = () => {
    const rect = buttonRef.current?.getBoundingClientRect();
    if (rect) setPosition({ left: Math.max(12, Math.min(rect.left, window.innerWidth - Math.min(760, window.innerWidth - 24) - 12)), top: rect.bottom + 6 });
    const activeRoot = findRoot(new URL(window.location.href).searchParams.get("category"));
    setSelectedId(activeRoot ?? selectedId);
    setOpen(true);
  };

  React.useEffect(() => {
    function closeOutside(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function closeEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    }
    document.addEventListener("pointerdown", closeOutside);
    document.addEventListener("keydown", closeEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOutside);
      document.removeEventListener("keydown", closeEscape);
    };
  }, []);

  return (
    <div ref={rootRef} className="relative shrink-0">
      <button ref={buttonRef} type="button" aria-expanded={open} aria-controls="department-mega-menu" onClick={() => open ? setOpen(false) : openMenu()} className={`inline-flex h-8 items-center gap-1.5 rounded-full px-3 font-bold shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-800 ${open ? "bg-[#d8eadf] text-emerald-950" : "bg-white text-emerald-950"}`}>
        <LayoutGrid className="h-4 w-4" /> Departments <ChevronDown className={`h-3.5 w-3.5 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open ? (
        <div id="department-mega-menu" style={{ left: position.left, top: position.top }} className="fixed z-[70] w-[min(92vw,760px)] rounded-2xl border border-emerald-950/10 bg-white p-4 shadow-[0_18px_50px_rgba(6,78,59,0.2)] sm:p-6">
          <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-3">
            <div><p className="font-display text-lg font-extrabold text-emerald-950">Shop by department</p><p className="text-xs text-slate-500">Choose a department to browse its categories</p></div>
            <Link href="/products" onClick={() => setOpen(false)} className="text-sm font-semibold text-emerald-800 hover:underline">View all products</Link>
          </div>
          <div className="grid max-h-[min(65vh,520px)] grid-cols-1 gap-4 overflow-y-auto sm:grid-cols-[minmax(10rem,0.8fr)_minmax(0,1.5fr)]">
            <div role="list" aria-label="Departments" className="space-y-1 sm:border-r sm:border-slate-100 sm:pr-3">
              {roots.map((root) => {
                const count = countFor(root);
                const active = root.id === selected?.id;
                return <div key={root.id} role="listitem"><button type="button" aria-pressed={active} onClick={() => setSelectedId(root.id)} className={`flex min-h-11 w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-800 ${active ? "bg-emerald-50 font-bold text-emerald-950" : "text-slate-700"}`}>
                  <span>{root.name}</span>{count > 0 ? <span className="rounded-full bg-[#fff1c2] px-2 py-0.5 text-[11px] tabular-nums">{count}</span> : null}
                </button></div>;
              })}
            </div>
            {selected ? <section aria-label={`${selected.name} categories`}>
              <div className="mb-2 flex items-center justify-between gap-3">
                <h2 className="font-display text-base font-extrabold text-emerald-950">{selected.name}</h2>
                <Link href={categoryHref(selected.slug)} onClick={() => selectCategory(selected.slug)} className="shrink-0 text-xs font-bold text-emerald-800 underline underline-offset-2">Shop all</Link>
              </div>
              {children(selected.id).length ? <ul className="grid grid-cols-1 gap-1 sm:grid-cols-2">
                {children(selected.id).map((child) => {
                  const childCount = countFor(child);
                  return <li key={child.id}><Link href={categoryHref(child.slug)} onClick={() => selectCategory(child.slug)} className="flex min-h-10 items-center justify-between gap-2 rounded-lg px-3 py-2 text-sm text-slate-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-800"><span>{child.name}</span>{childCount > 0 ? <span className="text-xs font-semibold tabular-nums text-emerald-800">{childCount}</span> : null}</Link></li>;
                })}
              </ul> : <p className="rounded-lg bg-slate-50 p-3 text-sm text-slate-600">Browse the {selected.name} department to see available products.</p>}
            </section> : <p className="text-sm text-slate-500">Choose a department to see its categories and products.</p>}
          </div>
        </div>
      ) : null}
    </div>
  );
}
