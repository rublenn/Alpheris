"use client";

import { createContext, useCallback, useContext, useMemo, useSyncExternalStore, type ReactNode } from "react";

/**
 * The cart lives in the visitor's browser (localStorage), so no login is needed.
 * Only variant IDs and quantities matter: prices and stock are always
 * re-checked on the server at checkout.
 */
export type CartItem = { variantId: string; quantity: number };

type CartContext = {
  items: CartItem[];
  ready: boolean;
  count: number;
  add: (variantId: string, quantity?: number) => void;
  setQuantity: (variantId: string, quantity: number) => void;
  remove: (variantId: string) => void;
  clear: () => void;
};

const KEY = "spacecraft-cart-v1";
const Ctx = createContext<CartContext | null>(null);

function read(): CartItem[] {
  try {
    const data = JSON.parse(localStorage.getItem(KEY) ?? "[]");
    return Array.isArray(data)
      ? data
          .filter((i) => typeof i?.variantId === "string" && Number.isInteger(i?.quantity) && i.quantity > 0)
          .slice(0, 50)
      : [];
  } catch {
    return [];
  }
}

// A tiny store around localStorage, read with useSyncExternalStore.
const EMPTY: CartItem[] = [];
let memory: CartItem[] | null = null;
const listeners = new Set<() => void>();

function snapshot() {
  if (memory === null) memory = read();
  return memory;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  const onStorage = (e: StorageEvent) => {
    if (e.key !== KEY) return;
    memory = read(); // changed in another tab
    listener();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

const noop = () => () => {};

export function CartProvider({ children }: { children: ReactNode }) {
  const items = useSyncExternalStore(subscribe, snapshot, () => EMPTY);
  // false while the page is first being shown from the server, true once the browser cart is read.
  const ready = useSyncExternalStore(noop, () => true, () => false);

  const save = useCallback((next: CartItem[]) => {
    memory = next;
    try {
      localStorage.setItem(KEY, JSON.stringify(next));
    } catch {
      /* private mode: cart still works for this visit */
    }
    listeners.forEach((l) => l());
  }, []);

  const value = useMemo<CartContext>(() => {
    const clamp = (n: number) => Math.max(1, Math.min(999, Math.floor(n)));
    return {
      items,
      ready,
      count: items.reduce((sum, i) => sum + i.quantity, 0),
      add: (variantId, quantity = 1) => {
        const existing = items.find((i) => i.variantId === variantId);
        save(
          existing
            ? items.map((i) => (i.variantId === variantId ? { ...i, quantity: clamp(i.quantity + quantity) } : i))
            : [...items, { variantId, quantity: clamp(quantity) }],
        );
      },
      setQuantity: (variantId, quantity) =>
        save(items.map((i) => (i.variantId === variantId ? { ...i, quantity: clamp(quantity) } : i))),
      remove: (variantId) => save(items.filter((i) => i.variantId !== variantId)),
      clear: () => save([]),
    };
  }, [items, ready, save]);

  return <Ctx value={value}>{children}</Ctx>;
}

export function useCart() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useCart must be used inside <CartProvider>");
  return ctx;
}
