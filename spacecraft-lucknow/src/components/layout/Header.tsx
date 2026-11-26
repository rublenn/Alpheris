"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AnimatePresence, motion, useMotionValueEvent, useScroll } from "framer-motion";
import { navLinks, site } from "@/lib/site";
import { Logo } from "./Logo";
import { useCart } from "@/components/shop/CartProvider";

const ease = [0.22, 1, 0.36, 1] as const;

export function Header() {
  const { scrollY } = useScroll();
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [open, setOpen] = useState(false);
  const { count } = useCart();

  // Frosted background after a little scrolling; tuck away while scrolling down.
  useMotionValueEvent(scrollY, "change", (y) => {
    const previous = scrollY.getPrevious() ?? 0;
    setScrolled(y > 24);
    setHidden(y > 500 && y > previous);
  });

  // Stop the page scrolling behind the open mobile menu; Escape closes it.
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <>
      <motion.header
        animate={{ y: hidden && !open ? "-100%" : 0 }}
        transition={{ duration: 0.5, ease }}
        className={`fixed inset-x-0 top-0 z-50 border-b transition-colors duration-500 ${
          scrolled && !open ? "border-line bg-ivory/85 backdrop-blur-md" : "border-transparent"
        }`}
      >
        <div className="shell flex h-[72px] items-center justify-between">
          <Logo onClick={() => setOpen(false)} />

          <nav aria-label="Main" className="hidden items-center gap-5 xl:flex 2xl:gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="group relative py-2 text-[12px] font-semibold uppercase tracking-[0.16em] text-ink/75 transition-colors hover:text-ink"
              >
                {link.label}
                <span className="absolute inset-x-0 bottom-0 h-px origin-right scale-x-0 bg-accent transition-transform duration-500 ease-luxe group-hover:origin-left group-hover:scale-x-100" />
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2 sm:gap-4">
            <Link
              href="/cart"
              aria-label={count ? `Shopping cart, ${count} items` : "Shopping cart"}
              className="relative flex h-11 w-11 items-center justify-center text-ink transition-colors hover:text-accent-deep"
            >
              {count > 0 && (
                <span className="absolute right-0.5 top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-accent px-1 text-[10px] font-bold text-ivory">
                  {count > 99 ? "99+" : count}
                </span>
              )}
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                <path d="M3 6h14l-1.2 11H4.2L3 6Z" stroke="currentColor" strokeWidth="1.3" />
                <path d="M7 8V5a3 3 0 0 1 6 0v3" stroke="currentColor" strokeWidth="1.3" />
              </svg>
            </Link>
            <a
              href={site.phoneHref}
              className="hidden h-11 items-center border border-ink/20 px-5 text-[12px] font-semibold uppercase tracking-[0.16em] text-ink transition-colors duration-300 hover:border-ink hover:bg-ink hover:text-white md:flex"
            >
              Call<span className="xl:hidden 2xl:inline"> {site.phoneDisplay}</span>
            </a>
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              aria-expanded={open}
              aria-controls="mobile-menu"
              aria-label={open ? "Close menu" : "Open menu"}
              className="relative flex h-11 w-11 items-center justify-center xl:hidden"
            >
              <span
                className={`absolute h-px w-6 bg-ink transition-transform duration-500 ease-luxe ${open ? "rotate-45" : "-translate-y-[5px]"}`}
              />
              <span
                className={`absolute h-px w-6 bg-ink transition-transform duration-500 ease-luxe ${open ? "-rotate-45" : "translate-y-[5px]"}`}
              />
            </button>
          </div>
        </div>
      </motion.header>

      <AnimatePresence>
        {open && (
          <motion.div
            id="mobile-menu"
            data-lenis-prevent
            role="dialog"
            aria-modal="true"
            aria-label="Menu"
            initial={{ clipPath: "inset(0 0 100% 0)" }}
            animate={{ clipPath: "inset(0 0 0% 0)" }}
            exit={{ clipPath: "inset(0 0 100% 0)" }}
            transition={{ duration: 0.7, ease }}
            className="blueprint fixed inset-0 z-40 flex flex-col overflow-y-auto bg-ivory pt-[72px] xl:hidden"
          >
            <nav aria-label="Mobile" className="shell flex flex-1 flex-col justify-center py-8">
              {navLinks.map((link, i) => (
                <motion.div
                  key={link.href}
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.15 + i * 0.05, ease }}
                  className="border-b border-line"
                >
                  <Link
                    href={link.href}
                    onClick={() => setOpen(false)}
                    className="flex items-baseline gap-4 py-4 font-display text-[clamp(1.9rem,7vw,3rem)] text-ink"
                  >
                    <span className="font-sans text-[11px] font-semibold tracking-[0.2em] text-accent-deep">
                      0{i + 1}
                    </span>
                    {link.label}
                  </Link>
                </motion.div>
              ))}
            </nav>
            <div className="shell flex flex-wrap items-center justify-between gap-3 pb-8 text-[13px] text-muted">
              <a href={site.phoneHref} className="font-semibold text-ink">
                {site.phoneDisplay}
              </a>
              <span>
                {site.days} · {site.hours}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
