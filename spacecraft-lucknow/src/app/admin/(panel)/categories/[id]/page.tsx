import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/admin-auth";
import { adminDb } from "@/lib/supabase";
import { deleteCategory, removeCategoryImage, saveCategory } from "@/actions/admin";
import { ActionButton, AdminForm } from "@/components/admin/AdminForm";
import { ImageUploader } from "@/components/admin/ImageUploader";
import { AdminHeader, Check, Field, TextArea, card } from "@/components/admin/ui";

export default async function EditCategory({ params }: PageProps<"/admin/categories/[id]">) {
  await requireAdmin();
  const { id } = await params;
  const { data: c } = await adminDb().from("categories").select("*").eq("id", id).maybeSingle();
  if (!c) notFound();

  return (
    <>
      <AdminHeader title={c.name} back={{ href: "/admin/categories", label: "Categories" }} />
      <div className="grid gap-8 xl:grid-cols-[1fr_380px]">
        <section className={card}>
          <AdminForm action={saveCategory} className="space-y-4">
            <input type="hidden" name="id" value={c.id} />
            <Field label="Name" name="name" required defaultValue={c.name} />
            <Field label="URL name" name="slug" defaultValue={c.slug} hint="Changing this changes the page address." />
            <TextArea label="Short description" name="blurb" defaultValue={c.blurb} rows={3} />
            <Field label="Display order" name="sort_order" type="number" defaultValue={c.sort_order} />
            <Check label="Show on website" name="is_active" defaultChecked={c.is_active} />
          </AdminForm>
        </section>
        <div className="space-y-8">
          <section className={card}>
            <h2 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted">Cover photo</h2>
            {c.image_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={c.image_url} alt="" className="mt-4 aspect-[5/4] w-full object-cover" />
            ) : (
              <p className="mt-3 text-[13px] text-muted">No photo — the illustrated texture is shown instead.</p>
            )}
            <div className="mt-4 flex flex-wrap gap-3">
              <ImageUploader target={{ kind: "category", id: c.id }} multiple={false} label={c.image_url ? "Replace photo" : "Upload photo"} />
              {c.image_url && <ActionButton action={removeCategoryImage} fields={{ id: c.id }} label="Remove photo" confirmText="Remove this photo?" variant="danger" />}
            </div>
          </section>
          <section className={card}>
            <h2 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted">Delete</h2>
            <p className="mt-3 text-[13px] text-muted">Only possible when no products use this category. To hide it instead, untick “Show on website”.</p>
            <div className="mt-4">
              <ActionButton action={deleteCategory} fields={{ id: c.id }} label="Delete category" confirmText={`Delete “${c.name}”? This cannot be undone.`} variant="danger" />
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
