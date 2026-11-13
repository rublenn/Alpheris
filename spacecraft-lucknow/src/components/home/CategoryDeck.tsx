"use client";

import { motion, useMotionValue, useSpring } from "framer-motion";
import { categories } from "@/lib/catalog";
import { MaterialSwatch } from "@/components/ui/MaterialSwatch";

const spring = { type: "spring", stiffness: 110, damping: 19, mass: 0.9 } as const;

/**
 * A 3D stack of material cards. The active category sits at the front, the
 * next few wait behind it in depth, and cards you have passed sweep forward
 * and away — like leafing through physical sample boards.
 * The whole stack also tilts gently toward the pointer.
 */
export function CategoryDeck({ active }: { active: number }) {
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
    <div onPointerMove={onMove} onPointerLeave={onLeave} className="pt-24 [perspective:1300px]">
      <motion.div
        style={{ rotateX: tiltX, rotateY: tiltY, transformStyle: "preserve-3d" }}
        className="relative aspect-[4/5]"
      >
        {categories.map((category, i) => {
          const offset = i - active; // 0 = front, 1+ = waiting behind, negative = passed
          const behind = Math.min(offset, 3);
          const pose =
            offset === 0
              ? { y: 0, z: 0, rotateX: 0, rotateY: 0, opacity: 1 }
              : offset > 0
                ? { y: -46 * behind, z: -70 * behind, rotateX: 0, rotateY: 0, opacity: offset > 3 ? 0 : 1 }
                : { y: 90, z: 220, rotateX: -32, rotateY: -14, opacity: 0 };
          return (
            <motion.div
              key={category.slug}
              initial={false}
              animate={pose}
              transition={{ ...spring, opacity: { duration: 0.45 } }}
              style={{ transformOrigin: "50% 100%" }}
              className="absolute inset-0 overflow-hidden bg-beige shadow-[0_30px_60px_-30px_rgba(37,37,37,0.35)] will-change-transform"
            >
              <MaterialSwatch swatch={category.swatch} />
              {/* Cards waiting behind are veiled so the front one stands out. */}
              <motion.span
                aria-hidden="true"
                initial={false}
                animate={{ opacity: offset > 0 ? 0.3 + 0.18 * behind : 0 }}
                transition={{ duration: 0.5 }}
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
