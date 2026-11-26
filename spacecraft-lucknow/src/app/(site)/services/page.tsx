import type { Metadata } from "next";
import { services } from "@/lib/services";
import { site, whatsappLink } from "@/lib/site";
import { PageIntro } from "@/components/shop/bits";
import { MaterialSwatch } from "@/components/ui/MaterialSwatch";
import { Button } from "@/components/ui/Button";

export const metadata: Metadata = {
  title: "Interior services",
  description: "Modular kitchens, wall to wall interiors, modular furniture, complete home interiors, retail and salon interiors in Lucknow by Space Craft.",
};

export default function ServicesPage() {
  return (
    <>
      <PageIntro crumbs={[{ label: "Services" }]} eyebrow="Services" title={<>Interiors, <em>start to finish.</em></>}>
        Besides supplying materials, the Space Craft team plans and builds interiors in {site.city}. Tell us about your space —
        we will talk through the options and give you a quote.
      </PageIntro>

      <section className="shell py-16 lg:py-24">
        <ul className="grid gap-x-8 gap-y-16 md:grid-cols-2">
          {services.map((s, i) => (
            <li key={s.slug} id={s.slug} className="scroll-mt-28">
              <div className="aspect-[16/9] overflow-hidden bg-beige">
                <MaterialSwatch swatch={s.swatch} />
              </div>
              <div className="mt-6 border-t border-line pt-5">
                <p className="text-[11px] font-semibold tracking-[0.2em] text-muted">{String(i + 1).padStart(2, "0")}</p>
                <h2 className="display mt-2 text-[clamp(1.9rem,3vw,2.6rem)]">{s.name}</h2>
                <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-muted">{s.summary}</p>
                <ul className="mt-5 grid gap-2 text-[14px] text-ink/85 sm:grid-cols-2">
                  {s.includes.map((x) => (
                    <li key={x} className="flex gap-3">
                      <span aria-hidden="true" className="mt-2 h-1.5 w-1.5 shrink-0 rotate-45 bg-accent" />
                      {x}
                    </li>
                  ))}
                </ul>
                <div className="mt-7 flex flex-wrap gap-3">
                  <Button href={whatsappLink(`Hello Space Craft, I would like to discuss ${s.name.toLowerCase()} work.`)} external>
                    Enquire on WhatsApp
                  </Button>
                  <Button href={site.phoneHref} variant="outline" external>
                    Call us
                  </Button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
