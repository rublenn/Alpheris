import Link from "next/link";
import { requireAdmin } from "@/lib/admin-auth";
import { adminDb } from "@/lib/supabase";
import { saveCategory } from "@/actions/admin";
import { AdminForm } from "@/components/admin/AdminForm";
import { AdminHeader, Check, Field, Pill, TextArea, card } from "@/components/admin/ui";

export const metadata = { title: "Categories" };

export default async function AdminCategories({ searchParams }: PageProps<"/admin/categories">) {
  await requireAdmin();
  const { error } = await searchParams;
  const { data: categories } = await adminDb()
    .from("categories")
    .select("id, name, slug, sort_order, is_active, products(count)")
    .order("sort_order")
    .order("name");

  return (
    <>
      <AdminHeader title="Categories" />
      {typeof error === "string" && <p role="alert" className="mb-6 text-[14px] text-red-300">{error}</p>}

      <div className="grid gap-8 xl:grid-cols-[1fr_380px]">
        <div className="overflow-x-auto border border-line">
          <table className="w-full min-w-[560px] text-left text-[14px]">
            <thead className="bg-beige text-[11px] uppercase tracking-[0.14em] text-muted">
              <tr><th className="p-3">Order</th><th className="p-3">Name</th><th className="p-3">Products</th><th className="p-3">Shown</th><th className="p-3" /></tr>
            </thead>
            <tbody className="divide-y divide-line">
              {(categories ?? []).map((c) => (
                <tr key={c.id}>
                  <td className="p-3 text-muted">{c.sort_order}</td>
                  <td className="p-3">{c.name}<span className="block text-[12px] text-muted">/categories/{c.slug}</span></td>
                  <td className="p-3">{(c.products as unknown as { count: number }[])[0]?.count ?? 0}</td>
                  <td className="p-3">{c.is_active ? <Pill tone="good">Visible</Pill> : <Pill>Hidden</Pill>}</td>
                  <td className="p-3 text-right"><Link href={`/admin/categories/${c.id}`} className="text-accent-deep hover:underline">Edit</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <section className={card}>
          <h2 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted">Add a category</h2>
          <AdminForm action={saveCategory} submitLabel="Add category" resetOnSuccess className="mt-4 space-y-4">
            <Field label="Name" name="name" required />
            <Field label="URL name (optional)" name="slug" hint="Made from the name if left empty." />
            <TextArea label="Short description" name="blurb" rows={3} />
            <Field label="Display order" name="sort_order" type="number" defaultValue={(categories?.length ?? 0) + 1} />
            <Check label="Show on website" name="is_active" defaultChecked />
          </AdminForm>
        </section>
      </div>
    </>
  );
}
