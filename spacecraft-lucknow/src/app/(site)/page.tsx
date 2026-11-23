import { SceneBackground } from "@/components/home/SceneBackground";
import { Hero } from "@/components/home/Hero";
import { Categories } from "@/components/home/Categories";
import { Brands } from "@/components/home/Brands";
import { Products } from "@/components/home/Products";
import { WhySpaceCraft } from "@/components/home/WhySpaceCraft";
import { Work } from "@/components/home/Work";
import { About } from "@/components/home/About";
import { Location } from "@/components/home/Location";
import { Enquiry } from "@/components/home/Enquiry";
import { site } from "@/lib/site";
import { getCatalog } from "@/lib/shop";
import type { Category, Swatch } from "@/lib/catalog";
import type { BrandTeaser } from "@/components/home/Brands";

const neutral: Swatch = { kind: "panel", base: "#3a3734", shade: "#2a2826", light: "#4a4642" };

// Structured data helps Google understand the business. Only confirmed facts.
const jsonLd = {
  "@context": "https://schema.org",
  "@type": "HomeGoodsStore",
  name: site.fullName,
  description: site.description,
  telephone: "+918882226272",
  address: {
    "@type": "PostalAddress",
    addressLocality: "Lucknow",
    addressRegion: "Uttar Pradesh",
    addressCountry: "IN",
  },
  geo: {
    "@type": "GeoCoordinates",
    latitude: site.location.coordinates[1],
    longitude: site.location.coordinates[0],
  },
  hasMap: site.location.mapsUrl,
  openingHours: "Mo-Su 09:00-21:00",
};

export default async function HomePage() {
  const catalog = await getCatalog();

  // Categories from the database, shaped for the animated sample-board stack.
  const categories: Category[] = catalog.categories.map((c) => {
    const { looks, ...swatch } = c.swatch ?? { ...neutral, looks: [] };
    return { slug: c.slug, name: c.name, blurb: c.blurb, swatch: swatch as Swatch, variants: looks ?? [] };
  });

  // Each brand with the categories and a few products it has in the shop.
  const brands: BrandTeaser[] = catalog.brands.map((b) => {
    const items = catalog.products.filter((p) => p.brand?.slug === b.slug);
    return {
      slug: b.slug,
      name: b.name,
      isSample: b.isSample,
      categoryNames: [...new Set(items.map((p) => p.category.name))],
      products: items.slice(0, 3).map((p) => ({
        slug: p.slug,
        name: p.name,
        swatch: p.swatch ?? p.category.swatch,
        image: p.images[0]?.url ?? null,
      })),
    };
  });

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />
      <SceneBackground />
      <Hero />
      <Categories categories={categories} />
      <Brands brands={brands} />
      <Products />
      <WhySpaceCraft />
      <Work />
      <About />
      <Location />
      <Enquiry />
    </>
  );
}
