"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { Category } from "@/lib/catalog";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Arrow } from "@/components/ui/Button";
import { CategoryDeck } from "./CategoryDeck";

const ease = [0.22, 1, 0.36, 1] as const;

export function Categories({ categories }: { categories: Category[] }) {
  const [active, setActive] = useState(0);
  const current = categories[Math.min(active, categories.length - 1)];
  const list = useRef<HTMLUListElement>(null);
  const track = useRef<HTMLDivElement>(null);

  // Phones and tablets: the stack stays on screen while you scroll, and the
  // distance scrolled decides which board is at the front.
  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      const el = track.current;
      if (!el || el.offsetParent === null) return; // hidden on desktop
      const box = el.getBoundingClientRect();
      const distance = box.height - window.innerHeight;
      const progress = Math.min(0.999, Math.max(0, -box.top / distance));
      setActive(Math.floor(progress * categories.length));
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(frame);
    };
  }, [categories.length]);

  // Scrolling through the list also leafs through the boards: whichever row
  // sits near the middle of the screen becomes the active category.
  useEffect(() => {
    let lastRow = -1;
    let frame = 0;
    const update = () => {
      frame = 0;
      const ul = list.current;
      if (!ul || ul.offsetParent === null) return; // hidden on phones
      const line = window.innerHeight * 0.45;
      const box = ul.getBoundingClientRect();
      if (line < box.top || line > box.bottom) return;
      const row = Math.min(
        categories.length - 1,
        Math.floor(((line - box.top) / box.height) * categories.length),
      );
      if (row !== lastRow) {
        lastRow = row;
        setActive(row);
      }
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(frame);
    };
  }, [categories.length]);

  if (!current) return null;

  return (
    <section id="categories" className="py-24 lg:py-36">
      <div className="shell">
        <SectionHeader index="01" eyebrow="Featured categories" title="Every surface, *considered.*">
          Browse the material families we supply. Scroll or hover to leaf through the sample boards.
        </SectionHeader>

        {/* Desktop: interactive list on the left, large live preview on the right. */}
        <div className="mt-16 hidden gap-14 lg:grid lg:grid-cols-12">
          <ul ref={list} className="border-t border-line lg:col-span-7">
            {categories.map((category, i) => (
              <li key={category.slug} className="border-b border-line">
                <Link
                  href={`/categories/${category.slug}`}
                  onMouseEnter={() => setActive(i)}
                  onFocus={() => setActive(i)}
                  data-cursor="View"
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
            <div className="sticky top-[72px]">
              <CategoryDeck categories={categories} active={active} />
              <div className="mt-6 flex items-start justify-between gap-6">
                <AnimatePresence mode="wait" initial={false}>
                  <motion.p
                    key={current.slug}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -12 }}
                    transition={{ duration: 0.3, ease }}
                    className="max-w-xs text-[15px] leading-relaxed text-muted"
                  >
                    {current.blurb}
                  </motion.p>
                </AnimatePresence>
                <p className="display text-4xl text-accent-deep">
                  {String(active + 1).padStart(2, "0")}
                  <span className="text-lg text-muted"> / {categories.length}</span>
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile & tablet: the same 3D stack, pinned and driven by scrolling. */}
        <div ref={track} className="relative mt-6 h-[320svh] lg:hidden">
          <div className="sticky top-[72px] flex h-[calc(100svh-72px)] flex-col justify-center pb-6">
            <CategoryDeck categories={categories} active={active} compact />
            <div className="mt-6 flex items-end justify-between gap-4">
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={current.slug}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -16 }}
                  transition={{ duration: 0.3, ease }}
                  className="min-w-0"
                >
                  <h3 className="display text-[2rem] leading-tight">{current.name}</h3>
                  <p className="mt-2 text-[14px] leading-relaxed text-muted">{current.blurb}</p>
                </motion.div>
              </AnimatePresence>
              <p className="display shrink-0 text-3xl text-accent-deep">
                {String(active + 1).padStart(2, "0")}
                <span className="text-base text-muted"> / {categories.length}</span>
              </p>
            </div>
            {/* Progress through the categories */}
            <div aria-hidden="true" className="mt-5 flex gap-1">
              {categories.map((c, i) => (
                <span
                  key={c.slug}
                  className={`h-[3px] flex-1 transition-colors duration-500 ${i <= active ? "bg-accent" : "bg-line"}`}
                />
              ))}
            </div>
            <Link
              href={`/categories/${current.slug}`}
              className="mt-5 inline-flex items-center gap-3 self-start text-[12px] font-semibold uppercase tracking-[0.2em] text-ink"
            >
              View {current.name}
              <Arrow />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
