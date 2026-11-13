"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useMotionValue, useSpring, useTransform, useVelocity } from "framer-motion";

/**
 * A custom cursor for mouse users that adapts to whatever it is over:
 *
 *  - plain page      → a small ring trailing a dot; it stretches as it moves
 *  - links, buttons  → the ring swells
 *  - text fields     → it thins into a text caret
 *  - areas marked with data-cursor="Word" → a solid disc showing that word
 *
 * A soft warm light also follows the pointer behind the page content.
 * Touch screens (and visitors who prefer reduced motion) never see it.
 */
type Mode = { kind: "idle" | "link" | "text" | "label"; label: string };

const idle: Mode = { kind: "idle", label: "" };

export function Cursor() {
  const [enabled, setEnabled] = useState(false);
  const [mode, setMode] = useState<Mode>(idle);
  const [pressed, setPressed] = useState(false);
  const [seen, setSeen] = useState(false);
  const heading = useRef(0);

  const x = useMotionValue(-100);
  const y = useMotionValue(-100);
  const ringX = useSpring(x, { stiffness: 260, damping: 26, mass: 0.6 });
  const ringY = useSpring(y, { stiffness: 260, damping: 26, mass: 0.6 });
  const glowX = useSpring(x, { stiffness: 50, damping: 18 });
  const glowY = useSpring(y, { stiffness: 50, damping: 18 });

  // The ring stretches along its direction of travel, like something with weight.
  const speedX = useVelocity(ringX);
  const speedY = useVelocity(ringY);
  const stretch = useTransform([speedX, speedY], ([vx, vy]: number[]) => 1 + Math.min(Math.hypot(vx, vy) / 2600, 0.5));
  const squash = useTransform(stretch, (s) => 1 / s);
  const rotate = useTransform([speedX, speedY], ([vx, vy]: number[]) => {
    if (Math.hypot(vx, vy) > 40) heading.current = (Math.atan2(vy, vx) * 180) / Math.PI;
    return heading.current;
  });

  useEffect(() => {
    const fine = window.matchMedia("(pointer: fine)");
    const calm = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setEnabled(fine.matches && !calm.matches);
    update();
    fine.addEventListener("change", update);
    calm.addEventListener("change", update);
    return () => {
      fine.removeEventListener("change", update);
      calm.removeEventListener("change", update);
    };
  }, []);

  useEffect(() => {
    if (!enabled) return;

    // Work out what the pointer is over and pick the matching cursor.
    const read = (target: Element | null): Mode => {
      if (!target) return idle;
      if (target.closest("input, textarea")) return { kind: "text", label: "" };
      const labelled = target.closest<HTMLElement>("[data-cursor]");
      if (labelled?.dataset.cursor) return { kind: "label", label: labelled.dataset.cursor };
      if (target.closest("a, button, select, label")) return { kind: "link", label: "" };
      return idle;
    };

    const onMove = (e: PointerEvent) => {
      x.set(e.clientX);
      y.set(e.clientY);
      setSeen(true);
      const next = read(e.target as Element | null);
      setMode((now) => (now.kind === next.kind && now.label === next.label ? now : next));
    };
    const onDown = () => setPressed(true);
    const onUp = () => setPressed(false);
    const onLeave = () => setSeen(false);
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerdown", onDown);
    window.addEventListener("pointerup", onUp);
    document.documentElement.addEventListener("pointerleave", onLeave);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", onUp);
      document.documentElement.removeEventListener("pointerleave", onLeave);
    };
  }, [enabled, x, y]);

  if (!enabled) return null;

  const ring = {
    idle: { width: 36, height: 36, borderRadius: 18, opacity: 0.75 },
    link: { width: 62, height: 62, borderRadius: 31, opacity: 1 },
    text: { width: 3, height: 30, borderRadius: 2, opacity: 1 },
    label: { width: 20, height: 20, borderRadius: 10, opacity: 0 },
  }[mode.kind];
  const springy = { type: "spring", stiffness: 280, damping: 24 } as const;

  return (
    <div aria-hidden="true" className={`transition-opacity duration-500 ${seen ? "opacity-100" : "opacity-0"}`}>
      {/* Warm light that drifts after the pointer, behind the page content */}
      <motion.div
        style={{ x: glowX, y: glowY }}
        className="pointer-events-none fixed left-0 top-0 z-0 -ml-[280px] -mt-[280px] h-[560px] w-[560px] rounded-full bg-[radial-gradient(closest-side,rgba(181,139,96,0.17),transparent)]"
      />

      <motion.div style={{ x: ringX, y: ringY }} className="pointer-events-none fixed left-0 top-0 z-[90]">
        {/* Trailing ring: stretches with speed, reshapes with context */}
        <motion.div
          style={{ rotate, scaleX: stretch, scaleY: squash }}
          className="absolute left-0 top-0 flex h-0 w-0 items-center justify-center"
        >
          <motion.span
            initial={false}
            animate={{ ...ring, scale: pressed ? 0.8 : 1 }}
            transition={springy}
            className={`block shrink-0 border border-ink/70 shadow-[0_0_0_1px_rgba(255,255,255,0.55)] transition-colors duration-300 ${
              mode.kind === "text" ? "bg-ink" : mode.kind === "link" ? "bg-accent/20" : "bg-transparent"
            }`}
          />
        </motion.div>

        {/* Solid disc with a word, for areas that name their action */}
        <div className="absolute left-0 top-0 flex h-0 w-0 items-center justify-center">
          <motion.span
            initial={false}
            animate={{ scale: mode.kind === "label" ? (pressed ? 0.9 : 1) : 0 }}
            transition={springy}
            className="flex h-[76px] w-[76px] shrink-0 items-center justify-center rounded-full bg-ink text-[10px] font-semibold uppercase tracking-[0.18em] text-white"
          >
            {mode.label}
          </motion.span>
        </div>
      </motion.div>

      {/* Dot that sits exactly on the pointer */}
      <motion.div
        style={{ x, y }}
        animate={{ scale: mode.kind === "idle" || mode.kind === "link" ? 1 : 0 }}
        className="pointer-events-none fixed left-0 top-0 z-[90] -ml-[3px] -mt-[3px] h-1.5 w-1.5 rounded-full bg-accent-deep"
      />
    </div>
  );
}
