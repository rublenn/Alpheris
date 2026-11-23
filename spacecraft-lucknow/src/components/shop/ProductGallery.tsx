"use client";

import { useState } from "react";
import type { Swatch } from "@/lib/catalog";
import { ProductVisual } from "./bits";

export function ProductGallery({
  images,
  swatch,
  name,
  isSample,
}: {
  images: { url: string; alt: string }[];
  swatch: Swatch | null;
  name: string;
  isSample: boolean;
}) {
  const [index, setIndex] = useState(0);
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
                onClick={() => setIndex(i)}
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
