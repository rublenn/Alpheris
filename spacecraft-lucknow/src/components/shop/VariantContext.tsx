"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

/** Which option (variant) is chosen on a product page — shared by the photo and the buy box. */
const Ctx = createContext<{ selected: string; select: (id: string) => void } | null>(null);

export function VariantSelection({ initial, children }: { initial: string; children: ReactNode }) {
  const [selected, select] = useState(initial);
  return <Ctx value={{ selected, select }}>{children}</Ctx>;
}

export function useSelectedVariant() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useSelectedVariant must be used inside <VariantSelection>");
  return ctx;
}
