import { requireAdmin } from "@/lib/admin-auth";
import { adminDb } from "@/lib/supabase";
import { ProductForm } from "@/components/admin/ProductForm";
import { AdminHeader, card } from "@/components/admin/ui";

export const metadata = { title: "New product" };

export default async function NewProduct() {
  await requireAdmin();
  const db = adminDb();
  const [{ data: categories }, { data: brands }] = await Promise.all([
    db.from("categories").select("id, name").order("sort_order"),
    db.from("brands").select("id, name").order("sort_order"),
  ]);
  return (
    <>
      <AdminHeader title="New product" back={{ href: "/admin/products", label: "Products" }} />
      <p className="mb-6 max-w-2xl text-[14px] text-muted">
        Step 1: the basic details. After saving you can add photos and the options (sizes / colours) with their price and stock.
      </p>
      <section className={`${card} max-w-3xl`}>
        <ProductForm categories={categories ?? []} brands={brands ?? []} />
      </section>
    </>
  );
}
