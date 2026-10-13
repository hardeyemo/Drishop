import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

function pageList(page: number, total: number): (number | "gap")[] {
  const set = new Set([1, total, page - 1, page, page + 1].filter((n) => n >= 1 && n <= total));
  const sorted = [...set].sort((a, b) => a - b);
  const out: (number | "gap")[] = [];
  sorted.forEach((n, i) => {
    if (i > 0 && n - sorted[i - 1] > 1) out.push("gap");
    out.push(n);
  });
  return out;
}

export function Pagination({
  page,
  totalPages,
  hrefFor,
}: {
  page: number;
  totalPages: number;
  hrefFor: (page: number) => string;
}) {
  if (totalPages <= 1) return null;
  const item =
    "inline-flex h-10 min-w-10 items-center justify-center rounded-md border border-line px-3 text-sm hover:border-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-gold-deep";
  return (
    <nav aria-label="Pagination" className="mt-12 flex flex-wrap items-center justify-center gap-2">
      {page > 1 ? (
        <Link href={hrefFor(page - 1)} className={item} aria-label="Previous page">
          <ChevronLeft className="h-4 w-4" />
        </Link>
      ) : null}
      {pageList(page, totalPages).map((n, i) =>
        n === "gap" ? (
          <span key={`g${i}`} aria-hidden="true" className="px-1 text-neutral-400">
            …
          </span>
        ) : (
          <Link
            key={n}
            href={hrefFor(n)}
            aria-current={n === page ? "page" : undefined}
            className={cn(item, n === page && "border-ink bg-ink text-white hover:border-ink")}
          >
            {n}
          </Link>
        ),
      )}
      {page < totalPages ? (
        <Link href={hrefFor(page + 1)} className={item} aria-label="Next page">
          <ChevronRight className="h-4 w-4" />
        </Link>
      ) : null}
    </nav>
  );
}
