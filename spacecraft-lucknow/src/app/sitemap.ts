import type { MetadataRoute } from "next";
import { getCatalog } from "@/lib/shop";
import { legalPages } from "@/lib/legal";
import { site } from "@/lib/site";

/** Tells Google which pages exist. Rebuilt from the catalogue. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { categories, brands, products } = await getCatalog();
  const page = (path: string, priority: number) => ({ url: `${site.url}${path}`, priority });
  return [
    page("/", 1),
    page("/search", 0.8),
    page("/categories", 0.8),
    page("/brands", 0.6),
    ...categories.map((c) => page(`/categories/${c.slug}`, 0.8)),
    ...brands.map((b) => page(`/brands/${b.slug}`, 0.6)),
    ...products.map((p) => page(`/products/${p.slug}`, 0.7)),
    ...legalPages.map((l) => page(`/legal/${l.slug}`, 0.3)),
  ];
}
