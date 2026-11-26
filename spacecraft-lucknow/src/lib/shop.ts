import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { isDbConfigured, publicDb } from "./supabase";
import {
  fromPrice,
  productAvailability,
  type ShopBrand,
  type ShopCategory,
  type ShopProduct,
} from "./shop-types";

/**
 * Reads the whole public catalogue in one go and keeps it in Next.js's cache.
 * The admin panel clears the "catalog" tag after every change, so edits show
 * up straight away. A shop of this size (hundreds of products) is small
 * enough that filtering in memory is fast and simple.
 */
export type Catalog = {
  categories: ShopCategory[];
  brands: ShopBrand[];
  products: ShopProduct[];
};

export const CATALOG_TAG = "catalog";

const empty: Catalog = { categories: [], brands: [], products: [] };

export async function getCatalog(): Promise<Catalog> {
  "use cache";
  cacheLife("hours");
  cacheTag(CATALOG_TAG);

  if (!isDbConfigured()) return empty;
  const db = publicDb();

  const [cats, brands, products] = await Promise.all([
    db.from("categories").select("id, slug, name, blurb, image_url, swatch").order("sort_order").order("name"),
    db.from("brands").select("id, slug, name, description, logo_url, is_sample").order("sort_order").order("name"),
    db
      .from("products")
      .select(
        `id, slug, name, description, material, specifications, swatch, is_featured, is_sample, created_at,
         category:categories!inner(slug, name, swatch, is_active),
         brand:brands(slug, name, is_active),
         images:product_images(url, alt, sort_order),
         variants(id, sku, label, colour, finish, dimensions, price_paise, sale_price_paise, stock, sort_order, image_url)`,
      )
      .order("created_at", { ascending: false }),
  ]);

  const error = cats.error ?? brands.error ?? products.error;
  if (error) throw new Error(`Could not load the catalogue: ${error.message}`);

  return {
    categories: (cats.data ?? []).map((c) => ({
      id: c.id,
      slug: c.slug,
      name: c.name,
      blurb: c.blurb,
      imageUrl: c.image_url,
      swatch: c.swatch,
    })),
    brands: (brands.data ?? []).map((b) => ({
      id: b.id,
      slug: b.slug,
      name: b.name,
      description: b.description,
      logoUrl: b.logo_url,
      isSample: b.is_sample,
    })),
    products: (products.data ?? [])
      // Supabase returns joined rows as objects; RLS already hides inactive ones.
      .map((p) => {
        const category = p.category as unknown as { slug: string; name: string; swatch: ShopCategory["swatch"] };
        const brand = p.brand as unknown as { slug: string; name: string } | null;
        return {
          id: p.id,
          slug: p.slug,
          name: p.name,
          description: p.description,
          material: p.material,
          specifications: (p.specifications ?? {}) as Record<string, string>,
          swatch: p.swatch,
          isFeatured: p.is_featured,
          isSample: p.is_sample,
          createdAt: p.created_at,
          category: { slug: category.slug, name: category.name, swatch: category.swatch },
          brand: brand ? { slug: brand.slug, name: brand.name } : null,
          images: [...(p.images ?? [])]
            .sort((a, b) => a.sort_order - b.sort_order)
            .map((i) => ({ url: i.url, alt: i.alt })),
          variants: [...(p.variants ?? [])]
            .sort((a, b) => a.sort_order - b.sort_order)
            .map((v) => ({
              id: v.id,
              sku: v.sku,
              label: v.label,
              colour: v.colour,
              finish: v.finish,
              dimensions: v.dimensions,
              pricePaise: v.price_paise,
              salePricePaise: v.sale_price_paise,
              stock: v.stock,
              imageUrl: v.image_url,
            })),
        } satisfies ShopProduct;
      })
      .filter((p) => p.variants.length > 0),
  };
}

export async function getProduct(slug: string) {
  const { products } = await getCatalog();
  return products.find((p) => p.slug === slug) ?? null;
}

export async function getFeaturedProducts(limit = 8) {
  const { products } = await getCatalog();
  const featured = products.filter((p) => p.isFeatured);
  return (featured.length ? featured : products).slice(0, limit);
}

// ───────────── search & filters ─────────────

export type SortKey = "newest" | "price-asc" | "price-desc" | "name";

export type ProductFilters = {
  q?: string;
  category?: string;
  brand?: string;
  /** Only show products that can be bought online right now. */
  inStock?: boolean;
  sort?: SortKey;
};

export function readFilters(params: Record<string, string | string[] | undefined>): ProductFilters {
  const one = (key: string) => {
    const v = params[key];
    return (Array.isArray(v) ? v[0] : v)?.trim() || undefined;
  };
  const sort = one("sort");
  return {
    q: one("q")?.slice(0, 80),
    category: one("category"),
    brand: one("brand"),
    inStock: one("stock") === "1",
    sort: (["newest", "price-asc", "price-desc", "name"] as const).find((s) => s === sort) ?? "newest",
  };
}

export function filterProducts(products: ShopProduct[], f: ProductFilters) {
  const words = (f.q ?? "").toLowerCase().split(/\s+/).filter(Boolean);
  const list = products.filter((p) => {
    if (f.category && p.category.slug !== f.category) return false;
    if (f.brand && p.brand?.slug !== f.brand) return false;
    if (f.inStock) {
      const a = productAvailability(p);
      if (a !== "in-stock" && a !== "low-stock") return false;
    }
    if (words.length) {
      const haystack = [
        p.name,
        p.description,
        p.material,
        p.category.name,
        p.brand?.name,
        ...p.variants.flatMap((v) => [v.label, v.sku, v.colour, v.finish]),
      ]
        .join(" ")
        .toLowerCase();
      if (!words.every((w) => haystack.includes(w))) return false;
    }
    return true;
  });

  const price = (p: ShopProduct, missing: number) => fromPrice(p) ?? missing;
  switch (f.sort) {
    case "price-asc":
      return list.sort((a, b) => price(a, Infinity) - price(b, Infinity));
    case "price-desc":
      return list.sort((a, b) => price(b, -1) - price(a, -1));
    case "name":
      return list.sort((a, b) => a.name.localeCompare(b.name));
    default:
      return list; // already newest first
  }
}
