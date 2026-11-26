import Link from "next/link";
import { requireAdmin } from "@/lib/admin-auth";
import { adminDb } from "@/lib/supabase";
import { formatINR } from "@/lib/money";
import { statusLabel, type OrderStatus } from "@/lib/orders";
import { isRazorpayConfigured, isTestMode } from "@/lib/razorpay";
import { AdminHeader, Pill, card } from "@/components/admin/ui";
import { dateTime } from "@/components/shop/OrderDetails";

export const metadata = { title: "Dashboard" };

export default async function AdminHome() {
  const admin = await requireAdmin();
  const db = adminDb();
  const [products, toShip, recent] = await Promise.all([
    db.from("products").select("id", { count: "exact", head: true }),
    db.from("orders").select("id", { count: "exact", head: true }).in("status", ["paid", "processing"]),
    db.from("orders").select("id, order_number, status, customer_name, total_paise, created_at").order("created_at", { ascending: false }).limit(8),
  ]);

  return (
    <>
      <AdminHeader title="Dashboard">
        <span className="text-[13px] text-muted">Logged in as {admin.email}</span>
      </AdminHeader>

      {!isRazorpayConfigured() ? (
        <p className="mb-8 border border-amber-400/40 p-4 text-[14px] text-amber-200">
          Online payment is OFF: Razorpay keys are not set. Customers can add to cart but cannot pay yet.
        </p>
      ) : isTestMode() ? (
        <p className="mb-8 border border-accent/40 p-4 text-[14px] text-accent-deep">
          Razorpay is in TEST mode — payments are not real. Switch to live keys before launch.
        </p>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <Stat label="Orders to prepare / ship" value={toShip.count ?? 0} href="/admin/orders?status=paid" />
        <Stat label="Products" value={products.count ?? 0} href="/admin/products" />
      </div>

      <div className="mt-10 grid gap-8">
        <section className={card}>
          <h2 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted">Latest orders</h2>
          {recent.data?.length ? (
            <ul className="mt-4 divide-y divide-line">
              {recent.data.map((o) => (
                <li key={o.id}>
                  <Link href={`/admin/orders/${o.id}`} className="flex flex-wrap items-center justify-between gap-3 py-3 hover:text-accent-deep">
                    <span>
                      <span className="font-semibold">{o.order_number}</span> · {o.customer_name}
                      <span className="block text-[12px] text-muted">{dateTime(o.created_at)}</span>
                    </span>
                    <span className="text-right">
                      {formatINR(o.total_paise)}
                      <span className="block"><Pill>{statusLabel[o.status as OrderStatus]}</Pill></span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-4 text-[14px] text-muted">No orders yet.</p>
          )}
        </section>

      </div>
    </>
  );
}

function Stat({ label, value, href }: { label: string; value: number; href: string }) {
  return (
    <Link href={href} className={`${card} block transition-colors hover:border-accent/50`}>
      <p className="display text-[3rem] leading-none">{value}</p>
      <p className="mt-3 text-[12px] uppercase tracking-[0.14em] text-muted">{label}</p>
    </Link>
  );
}
