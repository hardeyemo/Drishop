"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { CircleAlert, RefreshCw, ShoppingBag, Sparkles } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const pathname = usePathname();
  const [retrying, startRetry] = React.useTransition();

  React.useEffect(() => {
    // Route and digest are enough to correlate with server logs without logging query strings or user data.
    console.error("[Drishop] Page segment failed", {
      path: pathname,
      name: error.name || "Error",
      digest: error.digest ?? null,
    });
  }, [error.digest, error.name, pathname]);

  return (
    <section className="mx-auto max-w-3xl px-3 py-7 sm:px-4 sm:py-16" aria-labelledby="error-title">
      <div className="overflow-hidden rounded-3xl border border-blue-950/10 bg-white shadow-xl shadow-blue-950/5">
        <div className="relative overflow-hidden bg-[#174fc9] px-5 py-7 text-white sm:px-10 sm:py-10">
          <Sparkles aria-hidden="true" className="absolute -right-2 -top-5 h-32 w-32 rotate-12 text-white/10" />
          <p className="relative inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-bold uppercase tracking-[0.12em] text-white">
            <CircleAlert className="h-4 w-4 text-[#ffd34e]" /> A little pause
          </p>
          <h1 id="error-title" className="relative mt-4 max-w-xl font-display text-2xl font-extrabold leading-tight sm:text-4xl">
            We couldn&apos;t load this page
          </h1>
          <p className="relative mt-3 max-w-lg text-sm leading-relaxed text-white/85 sm:text-base">
            Something interrupted your shopping trip. You can try again or head back to the marketplace.
          </p>
        </div>

        <div className="px-6 py-7 sm:px-10 sm:py-8">
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button variant="gold" size="lg" disabled={retrying} onClick={() => startRetry(reset)} className="bg-[#ffd34e] font-bold text-blue-950 hover:bg-[#ffe078] focus-visible:outline-blue-800">
              <RefreshCw className={`h-4 w-4 ${retrying ? "animate-spin" : ""}`} /> {retrying ? "Retrying…" : "Try again"}
            </Button>
            <Link href="/products" className={buttonVariants({ variant: "outline", size: "lg", className: "border-blue-200 text-blue-950 hover:bg-blue-50" })}>
              <ShoppingBag className="h-4 w-4" /> Browse products
            </Link>
          </div>

          <p className="mt-5 text-xs text-slate-500">Your cart is saved while you get back on track.</p>
          {process.env.NODE_ENV !== "production" ? (
            <details className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4 text-left">
              <summary className="cursor-pointer text-xs font-semibold text-slate-600">Developer error details</summary>
              <pre className="mt-3 max-h-48 overflow-auto whitespace-pre-wrap break-words text-xs text-slate-700">{error.message}{error.digest ? `\nDigest: ${error.digest}` : ""}</pre>
            </details>
          ) : null}
        </div>
      </div>
    </section>
  );
}
