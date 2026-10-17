"use client";

import * as React from "react";
import Link from "next/link";

const KEY = "drishop-cookie-notice-dismissed-v1";

export function CookieNotice() {
  const [visible, setVisible] = React.useState(false);
  React.useEffect(() => {
    try { setVisible(window.localStorage.getItem(KEY) !== "1"); }
    catch { setVisible(true); }
  }, []);

  if (!visible) return null;
  function dismiss() {
    try { window.localStorage.setItem(KEY, "1"); } catch { /* dismissal is best effort */ }
    setVisible(false);
  }
  return <aside aria-label="Cookie notice" className="fixed inset-x-3 bottom-3 z-[80] mx-auto max-w-3xl rounded-xl border border-emerald-950/10 bg-white p-4 shadow-[0_8px_36px_rgba(2,6,23,0.2)] sm:inset-x-5 sm:flex sm:items-center sm:justify-between sm:gap-5 sm:p-5">
    <p className="text-sm leading-relaxed text-slate-700">Drishop uses essential cookies to keep sign-in secure. Guest carts and recently viewed items use browser storage. <Link href="/cookies" className="font-semibold text-emerald-800 underline underline-offset-2">Cookie policy</Link></p>
    <button type="button" onClick={dismiss} className="mt-3 min-h-10 shrink-0 rounded-lg bg-emerald-900 px-4 text-sm font-semibold text-white hover:bg-emerald-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-800 sm:mt-0">Got it</button>
  </aside>;
}
