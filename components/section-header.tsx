import Link from "next/link";

export function SectionHeader({ title, href, linkLabel = "View all" }: { title: string; href?: string; linkLabel?: string }) {
  return (
    <div className="mb-5 flex items-end justify-between gap-4 sm:mb-6">
      <h2 className="font-display text-2xl font-extrabold tracking-tight text-emerald-950 sm:text-3xl">{title}</h2>
      {href ? (
        <Link href={href} className="shrink-0 rounded-full bg-emerald-50 px-3 py-1.5 text-sm font-semibold text-emerald-900 underline-offset-4 hover:bg-emerald-100 hover:underline">
          {linkLabel}
        </Link>
      ) : null}
    </div>
  );
}
