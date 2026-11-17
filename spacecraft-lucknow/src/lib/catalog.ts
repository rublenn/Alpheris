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
  /** Extra illustrated looks shown in turn (SAMPLE textures, not real product lines). */
  variants?: Swatch[];
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

const s = (kind: SwatchKind, base: string, shade: string, light: string): Swatch => ({ kind, base, shade, light });

/** Different looks within each category, cycled in the category preview. */
const extraLooks: Record<string, Swatch[]> = {
  louvers: [s("flute", "#E6DCCB", "#B9AB94", "#F7F1E6"), s("flute", "#9C7350", "#644529", "#C29A72")],
  "wall-panels": [s("panel", "#E3D8C6", "#B8A68A", "#F4EDE2"), s("panel", "#DCDAD5", "#A5A19A", "#F2F1EE")],
  laminates: [s("wood", "#CFC8BD", "#8F877B", "#E7E1D7"), s("wood", "#8E6A4B", "#5A3F27", "#B08A66")],
  "acrylic-laminates": [s("gloss", "#E6D6BF", "#BFA583", "#FBF4E8"), s("gloss", "#D9D9D6", "#9E9D98", "#F5F5F3")],
  "uv-marble-sheets": [s("marble", "#EFEDEA", "#6F6A62", "#A9A297"), s("marble", "#F3EBDD", "#9C8466", "#C9A273")],
  "wpc-louvers": [s("flute", "#D2B994", "#A38560", "#EBD9BC"), s("flute", "#7A5A3E", "#4B3420", "#9E7B58")],
  "charcoal-panels": [s("flute", "#56524D", "#2F2C29", "#77716A"), s("flute", "#5E5247", "#362D25", "#85735F")],
  "plywood-boards": [s("ply", "#EDE0C8", "#C2AB86", "#F8F0E1"), s("ply", "#C9A87E", "#8A6A44", "#E0C49F")],
  doors: [s("door", "#E5D2B2", "#B79B70", "#F3E6CE"), s("door", "#8E6A4B", "#5A3F27", "#B08A66")],
  furniture: [s("furniture", "#E8E0D2", "#7A5A3E", "#FBF8F2"), s("furniture", "#E3E1DC", "#6B6660", "#F7F6F3")],
  "hardware-accessories": [s("metal", "#C9C4BB", "#8A847A", "#F1EEE8"), s("metal", "#6B6660", "#2E2B28", "#9A948C")],
};
for (const category of categories) category.variants = extraLooks[category.slug] ?? [];

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
  // Extra samples so each brand card has a few products to show.
  sampleProduct("fluted-louver-ash", "Fluted Louver — Ash Tone", "louvers", 0, {
    kind: "flute",
    base: "#E6DCCB",
    shade: "#B9AB94",
    light: "#F7F1E6",
  }),
  sampleProduct("charcoal-panel-slim", "Charcoal Panel — Slim Flute", "charcoal-panels", 1, {
    kind: "flute",
    base: "#56524D",
    shade: "#2F2C29",
    light: "#77716A",
  }),
  sampleProduct("plywood-board-sample", "Plywood Board — Sample", "plywood-boards", 2),
  sampleProduct("laminate-ash-grey", "Laminate — Ash Grey", "laminates", 2, {
    kind: "wood",
    base: "#CFC8BD",
    shade: "#8F877B",
    light: "#E7E1D7",
  }),
  sampleProduct("acrylic-laminate-sand", "Acrylic Laminate — Sand Gloss", "acrylic-laminates", 3, {
    kind: "gloss",
    base: "#E6D6BF",
    shade: "#BFA583",
    light: "#FBF4E8",
  }),
  sampleProduct("door-panelled-sample", "Door — Panelled Sample", "doors", 3),
  sampleProduct("marble-sheet-grey", "UV Marble Sheet — Grey Vein", "uv-marble-sheets", 4, {
    kind: "marble",
    base: "#EFEDEA",
    shade: "#6F6A62",
    light: "#A9A297",
  }),
  sampleProduct("sideboard-sample", "Sideboard — Sample", "furniture", 4),
  sampleProduct("wpc-louver-sand", "WPC Louver — Sand Tone", "wpc-louvers", 5, {
    kind: "flute",
    base: "#D2B994",
    shade: "#A38560",
    light: "#EBD9BC",
  }),
  sampleProduct("pull-handle-sample", "Pull Handle — Sample", "hardware-accessories", 5, {
    kind: "metal",
    base: "#C9C4BB",
    shade: "#8A847A",
    light: "#F1EEE8",
  }),
];

/** The first eight are shown in the homepage "Featured products" section. */
export const featuredProducts = products.slice(0, 8);

export function getBrandProducts(brandSlug: string) {
  return products.filter((p) => p.brandSlug === brandSlug);
}

export function getCategory(slug: string) {
  return categories.find((c) => c.slug === slug);
}

export function getBrand(slug: string) {
  return brands.find((b) => b.slug === slug);
}
