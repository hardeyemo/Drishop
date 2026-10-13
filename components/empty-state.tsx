import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

export function EmptyState({
  title,
  body,
  actionHref,
  actionLabel,
}: {
  title: string;
  body: string;
  actionHref?: string;
  actionLabel?: string;
}) {
  return (
    <div className="rounded-xl border border-dashed border-line px-6 py-14 text-center">
      <h2 className="font-display text-xl font-bold">{title}</h2>
      <p className="mx-auto mt-2 max-w-sm text-sm text-neutral-600">{body}</p>
      {actionHref && actionLabel ? (
        <Link href={actionHref} className={buttonVariants({ variant: "primary", className: "mt-6" })}>
          {actionLabel}
        </Link>
      ) : null}
    </div>
  );
}
