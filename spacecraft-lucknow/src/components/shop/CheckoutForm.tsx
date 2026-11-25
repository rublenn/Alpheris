"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { confirmPayment, markPaymentFailed, startCheckout, type CustomerInput } from "@/actions/checkout";
import { formatINR } from "@/lib/money";
import { site, whatsappLink } from "@/lib/site";
import { useCart } from "./CartProvider";
import { useCartLines } from "./useCartLines";
import { EmptyState, inputClass, labelClass } from "./bits";

type RazorpayResponse = { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string };
type RazorpayInstance = { open: () => void; on: (event: string, cb: () => void) => void };
declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => RazorpayInstance;
  }
}

function loadRazorpay(): Promise<boolean> {
  if (window.Razorpay) return Promise.resolve(true);
  return new Promise((resolve) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

const fieldsList: { name: keyof CustomerInput; label: string; type?: string; autoComplete: string; span?: boolean; optional?: boolean; readOnly?: boolean; inputMode?: "numeric" | "tel" | "email" }[] = [
  { name: "name", label: "Full name", autoComplete: "name", span: true },
  { name: "phone", label: "Mobile number", type: "tel", autoComplete: "tel-national", inputMode: "tel" },
  { name: "email", label: "Email", type: "email", autoComplete: "email", inputMode: "email" },
  { name: "address_line1", label: "House / flat no., building, street", autoComplete: "address-line1", span: true },
  { name: "address_line2", label: "Area, landmark", autoComplete: "address-line2", span: true, optional: true },
  { name: "pincode", label: "PIN code (Lucknow)", autoComplete: "postal-code", inputMode: "numeric" },
  { name: "city", label: "City", autoComplete: "address-level2", readOnly: true },
  { name: "state", label: "State", autoComplete: "address-level1", span: true, readOnly: true },
];

const businessFields: typeof fieldsList = [
  { name: "business_name", label: "Business name (as on GST certificate)", autoComplete: "organization", span: true },
  { name: "gstin", label: "GSTIN", autoComplete: "off", span: true },
];

export function CheckoutForm({ deliveryPaise, paymentsEnabled }: { deliveryPaise: number; paymentsEnabled: boolean }) {
  const router = useRouter();
  const { items, clear } = useCart();
  const { lines, subtotal, hasProblems, loading } = useCartLines();
  const [errors, setErrors] = useState<Partial<Record<keyof CustomerInput, string>>>({});
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [testMode, setTestMode] = useState(false);

  if (loading) return <p className="py-10 text-muted">Loading…</p>;
  if (!lines?.length) {
    return (
      <EmptyState title="Your cart is empty.">
        <Link href="/search" className="text-accent-deep underline">Browse products</Link>
      </EmptyState>
    );
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setMessage(null);
    const data = Object.fromEntries(new FormData(e.currentTarget)) as unknown as CustomerInput;

    const result = await startCheckout(items, data).catch(() => null);
    if (!result || !result.ok) {
      setErrors(result && !result.ok ? (result.fields ?? {}) : {});
      setMessage(result && !result.ok ? result.error : "Could not reach the server. Please check your internet and try again.");
      setBusy(false);
      return;
    }
    setErrors({});
    setTestMode(result.payment.testMode);

    if (!(await loadRazorpay()) || !window.Razorpay) {
      setMessage("The payment window could not load. Please check your internet connection and try again.");
      setBusy(false);
      return;
    }

    const p = result.payment;
    const rzp = new window.Razorpay({
      key: p.keyId,
      order_id: p.razorpayOrderId,
      amount: p.amountPaise,
      currency: "INR",
      name: site.fullName,
      description: `Order ${p.orderNumber}`,
      prefill: p.prefill,
      notes: { order_number: p.orderNumber },
      theme: { color: "#c9a06a" },
      handler: async (response: RazorpayResponse) => {
        setMessage("Payment received — confirming your order…");
        const confirmed = await confirmPayment(response).catch(() => null);
        if (confirmed?.ok) {
          clear();
          router.push(`/order/${confirmed.orderNumber}?t=${confirmed.token}`);
        } else {
          setMessage(
            (confirmed && !confirmed.ok ? confirmed.error : "We could not confirm the payment.") +
              ` Your order number is ${p.orderNumber}.`,
          );
          setBusy(false);
        }
      },
      modal: {
        ondismiss: () => {
          markPaymentFailed(p.razorpayOrderId).catch(() => {});
          setMessage("Payment was not completed. You can try again — nothing has been charged.");
          setBusy(false);
        },
      },
    });
    rzp.on("payment.failed", () => {
      setMessage("The payment failed. You can try again with another method in the same window.");
    });
    rzp.open();
  }

  const total = subtotal + deliveryPaise;

  return (
    <form onSubmit={onSubmit} noValidate className="grid gap-12 lg:grid-cols-12">
      <div className="lg:col-span-7">
        <h2 className="display text-[2rem]">Delivery details</h2>
        <div className="mt-8 grid gap-5 sm:grid-cols-2">
          {fieldsList.map((f) => (
            <div key={f.name} className={f.span ? "sm:col-span-2" : ""}>
              <label htmlFor={f.name} className={labelClass}>
                {f.label} {f.optional && <span className="normal-case tracking-normal">(optional)</span>}
              </label>
              <input
                id={f.name}
                name={f.name}
                type={f.type ?? "text"}
                autoComplete={f.autoComplete}
                inputMode={f.inputMode}
                required={!f.optional}
                readOnly={f.readOnly}
                defaultValue={f.name === "city" ? "Lucknow" : f.name === "state" ? "Uttar Pradesh" : undefined}
                aria-invalid={Boolean(errors[f.name])}
                aria-describedby={errors[f.name] ? `${f.name}-error` : undefined}
                className={`${inputClass} ${errors[f.name] ? "border-red-400" : ""} ${f.readOnly ? "cursor-not-allowed text-muted" : ""}`}
              />
              {errors[f.name] && <p id={`${f.name}-error`} className="mt-2 text-[12px] text-red-300">{errors[f.name]}</p>}
            </div>
          ))}
          <div className="sm:col-span-2">
            <label htmlFor="notes" className={labelClass}>
              Notes for the team <span className="normal-case tracking-normal">(optional)</span>
            </label>
            <textarea id="notes" name="notes" rows={3} maxLength={500} className={`${inputClass} h-auto py-3`} />
          </div>
        </div>
        <p className="mt-4 text-[13px] text-muted">
          We deliver only inside Lucknow, through {site.deliveryPartner}. The delivery charge is set by {site.deliveryPartner} by
          distance and vehicle, and is paid separately — our team confirms it with you before dispatch.
        </p>

        <details className="mt-8 border border-line p-5" open={Boolean(errors.gstin || errors.business_name)}>
          <summary className="cursor-pointer text-[13px] font-semibold text-ink">
            Buying for a business? Add your GSTIN for a GST invoice <span className="font-normal text-muted">(optional)</span>
          </summary>
          <div className="mt-5 grid gap-5">
            {businessFields.map((f) => (
              <div key={f.name}>
                <label htmlFor={f.name} className={labelClass}>{f.label}</label>
                <input
                  id={f.name}
                  name={f.name}
                  autoComplete={f.autoComplete}
                  maxLength={f.name === "gstin" ? 15 : 120}
                  aria-invalid={Boolean(errors[f.name])}
                  aria-describedby={errors[f.name] ? `${f.name}-error` : undefined}
                  className={`${inputClass} ${f.name === "gstin" ? "uppercase" : ""} ${errors[f.name] ? "border-red-400" : ""}`}
                />
                {errors[f.name] && <p id={`${f.name}-error`} className="mt-2 text-[12px] text-red-300">{errors[f.name]}</p>}
              </div>
            ))}
          </div>
        </details>
      </div>

      <aside className="lg:col-span-5">
        <div className="sticky top-[96px] border border-line bg-white p-6 sm:p-8">
          <h2 className="display text-[2rem]">Your order</h2>
          <ul className="mt-6 divide-y divide-line border-y border-line text-[14px]">
            {lines.map((l) => (
              <li key={l.variantId} className="flex justify-between gap-4 py-3">
                <span className="min-w-0">
                  <span className="text-ink">{l.productName}</span>
                  <span className="block text-[12px] text-muted">{l.variantLabel} × {l.quantity}</span>
                  {l.problem && <span className="block text-[12px] text-red-300">{l.problem}</span>}
                </span>
                <span className="shrink-0">{l.unitPricePaise != null ? formatINR(l.unitPricePaise * l.quantity) : "—"}</span>
              </li>
            ))}
          </ul>
          <dl className="mt-4 space-y-2 text-[14px]">
            <div className="flex justify-between"><dt className="text-muted">Subtotal</dt><dd>{formatINR(subtotal)}</dd></div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted">Delivery ({site.deliveryPartner})</dt>
              <dd className="text-right">{deliveryPaise ? formatINR(deliveryPaise) : <span className="text-muted">Paid separately</span>}</dd>
            </div>
            <div className="flex justify-between border-t border-line pt-3 text-[17px]"><dt>Total <span className="text-[12px] text-muted">(incl. GST)</span></dt><dd>{formatINR(total)}</dd></div>
          </dl>

          {message && (
            <p role="alert" className="mt-6 border border-accent/40 bg-ivory p-4 text-[13px] leading-relaxed text-ink">{message}</p>
          )}

          {!paymentsEnabled ? (
            <>
              <p className="mt-6 text-[13px] leading-relaxed text-muted">
                Online payment is not switched on yet. Send your order on WhatsApp and the team will confirm it with you.
              </p>
              <a
                href={whatsappLink(
                  `Hello Space Craft, I would like to order:\n${lines
                    .map((l) => `• ${l.productName} (${l.variantLabel}, SKU ${l.sku}) × ${l.quantity}`)
                    .join("\n")}`,
                )}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 flex h-12 w-full items-center justify-center bg-accent text-[12px] font-semibold uppercase tracking-[0.2em] text-ivory transition-colors hover:bg-accent-deep"
              >
                Send order on WhatsApp
              </a>
            </>
          ) : (
            <button
              type="submit"
              disabled={busy || hasProblems}
              className="mt-6 flex h-12 w-full items-center justify-center bg-accent text-[12px] font-semibold uppercase tracking-[0.2em] text-ivory transition-colors hover:bg-accent-deep disabled:cursor-not-allowed disabled:opacity-50"
            >
              {busy ? "Please wait…" : `Pay ${formatINR(total)}`}
            </button>
          )}
          {hasProblems && <p className="mt-3 text-[12px] text-red-300"><Link href="/cart" className="underline">Go back to the cart</Link> to fix the marked items.</p>}
          {paymentsEnabled && (
            <p className="mt-4 text-[12px] leading-relaxed text-muted">
              By paying you agree to our <Link href="/legal/terms" className="underline">Terms</Link> and{" "}
              <Link href="/legal/returns" className="underline">Return &amp; Refund Policy</Link>.
            </p>
          )}
          {paymentsEnabled && (
            <p className="mt-2 text-[12px] leading-relaxed text-muted">
              Payments are processed securely by Razorpay (UPI, cards, net banking). We never see your card details.
              {testMode && " TEST MODE: no real money is charged."}
            </p>
          )}
        </div>
      </aside>
    </form>
  );
}
