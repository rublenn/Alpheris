"use client";

import { useActionState } from "react";
import { loginAction, type FormState } from "@/actions/admin";
import { inputClass, labelClass } from "@/components/shop/bits";

export function LoginForm() {
  const [state, action, pending] = useActionState<FormState, FormData>(loginAction, {});
  return (
    <form action={action} className="mt-8 space-y-5">
      <div>
        <label htmlFor="email" className={labelClass}>Email</label>
        <input id="email" name="email" type="email" required autoComplete="username" className={inputClass} />
      </div>
      <div>
        <label htmlFor="password" className={labelClass}>Password</label>
        <input id="password" name="password" type="password" required autoComplete="current-password" className={inputClass} />
      </div>
      {state.error && <p role="alert" className="text-[13px] text-red-300">{state.error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="h-12 w-full bg-accent text-[12px] font-semibold uppercase tracking-[0.2em] text-ivory hover:bg-accent-deep disabled:opacity-50"
      >
        {pending ? "Checking…" : "Log in"}
      </button>
    </form>
  );
}
