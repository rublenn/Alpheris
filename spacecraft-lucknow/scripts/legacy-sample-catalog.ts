/**
 * The original Phase 1 SAMPLE brands and products, kept only so
 * scripts/make-seed.mts can recreate supabase/seed.sql. Not used by the site.
 */
import { categories, type Swatch, type SwatchKind } from "../src/lib/catalog.ts";

type Brand = { slug: string; name: string; categorySlugs: string[]; isSample: boolean };
type Variant = { sku: string; label: string; price: number | null; stock: number | null; availability: string };
type Product = {
  slug: string; name: string; brandSlug: string; categorySlug: string; description: string;
  images: string[]; swatch: Swatch; specifications: Record<string, string>; variants: Variant[]; isSample: boolean;
};

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

