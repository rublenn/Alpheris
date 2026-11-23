import type { Metadata } from "next";
import Link from "next/link";
import { getCatalog } from "@/lib/shop";
import { EmptyState, PageIntro } from "@/components/shop/bits";
import { Arrow } from "@/components/ui/Button";

export const metadata: Metadata = { title: "Brands" };

export default async function BrandsPage() {
  const { brands, products } = await getCatalog();

  return (
    <>
      <PageIntro crumbs={[{ label: "Brands" }]} eyebrow="Brands" title={<>Trusted names, <em>one roof.</em></>}>
        The brands Space Craft stocks, and what we carry from each.
      </PageIntro>
      <section className="shell py-16 lg:py-24">
        {brands.length === 0 ? (
          <EmptyState title="Brands are on their way." />
        ) : (
          <ul className="border-t border-line">
            {brands.map((b) => {
              const items = products.filter((p) => p.brand?.slug === b.slug);
              const cats = [...new Set(items.map((p) => p.category.name))];
              return (
                <li key={b.id} className="group relative border-b border-line">
                  <div className="flex flex-wrap items-center gap-x-8 gap-y-2 py-7">
                    <h2 className="display flex-1 text-[clamp(1.8rem,3vw,2.8rem)] transition-transform duration-500 ease-luxe group-hover:translate-x-2">
                      <Link href={`/brands/${b.slug}`} className="after:absolute after:inset-0 after:content-['']">
                        {b.name}
                      </Link>
                      {b.isSample && (
                        <span className="ml-4 align-middle border border-accent/50 px-2 py-1 font-sans text-[9px] font-semibold uppercase tracking-[0.18em] text-accent-deep">
                          Sample
                        </span>
                      )}
                    </h2>
                    <p className="text-[12px] uppercase tracking-[0.16em] text-muted">{cats.join(" · ") || "—"}</p>
                    <span className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-accent-deep">
                      {items.length} products
                      <Arrow className="transition-transform duration-500 ease-luxe group-hover:translate-x-1" />
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </>
  );
}
