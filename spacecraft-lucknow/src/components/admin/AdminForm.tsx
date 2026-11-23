"use client";

import { useActionState, useEffect, useRef, type ReactNode } from "react";
import { useFormStatus } from "react-dom";
import type { FormState } from "@/actions/admin";

/** A form that runs an admin server action and shows its success / error message. */
export function AdminForm({
  action,
  children,
  submitLabel = "Save",
  className = "",
  resetOnSuccess = false,
}: {
  action: (prev: FormState, fd: FormData) => Promise<FormState>;
  children: ReactNode;
  submitLabel?: string;
  className?: string;
  resetOnSuccess?: boolean;
}) {
  const [state, formAction] = useActionState(action, {});
  const form = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (resetOnSuccess && state.ok) form.current?.reset();
  }, [state, resetOnSuccess]);

  return (
    <form ref={form} action={formAction} className={className}>
      {children}
      <div className="mt-5 flex flex-wrap items-center gap-4">
        <SubmitButton label={submitLabel} />
        {state.error && <p role="alert" className="text-[13px] text-red-300">{state.error}</p>}
        {state.ok && <p role="status" className="text-[13px] text-emerald-300">{state.ok}</p>}
      </div>
    </form>
  );
}

export function SubmitButton({ label, variant = "solid" }: { label: string; variant?: "solid" | "danger" | "ghost" }) {
  const { pending } = useFormStatus();
  const style =
    variant === "danger"
      ? "border border-red-400/50 text-red-300 hover:bg-red-500/10"
      : variant === "ghost"
        ? "border border-line text-ink hover:border-ink/40"
        : "bg-accent text-ivory hover:bg-accent-deep";
  return (
    <button
      type="submit"
      disabled={pending}
      className={`h-10 px-5 text-[11px] font-semibold uppercase tracking-[0.18em] transition-colors disabled:opacity-50 ${style}`}
    >
      {pending ? "Working…" : label}
    </button>
  );
}

/** A one-button form (delete, make cover…) that asks before doing anything destructive. */
export function ActionButton({
  action,
  fields,
  label,
  confirmText,
  variant = "ghost",
}: {
  action: (fd: FormData) => Promise<void>;
  fields: Record<string, string>;
  label: string;
  confirmText?: string;
  variant?: "danger" | "ghost";
}) {
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (confirmText && !window.confirm(confirmText)) e.preventDefault();
      }}
    >
      {Object.entries(fields).map(([k, v]) => (
        <input key={k} type="hidden" name={k} value={v} />
      ))}
      <SubmitButton label={label} variant={variant} />
    </form>
  );
}
