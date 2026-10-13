"use client";

import * as React from "react";
import { ProductImage } from "@/components/product-image";
import { cn } from "@/lib/utils";

type Img = { url: string; alt: string | null };

export function ProductGallery({ images, name }: { images: Img[]; name: string }) {
  const [index, setIndex] = React.useState(0);
  const current = images[index] ?? null;

  return (
    <div className="flex flex-col gap-3">
      <div className="relative aspect-square overflow-hidden rounded-2xl bg-surface">
        <ProductImage
          url={current?.url ?? null}
          alt={current?.alt}
          name={name}
          priority
          sizes="(min-width:1024px) 50vw, 100vw"
        />
      </div>
      {images.length > 1 ? (
        <ul className="grid grid-cols-5 gap-2" aria-label="Product images">
          {images.map((img, i) => (
            <li key={img.url}>
              <button
                type="button"
                onClick={() => setIndex(i)}
                aria-label={`Show image ${i + 1} of ${images.length}`}
                aria-current={i === index}
                className={cn(
                  "relative block aspect-square w-full overflow-hidden rounded-lg border-2 bg-surface focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-deep",
                  i === index ? "border-ink" : "border-transparent hover:border-line",
                )}
              >
                <ProductImage url={img.url} alt={img.alt} name={name} sizes="120px" />
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
