import { saveVariant } from "@/actions/admin";
import { paiseToRupeesInput } from "@/lib/money";
import { AdminForm } from "./AdminForm";
import { Check, Field } from "./ui";

export type VariantRow = {
  id: string;
  sku: string;
  label: string;
  colour: string | null;
  finish: string | null;
  dimensions: string | null;
  price_paise: number | null;
  sale_price_paise: number | null;
  stock: number;
  is_active: boolean;
  sort_order: number;
  image_url?: string | null;
};

/** Edit one option (size/colour/finish) of a product: its price and stock. */
export function VariantForm({ productId, variant, nextSort }: { productId: string; variant?: VariantRow; nextSort?: number }) {
  // Several of these forms sit on one page, so each needs its own input ids.
  const idPrefix = variant ? `v-${variant.id.slice(0, 8)}-` : "new-";
  return (
    <AdminForm action={saveVariant} submitLabel={variant ? "Save option" : "Add option"} resetOnSuccess={!variant}>
      {variant && <input type="hidden" name="id" value={variant.id} />}
      <input type="hidden" name="product_id" value={productId} />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Field idPrefix={idPrefix} label="Option name" name="label" required defaultValue={variant?.label} placeholder="8 ft × 4 ft, Matt" className="xl:col-span-2" />
        <Field idPrefix={idPrefix} label="SKU (your code)" name="sku" required defaultValue={variant?.sku} placeholder="LV-OAK-8X4" />
        <Field idPrefix={idPrefix} label="Display order" name="sort_order" type="number" defaultValue={variant?.sort_order ?? nextSort ?? 0} />
        <Field idPrefix={idPrefix} label="Colour" name="colour" defaultValue={variant?.colour} />
        <Field idPrefix={idPrefix} label="Finish" name="finish" defaultValue={variant?.finish} />
        <Field idPrefix={idPrefix} label="Size / dimensions" name="dimensions" defaultValue={variant?.dimensions} className="xl:col-span-2" />
        <Field idPrefix={idPrefix} label="Price (₹)" name="price" inputMode="decimal" defaultValue={paiseToRupeesInput(variant?.price_paise)} hint="Empty = “price on request” (cannot be bought online)." />
        <Field idPrefix={idPrefix} label="Sale price (₹)" name="sale_price" inputMode="decimal" defaultValue={paiseToRupeesInput(variant?.sale_price_paise)} hint="Optional. Lower than price." />
        <Field idPrefix={idPrefix} label="Stock (units)" name="stock" type="number" required defaultValue={variant?.stock ?? 0} />
        {variant && <Field idPrefix={idPrefix} label="Reason for stock change" name="stock_note" placeholder="e.g. new delivery" />}
      </div>
      <div className="mt-4">
        <Check label="Show this option" name="is_active" defaultChecked={variant?.is_active ?? true} />
      </div>
    </AdminForm>
  );
}
