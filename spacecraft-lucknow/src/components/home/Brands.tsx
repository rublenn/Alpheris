"use client";

import { useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  brands,
  getBrandProducts,
  getCategory,
  type Brand,
} from "@/lib/catalog";
import { MaterialSwatch } from "@/components/ui/MaterialSwatch";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Reveal } from "@/components/ui/Reveal";
import { useTouchReveal } from "@/components/ui/useTouchReveal";

const ease = [0.22, 1, 0.36, 1] as const;

export function Brands() {
  const [open, setOpen] = useState(0);
  // Two rows of three; in each row the open card takes the extra width.
  const rows = [brands.slice(0, 3), brands.slice(3, 6)];

  return (
    <section
      id="brands"
      className="border-y border-line bg-white/75 py-24 lg:py-32"
    >
      <div className="shell">
        <SectionHeader
          index="02"
          eyebrow="Featured brands"
          title="Trusted names, *one roof.*"
        >
          Hover or tap a brand to see what we stock from it.
          <span className="mt-3 block text-[13px] text-accent-deep">
            Placeholder brands and example products shown — real ones will
            appear here once confirmed.
          </span>
        </SectionHeader>

        <Reveal delay={0.1}>
          <div className="mt-14 flex flex-col gap-3">
            {rows.map((row, r) => (
              <ul
                key={r}
                className="flex flex-col gap-3 lg:h-[400px] lg:flex-row xl:h-[310px]"
              >
                {row.map((brand, i) => {
                  const index = r * 3 + i;
                  return (
                    <BrandCard
                      key={brand.slug}
                      index={index}
                      brand={brand}
                      open={open === index}
                      onOpen={() => setOpen(index)}
                    />
                  );
                })}
              </ul>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/** One brand. The open card widens and shows that brand's products. */
function BrandCard({
  index,
  brand,
  open,
  onOpen,
}: {
  index: number;
  brand: Brand;
  open: boolean;
  onOpen: () => void;
}) {
  const items = getBrandProducts(brand.slug).slice(0, 3);
  const item = useRef<HTMLLIElement>(null);
  // On phones the card opens by itself as it scrolls in, and tilts with the scroll.
  const { touch, seen, tilt } = useTouchReveal(item);
  const expanded = touch ? seen || open : open;

  return (
    <motion.li
      ref={item}
      style={touch ? { ...tilt, transformPerspective: 1000 } : undefined}
      initial={false}
      animate={{ flexGrow: open ? 2.4 : 1 }}
      transition={{ duration: 0.8, ease }}
      onPointerEnter={(e) => e.pointerType === "mouse" && onOpen()}
      onClick={onOpen}
      data-cursor={expanded ? undefined : "Open"}
      className={`relative min-w-0 cursor-pointer overflow-hidden border transition-[background-color,border-color,box-shadow] duration-700 lg:basis-0 ${
        open
          ? "border-accent/50 bg-ivory shadow-[0_40px_70px_-45px_rgba(37,37,37,0.45)]"
          : "border-line bg-white/60"
      }`}
    >
      <span
        className={`absolute inset-x-0 top-0 h-[2px] origin-left bg-accent transition-transform duration-700 ease-luxe ${
          expanded ? "scale-x-100" : "scale-x-0"
        }`}
      />

      <div className="flex h-full flex-col justify-between gap-8 p-6 sm:p-8">
        <div className="flex items-start justify-between">
          <span className="text-[10px] font-semibold tracking-[0.2em] text-muted">
            {String(index + 1).padStart(2, "0")}
          </span>
          {brand.isSample && (
            <span className="border border-accent/50 px-2 py-1 text-[9px] font-semibold uppercase tracking-[0.18em] text-accent-deep">
              Sample
            </span>
          )}
        </div>

        {/* On wide screens the name sits left and the products right, to keep rows short. */}
        <div className="xl:flex xl:items-end xl:justify-between xl:gap-8">
          <div className="min-w-0">
            <h3
              className={`display leading-tight transition-colors duration-500 ${expanded ? "text-ink" : "text-ink/60"}`}
            >
              <button
                type="button"
                aria-expanded={expanded}
                className="text-left text-[clamp(1.6rem,2.4vw,2.3rem)]"
              >
                {brand.name}
              </button>
            </h3>
            <p className="mt-2 text-[11px] uppercase tracking-[0.16em] text-muted">
              {brand.categorySlugs
                .map((slug) => getCategory(slug)?.name)
                .join(" · ")}
            </p>
          </div>

          <AnimatePresence initial={false}>
            {expanded && (
              <motion.div
                key="products"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.7, ease }}
                className="overflow-hidden"
              >
                {/* Fixed width on desktop so nothing re-wraps while the card grows. */}
                <ul className="mt-5 grid grid-cols-3 gap-3 border-t border-line pt-5 lg:w-[400px] xl:mt-0 xl:w-[330px] xl:shrink-0 xl:border-t-0 xl:pt-0">
                  {items.map((product, n) => (
                    <motion.li
                      key={product.slug}
                      initial={{ opacity: 0, y: 26 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{
                        duration: 0.7,
                        delay: 0.2 + n * 0.09,
                        ease,
                      }}
                    >
                      <div className="aspect-[4/5] overflow-hidden bg-beige">
                        <MaterialSwatch swatch={product.swatch} />
                      </div>
                      <p className="mt-2 text-[12px] leading-snug text-ink">
                        {product.name}
                      </p>
                    </motion.li>
                  ))}
                </ul>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.li>
  );
}
