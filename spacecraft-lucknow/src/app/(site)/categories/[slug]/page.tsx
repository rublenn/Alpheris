import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { filterProducts, getCatalog, readFilters } from "@/lib/shop";
import { PageIntro } from "@/components/shop/bits";
import { FilterBar } from "@/components/shop/FilterBar";
import { GridSkeleton, ProductGrid } from "@/components/shop/ProductGrid";

export async function generateMetadata({ params }: PageProps<"/categories/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const { categories } = await getCatalog();
  const category = categories.find((c) => c.slug === slug);
  return category ? { title: category.name, description: category.blurb } : { title: "Category not found" };
}

/** Prerender the pages that exist at build time; new ones are rendered on first visit. */
export async function generateStaticParams() {
  const { categories } = await getCatalog();
  return categories.length ? categories.map((c) => ({ slug: c.slug })) : [{ slug: "_" }];
}

export default function CategoryPage(props: PageProps<"/categories/[slug]">) {
  return (
    <Suspense
      fallback={
        <>
          <PageIntro title="Loading…" />
          <section className="shell py-12"><GridSkeleton /></section>
        </>
      }
    >
      <CategoryPageContent {...props} />
    </Suspense>
  );
}

async function CategoryPageContent({ params, searchParams }: PageProps<"/categories/[slug]">) {
  const { slug } = await params;
  const { categories } = await getCatalog();
  const category = categories.find((c) => c.slug === slug);
  if (!category) notFound();

  return (
    <>
      <PageIntro
        crumbs={[{ label: "Categories", href: "/categories" }, { label: category.name }]}
        eyebrow="Category"
        title={category.name}
      >
        {category.blurb}
      </PageIntro>
      <section className="shell py-12 lg:py-16">
        <Suspense fallback={<GridSkeleton />}>
          <Results slug={slug} searchParams={searchParams} />
        </Suspense>
      </section>
    </>
  );
}

async function Results({
  slug,
  searchParams,
}: {
  slug: string;
  searchParams: PageProps<"/categories/[slug]">["searchParams"];
}) {
  const filters = { ...readFilters(await searchParams), category: slug };
  const { products, brands } = await getCatalog();
  const inCategory = products.filter((p) => p.category.slug === slug);
  const brandOptions = brands.filter((b) => inCategory.some((p) => p.brand?.slug === b.slug));
  const results = filterProducts(inCategory, filters);
  return (
    <>
      <FilterBar action={`/categories/${slug}`} filters={filters} brands={brandOptions} resultCount={results.length} />
      <div className="mt-12">
        <ProductGrid products={results} />
      </div>
    </>
  );
}
