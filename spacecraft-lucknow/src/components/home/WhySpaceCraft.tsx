import { SectionHeader } from "@/components/ui/SectionHeader";
import { Reveal } from "@/components/ui/Reveal";

// These four points come from the existing Space Craft website.
const reasons = [
  {
    title: "One solution",
    text: "Materials, products and guidance in one place — from the base board to the final finish.",
  },
  {
    title: "Expert team",
    text: "People who know the materials and can help you choose what suits your space.",
  },
  {
    title: "Quality materials",
    text: "A considered selection across louvers, panels, laminates, boards and hardware.",
  },
  {
    title: "Transparent pricing",
    text: "Clear cost estimates, fair pricing and no hidden charges.",
  },
];

export function WhySpaceCraft() {
  return (
    <section id="why" className="relative overflow-hidden bg-beige/85 py-24 lg:py-36">
      <div aria-hidden="true" className="blueprint absolute inset-0 opacity-70" />
      <div className="shell relative">
        <SectionHeader index="04" eyebrow="Why Space Craft" title="The right choice, *made simple.*" />

        <ol className="mt-16 grid gap-px bg-ink/15 sm:grid-cols-2 lg:grid-cols-4">
          {reasons.map((reason, i) => (
            <li key={reason.title} className="group relative bg-beige">
              <Reveal delay={i * 0.08}>
                <div className="relative flex min-h-[260px] flex-col justify-between p-7 transition-colors duration-700 group-hover:bg-ivory lg:min-h-[340px] lg:p-9">
                  <span className="absolute inset-x-0 top-0 h-[2px] origin-left scale-x-0 bg-accent transition-transform duration-700 ease-luxe group-hover:scale-x-100" />
                  <span className="display text-6xl text-accent-deep/70 lg:text-7xl">0{i + 1}</span>
                  <div>
                    <h3 className="display text-[1.9rem]">{reason.title}</h3>
                    <p className="mt-3 min-h-[4.9em] text-[14px] leading-relaxed text-ink/70">{reason.text}</p>
                  </div>
                </div>
              </Reveal>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
