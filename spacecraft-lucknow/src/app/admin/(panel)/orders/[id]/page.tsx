import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/admin-auth";
import { getOrderById, ORDER_STATUSES, statusLabel, statusTone } from "@/lib/orders";
import { formatINR } from "@/lib/money";
import { updateOrderStatus } from "@/actions/admin";
import { AdminForm } from "@/components/admin/AdminForm";
import { AdminHeader, Pill, card, inputClass, labelClass } from "@/components/admin/ui";
import { dateTime } from "@/components/shop/OrderDetails";

export default async function AdminOrder({ params }: PageProps<"/admin/orders/[id]">) {
  await requireAdmin();
  const order = await getOrderById((await params).id);
  if (!order) notFound();
  const phone = `+91${order.customerPhone}`;

  return (
    <>
      <AdminHeader title={`Order ${order.orderNumber}`} back={{ href: "/admin/orders", label: "Orders" }}>
        <Pill tone={statusTone[order.status]}>{statusLabel[order.status]}</Pill>
        {order.invoiceNumber && (
          <a href={`/admin/invoice/${order.id}`} target="_blank" className="text-[12px] font-semibold text-accent-deep hover:underline">
            Invoice {order.invoiceNumber} ↗
          </a>
        )}
      </AdminHeader>

      <div className="grid gap-8 xl:grid-cols-[1fr_400px]">
        <div className="space-y-8">
          <section className={card}>
            <h2 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted">Items</h2>
            <table className="mt-3 w-full text-left text-[14px]">
              <tbody className="divide-y divide-line">
                {order.items.map((i) => (
                  <tr key={i.id}>
                    <td className="py-3">{i.productName}<span className="block text-[12px] text-muted">{i.variantLabel} · {i.sku}</span></td>
                    <td className="py-3 text-muted">{formatINR(i.unitPricePaise)} × {i.quantity}</td>
                    <td className="py-3 text-right">{formatINR(i.lineTotalPaise)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <dl className="mt-4 space-y-1 border-t border-line pt-4 text-[14px]">
              <div className="flex justify-between"><dt className="text-muted">Subtotal</dt><dd>{formatINR(order.subtotalPaise)}</dd></div>
              <div className="flex justify-between"><dt className="text-muted">Delivery (Porter)</dt><dd>{order.shippingPaise ? formatINR(order.shippingPaise) : "Paid separately"}</dd></div>
              <div className="flex justify-between text-[16px]"><dt>Total</dt><dd>{formatINR(order.totalPaise)}</dd></div>
            </dl>
          </section>

          <section className={card}>
            <h2 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted">Customer & delivery address</h2>
            {order.customerBusinessName && <p className="mt-3 text-[15px] font-semibold">{order.customerBusinessName}</p>}
            {order.customerGstin && <p className="text-[13px] text-accent-deep">GSTIN {order.customerGstin}</p>}
            <p className="mt-3 text-[15px]">{order.customerName}</p>
            <p className="text-[14px]"><a href={`tel:${phone}`} className="text-accent-deep">{phone}</a> · <a href={`mailto:${order.customerEmail}`} className="text-accent-deep">{order.customerEmail}</a></p>
            <address className="mt-3 text-[14px] not-italic leading-relaxed text-muted">{order.address.map((l) => <span key={l} className="block">{l}</span>)}</address>
            {order.notes && <p className="mt-3 border-l-2 border-accent pl-3 text-[14px]">“{order.notes}”</p>}
            <a
              href={`https://wa.me/91${order.customerPhone}?text=${encodeURIComponent(`Hello ${order.customerName.split(" ")[0]}, this is Space Craft Lucknow about your order ${order.orderNumber}.`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-block text-[11px] font-semibold uppercase tracking-[0.18em] text-accent-deep"
            >
              Message on WhatsApp ↗
            </a>
          </section>

          <section className={card}>
            <h2 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted">Payment</h2>
            <dl className="mt-3 grid grid-cols-[160px_1fr] gap-y-1 text-[13px]">
              <dt className="text-muted">Placed</dt><dd>{dateTime(order.createdAt)}</dd>
              <dt className="text-muted">Paid</dt><dd>{order.paidAt ? dateTime(order.paidAt) : "—"}</dd>
              <dt className="text-muted">Razorpay order</dt><dd className="break-all">{order.razorpayOrderId ?? "—"}</dd>
              <dt className="text-muted">Razorpay payment</dt><dd className="break-all">{order.razorpayPaymentId ?? "—"}</dd>
            </dl>
            <p className="mt-3 text-[12px] text-muted">Refunds are made from the Razorpay Dashboard (search the payment ID).</p>
          </section>
        </div>

        <div className="space-y-8">
          <section className={card}>
            <h2 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted">Change status</h2>
            {order.status === "cancelled" ? (
              <p className="mt-3 text-[14px] text-muted">This order is cancelled and can no longer be changed.</p>
            ) : (
              <AdminForm action={updateOrderStatus} submitLabel="Update status" className="mt-4 space-y-4">
                <input type="hidden" name="id" value={order.id} />
                <div>
                  <label htmlFor="status" className={labelClass}>New status</label>
                  <select id="status" name="status" defaultValue={order.status} className={`${inputClass} h-11`}>
                    {ORDER_STATUSES.map((s) => <option key={s} value={s}>{statusLabel[s]}</option>)}
                  </select>
                </div>
                <div>
                  <label htmlFor="note" className={labelClass}>Note (optional, customer can see it)</label>
                  <input id="note" name="note" maxLength={200} placeholder="e.g. Delivery on Saturday morning" className={`${inputClass} h-11`} />
                </div>
                <p className="text-[12px] text-muted">Cancelling a paid order puts its stock back. Refund the money separately in Razorpay.</p>
              </AdminForm>
            )}
          </section>

          <section className={card}>
            <h2 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted">History</h2>
            <ol className="mt-3 space-y-3 text-[13px]">
              {[...order.history].reverse().map((h, i) => (
                <li key={i}>
                  <span className="text-ink">{statusLabel[h.status as keyof typeof statusLabel] ?? h.status}</span>
                  {h.note && <span className="text-muted"> — {h.note}</span>}
                  <span className="block text-[12px] text-muted">{dateTime(h.createdAt)}</span>
                </li>
              ))}
            </ol>
          </section>
        </div>
      </div>
    </>
  );
}
