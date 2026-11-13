/**
 * Catalogue structure: CATEGORY → BRAND → PRODUCT → VARIANT
 *
 * IMPORTANT: every brand and product below is SAMPLE DATA so the design can
 * be reviewed. Nothing here is a real specification, price or stock figure.
 * In Phase 4 this file is replaced by the Supabase database, and the same
 * types describe the database rows.
 */

/** Which illustrated material texture to draw (see MaterialSwatch). */
export type SwatchKind =
  | "flute"
  | "panel"
  | "wood"
  | "gloss"
  | "marble"
  | "ply"
  | "door"
  | "furniture"
  | "metal";

export type Swatch = {
  kind: SwatchKind;
  /** Main colour, shadow colour, highlight colour. */
  base: string;
  shade: string;
  light: string;
};

export type Category = {
  slug: string;
  name: string;
  blurb: string;
  swatch: Swatch;
};

export type Brand = {
  slug: string;
  name: string;
  categorySlugs: string[];
  isSample: boolean;
};

export type Availability = "in-stock" | "low-stock" | "out-of-stock" | "on-request";

export type Variant = {
  sku: string;
  label: string;
  colour?: string;
  finish?: string;
  dimensions?: string;
  /** Prices are in paise (₹1 = 100) to avoid rounding errors. null = on request. */
  price: number | null;
  salePrice?: number | null;
  stock: number | null;
  availability: Availability;
};

export type Product = {
  slug: string;
  name: string;
  brandSlug: string;
  categorySlug: string;
  description: string;
  material?: string;
  images: string[];
  swatch: Swatch;
  /** Free-form specs, because fields differ by category. */
  specifications: Record<string, string>;
  variants: Variant[];
  isSample: boolean;
};

export const categories: Category[] = [
  {
    slug: "louvers",
    name: "Louvers",
    blurb: "Fluted profiles that add rhythm and depth to walls and ceilings.",
    swatch: { kind: "flute", base: "#D8BF9F", shade: "#A98660", light: "#F0E0C9" },
  },
  {
    slug: "wall-panels",
    name: "Wall Panels",
    blurb: "Decorative panelling for feature walls and full-room cladding.",
    swatch: { kind: "panel", base: "#EFEAE1", shade: "#CFC6B6", light: "#FFFFFF" },
  },
  {
    slug: "laminates",
    name: "Laminates",
    blurb: "Laminated sheets in wood, solid and textured finishes.",
    swatch: { kind: "wood", base: "#C9A27A", shade: "#8F6A43", light: "#E4C9A8" },
  },
  {
    slug: "acrylic-laminates",
    name: "Acrylic Laminates",
    blurb: "High-gloss surfaces with a mirror-like, modern finish.",
    swatch: { kind: "gloss", base: "#F3EEE6", shade: "#D5C7B3", light: "#FFFFFF" },
  },
  {
    slug: "uv-marble-sheets",
    name: "UV Marble Sheets",
    blurb: "The look of natural marble in a light, easy-to-install sheet.",
    swatch: { kind: "marble", base: "#F7F5F1", shade: "#A9A297", light: "#B58B60" },
  },
  {
    slug: "wpc-louvers",
    name: "WPC Louvers",
    blurb: "Fluted wood-polymer louvers for warm, durable accents.",
    swatch: { kind: "flute", base: "#B98F66", shade: "#7E5C3B", light: "#DDBB95" },
  },
  {
    slug: "charcoal-panels",
    name: "Charcoal Panels",
    blurb: "Sculpted charcoal panels for bold, textured statements.",
    swatch: { kind: "flute", base: "#6B6660", shade: "#3F3B37", light: "#8F8980" },
  },
  {
    slug: "plywood-boards",
    name: "Plywood & Boards",
    blurb: "The base material for durable furniture and interiors.",
    swatch: { kind: "ply", base: "#E2CBA6", shade: "#A98660", light: "#F2E3C8" },
  },
  {
    slug: "doors",
    name: "Doors",
    blurb: "Doors and door boards for homes and commercial spaces.",
    swatch: { kind: "door", base: "#D2B48C", shade: "#9A7650", light: "#EBD6B5" },
  },
  {
    slug: "furniture",
    name: "Furniture",
    blurb: "Furniture designed and supplied for the way you live and work.",
    swatch: { kind: "furniture", base: "#EDE7DC", shade: "#B58B60", light: "#FFFFFF" },
  },
  {
    slug: "hardware-accessories",
    name: "Hardware & Accessories",
    blurb: "Hinges, handles and fittings that finish the job properly.",
    swatch: { kind: "metal", base: "#D9C3A5", shade: "#9C7A52", light: "#F6EBDB" },
  },
];

/** SAMPLE brands — placeholders until real brand partners are confirmed. */
export const brands: Brand[] = ["A", "B", "C", "D", "E", "F"].map((letter, i) => ({
  slug: `sample-brand-${letter.toLowerCase()}`,
  name: `Sample Brand ${letter}`,
  categorySlugs: [categories[i].slug, categories[i + 5].slug],
  isSample: true,
}));

function sampleProduct(
  slug: string,
  name: string,
  categorySlug: string,
  brandIndex: number,
  swatch?: Swatch,
): Product {
  const category = categories.find((c) => c.slug === categorySlug)!;
  return {
    slug,
    name,
    brandSlug: brands[brandIndex].slug,
    categorySlug,
    description: "Sample product for design preview. Real details will be added later.",
    images: [],
    swatch: swatch ?? category.swatch,
    specifications: {},
    variants: [
      {
        sku: `SAMPLE-${slug.toUpperCase()}`,
        label: "Sample variant",
        price: null,
        stock: null,
        availability: "on-request",
      },
    ],
    isSample: true,
  };
}

/** SAMPLE products — names are generic and no specifications are claimed. */
export const products: Product[] = [
  sampleProduct("fluted-louver-oak", "Fluted Louver — Oak Tone", "louvers", 0),
  sampleProduct("marble-sheet-ivory", "UV Marble Sheet — Ivory Vein", "uv-marble-sheets", 4),
  sampleProduct("charcoal-panel-linear", "Charcoal Panel — Linear", "charcoal-panels", 1),
  sampleProduct("acrylic-laminate-pearl", "Acrylic Laminate — Pearl Gloss", "acrylic-laminates", 3),
  sampleProduct("wpc-louver-walnut", "WPC Louver — Walnut Tone", "wpc-louvers", 0, {
    kind: "flute",
    base: "#9C7350",
    shade: "#644529",
    light: "#C29A72",
  }),
  sampleProduct("laminate-natural-teak", "Laminate — Natural Teak", "laminates", 2),
  sampleProduct("wall-panel-grid", "Wall Panel — Grid Relief", "wall-panels", 1),
  sampleProduct("handle-champagne", "Cabinet Handle — Champagne", "hardware-accessories", 5),
];

export function getCategory(slug: string) {
  return categories.find((c) => c.slug === slug);
}

export function getBrand(slug: string) {
  return brands.find((b) => b.slug === slug);
}
