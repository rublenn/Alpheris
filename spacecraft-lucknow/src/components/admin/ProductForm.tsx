import { saveProduct } from "@/actions/admin";
import { AdminForm } from "./AdminForm";
import { Check, Field, TextArea, inputClass, labelClass } from "./ui";

type Option = { id: string; name: string };
export type ProductRow = {
  id: string;
  name: string;
  slug: string;
  category_id: string;
  brand_id: string | null;
  description: string;
  material: string | null;
  specifications: Record<string, string>;
  is_active: boolean;
  is_featured: boolean;
  is_sample: boolean;
};

export function ProductForm({ product, categories, brands }: { product?: ProductRow; categories: Option[]; brands: Option[] }) {
  const specs = product ? Object.entries(product.specifications).map(([k, v]) => `${k}: ${v}`).join("\n") : "";
  return (
    <AdminForm action={saveProduct} submitLabel={product ? "Save product" : "Create product"} className="space-y-4">
      {product && <input type="hidden" name="id" value={product.id} />}
      <Field label="Product name" name="name" required defaultValue={product?.name} placeholder="e.g. Fluted Louver — Oak Tone" />
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="category_id" className={labelClass}>Category</label>
          <select id="category_id" name="category_id" required defaultValue={product?.category_id ?? ""} className={`${inputClass} h-11`}>
            <option value="" disabled>Choose…</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="brand_id" className={labelClass}>Brand</label>
          <select id="brand_id" name="brand_id" defaultValue={product?.brand_id ?? ""} className={`${inputClass} h-11`}>
            <option value="">No brand</option>
            {brands.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
        </div>
      </div>
      <Field label="URL name (optional)" name="slug" defaultValue={product?.slug} hint="Made from the name if left empty. Page address: /products/<url-name>" />
      <TextArea label="Description" name="description" defaultValue={product?.description} rows={5} />
      <Field label="Material" name="material" defaultValue={product?.material} placeholder="e.g. WPC, HDHMR, PVC" />
      <TextArea
        label="Specifications"
        name="specifications"
        defaultValue={specs}
        rows={5}
        placeholder={"Thickness: 8 mm\nSheet size: 8 ft × 4 ft\nWarranty: as per brand"}
        hint="One per line, as “Name: value”. Only add details you have confirmed."
      />
      <div className="flex flex-wrap gap-6 pt-2">
        <Check label="Show on website" name="is_active" defaultChecked={product?.is_active ?? true} />
        <Check label="Feature on homepage" name="is_featured" defaultChecked={product?.is_featured} />
        <Check label="Sample / placeholder" name="is_sample" defaultChecked={product?.is_sample} />
      </div>
    </AdminForm>
  );
}
