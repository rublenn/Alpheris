"use client";

import Link from "next/link";
import { motion, useMotionTemplate, useMotionValue, useReducedMotion, useSpring } from "framer-motion";
import { Arrow } from "@/components/ui/Button";
import { formatINR } from "@/lib/money";
import { fromPrice, productAvailability, type ShopProduct } from "@/lib/shop-types";
import { AvailabilityBadge, ProductVisual } from "./bits";

/**
 * Product card. The image tilts gently toward the pointer and a soft
 * highlight follows it, like light moving across a material sample.
 * Used on the homepage, category, brand and search pages.
 */
export function ProductCard({ product }: { product: ShopProduct }) {
  const reduce = useReducedMotion();
  const rotateX = useSpring(useMotionValue(0), { stiffness: 150, damping: 18 });
  const rotateY = useSpring(useMotionValue(0), { stiffness: 150, damping: 18 });
  const glowX = useMotionValue(50);
  const glowY = useMotionValue(50);
  const glow = useMotionTemplate`radial-gradient(circle at ${glowX}% ${glowY}%, rgba(255,255,255,0.35), transparent 55%)`;

  const price = fromPrice(product);
  const availability = productAvailability(product);
  const priced = product.variants.filter((v) => (v.salePricePaise ?? v.pricePaise) != null);
  const href = `/products/${product.slug}`;

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
    <article className="group relative">
      <div onPointerMove={onMove} onPointerLeave={onLeave} className="[perspective:1000px]">
        <motion.div
          style={{ rotateX, rotateY }}
          className="relative aspect-[4/5] overflow-hidden bg-beige will-change-transform"
        >
          <ProductVisual
            image={product.images[0]}
            swatch={product.swatch ?? product.category.swatch}
            alt={product.name}
            sizes="(min-width: 1024px) 25vw, 50vw"
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
          {product.category.name}
          {product.brand && ` · ${product.brand.name}`}
        </p>
        <h3 className="display mt-2 text-[1.5rem] leading-tight">
          {/* The link covers the whole card. */}
          <Link href={href} className="after:absolute after:inset-0 after:content-['']">
            {product.name}
          </Link>
        </h3>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-x-3 gap-y-2 border-t border-line pt-3">
          <span className="whitespace-nowrap text-[13px] text-muted">
            {price == null ? (
              "Price on request"
            ) : (
              <>
                {priced.length > 1 && "From "}
                <span className="text-ink">{formatINR(price)}</span>
              </>
            )}
          </span>
          {availability === "out-of-stock" || availability === "low-stock" ? (
            <AvailabilityBadge value={availability} />
          ) : (
            <span className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-ink transition-colors group-hover:text-accent-deep">
              View
              <Arrow className="transition-transform duration-500 ease-luxe group-hover:translate-x-1" />
            </span>
          )}
        </div>
      </div>
    </article>
  );
}
