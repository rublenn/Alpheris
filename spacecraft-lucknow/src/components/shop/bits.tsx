import Link from "next/link";
import type { ReactNode } from "react";
import type { Swatch } from "@/lib/catalog";
import { MaterialSwatch } from "@/components/ui/MaterialSwatch";
import { formatINR } from "@/lib/money";
import { availabilityLabel, type Availability } from "@/lib/shop-types";

/** Shared input styling for shop + admin forms. */
export const inputClass =
  "h-12 w-full border border-line bg-white px-4 text-[14px] text-ink placeholder:text-muted/60 outline-none transition-colors focus:border-accent";
export const labelClass = "mb-2 block text-[11px] font-semibold uppercase tracking-[0.18em] text-muted";

/** Top of every shop page: breadcrumb trail, eyebrow, big title, intro. */
export function PageIntro({
  crumbs = [],
  eyebrow,
  title,
  children,
}: {
  crumbs?: { label: string; href?: string }[];
  eyebrow?: string;
  title: ReactNode;
  children?: ReactNode;
}) {
  return (
    <div className="blueprint border-b border-line pb-12 pt-[128px] lg:pb-16 lg:pt-[150px]">
      <div className="shell">
        {crumbs.length > 0 && (
          <nav aria-label="Breadcrumb" className="mb-6 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted">
            <ol className="flex flex-wrap items-center gap-2">
              <li>
                <Link href="/" className="hover:text-ink">Home</Link>
              </li>
              {crumbs.map((c) => (
                <li key={c.label} className="flex items-center gap-2">
                  <span aria-hidden="true" className="text-line">/</span>
                  {c.href ? (
                    <Link href={c.href} className="hover:text-ink">{c.label}</Link>
                  ) : (
                    <span aria-current="page" className="text-ink">{c.label}</span>
                  )}
                </li>
              ))}
            </ol>
          </nav>
        )}
        {eyebrow && (
          <p className="eyebrow flex items-center gap-4">
            <span className="h-px w-10 bg-accent" />
            {eyebrow}
          </p>
        )}
        <h1 className="display mt-5 max-w-5xl text-[clamp(2.4rem,6vw,4.8rem)]">{title}</h1>
        {children && <div className="mt-5 max-w-2xl text-[15px] leading-relaxed text-muted">{children}</div>}
      </div>
    </div>
  );
}

/** A product photo, or the illustrated texture when no photo has been uploaded yet. */
export function ProductVisual({
  image,
  swatch,
  alt,
  className = "",
  sizes,
}: {
  image?: { url: string; alt?: string } | null;
  swatch: Swatch | null;
  alt: string;
  className?: string;
  sizes?: string;
}) {
  if (image) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={image.url}
        alt={image.alt || alt}
        sizes={sizes}
        loading="lazy"
        decoding="async"
        className={`block h-full w-full object-cover ${className}`}
      />
    );
  }
  return swatch ? (
    <MaterialSwatch swatch={swatch} className={className} />
  ) : (
    <div className={`h-full w-full bg-beige ${className}`} />
  );
}

export function Price({ paise, salePaise, className = "" }: { paise: number | null; salePaise?: number | null; className?: string }) {
  if (paise == null) return <span className={`text-muted ${className}`}>Price on request</span>;
  if (salePaise != null && salePaise < paise) {
    return (
      <span className={className}>
        <span className="text-ink">{formatINR(salePaise)}</span>{" "}
        <s className="text-[0.85em] text-muted">{formatINR(paise)}</s>
      </span>
    );
  }
  return <span className={`text-ink ${className}`}>{formatINR(paise)}</span>;
}

const badgeTone: Record<Availability, string> = {
  "in-stock": "border-emerald-400/40 text-emerald-300",
  "low-stock": "border-accent/60 text-accent-deep",
  "out-of-stock": "border-red-400/40 text-red-300",
  "on-request": "border-line text-muted",
};

export function AvailabilityBadge({ value }: { value: Availability }) {
  return (
    <span className={`inline-flex items-center border px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] ${badgeTone[value]}`}>
      {availabilityLabel[value]}
    </span>
  );
}

export function EmptyState({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="border border-dashed border-line px-6 py-16 text-center">
      <p className="display text-3xl">{title}</p>
      {children && <div className="mx-auto mt-3 max-w-md text-[14px] leading-relaxed text-muted">{children}</div>}
    </div>
  );
}
