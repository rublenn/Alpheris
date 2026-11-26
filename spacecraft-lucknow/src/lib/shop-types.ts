import type { Swatch } from "./catalog";

/** Shapes used by the shop pages. Safe to import in browser components. */

export type CategorySwatch = Swatch & { looks?: Swatch[] };

export type ShopCategory = {
  id: string;
  slug: string;
  name: string;
  blurb: string;
  imageUrl: string | null;
  swatch: CategorySwatch | null;
};

export type ShopBrand = {
  id: string;
  slug: string;
  name: string;
  description: string;
  logoUrl: string | null;
  isSample: boolean;
};

export type Availability = "in-stock" | "low-stock" | "out-of-stock" | "on-request";

export type ShopVariant = {
  id: string;
  sku: string;
  label: string;
  colour: string | null;
  finish: string | null;
  dimensions: string | null;
  /** Normal price in paise. null = price on request (not sold online). */
  pricePaise: number | null;
  salePricePaise: number | null;
  stock: number;
  /** Photo of this option (e.g. one design), if it has its own. */
  imageUrl: string | null;
};

export type ShopProduct = {
  id: string;
  slug: string;
  name: string;
  description: string;
  material: string | null;
  specifications: Record<string, string>;
  swatch: Swatch | null;
  isFeatured: boolean;
  isSample: boolean;
  createdAt: string;
  category: { slug: string; name: string; swatch: CategorySwatch | null };
  brand: { slug: string; name: string } | null;
  images: { url: string; alt: string }[];
  variants: ShopVariant[];
};

export const LOW_STOCK = 5;

/** The photo to show for a product in lists: its own first photo, else the first option photo. */
export function coverImage(p: Pick<ShopProduct, "images" | "variants" | "name">): { url: string; alt: string } | null {
  if (p.images[0]) return p.images[0];
  const v = p.variants.find((x) => x.imageUrl);
  return v?.imageUrl ? { url: v.imageUrl, alt: `${p.name} — ${v.label}` } : null;
}

/** What the customer actually pays for one unit. */
export function unitPrice(v: Pick<ShopVariant, "pricePaise" | "salePricePaise">) {
  return v.salePricePaise ?? v.pricePaise;
}

export function variantAvailability(v: ShopVariant): Availability {
  if (unitPrice(v) == null) return "on-request";
  if (v.stock <= 0) return "out-of-stock";
  if (v.stock <= LOW_STOCK) return "low-stock";
  return "in-stock";
}

export function productAvailability(p: ShopProduct): Availability {
  const all = p.variants.map(variantAvailability);
  if (all.includes("in-stock")) return "in-stock";
  if (all.includes("low-stock")) return "low-stock";
  if (all.includes("out-of-stock")) return "out-of-stock";
  return "on-request";
}

/** Lowest price a customer can pay for this product, or null if none are priced. */
export function fromPrice(p: ShopProduct): number | null {
  const prices = p.variants.map(unitPrice).filter((n): n is number => n != null);
  return prices.length ? Math.min(...prices) : null;
}

export const availabilityLabel: Record<Availability, string> = {
  "in-stock": "In stock",
  "low-stock": "Only a few left",
  "out-of-stock": "Out of stock",
  "on-request": "Price on request",
};
