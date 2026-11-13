"use client";

import { motion, useMotionValue, useSpring } from "framer-motion";
import { categories } from "@/lib/catalog";
import { MaterialSwatch } from "@/components/ui/MaterialSwatch";

const glide = { duration: 0.95, ease: [0.22, 1, 0.36, 1] } as const;
const count = categories.length;

/**
 * A 3D stack of material sample boards. The active category is at the front
 * and the next three wait behind it. When you move on, the front board lifts
 * and tucks away to the back of the stack while the others step forward —
 * like leafing through physical samples. The stack tilts toward the pointer.
 *
 * The stack is sized from the screen height, so a board is never cut off.
 */
export function CategoryDeck({ active, compact = false }: { active: number; compact?: boolean }) {
  const tiltX = useSpring(useMotionValue(0), { stiffness: 120, damping: 16 });
  const tiltY = useSpring(useMotionValue(0), { stiffness: 120, damping: 16 });

  function onMove(e: React.PointerEvent<HTMLDivElement>) {
    if (e.pointerType !== "mouse") return;
    const box = e.currentTarget.getBoundingClientRect();
    tiltY.set(((e.clientX - box.left) / box.width - 0.5) * 12);
    tiltX.set((0.5 - (e.clientY - box.top) / box.height) * 10);
  }

  function onLeave() {
    tiltX.set(0);
    tiltY.set(0);
  }

  return (
    <div onPointerMove={onMove} onPointerLeave={onLeave} className={`flex justify-center [perspective:1300px] ${compact ? "pt-20" : "pt-24"}`}>
      <motion.div
        style={{ rotateX: tiltX, rotateY: tiltY, transformStyle: "preserve-3d" }}
        className={`relative aspect-[4/5] ${compact ? "h-[min(42svh,440px)]" : "h-[min(54svh,540px)]"}`}
      >
        {categories.map((category, i) => {
          // Place in the queue: 0 = front, 1–3 = visible behind, more = tucked away at the back.
          const place = (i - active + count) % count;
          const visible = place <= 3;
          const pose = visible
            ? { y: -32 * place, z: -70 * place, opacity: 1 }
            : { y: -150, z: -340, opacity: 0 };
          return (
            <motion.div
              key={category.slug}
              initial={false}
              animate={pose}
              transition={{ ...glide, opacity: { duration: 0.5, delay: visible ? 0.2 : 0.1 } }}
              className="absolute inset-0 overflow-hidden bg-beige shadow-[0_30px_60px_-30px_rgba(37,37,37,0.35)] will-change-transform"
            >
              <MaterialSwatch swatch={category.swatch} />
              {/* Boards waiting behind are veiled so the front one stands out. */}
              <motion.span
                aria-hidden="true"
                initial={false}
                animate={{ opacity: place === 0 ? 0 : 0.3 + 0.18 * Math.min(place, 3) }}
                transition={{ duration: 0.6 }}
                className="absolute inset-0 bg-ivory"
              />
            </motion.div>
          );
        })}
        <span
          style={{ transform: "translateZ(40px)" }}
          className="absolute left-4 top-4 bg-white/90 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-ink"
        >
          Illustrative texture
        </span>
      </motion.div>
    </div>
  );
}
