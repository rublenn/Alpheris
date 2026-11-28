import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { getCatalog, getProduct } from "@/lib/shop";
import { ProductGallery } from "@/components/shop/ProductGallery";
import { AddToCart } from "@/components/shop/AddToCart";
import { VariantSelection } from "@/components/shop/VariantContext";
import { variantAvailability } from "@/lib/shop-types";
import { GridSkeleton, ProductGrid } from "@/components/shop/ProductGrid";
import { site } from "@/lib/site";
import { PageIntro } from "@/components/shop/bits";

export async function generateMetadata({ params }: PageProps<"/products/[slug]">): Promise<Metadata> {
  const product = await getProduct((await params).slug);
  if (!product) return { title: "Product not found" };
  return {
    title: product.name,
    description: product.description.slice(0, 160) || `${product.name} — ${product.category.name} at ${site.fullName}.`,
    openGraph: product.images[0] ? { images: [product.images[0].url] } : undefined,
  };
}

/** Prerender the pages that exist at build time; new ones are rendered on first visit. */
export async function generateStaticParams() {
  const { products } = await getCatalog();
  return products.length ? products.map((p) => ({ slug: p.slug })) : [{ slug: "_" }];
}

export default function ProductPage(props: PageProps<"/products/[slug]">) {
  return (
    <Suspense
      fallback={
        <>
          <PageIntro title="Loading…" />
          <section className="shell py-12"><GridSkeleton /></section>
        </>
      }
    >
      <ProductPageContent {...props} />
    </Suspense>
  );
}

async function ProductPageContent({ params }: PageProps<"/products/[slug]">) {
  const product = await getProduct((await params).slug);
  if (!product) notFound();

  const { products } = await getCatalog();
  const related = products.filter((p) => p.category.slug === product.category.slug && p.id !== product.id).slice(0, 4);
  const specs = Object.entries(product.specifications).filter(([k, v]) => k && v);

  return (
    <>
      <section className="shell pb-16 pt-[110px] lg:pt-[130px]">
        <nav aria-label="Breadcrumb" className="mb-8 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted">
          <ol className="flex flex-wrap items-center gap-2">
            <li><Link href="/" className="hover:text-ink">Home</Link></li>
            <li aria-hidden="true" className="text-line">/</li>
            <li><Link href={`/categories/${product.category.slug}`} className="hover:text-ink">{product.category.name}</Link></li>
            <li aria-hidden="true" className="text-line">/</li>
            <li aria-current="page" className="text-ink">{product.name}</li>
          </ol>
        </nav>

        <VariantSelection
          initial={
            (product.variants.find((v) => ["in-stock", "low-stock"].includes(variantAvailability(v))) ?? product.variants[0]).id
          }
        >
        <div className="grid gap-10 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-6">
            <ProductGallery
              images={product.images}
              variants={product.variants}
              swatch={product.swatch ?? product.category.swatch}
              name={product.name}
              isSample={product.isSample}
            />
          </div>

          <div className="lg:col-span-6 lg:pt-4">
            <p className="eyebrow">
              <Link href={`/categories/${product.category.slug}`} className="hover:text-ink">{product.category.name}</Link>
              {product.brand && (
                <>
                  {" · "}
                  <Link href={`/brands/${product.brand.slug}`} className="hover:text-ink">{product.brand.name}</Link>
                </>
              )}
            </p>
            <h1 className="display mt-4 text-[clamp(2.4rem,5vw,4rem)]">{product.name}</h1>
            {product.description && (
              <p className="mt-6 max-w-xl whitespace-pre-line text-[15px] leading-relaxed text-muted">{product.description}</p>
            )}

            <div className="mt-10 border-t border-line pt-8">
              <AddToCart productName={product.name} variants={product.variants} priceUnit={product.priceUnit} />
            </div>

            {(specs.length > 0 || product.material) && (
              <dl className="mt-12 border-t border-line">
                {product.material && <Spec label="Material" value={product.material} />}
                {specs.map(([k, v]) => <Spec key={k} label={k} value={v} />)}
              </dl>
            )}
            <p className="mt-8 text-[12px] leading-relaxed text-muted">
              Colours on screen can differ slightly from the actual material — visit the showroom to see samples in
              person.
            </p>
          </div>
        </div>
        </VariantSelection>
      </section>

      {related.length > 0 && (
        <section className="border-t border-line py-16 lg:py-24">
          <div className="shell">
            <h2 className="display text-[clamp(2rem,4vw,3.2rem)]">More in {product.category.name}</h2>
            <div className="mt-10">
              <ProductGrid products={related} />
            </div>
          </div>
        </section>
      )}
    </>
  );
}

function Spec({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-3 gap-4 border-b border-line py-3 text-[14px]">
      <dt className="text-muted">{label}</dt>
      <dd className="col-span-2 text-ink">{value}</dd>
    </div>
  );
}
