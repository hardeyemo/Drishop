"use client";

import * as React from "react";
import Link from "next/link";
import { Heart } from "lucide-react";
import { toggleWishlist } from "@/app/actions/account";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function WishlistButton({
  productId,
  initialSaved,
  signedIn,
  loginHref,
  compact = false,
}: {
  productId: string;
  initialSaved: boolean;
  signedIn: boolean;
  loginHref: string;
  compact?: boolean;
}) {
  const [saved, setSaved] = React.useState(initialSaved);
  const [error, setError] = React.useState(false);
  const [pending, start] = React.useTransition();

  const cls = buttonVariants({ variant: "outline", size: compact ? "sm" : "lg" });

  if (compact) {
    return (
      <button
        type="button"
        aria-label={saved ? "Remove from wishlist" : "Save to wishlist"}
        aria-pressed={saved}
        disabled={pending}
        className={cn("h-9 w-9 rounded-full border border-line bg-white/95 p-0 shadow-sm hover:bg-white", saved && "text-red-600")}
        onClick={() => start(async () => {
          setError(false);
          const res = await toggleWishlist(productId);
          if (res.needsSignIn) {
            window.location.assign(loginHref);
            return;
          }
          if (res.ok && res.saved !== undefined) setSaved(res.saved);
          else setError(true);
        })}
      >
        <Heart className={cn("mx-auto h-4 w-4", saved && "fill-current")} />
        {error ? <span className="sr-only">Could not update wishlist</span> : null}
      </button>
    );
  }

  if (!signedIn) {
    return (
      <Link href={loginHref} className={cls}>
        <Heart className="h-5 w-5" /> Sign in to save
      </Link>
    );
  }

  return (
    <div>
      <button
        type="button"
        aria-pressed={saved}
        disabled={pending}
        className={cn(cls, saved && "border-gold bg-gold-soft")}
        onClick={() =>
          start(async () => {
            setError(false);
            const res = await toggleWishlist(productId);
            if (res.ok && res.saved !== undefined) setSaved(res.saved);
            else setError(true);
          })
        }
      >
        <Heart className={cn("h-5 w-5", saved && "fill-gold text-gold-deep")} />
        {saved ? "Saved to wishlist" : "Save to wishlist"}
      </button>
      <p role="status" className="mt-1 min-h-5 text-xs text-red-700">
        {error ? "Couldn't update your wishlist. Try again." : ""}
      </p>
    </div>
  );
}
