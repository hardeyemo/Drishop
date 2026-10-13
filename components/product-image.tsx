"use client";

import { useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

type Props = {
  url: string | null;
  alt?: string | null;
  name: string;
  sizes: string;
  priority?: boolean;
  className?: string;
};

/** Fills its (relatively positioned) parent. Falls back to a monogram tile until an image is uploaded. */
export function ProductImage({ url, alt, name, sizes, priority, className }: Props) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  if (!url || failedUrl === url) {
    return (
      <div
        aria-hidden="true"
        className={cn(
          "flex h-full w-full items-center justify-center bg-gradient-to-br from-gold-soft via-white to-surface",
          className,
        )}
      >
        <span className="font-display text-6xl font-bold text-gold-deep/40">{name.charAt(0)}</span>
      </div>
    );
  }
  return (
    <Image
      src={url}
      alt={alt ?? name}
      fill
      sizes={sizes}
      priority={priority}
      className={cn("object-cover", className)}
      onError={() => setFailedUrl(url)}
    />
  );
}
