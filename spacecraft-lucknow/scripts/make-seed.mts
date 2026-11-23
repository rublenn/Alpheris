// One-off: turns the old sample catalogue (src/lib/catalog.ts) into seed SQL.
// Run: node scripts/make-seed.mts > supabase/seed.sql
import { categories } from "../src/lib/catalog.ts";
import { brands, products } from "./legacy-sample-catalog.ts";
const q = (v: unknown) => (v == null ? "null" : `'${String(v).replace(/'/g, "''")}'`);
const j = (v: unknown) => `${q(JSON.stringify(v))}::jsonb`;
const out: string[] = ["-- Seed: real category list + clearly-labelled SAMPLE brands/products (no prices).", "begin;"];
categories.forEach((c, i) => out.push(
  `insert into categories (slug,name,blurb,swatch,sort_order) values (${q(c.slug)},${q(c.name)},${q(c.blurb)},${j({ ...c.swatch, looks: c.variants })},${i}) on conflict (slug) do nothing;`));
brands.forEach((b, i) => out.push(
  `insert into brands (slug,name,is_sample,sort_order) values (${q(b.slug)},${q(b.name)},true,${i}) on conflict (slug) do nothing;`));
products.forEach((p, i) => {
  out.push(`insert into products (slug,name,category_id,brand_id,description,swatch,is_featured,is_sample) select ${q(p.slug)},${q(p.name)},c.id,b.id,${q(p.description)},${j(p.swatch)},${i < 8},true from categories c, brands b where c.slug=${q(p.categorySlug)} and b.slug=${q(p.brandSlug)} on conflict (slug) do nothing;`);
  for (const v of p.variants) out.push(`insert into variants (product_id,sku,label,price_paise,stock) select id,${q(v.sku)},${q(v.label)},null,0 from products where slug=${q(p.slug)} on conflict (sku) do nothing;`);
});
out.push("commit;");
console.log(out.join("\n"));
