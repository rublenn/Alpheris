import Link from "next/link";
import type { ReactNode } from "react";
import { inputClass, labelClass } from "@/components/shop/bits";

export { inputClass, labelClass };

export function AdminHeader({ title, children, back }: { title: string; children?: ReactNode; back?: { href: string; label: string } }) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4 border-b border-line pb-6">
      <div>
        {back && (
          <Link href={back.href} className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted hover:text-ink">
            ← {back.label}
          </Link>
        )}
        <h1 className="display mt-2 text-[2.6rem]">{title}</h1>
      </div>
      {children && <div className="flex flex-wrap gap-3">{children}</div>}
    </div>
  );
}

export function Field({
  label,
  name,
  defaultValue,
  type = "text",
  required,
  placeholder,
  hint,
  className = "",
  inputMode,
  idPrefix = "",
}: {
  idPrefix?: string;
  label: string;
  name: string;
  defaultValue?: string | number | null;
  type?: string;
  required?: boolean;
  placeholder?: string;
  hint?: string;
  className?: string;
  inputMode?: "numeric" | "decimal";
}) {
  return (
    <div className={className}>
      <label htmlFor={idPrefix + name} className={labelClass}>{label}</label>
      <input
        id={idPrefix + name}
        name={name}
        type={type}
        required={required}
        placeholder={placeholder}
        inputMode={inputMode}
        defaultValue={defaultValue ?? ""}
        className={`${inputClass} h-11`}
      />
      {hint && <p className="mt-1.5 text-[12px] text-muted">{hint}</p>}
    </div>
  );
}

export function TextArea({ label, name, defaultValue, rows = 4, hint, placeholder }: { label: string; name: string; defaultValue?: string; rows?: number; hint?: string; placeholder?: string }) {
  return (
    <div>
      <label htmlFor={name} className={labelClass}>{label}</label>
      <textarea id={name} name={name} rows={rows} placeholder={placeholder} defaultValue={defaultValue ?? ""} className={`${inputClass} h-auto py-3`} />
      {hint && <p className="mt-1.5 text-[12px] text-muted">{hint}</p>}
    </div>
  );
}

export function Check({ label, name, defaultChecked }: { label: string; name: string; defaultChecked?: boolean }) {
  return (
    <label className="flex cursor-pointer items-center gap-3 text-[14px] text-ink">
      <input type="checkbox" name={name} defaultChecked={defaultChecked} className="h-4 w-4 accent-[var(--color-accent)]" />
      {label}
    </label>
  );
}

export function Pill({ children, tone = "muted" }: { children: ReactNode; tone?: "muted" | "good" | "warn" | "bad" | "gold" }) {
  const tones = {
    muted: "border-line text-muted",
    good: "border-emerald-400/40 text-emerald-300",
    warn: "border-amber-400/40 text-amber-300",
    bad: "border-red-400/40 text-red-300",
    gold: "border-accent/50 text-accent-deep",
  };
  return <span className={`inline-block border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] ${tones[tone]}`}>{children}</span>;
}

export const card = "border border-line bg-white p-5 sm:p-6";
