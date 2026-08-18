"use client";

import { ReactNode, useEffect } from "react";
import { IconClose, IconTrash } from "./icons";

// ---------- layout ----------

export function Card({
  children,
  className = "",
  padded = true,
  id,
}: {
  children: ReactNode;
  className?: string;
  padded?: boolean;
  id?: string;
}) {
  return (
    <div
      id={id}
      className={`rounded-2xl border border-border bg-surface ${
        padded ? "p-5 sm:p-6" : ""
      } ${className}`}
    >
      {children}
    </div>
  );
}

export function SectionHeader({
  eyebrow,
  title,
  action,
}: {
  eyebrow?: string;
  title: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex items-end justify-between gap-4 flex-wrap">
      <div>
        {eyebrow && (
          <p className="text-xs font-medium tracking-wide uppercase text-muted mb-1">
            {eyebrow}
          </p>
        )}
        <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
      </div>
      {action}
    </div>
  );
}

// ---------- badges / pills ----------

type Tone = "neutral" | "good" | "warn" | "critical" | "accent";

const toneClasses: Record<Tone, string> = {
  neutral: "bg-surface-2 text-muted border-border",
  good: "bg-good-soft text-good border-good/30",
  warn: "bg-warn-soft text-warn border-warn/30",
  critical: "bg-critical-soft text-critical border-critical/30",
  accent: "bg-accent-soft text-accent border-accent/30",
};

export function Badge({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: Tone;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium ${toneClasses[tone]}`}
    >
      {children}
    </span>
  );
}

export function Dot({ tone = "neutral" }: { tone?: Tone }) {
  const dotClasses: Record<Tone, string> = {
    neutral: "bg-muted",
    good: "bg-good",
    warn: "bg-warn",
    critical: "bg-critical",
    accent: "bg-accent",
  };
  return <span className={`inline-block h-1.5 w-1.5 rounded-full ${dotClasses[tone]}`} />;
}

// ---------- buttons ----------

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";

export function Button({
  children,
  onClick,
  variant = "secondary",
  type = "button",
  className = "",
  disabled,
}: {
  children: ReactNode;
  onClick?: () => void;
  variant?: ButtonVariant;
  type?: "button" | "submit";
  className?: string;
  disabled?: boolean;
}) {
  const variants: Record<ButtonVariant, string> = {
    primary: "bg-accent text-white hover:opacity-90",
    secondary: "bg-surface-2 text-foreground border border-border hover:border-muted",
    ghost: "text-muted hover:text-foreground hover:bg-surface-2",
    danger: "bg-critical-soft text-critical border border-critical/30 hover:bg-critical/20",
  };
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center justify-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition disabled:opacity-40 disabled:cursor-not-allowed ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  );
}

export function IconButton({
  children,
  onClick,
  label,
  danger,
}: {
  children: ReactNode;
  onClick?: () => void;
  label: string;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className={`inline-flex h-8 w-8 items-center justify-center rounded-full border border-border transition hover:border-muted ${
        danger ? "text-critical hover:bg-critical-soft" : "text-muted hover:text-foreground hover:bg-surface-2"
      }`}
    >
      {children}
    </button>
  );
}

export function DeleteButton({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <IconButton onClick={onClick} label={label} danger>
      <IconTrash className="h-4 w-4" />
    </IconButton>
  );
}

// ---------- tabs ----------

export function Tabs<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string; count?: number }[];
}) {
  return (
    <div className="flex items-center gap-1 rounded-full border border-border bg-surface p-1 w-fit overflow-x-auto max-w-full">
      {options.map((o) => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition ${
            value === o.value ? "bg-accent text-white" : "text-muted hover:text-foreground"
          }`}
        >
          {o.label}
          {typeof o.count === "number" && o.count > 0 && (
            <span className={`ml-1.5 text-xs tabular-nums ${value === o.value ? "text-white/80" : "text-muted"}`}>
              {o.count}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}

// ---------- stat tile ----------

export function StatTile({
  label,
  value,
  hint,
  tone = "neutral",
}: {
  label: string;
  value: ReactNode;
  hint?: string;
  tone?: Tone;
}) {
  const valueTone: Record<Tone, string> = {
    neutral: "text-foreground",
    good: "text-good",
    warn: "text-warn",
    critical: "text-critical",
    accent: "text-accent",
  };
  return (
    <div className="rounded-xl border border-border-soft bg-surface-2 p-4">
      <p className="text-xs font-medium tracking-wide uppercase text-muted mb-1.5">{label}</p>
      <p className={`text-2xl font-semibold tracking-tight ${valueTone[tone]}`}>{value}</p>
      {hint && <p className="text-xs text-muted mt-1">{hint}</p>}
    </div>
  );
}

// ---------- progress ----------

export function ProgressBar({ value, tone = "accent" }: { value: number; tone?: Tone }) {
  const barTone: Record<Tone, string> = {
    neutral: "bg-muted",
    good: "bg-good",
    warn: "bg-warn",
    critical: "bg-critical",
    accent: "bg-accent",
  };
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div className="h-1.5 w-full rounded-full bg-surface-2 overflow-hidden">
      <div
        className={`h-full rounded-full transition-[width] duration-500 ${barTone[tone]}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

// ---------- empty state ----------

export function EmptyState({
  title,
  body,
  action,
}: {
  title: string;
  body: string;
  action?: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-border py-14 px-6 text-center">
      <p className="font-medium mb-1">{title}</p>
      <p className="text-sm text-muted max-w-sm mx-auto mb-5">{body}</p>
      {action}
    </div>
  );
}

// ---------- drawer ----------

export function Drawer({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <div
      className={`fixed inset-0 z-50 ${open ? "pointer-events-auto" : "pointer-events-none"}`}
      aria-hidden={!open}
    >
      <div
        onClick={onClose}
        className={`absolute inset-0 bg-black/50 backdrop-blur-[2px] transition-opacity duration-300 ${
          open ? "opacity-100" : "opacity-0"
        }`}
      />
      <div
        className={`absolute right-0 top-0 h-full w-full max-w-md border-l border-border bg-surface shadow-2xl transition-transform duration-300 ease-out ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <h3 className="font-semibold tracking-tight">{title}</h3>
          <button
            onClick={onClose}
            aria-label="Close"
            className="inline-flex h-8 w-8 items-center justify-center rounded-full text-muted hover:text-foreground hover:bg-surface-2 transition"
          >
            <IconClose className="h-4 w-4" />
          </button>
        </div>
        <div className="h-[calc(100%-57px)] overflow-y-auto px-6 py-5">{children}</div>
      </div>
    </div>
  );
}

// ---------- form fields ----------

export function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="block text-sm font-medium mb-1.5">{label}</span>
      {children}
    </label>
  );
}

const inputClasses =
  "w-full rounded-lg border border-border bg-surface-2 px-3.5 py-2.5 text-sm outline-none focus:border-accent transition";

export function TextInput({
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <input
      className={inputClasses}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      type={type}
    />
  );
}

export function NumberInput({
  value,
  onChange,
  placeholder,
}: {
  value: number;
  onChange: (v: number) => void;
  placeholder?: string;
}) {
  return (
    <input
      className={inputClasses}
      value={Number.isFinite(value) ? value : 0}
      onChange={(e) => onChange(Number(e.target.value) || 0)}
      placeholder={placeholder}
      type="number"
      inputMode="decimal"
    />
  );
}

export function TextArea({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <textarea
      className={`${inputClasses} min-h-24 resize-y`}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
    />
  );
}

export function SelectInput<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (v: T) => void;
  options: readonly T[];
}) {
  return (
    <select
      className={`${inputClasses} appearance-none`}
      value={value}
      onChange={(e) => onChange(e.target.value as T)}
    >
      {options.map((o) => (
        <option key={o} value={o}>
          {o}
        </option>
      ))}
    </select>
  );
}
