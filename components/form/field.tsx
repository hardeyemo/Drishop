import * as React from "react";
import { cn } from "@/lib/utils";

type Props = React.InputHTMLAttributes<HTMLInputElement> & {
  id: string;
  label: string;
  error?: string;
  hint?: string;
};

export function Field({ id, label, error, hint, className, ...props }: Props) {
  const errId = `${id}-error`;
  const hintId = `${id}-hint`;
  const describedBy = [error ? errId : null, hint && !error ? hintId : null].filter(Boolean).join(" ") || undefined;
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium">
        {label}
      </label>
      <input
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={cn(
          "h-11 w-full rounded-md border bg-white px-3 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-gold-deep",
          error ? "border-red-600" : "border-ink/20",
          className,
        )}
        {...props}
      />
      {hint && !error ? (
        <p id={hintId} className="mt-1 text-xs text-neutral-500">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={errId} className="mt-1 text-xs text-red-700">
          {error}
        </p>
      ) : null}
    </div>
  );
}
