import type { OrderView } from "@/lib/orders";
import { site } from "@/lib/site";
import { amount, rupeesInWords, splitInclusive, sumLines } from "@/lib/gst";
import { PrintButton } from "./PrintButton";

const date = (iso: string) =>
  new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeZone: "Asia/Kolkata" }).format(new Date(iso));

/**
 * GST tax invoice for a paid order. Printed or saved as PDF from the browser.
 * Light colours on purpose, so it prints well.
 */
export function Invoice({ order }: { order: OrderView }) {
  const lines = order.items.map((i) => ({ item: i, gst: splitInclusive(i.lineTotalPaise, i.gstRate) }));
  const totals = sumLines(lines.map((l) => l.gst));
  const th = "border border-neutral-300 px-2 py-1.5 text-left font-semibold";
  const td = "border border-neutral-300 px-2 py-1.5 align-top";

  return (
    <div style={{ colorScheme: "light" }} className="min-h-screen bg-neutral-100 py-8 text-[13px] text-neutral-900 print:bg-[#ffffff] print:py-0">
      <div className="mx-auto mb-4 flex max-w-[900px] justify-end px-4 print:hidden">
        <PrintButton />
      </div>
      <article className="mx-auto max-w-[900px] bg-[#ffffff] p-8 shadow print:max-w-none print:p-0 print:shadow-none">
        <header className="flex flex-wrap items-start justify-between gap-6 border-b-2 border-neutral-800 pb-4">
          <div>
            <p className="text-[20px] font-bold">{site.legalName}</p>
            <p className="text-neutral-600">Trading as {site.fullName}</p>
            <p className="mt-1 max-w-sm">{site.address}</p>
            <p>GSTIN: <strong>{site.gstin}</strong> · State: {site.stateName} ({site.stateCode})</p>
            <p>{site.phoneDisplay} · {site.email}</p>
          </div>
          <div className="text-right">
            <p className="text-[22px] font-bold tracking-wide">TAX INVOICE</p>
            <p>Invoice no.: <strong>{order.invoiceNumber}</strong></p>
            <p>Invoice date: {order.invoiceDate ? date(order.invoiceDate) : "—"}</p>
            <p>Order no.: {order.orderNumber}</p>
          </div>
        </header>

        <section className="grid gap-6 border-b border-neutral-300 py-4 sm:grid-cols-2">
          <div>
            <p className="font-semibold uppercase tracking-wide text-neutral-500">Bill to / Ship to</p>
            {order.customerBusinessName && <p className="font-semibold">{order.customerBusinessName}</p>}
            <p>{order.customerName}</p>
            {order.address.map((l) => <p key={l}>{l}</p>)}
            <p>Phone: +91 {order.customerPhone}</p>
            {order.customerGstin && <p>GSTIN: <strong>{order.customerGstin}</strong></p>}
          </div>
          <div className="sm:text-right">
            <p>Place of supply: {site.stateName} ({site.stateCode})</p>
            <p>Reverse charge: No</p>
            <p>Payment: Online (Razorpay)</p>
            {order.razorpayPaymentId && <p className="break-all">Payment ID: {order.razorpayPaymentId}</p>}
          </div>
        </section>

        <div className="overflow-x-auto py-4">
          <table className="w-full min-w-[720px] border-collapse">
            <thead className="bg-neutral-100">
              <tr>
                <th className={th}>#</th>
                <th className={th}>Description</th>
                <th className={th}>HSN</th>
                <th className={`${th} text-right`}>Qty</th>
                <th className={`${th} text-right`}>Rate (incl. GST)</th>
                <th className={`${th} text-right`}>Taxable value</th>
                <th className={`${th} text-right`}>CGST</th>
                <th className={`${th} text-right`}>SGST</th>
                <th className={`${th} text-right`}>Amount</th>
              </tr>
            </thead>
            <tbody>
              {lines.map(({ item, gst }, n) => (
                <tr key={item.id}>
                  <td className={td}>{n + 1}</td>
                  <td className={td}>
                    {item.productName}
                    <span className="block text-neutral-500">{item.variantLabel} · {item.sku}</span>
                  </td>
                  <td className={td}>{item.hsnCode ?? "—"}</td>
                  <td className={`${td} text-right`}>{item.quantity}</td>
                  <td className={`${td} text-right`}>{amount(item.unitPricePaise)}</td>
                  <td className={`${td} text-right`}>{amount(gst.taxablePaise)}</td>
                  <td className={`${td} text-right`}>{amount(gst.cgstPaise)}<span className="block text-neutral-500">@{gst.rate / 2}%</span></td>
                  <td className={`${td} text-right`}>{amount(gst.sgstPaise)}<span className="block text-neutral-500">@{gst.rate / 2}%</span></td>
                  <td className={`${td} text-right`}>{amount(gst.grossPaise)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot className="font-semibold">
              <tr>
                <td className={td} colSpan={5}>Total</td>
                <td className={`${td} text-right`}>{amount(totals.taxablePaise)}</td>
                <td className={`${td} text-right`}>{amount(totals.cgstPaise)}</td>
                <td className={`${td} text-right`}>{amount(totals.sgstPaise)}</td>
                <td className={`${td} text-right`}>{amount(totals.grossPaise)}</td>
              </tr>
            </tfoot>
          </table>
        </div>

        <section className="grid gap-4 sm:grid-cols-[1fr_280px]">
          <p>
            <span className="font-semibold">Amount in words:</span> {rupeesInWords(totals.grossPaise)}
          </p>
          <dl className="space-y-1">
            <div className="flex justify-between"><dt>Taxable value</dt><dd>₹{amount(totals.taxablePaise)}</dd></div>
            <div className="flex justify-between"><dt>CGST</dt><dd>₹{amount(totals.cgstPaise)}</dd></div>
            <div className="flex justify-between"><dt>SGST</dt><dd>₹{amount(totals.sgstPaise)}</dd></div>
            <div className="flex justify-between border-t border-neutral-800 pt-1 text-[15px] font-bold"><dt>Invoice total</dt><dd>₹{amount(totals.grossPaise)}</dd></div>
          </dl>
        </section>

        <footer className="mt-8 flex flex-wrap items-end justify-between gap-6 border-t border-neutral-300 pt-4 text-neutral-600">
          <div className="max-w-md space-y-1">
            <p>Delivery is by {site.deliveryPartner}; its charge is not part of this invoice.</p>
            <p>This is a computer-generated invoice.</p>
          </div>
          <div className="text-right">
            <p>For {site.legalName}</p>
            <p className="mt-10">Authorised signatory</p>
          </div>
        </footer>
      </article>
    </div>
  );
}
