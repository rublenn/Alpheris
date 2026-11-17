"use client";

import { useEffect, useState, type RefObject } from "react";
import { useScroll, useTransform } from "framer-motion";

/**
 * For phones and tablets (no mouse to hover with):
 *  - `seen` turns true once the element has scrolled well into view, so
 *    cards can open by themselves instead of waiting for a tap;
 *  - `tilt` leans the element back as it enters and forward as it leaves,
 *    so scrolling past it feels three-dimensional.
 * On devices with a mouse, `touch` stays false and nothing changes.
 */
export function useTouchReveal(ref: RefObject<HTMLElement | null>) {
  const [touch, setTouch] = useState(false);
  const [seen, setSeen] = useState(false);

  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const rotateX = useTransform(scrollYProgress, [0, 0.3, 0.75, 1], [26, 0, 0, -18]);
  const scale = useTransform(scrollYProgress, [0, 0.3, 0.75, 1], [0.9, 1, 1, 0.94]);

  // Is this a touch device (and is motion welcome)?
  useEffect(() => {
    const noHover = window.matchMedia("(hover: none)");
    const calm = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setTouch(noHover.matches && !calm.matches);
    update();
    noHover.addEventListener("change", update);
    return () => noHover.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el || !touch) return;
    const watcher = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setSeen(true);
          watcher.disconnect();
        }
      },
      // "Seen" once its top edge is in the upper two-thirds of the screen.
      { rootMargin: "0px 0px -34% 0px" },
    );
    watcher.observe(el);
    return () => watcher.disconnect();
  }, [ref, touch]);

  return { touch, seen, tilt: { rotateX, scale } };
}
