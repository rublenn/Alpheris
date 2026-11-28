import Link from "next/link";
import { requireAdmin } from "@/lib/admin-auth";
import { adminDb } from "@/lib/supabase";
import { formatINR } from "@/lib/money";
import { AdminHeader, Pill, inputClass } from "@/components/admin/ui";

export const metadata = { title: "Products" };

export default async function AdminProducts({ searchParams }: PageProps<"/admin/products">) {
  await requireAdmin();
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q.trim() : "";
  let query = adminDb()
    .from("products")
    .select("id, name, slug, is_active, is_featured, is_sample, category:categories(name), brand:brands(name), variants(price_paise, sale_price_paise, stock, is_active), product_images(count)")
    .order("created_at", { ascending: false })
    .limit(500);
  if (q) query = query.ilike("name", `%${q.replace(/[%_,()]/g, " ")}%`);
  const { data: products } = await query;

  return (
    <>
      <AdminHeader title="Products">
        <Link href="/admin/products/new" className="flex h-10 items-center bg-accent px-5 text-[11px] font-semibold uppercase tracking-[0.18em] text-ivory hover:bg-accent-deep">
          + New product
        </Link>
      </AdminHeader>
      <form className="mb-6 flex max-w-md">
        <input name="q" type="search" defaultValue={q} placeholder="Search by name…" className={`${inputClass} h-10`} />
        <button className="h-10 bg-ink px-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-ivory">Search</button>
      </form>
      <div className="overflow-x-auto border border-line">
        <table className="w-full min-w-[760px] text-left text-[14px]">
          <thead className="bg-beige text-[11px] uppercase tracking-[0.14em] text-muted">
            <tr>
              <th className="p-3">Product</th><th className="p-3">Category / brand</th><th className="p-3">Price</th>
<th className="p-3">Photos</th><th className="p-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {(products ?? []).map((p) => {
              const variants = (p.variants ?? []).filter((v) => v.is_active);
              const prices = variants.map((v) => v.sale_price_paise ?? v.price_paise).filter((n): n is number => n != null);
              const lowest = prices.length ? Math.min(...prices) : null;
              const photos = (p.product_images as unknown as { count: number }[])[0]?.count ?? 0;
              return (
                <tr key={p.id} className="hover:bg-white">
                  <td className="p-3">
                    <Link href={`/admin/products/${p.id}`} className="text-ink hover:text-accent-deep">{p.name}</Link>
                    <span className="block text-[12px] text-muted">{variants.length} option{variants.length === 1 ? "" : "s"}</span>
                  </td>
                  <td className="p-3 text-muted">
                    {(p.category as unknown as { name: string } | null)?.name}
                    <span className="block text-[12px]">{(p.brand as unknown as { name: string } | null)?.name ?? "—"}</span>
                  </td>
                  <td className="p-3">{lowest != null ? formatINR(lowest) : <span className="text-muted">On request</span>}</td>
                  <td className="p-3">{photos || <span className="text-muted">0</span>}</td>
                  <td className="space-x-1 p-3">
                    {p.is_active ? <Pill tone="good">Visible</Pill> : <Pill>Hidden</Pill>}
                    {p.is_featured && <Pill tone="gold">Featured</Pill>}
                    {p.is_sample && <Pill tone="warn">Sample</Pill>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {!products?.length && <p className="p-6 text-muted">No products found.</p>}
      </div>
    </>
  );
}
