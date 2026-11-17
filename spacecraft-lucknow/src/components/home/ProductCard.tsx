"use client";

import { motion, useMotionTemplate, useMotionValue, useReducedMotion, useSpring } from "framer-motion";
import { getBrand, getCategory, type Product } from "@/lib/catalog";
import { MaterialSwatch } from "@/components/ui/MaterialSwatch";
import { Arrow } from "@/components/ui/Button";
import { whatsappLink } from "@/lib/site";

/**
 * Product card. The image tilts gently toward the pointer and a soft
 * highlight follows it, like light moving across a material sample.
 * Reusable on category, brand and search pages in Phase 2.
 */
export function ProductCard({ product }: { product: Product }) {
  const reduce = useReducedMotion();
  const rotateX = useSpring(useMotionValue(0), { stiffness: 150, damping: 18 });
  const rotateY = useSpring(useMotionValue(0), { stiffness: 150, damping: 18 });
  const glowX = useMotionValue(50);
  const glowY = useMotionValue(50);
  const glow = useMotionTemplate`radial-gradient(circle at ${glowX}% ${glowY}%, rgba(255,255,255,0.55), transparent 55%)`;

  const category = getCategory(product.categorySlug);
  const brand = getBrand(product.brandSlug);

  function onMove(e: React.PointerEvent<HTMLDivElement>) {
    if (reduce || e.pointerType !== "mouse") return;
    const box = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - box.left) / box.width;
    const y = (e.clientY - box.top) / box.height;
    rotateY.set((x - 0.5) * 9);
    rotateX.set((0.5 - y) * 9);
    glowX.set(x * 100);
    glowY.set(y * 100);
  }

  function onLeave() {
    rotateX.set(0);
    rotateY.set(0);
  }

  return (
    <article className="group">
      <div onPointerMove={onMove} onPointerLeave={onLeave} className="[perspective:1000px]">
        <motion.div
          style={{ rotateX, rotateY }}
          className="relative aspect-[4/5] overflow-hidden bg-beige will-change-transform"
        >
          <MaterialSwatch
            swatch={product.swatch}
            className="transition-transform duration-[1200ms] ease-luxe group-hover:scale-[1.07]"
          />
          <motion.span
            aria-hidden="true"
            style={{ background: glow }}
            className="absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
          />
          {product.isSample && (
            <span className="absolute left-3 top-3 bg-white/90 px-2.5 py-1.5 text-[9px] font-semibold uppercase tracking-[0.2em] text-ink">
              Sample product
            </span>
          )}
        </motion.div>
      </div>

      <div className="mt-4">
        <p className="truncate text-[10px] font-semibold uppercase tracking-[0.2em] text-muted">
          {category?.name} · {brand?.name}
        </p>
        <h3 className="display mt-2 text-[1.5rem] leading-tight">{product.name}</h3>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-x-3 gap-y-1 border-t border-line pt-3">
          <span className="whitespace-nowrap text-[13px] text-muted">Price on request</span>
          <a
            href={whatsappLink(`Hello Space Craft, I would like to enquire about: ${category?.name ?? product.name}.`)}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Enquire about ${product.name} on WhatsApp`}
            className="group/link flex items-center gap-2 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-ink transition-colors hover:text-accent-deep"
          >
            Enquire
            <Arrow className="transition-transform duration-500 ease-luxe group-hover/link:translate-x-1" />
          </a>
        </div>
      </div>
    </article>
  );
}
