"use client";

import { useEffect, useState } from "react";
import { getCartLines, type CartLine } from "@/actions/checkout";
import { useCart } from "./CartProvider";

export type ResolvedLine = CartLine & { quantity: number; problem: string | null };

/** Joins the browser cart with fresh prices + stock from the server. */
export function useCartLines() {
  const { items, ready } = useCart();
  const key = items.map((i) => i.variantId).sort().join(",");
  // Server answer for a given set of variant ids.
  const [fetched, setFetched] = useState<{ key: string; lines: CartLine[] } | null>(null);

  useEffect(() => {
    if (!ready || !key) return;
    let live = true;
    getCartLines(key.split(","))
      .then((l) => live && setFetched({ key, lines: l }))
      .catch(() => live && setFetched({ key, lines: [] }));
    return () => {
      live = false;
    };
  }, [key, ready]);

  const lines: CartLine[] | null = !key ? [] : fetched?.key === key ? fetched.lines : null;

  const resolved: ResolvedLine[] | null =
    lines &&
    items.map((item) => {
      const line = lines.find((l) => l.variantId === item.variantId);
      if (!line) {
        return {
          variantId: item.variantId,
          productSlug: "",
          productName: "Item no longer available",
          variantLabel: "",
          sku: "",
          unitPricePaise: null,
          stock: 0,
          image: null,
          swatch: null,
          quantity: item.quantity,
          problem: "This item was removed from the shop. Please remove it from your cart.",
        };
      }
      let problem: string | null = null;
      if (line.unitPricePaise == null) problem = "Price on request — cannot be paid online.";
      else if (line.stock <= 0) problem = "Out of stock.";
      else if (item.quantity > line.stock) problem = `Only ${line.stock} available.`;
      return { ...line, quantity: item.quantity, problem };
    });

  const subtotal = (resolved ?? []).reduce((sum, l) => sum + (l.unitPricePaise ?? 0) * l.quantity, 0);
  const hasProblems = (resolved ?? []).some((l) => l.problem);
  return { lines: resolved, subtotal, hasProblems, loading: !ready || lines === null };
}
