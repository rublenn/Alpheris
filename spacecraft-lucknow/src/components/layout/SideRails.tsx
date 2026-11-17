"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { site } from "@/lib/site";

/**
 * Architectural "drawing border" along both sides of the page on large screens:
 * a measured rail on the left with a marker that tracks how far you have
 * scrolled, and a rail on the right carrying the address and coordinates.
 * Decorative only; it never blocks clicks.
 */
const edge = "max(14px, calc((100vw - 1440px) / 2 + 18px))";

export function SideRails() {
  const { scrollYProgress } = useScroll();
  const top = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);
  const percent = useTransform(scrollYProgress, (v) => String(Math.round(v * 100)).padStart(2, "0"));
  const [lng, lat] = site.location.coordinates;

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-20 hidden lg:block">
      {/* Left: measured rail with a scroll marker */}
      <div style={{ left: edge }} className="absolute bottom-[78px] top-[100px] w-px bg-ink/12">
        <div className="absolute inset-y-0 -left-[3px] w-[7px] [background-image:repeating-linear-gradient(to_bottom,rgb(242_238_230/0.18)_0_1px,transparent_1px_28px)]" />
        <motion.div style={{ top }} className="absolute -left-[2px] h-12 w-[5px] -translate-y-1/2 bg-accent" />
      </div>
      <motion.p
        style={{ left: edge }}
        className="absolute bottom-[56px] -translate-x-1/2 text-[10px] font-semibold tracking-[0.2em] text-accent-deep"
      >
        {percent}
      </motion.p>

      {/* Right: rail carrying the location */}
      <div style={{ right: edge }} className="absolute bottom-[78px] top-[100px] w-px bg-ink/12">
        <p className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 whitespace-nowrap bg-ivory/90 py-5 text-[10px] font-semibold uppercase tracking-[0.35em] text-muted [writing-mode:vertical-rl]">
          {site.fullName} · {lat.toFixed(2)}° N · {lng.toFixed(2)}° E
        </p>
      </div>

      {/* Corner marks, like the corners of a drawing sheet */}
      <span style={{ left: edge }} className="absolute top-[100px] h-3 w-3 border-l border-t border-accent" />
      <span style={{ right: edge }} className="absolute top-[100px] h-3 w-3 border-r border-t border-accent" />
    </div>
  );
}
