import type { Metadata } from "next";
import Link from "next/link";
import { getCatalog } from "@/lib/shop";
import { PageIntro, ProductVisual, EmptyState } from "@/components/shop/bits";
import { Arrow } from "@/components/ui/Button";

export const metadata: Metadata = {
  title: "All categories",
  description: "Louvers, wall panels, laminates, UV marble sheets, plywood, doors and hardware at Space Craft Lucknow.",
};

export default async function CategoriesPage() {
  const { categories, products } = await getCatalog();
  const count = (slug: string) => products.filter((p) => p.category.slug === slug).length;

  return (
    <>
      <PageIntro crumbs={[{ label: "Categories" }]} eyebrow="The collection" title={<>Every surface, <em>considered.</em></>}>
        Choose a material family to see its products, finishes and prices.
      </PageIntro>
      <section className="shell py-16 lg:py-24">
        {categories.length === 0 ? (
          <EmptyState title="Categories are on their way." />
        ) : (
          <ul className="grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map((c, i) => (
              <li key={c.id} className="group relative">
                <div className="aspect-[5/4] overflow-hidden bg-beige">
                  <ProductVisual
                    image={c.imageUrl ? { url: c.imageUrl } : null}
                    swatch={c.swatch}
                    alt={c.name}
                    className="transition-transform duration-[1200ms] ease-luxe group-hover:scale-[1.06]"
                  />
                </div>
                <div className="mt-5 flex items-start justify-between gap-4 border-t border-line pt-4">
                  <div>
                    <p className="text-[10px] font-semibold tracking-[0.2em] text-muted">{String(i + 1).padStart(2, "0")}</p>
                    <h2 className="display mt-1 text-[2rem]">
                      <Link href={`/categories/${c.slug}`} className="after:absolute after:inset-0 after:content-['']">
                        {c.name}
                      </Link>
                    </h2>
                    <p className="mt-2 text-[14px] leading-relaxed text-muted">{c.blurb}</p>
                  </div>
                  <span className="mt-6 flex shrink-0 items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-accent-deep">
                    {count(c.slug)}
                    <Arrow className="transition-transform duration-500 ease-luxe group-hover:translate-x-1" />
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
