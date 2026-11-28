import type { Metadata } from "next";
import { Suspense } from "react";
import { getOrderWithToken } from "@/lib/orders";
import { Invoice } from "@/components/shop/Invoice";

export const metadata: Metadata = { title: "Invoice", robots: { index: false, follow: false } };

/** Customer's GST invoice. Needs the private token from the order link. */
export default function InvoicePage(props: PageProps<"/invoice/[number]">) {
  return (
    <Suspense fallback={<p className="p-8">Loading invoice…</p>}>
      <Content {...props} />
    </Suspense>
  );
}

async function Content({ params, searchParams }: PageProps<"/invoice/[number]">) {
  const { number } = await params;
  const { t } = await searchParams;
  const order = await getOrderWithToken(number, typeof t === "string" ? t : "");
  if (!order || !order.invoiceNumber) {
    return <p className="p-8 text-ink">Invoice not available. It is created once the payment is received.</p>;
  }
  return <Invoice order={order} />;
}
