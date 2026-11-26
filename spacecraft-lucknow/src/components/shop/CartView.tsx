"use client";

import Link from "next/link";
import { formatINR } from "@/lib/money";
import { Button } from "@/components/ui/Button";
import { useCart } from "./CartProvider";
import { useCartLines } from "./useCartLines";
import { EmptyState, ProductVisual } from "./bits";

export function CartView() {
  const { setQuantity, remove } = useCart();
  const { lines, subtotal, hasProblems, loading } = useCartLines();

  if (loading) return <p className="py-10 text-muted">Loading your cart…</p>;
  if (!lines?.length) {
    return (
      <EmptyState title="Your cart is empty.">
        <p>Browse the collection and add the materials you need.</p>
        <div className="mt-8 flex justify-center">
          <Button href="/search">Browse products</Button>
        </div>
      </EmptyState>
    );
  }

  return (
    <div className="grid gap-12 lg:grid-cols-12">
      <ul className="border-t border-line lg:col-span-8">
        {lines.map((l) => (
          <li key={l.variantId} className="flex gap-4 border-b border-line py-6 sm:gap-6">
            <div className="h-28 w-24 shrink-0 overflow-hidden bg-beige">
              <ProductVisual image={l.image ? { url: l.image } : null} swatch={l.swatch} alt={l.productName} />
            </div>
            <div className="flex min-w-0 flex-1 flex-col">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  {l.productSlug ? (
                    <Link href={`/products/${l.productSlug}`} className="display text-[1.4rem] leading-tight hover:text-accent-deep">
                      {l.productName}
                    </Link>
                  ) : (
                    <p className="display text-[1.4rem] leading-tight">{l.productName}</p>
                  )}
                  {l.variantLabel && <p className="mt-1 text-[13px] text-muted">{l.variantLabel} · SKU {l.sku}</p>}
                  {l.unitPricePaise != null && (
                    <p className="text-[12px] text-muted">{formatINR(l.unitPricePaise)}{l.priceUnit ? ` per ${l.priceUnit}` : " each"} × {l.quantity}</p>
                  )}
                </div>
                <p className="text-[15px] text-ink">
                  {l.unitPricePaise != null ? formatINR(l.unitPricePaise * l.quantity) : "—"}
                </p>
              </div>
              {l.problem && <p className="mt-2 text-[13px] text-red-300">{l.problem}</p>}
              <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-4">
                <div className="flex h-10 items-stretch border border-line">
                  <button type="button" aria-label={`One less ${l.productName}`} onClick={() => setQuantity(l.variantId, l.quantity - 1)} className="w-10 text-ink hover:bg-white">−</button>
                  <span aria-live="polite" className="flex w-10 items-center justify-center text-[14px]">{l.quantity}</span>
                  <button
                    type="button"
                    aria-label={`One more ${l.productName}`}
                    onClick={() => setQuantity(l.variantId, l.quantity + 1)}
                    className="w-10 text-ink hover:bg-white disabled:opacity-30"
                  >
                    +
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => remove(l.variantId)}
                  className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted hover:text-ink"
                >
                  Remove
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>

      <aside className="lg:col-span-4">
        <div className="sticky top-[96px] border border-line bg-white p-6 sm:p-8">
          <h2 className="display text-[2rem]">Summary</h2>
          <dl className="mt-6 space-y-3 text-[14px]">
            <div className="flex justify-between">
              <dt className="text-muted">Subtotal <span className="text-[12px]">(incl. GST)</span></dt>
              <dd>{formatINR(subtotal)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted">Delivery (Porter)</dt>
              <dd className="text-muted">Paid separately</dd>
            </div>
          </dl>
          {hasProblems && (
            <p className="mt-6 text-[13px] text-red-300">Please fix the items marked above before checking out.</p>
          )}
          {hasProblems ? (
            <span className="mt-6 flex h-12 cursor-not-allowed items-center justify-center bg-line text-[12px] font-semibold uppercase tracking-[0.2em] text-muted">
              Checkout
            </span>
          ) : (
            <Link
              href="/checkout"
              className="mt-6 flex h-12 items-center justify-center bg-accent text-[12px] font-semibold uppercase tracking-[0.2em] text-ivory transition-colors hover:bg-accent-deep"
            >
              Checkout
            </Link>
          )}
          <Link href="/search" className="mt-4 block text-center text-[11px] font-semibold uppercase tracking-[0.18em] text-muted hover:text-ink">
            Continue shopping
          </Link>
        </div>
      </aside>
    </div>
  );
}
