"use client";

import { useEffect, useState } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";

/**
 * A custom cursor for mouse users: a small dot, a ring that trails behind it
 * and swells over anything clickable, and a soft warm light that follows the
 * pointer across the page. Touch screens never see it.
 */
export function Cursor() {
  const [enabled, setEnabled] = useState(false);
  const [hovering, setHovering] = useState(false);
  const [pressed, setPressed] = useState(false);
  const [seen, setSeen] = useState(false);

  const x = useMotionValue(-100);
  const y = useMotionValue(-100);
  const ringX = useSpring(x, { stiffness: 260, damping: 26, mass: 0.6 });
  const ringY = useSpring(y, { stiffness: 260, damping: 26, mass: 0.6 });
  const glowX = useSpring(x, { stiffness: 50, damping: 18 });
  const glowY = useSpring(y, { stiffness: 50, damping: 18 });

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
    const onMove = (e: PointerEvent) => {
      x.set(e.clientX);
      y.set(e.clientY);
      setSeen(true);
      const target = e.target as Element | null;
      setHovering(Boolean(target?.closest("a, button, select, input, textarea, [data-cursor]")));
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

  return (
    <div aria-hidden="true" className={`transition-opacity duration-500 ${seen ? "opacity-100" : "opacity-0"}`}>
      {/* Warm light that drifts after the pointer, behind the page content */}
      <motion.div
        style={{ x: glowX, y: glowY }}
        className="pointer-events-none fixed left-0 top-0 z-0 -ml-[280px] -mt-[280px] h-[560px] w-[560px] rounded-full bg-[radial-gradient(closest-side,rgba(181,139,96,0.17),transparent)]"
      />
      {/* Trailing ring */}
      <motion.div style={{ x: ringX, y: ringY }} className="pointer-events-none fixed left-0 top-0 z-[90]">
        <motion.span
          animate={{ scale: pressed ? 0.8 : hovering ? 1.9 : 1, opacity: hovering ? 1 : 0.7 }}
          transition={{ type: "spring", stiffness: 300, damping: 22 }}
          className={`-ml-[18px] -mt-[18px] block h-9 w-9 rounded-full border border-accent-deep transition-colors duration-300 ${
            hovering ? "bg-accent/15" : "bg-transparent"
          }`}
        />
      </motion.div>
      {/* Dot that sits exactly on the pointer */}
      <motion.div
        style={{ x, y }}
        className="pointer-events-none fixed left-0 top-0 z-[90] -ml-[3px] -mt-[3px] h-1.5 w-1.5 rounded-full bg-accent-deep"
      />
    </div>
  );
}
