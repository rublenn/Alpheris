"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Button } from "@/components/ui/Button";
import { site, whatsappLink } from "@/lib/site";

const headline = [["Materials", "that"], ["shape", "*remarkable*"], ["spaces."]];

export function Hero() {
  const root = useRef<HTMLElement>(null);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const mm = gsap.matchMedia(root);

    // Only animate for visitors who have not asked for reduced motion.
    mm.add("(prefers-reduced-motion: no-preference)", () => {
      const intro = gsap.timeline({ defaults: { ease: "expo.out" } });
      intro
        .from("[data-hero-word]", { yPercent: 115, duration: 1.4, stagger: 0.09 }, 0.15)
        .from("[data-hero-fade]", { opacity: 0, y: 24, duration: 1.1, stagger: 0.1 }, 0.7)
        .from("[data-hero-rule]", { scaleX: 0, duration: 1.6 }, 0.6);

      // As you scroll away, the text lifts and fades.
      gsap.to("[data-hero-copy]", {
        yPercent: -8,
        opacity: 0.2,
        scrollTrigger: { trigger: root.current, start: "45% top", end: "bottom top", scrub: 0.6 },
      });
    });

    return () => mm.revert();
  }, []);

  return (
    <section ref={root} className="relative overflow-hidden">
      <div aria-hidden="true" className="blueprint absolute inset-0 [mask-image:linear-gradient(to_bottom,black,transparent_85%)]" />
      <div className="shell relative flex min-h-[100svh] flex-col pt-[72px]">
        <div className="grid flex-1 items-center gap-2 lg:grid-cols-12">
          <div data-hero-copy className="relative z-10 pt-10 lg:col-span-7 lg:pt-0">
            <p data-hero-fade className="eyebrow flex items-center gap-4">
              <span className="h-px w-10 bg-accent" />
              {site.fullName} · {site.tagline}
            </p>

            <h1
              aria-label="Materials that shape remarkable spaces."
              className="display mt-6 text-[clamp(3.1rem,7.4vw,7.6rem)]"
            >
              {headline.map((line, i) => (
                <span key={i} aria-hidden="true" className="block overflow-hidden pb-[0.1em] sm:whitespace-nowrap">
                  {line.map((raw) => {
                    const accent = raw.startsWith("*");
                    return (
                      <span
                        key={raw}
                        data-hero-word
                        className={`mr-[0.22em] inline-block ${accent ? "italic text-accent-deep" : ""}`}
                      >
                        {raw.replaceAll("*", "")}
                      </span>
                    );
                  })}
                </span>
              ))}
            </h1>

            <p data-hero-fade className="mt-7 max-w-xl text-[16px] leading-relaxed text-muted sm:text-[17px]">
              Louvers, wall panels, laminates, UV marble sheets, plywood, doors and hardware — a
              curated showroom of interior and architectural materials for homes and commercial
              spaces across Lucknow.
            </p>

            <div data-hero-fade className="mt-9 flex flex-wrap gap-4">
              <Button href="/#categories">Explore materials</Button>
              <Button
                variant="outline"
                external
                href={whatsappLink("Hello Space Craft, I would like to enquire about your materials.")}
              >
                Enquire on WhatsApp
              </Button>
            </div>
          </div>

          {/* Space kept free on phones for the 3D materials (drawn by the page backdrop). */}
          <div aria-hidden="true" data-scene-slot className="h-[40svh] min-h-[280px] lg:hidden" />
        </div>

        {/* Info strip along the bottom of the hero */}
        <div className="relative z-10 pb-6">
          <div data-hero-rule className="h-px origin-left bg-line" />
          <dl
            data-hero-fade
            className="grid grid-cols-2 gap-x-6 gap-y-4 pt-5 text-[12px] sm:grid-cols-4"
          >
            {[
              ["Find us", "Near Phoenix Palassio, Lucknow"],
              ["Hours", site.hours],
              ["Open", "All 7 days"],
              ["Coordinates", "26.80° N · 80.99° E"],
            ].map(([term, value]) => (
              <div key={term}>
                <dt className="font-semibold uppercase tracking-[0.22em] text-muted">{term}</dt>
                <dd className="mt-1 text-[14px] text-ink">{value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  );
}
