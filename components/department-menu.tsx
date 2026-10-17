"use client";

import * as React from "react";
import Link from "next/link";
import { ChevronDown, LayoutGrid } from "lucide-react";
import type { Category } from "@/lib/types";

function categoryHref(slug: string) { return `/products?category=${encodeURIComponent(slug)}`; }

export function DepartmentMenu({ categories }: { categories: Category[] }) {
  const [open, setOpen] = React.useState(false);
  const [position, setPosition] = React.useState({ left: 12, top: 0 });
  const rootRef = React.useRef<HTMLDivElement>(null);
  const buttonRef = React.useRef<HTMLButtonElement>(null);
  const roots = categories.filter((category) => !category.parentId);
  const children = (id: string) => categories.filter((category) => category.parentId === id);
  const descendants = (id: string, depth = 0): { category: Category; depth: number }[] =>
    children(id).flatMap((category) => [
      { category, depth },
      ...descendants(category.id, depth + 1),
    ]);
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
  const categoryTree = (id: string, depth = 0): { category: Category; depth: number }[] =>
    children(id).flatMap((category) => [
      { category, depth },
      ...categoryTree(category.id, depth + 1),
    ]);
  const allCategories = roots.flatMap((root) => [
    { category: root, depth: 0 },
    ...categoryTree(root.id, 1),
  ]);

  const openMenu = () => {
    const rect = buttonRef.current?.getBoundingClientRect();
    if (rect) setPosition({ left: Math.max(12, Math.min(rect.left, window.innerWidth - Math.min(760, window.innerWidth - 24) - 12)), top: rect.bottom + 6 });
    const activeRoot = findRoot(new URL(window.location.href).searchParams.get("category"));
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
          <ul aria-label="Department categories" className="grid max-h-[min(65vh,520px)] grid-cols-1 gap-1 overflow-y-auto sm:grid-cols-2">
            {allCategories.map(({ category, depth }) => (
              <li key={category.id}>
                <Link href={categoryHref(category.slug)} onClick={() => selectCategory(category.slug)} style={{ paddingLeft: `${12 + depth * 16}px` }} className="flex min-h-10 items-center rounded-lg py-2 pr-3 text-sm text-slate-600 hover:bg-emerald-50 hover:text-emerald-950 focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-800">
                  {category.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
