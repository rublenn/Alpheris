"use client";

import Link from "next/link";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { categories } from "@/lib/catalog";
import { MaterialSwatch } from "@/components/ui/MaterialSwatch";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Arrow } from "@/components/ui/Button";
import { Reveal } from "@/components/ui/Reveal";

const ease = [0.22, 1, 0.36, 1] as const;

export function Categories() {
  const [active, setActive] = useState(0);
  const current = categories[active];

  return (
    <section id="categories" className="bg-ivory py-24 lg:py-36">
      <div className="shell">
        <SectionHeader index="01" eyebrow="Featured categories" title="Every surface, *considered.*">
          Browse the material families we supply. Hover a category to preview its character.
        </SectionHeader>

        {/* Desktop: interactive list on the left, large live preview on the right. */}
        <div className="mt-16 hidden gap-14 lg:grid lg:grid-cols-12">
          <ul className="border-t border-line lg:col-span-7">
            {categories.map((category, i) => (
              <li key={category.slug} className="border-b border-line">
                <Link
                  href="/categories"
                  onMouseEnter={() => setActive(i)}
                  onFocus={() => setActive(i)}
                  className="group flex items-center gap-6 py-5"
                >
                  <span className="w-8 text-[11px] font-semibold tracking-[0.2em] text-muted">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span
                    className={`display flex-1 text-[clamp(1.8rem,3vw,2.9rem)] transition-all duration-500 ease-luxe group-hover:translate-x-3 ${
                      active === i ? "translate-x-3 text-ink" : "text-ink/45"
                    }`}
                  >
                    {category.name}
                  </span>
                  <Arrow
                    className={`text-accent-deep transition-all duration-500 ease-luxe ${
                      active === i ? "translate-x-0 opacity-100" : "-translate-x-3 opacity-0"
                    }`}
                  />
                </Link>
              </li>
            ))}
          </ul>

          <div className="lg:col-span-5">
            <div className="sticky top-28">
              <div className="relative aspect-[4/5] overflow-hidden bg-beige">
                <AnimatePresence initial={false}>
                  <motion.div
                    key={current.slug}
                    className="absolute inset-0"
                    initial={{ clipPath: "inset(100% 0 0 0)", scale: 1.12 }}
                    animate={{ clipPath: "inset(0% 0 0 0)", scale: 1 }}
                    exit={{ opacity: 0.6 }}
                    transition={{ duration: 0.8, ease }}
                  >
                    <MaterialSwatch swatch={current.swatch} />
                  </motion.div>
                </AnimatePresence>
                <span className="absolute left-4 top-4 bg-white/90 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-ink">
                  Illustrative texture
                </span>
              </div>
              <div className="mt-5 flex items-start justify-between gap-6">
                <p className="max-w-xs text-[15px] leading-relaxed text-muted">{current.blurb}</p>
                <p className="display text-4xl text-accent-deep">
                  {String(active + 1).padStart(2, "0")}
                  <span className="text-lg text-muted"> / {categories.length}</span>
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile & tablet: simple, touch-friendly cards. */}
        <ul className="mt-12 grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:hidden">
          {categories.map((category, i) => (
            <li key={category.slug}>
              <Reveal delay={(i % 3) * 0.06}>
                <Link href="/categories" className="group block">
                  <div className="aspect-[4/5] overflow-hidden bg-beige">
                    <MaterialSwatch
                      swatch={category.swatch}
                      className="transition-transform duration-700 ease-luxe group-active:scale-105"
                    />
                  </div>
                  <p className="mt-3 text-[10px] font-semibold tracking-[0.2em] text-muted">
                    {String(i + 1).padStart(2, "0")}
                  </p>
                  <h3 className="display mt-1 text-[1.45rem] leading-tight">{category.name}</h3>
                </Link>
              </Reveal>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
