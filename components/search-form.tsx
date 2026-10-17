"use client";

import * as React from "react";
import { Search } from "lucide-react";
import { useSearchParams } from "next/navigation";

/** Plain GET form: works without JavaScript and lands on /products?q=... */
export function SearchForm({ className, inputId = "site-search" }: { className?: string; inputId?: string }) {
  return <React.Suspense fallback={<SearchFormMarkup className={className} inputId={inputId} query="" onQueryChange={() => {}} />}>
    <SearchFormWithUrl className={className} inputId={inputId} />
  </React.Suspense>;
}

function SearchFormWithUrl({ className, inputId }: { className?: string; inputId: string }) {
  const searchParams = useSearchParams();
  const queryFromUrl = searchParams.get("q") ?? "";
  const [query, setQuery] = React.useState(queryFromUrl);
  const categoryRef = React.useRef<HTMLInputElement>(null);
  React.useEffect(() => setQuery(queryFromUrl), [queryFromUrl]);

  return <SearchFormMarkup
    className={className}
    inputId={inputId}
    query={query}
    onQueryChange={setQuery}
    categoryRef={categoryRef}
  />;
}

function SearchFormMarkup({
  className,
  inputId,
  query,
  onQueryChange,
  categoryRef,
}: {
  className?: string;
  inputId: string;
  query: string;
  onQueryChange: (value: string) => void;
  categoryRef?: React.RefObject<HTMLInputElement | null>;
}) {
  const fallbackCategoryRef = React.useRef<HTMLInputElement>(null);
  const formCategoryRef = categoryRef ?? fallbackCategoryRef;
  return (
    <form action="/products" role="search" className={className} onSubmit={() => {
      const current = new URL(window.location.href);
      formCategoryRef.current!.value = current.pathname === "/products" ? current.searchParams.get("category") ?? "" : "";
    }}>
      <input ref={formCategoryRef} type="hidden" name="category" defaultValue="" />
      <label htmlFor={inputId} className="sr-only">
        Search products
      </label>
      <div className="flex h-11 overflow-hidden rounded-full border border-white bg-white shadow-sm transition focus-within:ring-2 focus-within:ring-[#ffd34e]">
        <input
          id={inputId}
          name="q"
          type="search"
          maxLength={80}
          value={query}
          onChange={(event) => onQueryChange(event.currentTarget.value)}
          placeholder="Search phones, shoes, kitchen…"
          className="min-w-0 flex-1 bg-transparent px-3 text-base text-emerald-950 outline-none placeholder:text-neutral-500 sm:px-4 sm:text-sm"
        />
        <button
          type="submit"
          aria-label="Search"
          className="flex min-h-11 w-12 shrink-0 items-center justify-center bg-[#ffd34e] text-emerald-950 transition-colors hover:bg-[#ffdf73] focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-4 focus-visible:outline-emerald-950"
        >
          <Search className="h-5 w-5" />
        </button>
      </div>
    </form>
  );
}
