"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";

const ease = [0.22, 1, 0.36, 1] as const;

/** Fades and lifts its children into place the first time they scroll into view. */
export function Reveal({
  children,
  delay = 0,
  className,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "0px 0px -10% 0px" }}
      transition={{ duration: 0.9, delay, ease }}
    >
      {children}
    </motion.div>
  );
}

/**
 * Heading whose words rise up from behind a mask, one after another.
 * Wrap a word in *asterisks* to set it in accent italics.
 */
export function RevealHeading({
  text,
  as: Tag = "h2",
  className = "",
}: {
  text: string;
  as?: "h1" | "h2" | "h3" | "p";
  className?: string;
}) {
  const words = text.split(" ");
  return (
    <Tag className={className} aria-label={text.replaceAll("*", "")}>
      {words.map((raw, i) => {
        const accent = raw.startsWith("*");
        const word = raw.replaceAll("*", "");
        return (
          <span key={i} aria-hidden="true" className="inline-block overflow-hidden pb-[0.12em] align-bottom">
            <motion.span
              className={`inline-block ${accent ? "italic text-accent-deep" : ""}`}
              initial={{ y: "110%" }}
              whileInView={{ y: 0 }}
              viewport={{ once: true, margin: "0px 0px -8% 0px" }}
              transition={{ duration: 0.95, delay: i * 0.055, ease }}
            >
              {word}
              {i < words.length - 1 ? " " : ""}
            </motion.span>
          </span>
        );
      })}
    </Tag>
  );
}
