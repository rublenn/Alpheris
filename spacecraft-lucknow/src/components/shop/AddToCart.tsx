"use client";

import Link from "next/link";
import { useState } from "react";
import { variantAvailability, type ShopVariant } from "@/lib/shop-types";
import { whatsappLink } from "@/lib/site";
import { Arrow } from "@/components/ui/Button";
import { useCart } from "./CartProvider";
import { useSelectedVariant } from "./VariantContext";
import { AvailabilityBadge, Price } from "./bits";

/** Pick a variant + quantity and add it to the cart. Unpriced variants show "Enquire". */
export function AddToCart({ productName, variants }: { productName: string; variants: ShopVariant[] }) {
  const { add } = useCart();
  const { selected: variantId, select: setVariantId } = useSelectedVariant();
  const withPhotos = variants.some((v) => v.imageUrl);
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  const variant = variants.find((v) => v.id === variantId) ?? variants[0];
  const availability = variantAvailability(variant);
  const buyable = availability === "in-stock" || availability === "low-stock";
  const maxQty = Math.min(variant.stock, 999);

  function onAdd() {
    add(variant.id, Math.min(quantity, maxQty));
    setAdded(true);
  }

  const details = [variant.colour && `Colour: ${variant.colour}`, variant.finish && `Finish: ${variant.finish}`, variant.dimensions && `Size: ${variant.dimensions}`]
    .filter(Boolean)
    .join(" · ");

  return (
    <div>
      <p className="text-[2rem] leading-none">
        <Price paise={variant.pricePaise} salePaise={variant.salePricePaise} />
      </p>
      {variant.pricePaise != null && <p className="mt-2 text-[12px] text-muted">Price includes GST</p>}
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <AvailabilityBadge value={availability} />
        <span className="text-[12px] text-muted">SKU {variant.sku}</span>
      </div>

      {variants.length > 1 && (
        <fieldset className="mt-8">
          <legend className="mb-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted">{withPhotos ? `Choose a design (${variants.length})` : "Choose an option"}</legend>
          <div className={withPhotos ? "grid max-h-[420px] grid-cols-4 gap-2 overflow-y-auto pr-1 sm:grid-cols-6" : "flex flex-wrap gap-2"} data-lenis-prevent>
            {variants.map((v) => (
              <label
                key={v.id}
                title={v.label}
                className={`cursor-pointer border ${withPhotos ? "p-1 text-[10px] leading-tight" : "px-4 py-3 text-[13px]"} transition-colors has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-accent-deep ${
                  v.id === variantId ? "border-accent bg-white text-ink" : "border-line text-muted hover:border-ink/40 hover:text-ink"
                }`}
              >
                <input
                  type="radio"
                  name="variant"
                  value={v.id}
                  checked={v.id === variantId}
                  onChange={() => {
                    setVariantId(v.id);
                    setQuantity(1);
                    setAdded(false);
                  }}
                  className="sr-only"
                />
                {withPhotos && v.imageUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={v.imageUrl} alt="" loading="lazy" className="mb-1 aspect-square w-full object-cover" />
                )}
                <span className={withPhotos ? "block truncate" : ""}>{v.label}</span>
              </label>
            ))}
          </div>
        </fieldset>
      )}
      {details && <p className="mt-4 text-[13px] text-muted">{details}</p>}

      {buyable ? (
        <div className="mt-8 flex flex-wrap items-stretch gap-3">
          <div className="flex h-12 items-stretch border border-line">
            <button type="button" aria-label="One less" onClick={() => setQuantity((q) => Math.max(1, q - 1))} className="w-11 text-lg text-ink hover:bg-white">−</button>
            <input
              aria-label="Quantity"
              inputMode="numeric"
              value={quantity}
              onChange={(e) => {
                const n = parseInt(e.target.value.replace(/\D/g, "") || "1", 10);
                setQuantity(Math.max(1, Math.min(maxQty, n)));
              }}
              className="w-14 bg-transparent text-center text-[15px] text-ink outline-none"
            />
            <button type="button" aria-label="One more" onClick={() => setQuantity((q) => Math.min(maxQty, q + 1))} className="w-11 text-lg text-ink hover:bg-white">+</button>
          </div>
          <button
            type="button"
            onClick={onAdd}
            className="h-12 flex-1 bg-accent px-7 text-[12px] font-semibold uppercase tracking-[0.2em] text-ivory transition-colors hover:bg-accent-deep sm:flex-none"
          >
            Add to cart
          </button>
        </div>
      ) : (
        <p className="mt-8 text-[14px] text-muted">
          {availability === "out-of-stock"
            ? "This option is out of stock right now. Message us and we will tell you when it is back."
            : "This option is sold on request. Message us for a price and availability."}
        </p>
      )}

      {added && (
        <p role="status" className="mt-4 flex flex-wrap items-center gap-4 text-[14px] text-ink">
          Added to your cart.
          <Link href="/cart" className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-accent-deep">
            View cart <Arrow />
          </Link>
        </p>
      )}

      <a
        href={whatsappLink(`Hello Space Craft, I would like to enquire about: ${productName} (${variant.label}, SKU ${variant.sku}).`)}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-6 inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-ink hover:text-accent-deep"
      >
        Ask on WhatsApp <Arrow />
      </a>
    </div>
  );
}
