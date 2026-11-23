"use client";

import { useActionState } from "react";
import { trackAction, type TrackState } from "./actions";
import { OrderDetails } from "@/components/shop/OrderDetails";
import { inputClass, labelClass } from "@/components/shop/bits";

const initial: TrackState = { order: null, error: null, submitted: false };

export function TrackForm() {
  const [state, action, pending] = useActionState(trackAction, initial);
  return (
    <>
      <form action={action} className="grid max-w-3xl gap-5 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
        <div>
          <label htmlFor="order" className={labelClass}>Order number</label>
          <input id="order" name="order" required placeholder="SC251123-AB12CD" autoCapitalize="characters" className={inputClass} />
        </div>
        <div>
          <label htmlFor="phone" className={labelClass}>Mobile number</label>
          <input id="phone" name="phone" type="tel" required inputMode="tel" autoComplete="tel-national" className={inputClass} />
        </div>
        <button
          type="submit"
          disabled={pending}
          className="h-12 bg-accent px-8 text-[12px] font-semibold uppercase tracking-[0.2em] text-ivory transition-colors hover:bg-accent-deep disabled:opacity-50"
        >
          {pending ? "Checking…" : "Track"}
        </button>
      </form>
      {state.error && <p role="alert" className="mt-6 text-[14px] text-red-300">{state.error}</p>}
      {state.order && (
        <div className="mt-14">
          <OrderDetails order={state.order} showAddress={false} />
        </div>
      )}
    </>
  );
}
