"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { categories } from "@/lib/catalog";
import { MaterialSwatch } from "@/components/ui/MaterialSwatch";
import { Reveal, RevealHeading } from "@/components/ui/Reveal";
import { Button } from "@/components/ui/Button";
import { site } from "@/lib/site";

const facts = [
  ["Who we serve", "Homeowners, architects, designers & contractors"],
  ["Where", site.serviceAreas.join(" · ")],
  ["When", `${site.days} · ${site.hours}`],
];

export function About() {
  const root = useRef<HTMLElement>(null);

  // Subtle parallax: the two material boards drift at different speeds.
  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const mm = gsap.matchMedia(root);
    mm.add("(prefers-reduced-motion: no-preference)", () => {
      gsap.utils.toArray<HTMLElement>("[data-parallax]").forEach((el) => {
        gsap.fromTo(
          el,
          { yPercent: Number(el.dataset.parallax) },
          {
            yPercent: -Number(el.dataset.parallax),
            ease: "none",
            scrollTrigger: { trigger: root.current, start: "top bottom", end: "bottom top", scrub: 0.5 },
          },
        );
      });
    });
    return () => mm.revert();
  }, []);

  return (
    <section id="about" ref={root} className="overflow-hidden bg-white/75 py-24 lg:py-40">
      <div className="shell grid gap-16 lg:grid-cols-12 lg:items-center">
        <div className="relative mx-auto aspect-[5/6] w-full max-w-md lg:col-span-5 lg:max-w-none">
          <div data-parallax="6" className="absolute left-0 top-0 h-[78%] w-[68%] overflow-hidden bg-beige">
            <MaterialSwatch swatch={categories[0].swatch} />
          </div>
          <div
            data-parallax="-10"
            className="absolute bottom-0 right-0 h-[58%] w-[52%] overflow-hidden border-[10px] border-white bg-beige"
          >
            <MaterialSwatch swatch={categories[4].swatch} />
          </div>
          <span aria-hidden="true" className="absolute right-[6%] top-[8%] h-24 w-px bg-accent" />
        </div>

        <div className="lg:col-span-6 lg:col-start-7">
          <Reveal>
            <p className="eyebrow flex items-center gap-4">
              <span className="text-muted">05</span>
              <span className="h-px w-10 bg-accent" />
              About Space Craft
            </p>
          </Reveal>
          <RevealHeading
            text="Designing spaces that reflect *your* lifestyle."
            className="display mt-5 text-[clamp(2.3rem,5vw,4.4rem)]"
          />
          <Reveal delay={0.1}>
            <p className="mt-7 max-w-xl text-[16px] leading-relaxed text-muted">
              Space Craft is an interior and interior-products company based in Lucknow, working
              with residential, commercial and retail spaces. We serve individual homeowners and
              trade customers alike — helping each one find materials that are stylish, functional
              and sensibly priced.
            </p>
          </Reveal>

          <dl className="mt-10 border-t border-line">
            {facts.map(([term, value], i) => (
              <Reveal key={term} delay={0.1 + i * 0.06}>
                <div className="grid grid-cols-3 gap-4 border-b border-line py-4">
                  <dt className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted">{term}</dt>
                  <dd className="col-span-2 text-[15px] text-ink">{value}</dd>
                </div>
              </Reveal>
            ))}
          </dl>

          <Reveal delay={0.2} className="mt-10">
            <Button href="/#contact" variant="outline">
              Talk to us
            </Button>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
