import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { getOrderWithToken, toPublicOrder } from "@/lib/orders";
import { OrderDetails } from "@/components/shop/OrderDetails";
import { EmptyState, PageIntro } from "@/components/shop/bits";
import { site } from "@/lib/site";

export const metadata: Metadata = { title: "Your order", robots: { index: false } };

export default function OrderPage({ params, searchParams }: PageProps<"/order/[number]">) {
  return (
    <Suspense fallback={<PageIntro title="Loading your order…" />}>
      <Content params={params} searchParams={searchParams} />
    </Suspense>
  );
}

async function Content({ params, searchParams }: Pick<PageProps<"/order/[number]">, "params" | "searchParams">) {
  const { number } = await params;
  const t = (await searchParams).t;
  const order = await getOrderWithToken(number, typeof t === "string" ? t : "");

  if (!order) {
    return (
      <>
        <PageIntro title="Order not found" />
        <section className="shell py-12">
          <EmptyState title="We could not open this order.">
            The link may be incomplete. You can <Link href="/track" className="text-accent-deep underline">track it here</Link> with
            your order number and mobile number.
          </EmptyState>
        </section>
      </>
    );
  }

  const paid = !["pending_payment", "payment_failed", "cancelled"].includes(order.status);
  return (
    <>
      <PageIntro eyebrow={paid ? "Thank you" : "Order"} title={paid ? <>Your order is <em>confirmed.</em></> : `Order ${order.orderNumber}`}>
        {paid ? (
          <>
            Thank you, {order.customerName.split(" ")[0]}. We have received your payment. The Space Craft team will call you on{" "}
            {order.customerPhone} to arrange delivery. Save this page, or track the order any time at{" "}
            <Link href="/track" className="text-accent-deep underline">/track</Link> with order number <strong className="text-ink">{order.orderNumber}</strong>.
          </>
        ) : (
          <>This order has not been paid. If money was deducted, please call {site.phoneDisplay} with the order number.</>
        )}
      </PageIntro>
      <section className="shell py-12 lg:py-16">
        {order.invoiceNumber && (
          <p className="mb-10">
            <a
              href={`/invoice/${order.orderNumber}?t=${typeof t === "string" ? t : ""}`}
              target="_blank"
              className="inline-flex h-11 items-center border border-accent/60 px-5 text-[11px] font-semibold uppercase tracking-[0.18em] text-accent-deep hover:bg-accent/10"
            >
              GST invoice {order.invoiceNumber} ↗
            </a>
          </p>
        )}
        <OrderDetails order={toPublicOrder(order)} />
      </section>
    </>
  );
}
