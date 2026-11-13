import { brands, getCategory } from "@/lib/catalog";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Reveal } from "@/components/ui/Reveal";

export function Brands() {
  return (
    <section id="brands" className="border-y border-line bg-white/75 py-24 lg:py-32">
      <div className="shell">
        <SectionHeader index="02" eyebrow="Featured brands" title="Trusted names, *one roof.*">
          Each category is organised by brand, so comparing options is simple.
          <span className="mt-3 block text-[13px] text-accent-deep">
            Placeholder tiles shown — real brand partners will appear here once confirmed.
          </span>
        </SectionHeader>

        <ul className="mt-14 grid grid-cols-2 border-l border-t border-line md:grid-cols-3">
          {brands.map((brand, i) => (
            <li key={brand.slug} className="border-b border-r border-line">
              <Reveal delay={(i % 3) * 0.07}>
                <div className="group relative flex aspect-[4/3] flex-col justify-between overflow-hidden p-5 sm:p-7">
                  {/* Beige panel slides up on hover */}
                  <span className="absolute inset-0 origin-bottom scale-y-0 bg-ivory transition-transform duration-700 ease-luxe group-hover:scale-y-100" />
                  <div className="relative flex items-start justify-between">
                    <span className="text-[10px] font-semibold tracking-[0.2em] text-muted">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span className="border border-accent/50 px-2 py-1 text-[9px] font-semibold uppercase tracking-[0.18em] text-accent-deep">
                      Sample
                    </span>
                  </div>
                  <p className="display relative text-center text-[clamp(1.5rem,3.2vw,2.6rem)] text-ink/70 transition-colors duration-500 group-hover:text-ink">
                    {brand.name}
                  </p>
                  <p className="relative truncate text-[11px] uppercase tracking-[0.16em] text-muted">
                    {brand.categorySlugs.map((slug) => getCategory(slug)?.name).join(" · ")}
                  </p>
                </div>
              </Reveal>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
