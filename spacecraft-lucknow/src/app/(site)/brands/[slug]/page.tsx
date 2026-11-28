import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { filterProducts, getCatalog, readFilters } from "@/lib/shop";
import { PageIntro } from "@/components/shop/bits";
import { FilterBar } from "@/components/shop/FilterBar";
import { GridSkeleton, ProductGrid } from "@/components/shop/ProductGrid";

export async function generateMetadata({ params }: PageProps<"/brands/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const brand = (await getCatalog()).brands.find((b) => b.slug === slug);
  return { title: brand?.name ?? "Brand not found", description: brand?.description || undefined };
}

/** Prerender the pages that exist at build time; new ones are rendered on first visit. */
export async function generateStaticParams() {
  const { brands } = await getCatalog();
  return brands.length ? brands.map((b) => ({ slug: b.slug })) : [{ slug: "_" }];
}

export default function BrandPage(props: PageProps<"/brands/[slug]">) {
  return (
    <Suspense
      fallback={
        <>
          <PageIntro title="Loading…" />
          <section className="shell py-12"><GridSkeleton /></section>
        </>
      }
    >
      <BrandPageContent {...props} />
    </Suspense>
  );
}

async function BrandPageContent({ params, searchParams }: PageProps<"/brands/[slug]">) {
  const { slug } = await params;
  const brand = (await getCatalog()).brands.find((b) => b.slug === slug);
  if (!brand) notFound();

  return (
    <>
      <PageIntro crumbs={[{ label: "Brands", href: "/brands" }, { label: brand.name }]} eyebrow="Brand" title={brand.name}>
        {brand.description || null}
        {brand.isSample && (
          <span className="mt-3 block text-[13px] text-accent-deep">Placeholder brand — real brand details will replace it.</span>
        )}
      </PageIntro>
      <section className="shell py-12 lg:py-16">
        <Suspense fallback={<GridSkeleton />}>
          <Results slug={slug} searchParams={searchParams} />
        </Suspense>
      </section>
    </>
  );
}

async function Results({ slug, searchParams }: { slug: string; searchParams: PageProps<"/brands/[slug]">["searchParams"] }) {
  const filters = { ...readFilters(await searchParams), brand: slug };
  const { products, categories } = await getCatalog();
  const ofBrand = products.filter((p) => p.brand?.slug === slug);
  const catOptions = categories.filter((c) => ofBrand.some((p) => p.category.slug === c.slug));
  const results = filterProducts(ofBrand, filters);
  return (
    <>
      <FilterBar action={`/brands/${slug}`} filters={filters} categories={catOptions} resultCount={results.length} />
      <div className="mt-12">
        <ProductGrid products={results} />
      </div>
    </>
  );
}
