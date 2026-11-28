import Link from "next/link";
import type { ReactNode } from "react";

type Props = {
  href: string;
  children: ReactNode;
  variant?: "solid" | "outline";
  /** Opens in a new tab (used for WhatsApp links). */
  external?: boolean;
  className?: string;
};

/** The site's main call-to-action button. A fill sweeps up on hover. */
export function Button({ href, children, variant = "solid", external, className = "" }: Props) {
  const styles =
    variant === "solid"
      ? "bg-ink text-white before:bg-accent-deep"
      : "border border-ink/25 text-ink before:bg-ink hover:text-white hover:border-ink";
  const classes = `group relative inline-flex h-12 items-center gap-3 overflow-hidden px-7 text-[12px] font-semibold uppercase tracking-[0.2em] transition-colors duration-500 before:absolute before:inset-0 before:origin-bottom before:scale-y-0 before:transition-transform before:duration-500 before:ease-luxe hover:before:scale-y-100 ${styles} ${className}`;
  const inner = (
    <>
      <span className="relative">{children}</span>
      <Arrow className="relative transition-transform duration-500 ease-luxe group-hover:translate-x-1" />
    </>
  );
  return external ? (
    <a href={href} target="_blank" rel="noopener noreferrer" className={classes}>
      {inner}
    </a>
  ) : (
    <Link href={href} className={classes}>
      {inner}
    </Link>
  );
}

export function Arrow({ className = "" }: { className?: string }) {
  return (
    <svg width="16" height="10" viewBox="0 0 16 10" fill="none" aria-hidden="true" className={className}>
      <path d="M0 5h14M10 1l4 4-4 4" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  );
}
