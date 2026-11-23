import Link from "next/link";
import { requireAdmin } from "@/lib/admin-auth";
import { adminDb } from "@/lib/supabase";
import { saveBrand } from "@/actions/admin";
import { AdminForm } from "@/components/admin/AdminForm";
import { AdminHeader, Check, Field, Pill, TextArea, card } from "@/components/admin/ui";

export const metadata = { title: "Brands" };

export default async function AdminBrands({ searchParams }: PageProps<"/admin/brands">) {
  await requireAdmin();
  const { error } = await searchParams;
  const { data: brands } = await adminDb()
    .from("brands")
    .select("id, name, slug, sort_order, is_active, is_sample, products(count)")
    .order("sort_order")
    .order("name");

  return (
    <>
      <AdminHeader title="Brands" />
      {typeof error === "string" && <p role="alert" className="mb-6 text-[14px] text-red-300">{error}</p>}
      <div className="grid gap-8 xl:grid-cols-[1fr_380px]">
        <div className="overflow-x-auto border border-line">
          <table className="w-full min-w-[560px] text-left text-[14px]">
            <thead className="bg-beige text-[11px] uppercase tracking-[0.14em] text-muted">
              <tr><th className="p-3">Order</th><th className="p-3">Name</th><th className="p-3">Products</th><th className="p-3">Shown</th><th className="p-3" /></tr>
            </thead>
            <tbody className="divide-y divide-line">
              {(brands ?? []).map((b) => (
                <tr key={b.id}>
                  <td className="p-3 text-muted">{b.sort_order}</td>
                  <td className="p-3">
                    {b.name} {b.is_sample && <Pill tone="gold">Sample</Pill>}
                    <span className="block text-[12px] text-muted">/brands/{b.slug}</span>
                  </td>
                  <td className="p-3">{(b.products as unknown as { count: number }[])[0]?.count ?? 0}</td>
                  <td className="p-3">{b.is_active ? <Pill tone="good">Visible</Pill> : <Pill>Hidden</Pill>}</td>
                  <td className="p-3 text-right"><Link href={`/admin/brands/${b.id}`} className="text-accent-deep hover:underline">Edit</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <section className={card}>
          <h2 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted">Add a brand</h2>
          <AdminForm action={saveBrand} submitLabel="Add brand" resetOnSuccess className="mt-4 space-y-4">
            <Field label="Name" name="name" required />
            <Field label="URL name (optional)" name="slug" />
            <TextArea label="Description" name="description" rows={3} />
            <Field label="Display order" name="sort_order" type="number" defaultValue={(brands?.length ?? 0) + 1} />
            <Check label="Show on website" name="is_active" defaultChecked />
            <Check label="This is a placeholder (shows a “Sample” label)" name="is_sample" />
          </AdminForm>
        </section>
      </div>
    </>
  );
}
