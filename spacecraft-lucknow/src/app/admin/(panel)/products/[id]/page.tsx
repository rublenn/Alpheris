import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/admin-auth";
import { adminDb } from "@/lib/supabase";
import { deleteImage, deleteProduct, deleteVariant, makeCoverImage } from "@/actions/admin";
import { ActionButton } from "@/components/admin/AdminForm";
import { ImageUploader } from "@/components/admin/ImageUploader";
import { ProductForm, type ProductRow } from "@/components/admin/ProductForm";
import { VariantForm, type VariantRow } from "@/components/admin/VariantForm";
import { AdminHeader, Pill, card } from "@/components/admin/ui";
import { dateTime } from "@/components/shop/OrderDetails";

export default async function EditProduct({ params, searchParams }: PageProps<"/admin/products/[id]">) {
  await requireAdmin();
  const { id } = await params;
  const sp = await searchParams;
  const db = adminDb();
  const [{ data: product }, { data: categories }, { data: brands }, { data: images }, { data: variants }] = await Promise.all([
    db.from("products").select("*").eq("id", id).maybeSingle(),
    db.from("categories").select("id, name").order("sort_order"),
    db.from("brands").select("id, name").order("sort_order"),
    db.from("product_images").select("id, url, alt, sort_order").eq("product_id", id).order("sort_order"),
    db.from("variants").select("*").eq("product_id", id).order("sort_order").order("created_at"),
  ]);
  if (!product) notFound();

  const variantIds = (variants ?? []).map((v) => v.id);
  const { data: movements } = variantIds.length
    ? await db.from("stock_movements").select("variant_id, change, stock_after, reason, note, created_at").in("variant_id", variantIds).order("created_at", { ascending: false }).limit(15)
    : { data: [] };
  const sku = (vid: string) => variants?.find((v) => v.id === vid)?.sku ?? "";

  return (
    <>
      <AdminHeader title={product.name} back={{ href: "/admin/products", label: "Products" }}>
        <Link href={`/products/${product.slug}`} target="_blank" className="flex h-10 items-center border border-line px-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-ink hover:border-ink/40">
          View on site ↗
        </Link>
      </AdminHeader>
      {sp.created && <p className="mb-6 border border-emerald-400/40 p-4 text-[14px] text-emerald-200">Product created. Now add photos and at least one option with a price and stock.</p>}
      {typeof sp.error === "string" && <p role="alert" className="mb-6 text-[14px] text-red-300">{sp.error}</p>}
      {!variants?.length && <p className="mb-6 border border-amber-400/40 p-4 text-[14px] text-amber-200">This product has no options yet, so it is not shown on the website. Add one below.</p>}

      <div className="grid gap-8 2xl:grid-cols-2">
        <section className={card}>
          <h2 className="mb-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted">Details</h2>
          <ProductForm product={product as ProductRow} categories={categories ?? []} brands={brands ?? []} />
        </section>

        <section className={card}>
          <h2 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted">Photos</h2>
          <p className="mt-2 text-[13px] text-muted">The first photo is the cover shown in product lists.</p>
          <ul className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3">
            {(images ?? []).map((img, i) => (
              <li key={img.id} className="border border-line">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={img.url} alt={img.alt} className="aspect-square w-full object-cover" />
                <div className="flex flex-wrap gap-2 p-2">
                  {i === 0 ? <Pill tone="gold">Cover</Pill> : <ActionButton action={makeCoverImage} fields={{ id: img.id, product_id: product.id }} label="Make cover" />}
                  <ActionButton action={deleteImage} fields={{ id: img.id }} label="Delete" confirmText="Delete this photo?" variant="danger" />
                </div>
              </li>
            ))}
          </ul>
          <div className="mt-5">
            <ImageUploader target={{ kind: "product", id: product.id }} />
          </div>
        </section>
      </div>

      <section className="mt-10">
        <h2 className="display text-[2rem]">Options, prices & stock</h2>
        <p className="mt-2 max-w-2xl text-[14px] text-muted">
          Each option is one thing a customer can buy (a size, colour or finish), with its own price and stock. Stock goes down
          automatically when an order is paid, and back up if you cancel a paid order.
        </p>
        <div className="mt-6 space-y-5">
          {(variants as VariantRow[] | null)?.map((v) => (
            <div key={v.id} className={card}>
              <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                <p className="text-[14px] text-ink">{v.label} <span className="text-muted">· {v.sku}</span></p>
                <ActionButton action={deleteVariant} fields={{ id: v.id }} label="Delete option" confirmText={`Delete option “${v.label}”?`} variant="danger" />
              </div>
              <VariantForm productId={product.id} variant={v} />
            </div>
          ))}
          <div className={`${card} border-dashed border-accent/50`}>
            <h3 className="mb-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-accent-deep">Add an option</h3>
            <VariantForm productId={product.id} nextSort={variants?.length ?? 0} />
          </div>
        </div>
      </section>

      {movements && movements.length > 0 && (
        <section className={`${card} mt-10`}>
          <h2 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted">Recent stock changes</h2>
          <ul className="mt-3 divide-y divide-line text-[13px]">
            {movements.map((m, i) => (
              <li key={i} className="flex flex-wrap justify-between gap-3 py-2">
                <span>{sku(m.variant_id)} · {m.reason.replace("_", " ")}{m.note ? ` — ${m.note}` : ""}</span>
                <span className="text-muted">
                  <span className={m.change < 0 ? "text-red-300" : "text-emerald-300"}>{m.change > 0 ? `+${m.change}` : m.change}</span> → {m.stock_after} · {dateTime(m.created_at)}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className={`${card} mt-10`}>
        <h2 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted">Delete product</h2>
        <p className="mt-2 text-[13px] text-muted">Removes the product, its options and photos. Past orders keep their own copy of the details. To hide it instead, untick “Show on website”.</p>
        <div className="mt-4">
          <ActionButton action={deleteProduct} fields={{ id: product.id }} label="Delete product" confirmText={`Delete “${product.name}” permanently?`} variant="danger" />
        </div>
      </section>
    </>
  );
}
