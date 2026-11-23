import { formatINR } from "@/lib/money";
import type { OrderStatus } from "@/lib/orders";

/** Plain data (safe to pass to the browser) for showing one order to its customer. */
export type PublicOrder = {
  orderNumber: string;
  status: OrderStatus;
  statusText: string;
  createdAt: string;
  customerName: string;
  address: string[];
  subtotalPaise: number;
  shippingPaise: number;
  totalPaise: number;
  items: { id: string; productName: string; variantLabel: string; quantity: number; lineTotalPaise: number }[];
  history: { status: string; label: string; note: string | null; createdAt: string }[];
};

const STEPS: { status: OrderStatus; label: string }[] = [
  { status: "paid", label: "Order received" },
  { status: "processing", label: "Being prepared" },
  { status: "shipped", label: "Out for delivery" },
  { status: "delivered", label: "Delivered" },
];

export const dateTime = (iso: string) =>
  new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Kolkata" }).format(new Date(iso));

export function OrderDetails({ order, showAddress = true }: { order: PublicOrder; showAddress?: boolean }) {
  const reached = STEPS.findIndex((s) => s.status === order.status);
  const off = order.status === "cancelled" || order.status === "pending_payment" || order.status === "payment_failed";

  return (
    <div className="grid gap-12 lg:grid-cols-12">
      <div className="lg:col-span-7">
        <p className="eyebrow">Status</p>
        <p className="display mt-3 text-[2.2rem]">{order.statusText}</p>

        {!off && (
          <ol className="mt-8 grid grid-cols-4 gap-2" aria-label="Order progress">
            {STEPS.map((s, i) => (
              <li key={s.status}>
                <span className={`block h-[3px] ${i <= reached ? "bg-accent" : "bg-line"}`} />
                <span className={`mt-3 block text-[11px] font-semibold uppercase tracking-[0.14em] ${i <= reached ? "text-ink" : "text-muted"}`}>
                  {s.label}
                </span>
              </li>
            ))}
          </ol>
        )}

        <h2 className="mt-12 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted">Updates</h2>
        <ol className="mt-4 border-l border-line pl-6">
          {[...order.history].reverse().map((h, i) => (
            <li key={i} className="relative pb-5">
              <span className="absolute -left-[29px] top-1.5 h-2 w-2 rounded-full bg-accent" />
              <p className="text-[14px] text-ink">{h.label}</p>
              {h.note && <p className="text-[13px] text-muted">{h.note}</p>}
              <p className="text-[12px] text-muted">{dateTime(h.createdAt)}</p>
            </li>
          ))}
        </ol>
      </div>

      <aside className="lg:col-span-5">
        <div className="border border-line bg-white p-6 sm:p-8">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted">Order</p>
          <p className="display mt-1 text-[2rem]">{order.orderNumber}</p>
          <p className="text-[12px] text-muted">Placed {dateTime(order.createdAt)}</p>
          <ul className="mt-6 divide-y divide-line border-y border-line text-[14px]">
            {order.items.map((i) => (
              <li key={i.id} className="flex justify-between gap-4 py-3">
                <span>
                  {i.productName}
                  <span className="block text-[12px] text-muted">{i.variantLabel} × {i.quantity}</span>
                </span>
                <span className="shrink-0">{formatINR(i.lineTotalPaise)}</span>
              </li>
            ))}
          </ul>
          <dl className="mt-4 space-y-2 text-[14px]">
            <div className="flex justify-between"><dt className="text-muted">Subtotal</dt><dd>{formatINR(order.subtotalPaise)}</dd></div>
            <div className="flex justify-between"><dt className="text-muted">Delivery</dt><dd>{formatINR(order.shippingPaise)}</dd></div>
            <div className="flex justify-between border-t border-line pt-3 text-[17px]"><dt>Total</dt><dd>{formatINR(order.totalPaise)}</dd></div>
          </dl>
          {showAddress && (
            <div className="mt-6 border-t border-line pt-4 text-[14px] leading-relaxed">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted">Delivering to</p>
              <p className="mt-2 text-ink">{order.customerName}</p>
              {order.address.map((line) => <p key={line} className="text-muted">{line}</p>)}
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}
