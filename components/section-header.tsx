import Link from "next/link";
import { ArrowRight } from "lucide-react";

export function SectionHeader({ title, href, linkLabel = "View all" }: { title: string; href?: string; linkLabel?: string }) {
  return (
    <div className="mb-5 sm:mb-6">
      <h2 className="font-display text-2xl font-extrabold tracking-tight text-emerald-950 sm:text-3xl">{title}</h2>
      {href ? (
        <div className="mt-2 flex justify-end">
          <Link href={href} className="inline-flex h-10 items-center gap-2 rounded-full border border-emerald-200 bg-white px-4 text-sm font-semibold text-emerald-900 shadow-sm transition-colors hover:border-emerald-300 hover:bg-emerald-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-800">
            {linkLabel} <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      ) : null}
    </div>
  );
}
