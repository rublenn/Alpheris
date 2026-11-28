"use client";

import { useState } from "react";
import type { ShopVariant } from "@/lib/shop-types";
import { useSelectedVariant } from "./VariantContext";
import type { Swatch } from "@/lib/catalog";
import { ProductVisual } from "./bits";

export function ProductGallery({
  images: productImages,
  variants,
  swatch,
  name,
  isSample,
}: {
  images: { url: string; alt: string }[];
  variants: ShopVariant[];
  swatch: Swatch | null;
  name: string;
  isSample: boolean;
}) {
  const { selected } = useSelectedVariant();
  const chosen = variants.find((v) => v.id === selected);
  // The chosen option's own photo comes first, then the product photos.
  const images = [
    ...(chosen?.imageUrl ? [{ url: chosen.imageUrl, alt: `${name} — ${chosen.label}` }] : []),
    ...productImages,
  ];
  const [picked, setIndex] = useState<{ variant: string; index: number }>({ variant: selected, index: 0 });
  const index = picked.variant === selected ? Math.min(picked.index, images.length - 1) : 0;
  const current = images[index] ?? null;

  return (
    <div>
      <div className="relative aspect-[4/5] overflow-hidden bg-beige">
        <ProductVisual image={current} swatch={swatch} alt={name} sizes="(min-width: 1024px) 50vw, 100vw" />
        {!current && (
          <span className="absolute left-4 top-4 bg-white/90 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-ink">
            Illustrative texture
          </span>
        )}
        {isSample && (
          <span className="absolute right-4 top-4 bg-white/90 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-ink">
            Sample product
          </span>
        )}
      </div>
      {images.length > 1 && (
        <ul className="mt-3 grid grid-cols-5 gap-3">
          {images.map((img, i) => (
            <li key={img.url}>
              <button
                type="button"
                onClick={() => setIndex({ variant: selected, index: i })}
                aria-label={`Show photo ${i + 1}`}
                aria-current={i === index}
                className={`block aspect-square w-full overflow-hidden border-2 transition-colors ${
                  i === index ? "border-accent" : "border-transparent opacity-70 hover:opacity-100"
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={img.url} alt="" className="h-full w-full object-cover" loading="lazy" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
