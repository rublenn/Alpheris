import Link from "next/link";
import { requireAdmin } from "@/lib/admin-auth";
import { adminDb } from "@/lib/supabase";
import { formatINR } from "@/lib/money";
import { ORDER_STATUSES, statusLabel, statusTone, type OrderStatus } from "@/lib/orders";
import { AdminHeader, Pill } from "@/components/admin/ui";
import { dateTime } from "@/components/shop/OrderDetails";

export const metadata = { title: "Orders" };


export default async function AdminOrders({ searchParams }: PageProps<"/admin/orders">) {
  await requireAdmin();
  const sp = await searchParams;
  const status = typeof sp.status === "string" && (ORDER_STATUSES as readonly string[]).includes(sp.status) ? sp.status : "";
  const q = typeof sp.q === "string" ? sp.q.trim().replace(/[%_,()]/g, " ") : "";

  let query = adminDb()
    .from("orders")
    .select("id, order_number, status, customer_name, customer_phone, city, total_paise, created_at")
    .order("created_at", { ascending: false })
    .limit(200);
  if (status) query = query.eq("status", status);
  else query = query.neq("status", "pending_payment"); // hide abandoned checkouts by default
  if (q) query = query.or(`order_number.ilike.%${q}%,customer_name.ilike.%${q}%,customer_phone.ilike.%${q}%`);
  const { data: orders } = await query;

  const tabs = [
    { value: "", label: "All (excl. unpaid)" },
    { value: "paid", label: "New — paid" },
    { value: "processing", label: "Preparing" },
    { value: "shipped", label: "Out for delivery" },
    { value: "delivered", label: "Delivered" },
    { value: "cancelled", label: "Cancelled" },
    { value: "pending_payment", label: "Unpaid / abandoned" },
  ];

  return (
    <>
      <AdminHeader title="Orders" />
      <nav className="mb-5 flex flex-wrap gap-2">
        {tabs.map((t) => (
          <Link
            key={t.value}
            href={t.value ? `/admin/orders?status=${t.value}` : "/admin/orders"}
            className={`border px-3 py-1.5 text-[12px] ${status === t.value ? "border-accent text-ink" : "border-line text-muted hover:text-ink"}`}
          >
            {t.label}
          </Link>
        ))}
      </nav>
      <form className="mb-6 flex max-w-md">
        {status && <input type="hidden" name="status" value={status} />}
        <input name="q" type="search" defaultValue={q} placeholder="Order no., name or phone" className="h-10 w-full border border-line bg-white px-3 text-[14px] outline-none focus:border-accent" />
        <button className="h-10 bg-ink px-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-ivory">Find</button>
      </form>

      <div className="overflow-x-auto border border-line">
        <table className="w-full min-w-[720px] text-left text-[14px]">
          <thead className="bg-beige text-[11px] uppercase tracking-[0.14em] text-muted">
            <tr><th className="p-3">Order</th><th className="p-3">Customer</th><th className="p-3">Total</th><th className="p-3">Status</th><th className="p-3">Placed</th></tr>
          </thead>
          <tbody className="divide-y divide-line">
            {(orders ?? []).map((o) => (
              <tr key={o.id} className="hover:bg-white">
                <td className="p-3"><Link href={`/admin/orders/${o.id}`} className="font-semibold text-ink hover:text-accent-deep">{o.order_number}</Link></td>
                <td className="p-3">{o.customer_name}<span className="block text-[12px] text-muted">{o.customer_phone} · {o.city}</span></td>
                <td className="p-3">{formatINR(o.total_paise)}</td>
                <td className="p-3"><Pill tone={statusTone[o.status as OrderStatus]}>{statusLabel[o.status as OrderStatus]}</Pill></td>
                <td className="p-3 text-muted">{dateTime(o.created_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {!orders?.length && <p className="p-6 text-muted">No orders here.</p>}
      </div>
    </>
  );
}
