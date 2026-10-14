"use client";

import * as React from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";

type Item = { name: string; slug: string };
type TouchStart = { y: number; time: number };

export function MobileNav({ categories, signedIn, buttonClassName = "" }: { categories: Item[]; signedIn: boolean; buttonClassName?: string }) {
  const [open, setOpen] = React.useState(false);
  const [dragY, setDragY] = React.useState(0);
  const panelRef = React.useRef<HTMLDivElement>(null);
  const triggerRef = React.useRef<HTMLButtonElement>(null);
  const touchStart = React.useRef<TouchStart | null>(null);

  const close = React.useCallback(() => {
    setOpen(false);
    setDragY(0);
  }, []);

  React.useEffect(() => {
    if (!open) return;

    const scrollY = window.scrollY;
    const trigger = triggerRef.current;
    const body = document.body;
    const html = document.documentElement;
    const previousBody = {
      position: body.style.position,
      top: body.style.top,
      left: body.style.left,
      right: body.style.right,
      width: body.style.width,
      overflow: body.style.overflow,
    };
    const previousHtmlOverflow = html.style.overflow;

    body.style.position = "fixed";
    body.style.top = `-${scrollY}px`;
    body.style.left = "0";
    body.style.right = "0";
    body.style.width = "100%";
    body.style.overflow = "hidden";
    html.style.overflow = "hidden";

    const focusClose = window.requestAnimationFrame(() => {
      panelRef.current?.querySelector<HTMLButtonElement>("[data-sheet-close]")?.focus();
    });

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        close();
        return;
      }
      if (event.key !== "Tab" || !panelRef.current) return;
      const focusable = panelRef.current.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );
      const first = focusable.item(0);
      const last = focusable.item(focusable.length - 1);
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.cancelAnimationFrame(focusClose);
      window.removeEventListener("keydown", onKeyDown);
      body.style.position = previousBody.position;
      body.style.top = previousBody.top;
      body.style.left = previousBody.left;
      body.style.right = previousBody.right;
      body.style.width = previousBody.width;
      body.style.overflow = previousBody.overflow;
      html.style.overflow = previousHtmlOverflow;
      window.scrollTo(0, scrollY);
      trigger?.focus();
    };
  }, [open, close]);

  function startDrag(event: React.PointerEvent<HTMLDivElement>) {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    touchStart.current = { y: event.clientY, time: performance.now() };
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function finishDrag(event: React.PointerEvent<HTMLDivElement>) {
    const start = touchStart.current;
    if (!start) return;
    const delta = Math.max(0, event.clientY - start.y);
    const elapsed = Math.max(1, performance.now() - start.time);
    touchStart.current = null;
    if (delta > 88 || (delta > 42 && delta / elapsed > 0.55)) close();
    else setDragY(0);
  }

  function moveDrag(event: React.PointerEvent<HTMLDivElement>) {
    if (!touchStart.current) return;
    setDragY(Math.max(0, Math.min(event.clientY - touchStart.current.y, 240)));
  }

  return (
    <div className="md:hidden">
      <button
        ref={triggerRef}
        type="button"
        aria-expanded={open}
        aria-controls="mobile-nav-panel"
        aria-label={open ? "Close menu" : "Open menu"}
        onClick={() => setOpen((value) => !value)}
        className={`inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-current transition-colors hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white ${buttonClassName}`}
      >
        {open ? <X aria-hidden="true" className="h-5 w-5" /> : <Menu aria-hidden="true" className="h-5 w-5" />}
      </button>

      <div
        className={`fixed inset-0 z-[60] flex items-end transition-[visibility] duration-300 ${open ? "visible delay-0" : "invisible delay-300"}`}
        aria-hidden={!open}
        inert={!open}
      >
        <button
          type="button"
          tabIndex={-1}
          aria-label="Close navigation menu"
          onClick={close}
          className={`absolute inset-0 bg-slate-950/50 transition-opacity duration-200 motion-reduce:transition-none ${open ? "opacity-100" : "opacity-0"}`}
        />
        <div
          id="mobile-nav-panel"
          ref={panelRef}
          role="dialog"
          aria-modal="true"
          aria-label="Shop navigation"
          className={`relative z-10 flex h-[50dvh] min-h-64 max-h-[34rem] w-full flex-col overflow-hidden rounded-t-[1.75rem] border border-b-0 border-white/70 bg-white shadow-[0_-18px_60px_rgba(2,6,23,0.2)] pb-[max(1rem,env(safe-area-inset-bottom))] transition-transform duration-300 ease-out motion-reduce:transition-none ${open ? "translate-y-0" : "translate-y-full"} ${dragY > 0 ? "!transition-none" : ""}`}
          style={dragY > 0 ? { transform: `translateY(${dragY}px)` } : undefined}
          onPointerMove={moveDrag}
          onPointerUp={finishDrag}
          onPointerCancel={finishDrag}
        >
          <div
            className="flex shrink-0 cursor-grab touch-none flex-col items-center px-4 pb-3 pt-3 active:cursor-grabbing"
            onPointerDown={startDrag}
            aria-hidden="true"
          >
            <span className="h-1.5 w-11 rounded-full bg-slate-300" />
          </div>
          <div className="flex shrink-0 items-center justify-between border-b border-slate-100 px-5 pb-3">
            <div>
              <p className="font-display text-lg font-extrabold text-emerald-950">Shop departments</p>
              <p className="mt-0.5 text-xs text-slate-500">Browse Drishop by category</p>
            </div>
            <button
              type="button"
              data-sheet-close
              onClick={close}
              aria-label="Close menu"
              className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-slate-100 text-slate-700 transition-colors hover:bg-slate-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-800"
            >
              <X aria-hidden="true" className="h-5 w-5" />
            </button>
          </div>
          <nav aria-label="Categories" className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-2">
            <ul className="divide-y divide-slate-100">
              <li>
                <Link href="/products" onClick={close} className="flex min-h-12 items-center py-3 text-sm font-semibold text-slate-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-800">
                  All products
                </Link>
              </li>
              <li>
                <Link href="/products?deals=1" onClick={close} className="flex min-h-12 items-center py-3 text-sm font-bold text-amber-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-800">
                  Deals
                </Link>
              </li>
              <li>
                <Link href={signedIn ? "/account" : "/login"} onClick={close} className="flex min-h-12 items-center py-3 text-sm font-semibold text-slate-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-800">
                  {signedIn ? "My account" : "Sign in or create account"}
                </Link>
              </li>
              {categories.map((category) => (
                <li key={category.slug}>
                  <Link
                    href={`/products?category=${category.slug}`}
                    onClick={close}
                    className="flex min-h-12 items-center py-3 text-sm text-slate-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-800"
                  >
                    {category.name}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </div>
    </div>
  );
}
