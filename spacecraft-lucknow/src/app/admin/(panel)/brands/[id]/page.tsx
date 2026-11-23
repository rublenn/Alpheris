import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/admin-auth";
import { adminDb } from "@/lib/supabase";
import { deleteBrand, saveBrand } from "@/actions/admin";
import { ActionButton, AdminForm } from "@/components/admin/AdminForm";
import { AdminHeader, Check, Field, TextArea, card } from "@/components/admin/ui";

export default async function EditBrand({ params }: PageProps<"/admin/brands/[id]">) {
  await requireAdmin();
  const { id } = await params;
  const { data: b } = await adminDb().from("brands").select("*").eq("id", id).maybeSingle();
  if (!b) notFound();

  return (
    <>
      <AdminHeader title={b.name} back={{ href: "/admin/brands", label: "Brands" }} />
      <div className="grid gap-8 xl:grid-cols-[1fr_380px]">
        <section className={card}>
          <AdminForm action={saveBrand} className="space-y-4">
            <input type="hidden" name="id" value={b.id} />
            <Field label="Name" name="name" required defaultValue={b.name} />
            <Field label="URL name" name="slug" defaultValue={b.slug} />
            <TextArea label="Description" name="description" defaultValue={b.description} rows={4} />
            <Field label="Display order" name="sort_order" type="number" defaultValue={b.sort_order} />
            <Check label="Show on website" name="is_active" defaultChecked={b.is_active} />
            <Check label="This is a placeholder (shows a “Sample” label)" name="is_sample" defaultChecked={b.is_sample} />
          </AdminForm>
        </section>
        <section className={card}>
          <h2 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted">Delete</h2>
          <p className="mt-3 text-[13px] text-muted">Products of this brand stay in the shop, without a brand.</p>
          <div className="mt-4">
            <ActionButton action={deleteBrand} fields={{ id: b.id }} label="Delete brand" confirmText={`Delete “${b.name}”?`} variant="danger" />
          </div>
        </section>
      </div>
    </>
  );
}
