import type { Metadata } from "next";
import { Suspense } from "react";
import { filterProducts, getCatalog, readFilters } from "@/lib/shop";
import { PageIntro } from "@/components/shop/bits";
import { FilterBar } from "@/components/shop/FilterBar";
import { GridSkeleton, ProductGrid } from "@/components/shop/ProductGrid";

export const metadata: Metadata = { title: "Search products" };

export default function SearchPage({ searchParams }: PageProps<"/search">) {
  return (
    <>
      <PageIntro crumbs={[{ label: "All products" }]} eyebrow="Shop" title={<>Find the right <em>material.</em></>}>
        Search every product, or narrow down by category, brand and price.
      </PageIntro>
      <section className="shell py-12 lg:py-16">
        <Suspense fallback={<GridSkeleton />}>
          <Results searchParams={searchParams} />
        </Suspense>
      </section>
    </>
  );
}

async function Results({ searchParams }: { searchParams: PageProps<"/search">["searchParams"] }) {
  const filters = readFilters(await searchParams);
  const { products, categories, brands } = await getCatalog();
  const results = filterProducts(products, filters);
  return (
    <>
      <FilterBar action="/search" filters={filters} categories={categories} brands={brands} resultCount={results.length} />
      <div className="mt-12">
        <ProductGrid products={results} />
      </div>
    </>
  );
}
