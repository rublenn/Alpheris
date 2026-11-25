"use client";

import { useActionState } from "react";
import { forgotPasswordAction, type FormState } from "@/actions/admin";
import { inputClass, labelClass } from "@/components/shop/bits";

export function ForgotForm() {
  const [state, action, pending] = useActionState<FormState, FormData>(forgotPasswordAction, {});
  return (
    <form action={action} className="mt-8 space-y-5">
      <div>
        <label htmlFor="email" className={labelClass}>Your admin email</label>
        <input id="email" name="email" type="email" required autoComplete="username" className={inputClass} />
      </div>
      {state.error && <p role="alert" className="text-[13px] text-red-300">{state.error}</p>}
      {state.ok && <p role="status" className="text-[13px] text-emerald-300">{state.ok}</p>}
      <button type="submit" disabled={pending} className="h-12 w-full bg-accent text-[12px] font-semibold uppercase tracking-[0.2em] text-ivory hover:bg-accent-deep disabled:opacity-50">
        {pending ? "Sending…" : "Email me a link"}
      </button>
    </form>
  );
}
