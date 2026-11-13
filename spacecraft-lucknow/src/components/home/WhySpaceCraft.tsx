"use client";

import { useState } from "react";
import { AnimatePresence, motion, useMotionTemplate, useMotionValue, useSpring } from "framer-motion";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Reveal } from "@/components/ui/Reveal";

const ease = [0.22, 1, 0.36, 1] as const;

/**
 * The four headline reasons come from the existing Space Craft website.
 * The "points" under each are DRAFT COPY to show how the section opens up —
 * replace them with the real details.
 */
const reasons = [
  {
    title: "One solution",
    text: "Materials, products and guidance in one place — from the base board to the final finish.",
    points: [
      "Boards, laminates, panels, louvers, doors and hardware together",
      "One conversation instead of several suppliers",
      "Materials chosen to work well with each other",
    ],
  },
  {
    title: "Expert team",
    text: "People who know the materials and can help you choose what suits your space.",
    points: [
      "Guidance on which material suits which use",
      "Help matching finishes and colours",
      "Support for homeowners and trade customers alike",
    ],
  },
  {
    title: "Quality materials",
    text: "A considered selection across louvers, panels, laminates, boards and hardware.",
    points: [
      "A curated range rather than an endless one",
      "Compare finishes side by side",
      "Options across styles and budgets",
    ],
  },
  {
    title: "Transparent pricing",
    text: "Clear cost estimates, fair pricing and no hidden charges.",
    points: ["Clear estimates before you commit", "Fair, straightforward pricing", "No hidden charges"],
  },
];

export function WhySpaceCraft() {
  const [open, setOpen] = useState(0);

  return (
    <section id="why" className="relative overflow-hidden bg-beige/85 py-24 lg:py-36">
      <div aria-hidden="true" className="blueprint absolute inset-0 opacity-70" />
      <div className="shell relative">
        <SectionHeader index="04" eyebrow="Why Space Craft" title="The right choice, *made simple.*">
          Hover or tap a reason to open it up.
        </SectionHeader>

        <Reveal delay={0.1}>
          <ol className="mt-16 flex flex-col gap-3 lg:h-[480px] lg:flex-row">
            {reasons.map((reason, i) => (
              <Panel key={reason.title} index={i} reason={reason} open={open === i} onOpen={() => setOpen(i)} />
            ))}
          </ol>
        </Reveal>
      </div>
    </section>
  );
}

/**
 * One reason. The open panel grows wider and reveals its details; every
 * panel tilts in 3D toward the pointer, with its number, title and text
 * floating at different depths and a soft light following the cursor.
 */
function Panel({
  index,
  reason,
  open,
  onOpen,
}: {
  index: number;
  reason: (typeof reasons)[number];
  open: boolean;
  onOpen: () => void;
}) {
  const rotateX = useSpring(useMotionValue(0), { stiffness: 140, damping: 16 });
  const rotateY = useSpring(useMotionValue(0), { stiffness: 140, damping: 16 });
  const lightX = useMotionValue(50);
  const lightY = useMotionValue(0);
  const light = useMotionTemplate`radial-gradient(420px circle at ${lightX}% ${lightY}%, rgba(255,255,255,0.9), transparent 65%)`;

  function onMove(e: React.PointerEvent<HTMLLIElement>) {
    if (e.pointerType !== "mouse") return;
    const box = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - box.left) / box.width;
    const y = (e.clientY - box.top) / box.height;
    rotateY.set((x - 0.5) * 10);
    rotateX.set((0.5 - y) * 10);
    lightX.set(x * 100);
    lightY.set(y * 100);
  }

  function onLeave() {
    rotateX.set(0);
    rotateY.set(0);
  }

  return (
    <motion.li
      initial={false}
      animate={{ flexGrow: open ? 2.6 : 1 }}
      transition={{ duration: 0.8, ease }}
      onPointerEnter={(e) => e.pointerType === "mouse" && onOpen()}
      onClick={onOpen}
      data-cursor={open ? undefined : "Open"}
      onPointerMove={onMove}
      onPointerLeave={onLeave}
      className="min-w-0 cursor-pointer [perspective:1100px] lg:basis-0"
    >
      <motion.div
        style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
        className={`relative h-full overflow-hidden border transition-[background-color,border-color,box-shadow] duration-700 ${
          open
            ? "border-accent/50 bg-ivory shadow-[0_40px_70px_-40px_rgba(37,37,37,0.45)]"
            : "border-ink/10 bg-beige"
        }`}
      >
        {/* Light that follows the cursor across the panel */}
        <motion.span aria-hidden="true" style={{ background: light }} className="absolute inset-0" />
        <span
          className={`absolute inset-x-0 top-0 h-[2px] origin-left bg-accent transition-transform duration-700 ease-luxe ${
            open ? "scale-x-100" : "scale-x-0"
          }`}
        />

        <div
          style={{ transformStyle: "preserve-3d" }}
          className="relative flex h-full flex-col justify-between gap-10 p-7 lg:p-9"
        >
          <span
            style={{ transform: "translateZ(60px)" }}
            className={`display text-6xl transition-colors duration-700 lg:text-7xl ${
              open ? "text-accent-deep" : "text-accent-deep/45"
            }`}
          >
            0{index + 1}
          </span>

          <div style={{ transform: "translateZ(35px)" }}>
            <h3 className="display text-[1.9rem] leading-tight">
              <button type="button" aria-expanded={open} className="text-left">
                {reason.title}
              </button>
            </h3>

            <AnimatePresence initial={false}>
              {open && (
                <motion.div
                  key="details"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.7, ease }}
                  className="overflow-hidden"
                >
                  {/* Fixed width so the text does not re-wrap while the panel grows. */}
                  <div className="pt-4 lg:w-[380px]">
                    <p className="text-[15px] leading-relaxed text-ink/75">{reason.text}</p>
                    <ul className="mt-5 space-y-2.5 border-t border-line pt-5">
                      {reason.points.map((point, n) => (
                        <motion.li
                          key={point}
                          initial={{ opacity: 0, x: -14 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.6, delay: 0.25 + n * 0.08, ease }}
                          className="flex items-start gap-3 text-[14px] text-ink"
                        >
                          <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rotate-45 bg-accent" />
                          {point}
                        </motion.li>
                      ))}
                    </ul>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
    </motion.li>
  );
}
