export default function Loading() {
  return (
    <div className="mx-auto max-w-7xl px-3 py-7 sm:px-5 sm:py-9 lg:px-8" role="status" aria-label="Loading products">
      <div className="h-10 w-56 animate-pulse rounded bg-surface" />
      <div className="mt-6 h-32 animate-pulse rounded-xl bg-surface" />
      <div className="mt-7 grid grid-cols-2 gap-x-2.5 gap-y-5 sm:mt-10 sm:grid-cols-3 sm:gap-x-4 sm:gap-y-8 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i}>
            <div className="aspect-[4/3] animate-pulse rounded-xl bg-surface" />
            <div className="mt-3 h-4 w-3/4 animate-pulse rounded bg-surface" />
            <div className="mt-2 h-4 w-1/3 animate-pulse rounded bg-surface" />
            <div className="mt-2 h-3 w-full animate-pulse rounded bg-surface" />
          </div>
        ))}
      </div>
      <span className="sr-only">Loading…</span>
    </div>
  );
}
