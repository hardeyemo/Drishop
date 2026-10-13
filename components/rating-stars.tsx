import { Star } from "lucide-react";

export function RatingStars({ value, count }: { value: number; count: number }) {
  if (count === 0) return <span className="text-xs text-neutral-500">No reviews yet</span>;
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="flex" aria-hidden="true">
        {[1, 2, 3, 4, 5].map((n) => (
          <Star
            key={n}
            className={`h-3.5 w-3.5 ${n <= Math.round(value) ? "fill-gold text-gold" : "text-neutral-300"}`}
          />
        ))}
      </span>
      <span className="sr-only">
        Rated {value.toFixed(1)} out of 5 from {count} reviews
      </span>
      <span className="text-xs text-neutral-500" aria-hidden="true">
        ({count})
      </span>
    </span>
  );
}
