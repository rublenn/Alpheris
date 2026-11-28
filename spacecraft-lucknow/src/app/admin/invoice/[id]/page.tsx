import { Suspense } from "react";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/admin-auth";
import { getOrderById } from "@/lib/orders";
import { Invoice } from "@/components/shop/Invoice";

export const metadata = { title: "Invoice" };

export default function AdminInvoicePage(props: PageProps<"/admin/invoice/[id]">) {
  return (
    <Suspense fallback={<p className="p-8">Loading invoice…</p>}>
      <Content {...props} />
    </Suspense>
  );
}

async function Content({ params }: PageProps<"/admin/invoice/[id]">) {
  await requireAdmin();
  const order = await getOrderById((await params).id);
  if (!order) notFound();
  if (!order.invoiceNumber) return <p className="p-8">No invoice yet — this order has not been paid.</p>;
  return <Invoice order={order} />;
}
