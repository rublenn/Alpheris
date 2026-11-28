"use client";

import { useRouter } from "next/navigation";
import { useRef, useTransition } from "react";
import type { ProductFilters } from "@/lib/shop";
import { inputClass, labelClass } from "./bits";

type Option = { slug: string; name: string };

/**
 * Search + filters. It is a normal GET form (works without JavaScript);
 * with JavaScript, changing a dropdown applies it straight away.
 */
export function FilterBar({
  action,
  filters,
  categories,
  brands,
  resultCount,
}: {
  action: string;
  filters: ProductFilters;
  /** Leave out to hide the category filter (e.g. on a category page). */
  categories?: Option[];
  brands?: Option[];
  resultCount: number;
}) {
  const form = useRef<HTMLFormElement>(null);
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function apply() {
    const data = new FormData(form.current!);
    const params = new URLSearchParams();
    for (const [key, value] of data) {
      const v = String(value).trim();
      if (v && !(key === "sort" && v === "newest")) params.set(key, v);
    }
    const qs = params.toString();
    startTransition(() => router.push(qs ? `${action}?${qs}` : action, { scroll: false }));
  }

  return (
    <form
      ref={form}
      action={action}
      method="get"
      role="search"
      onSubmit={(e) => {
        e.preventDefault();
        apply();
      }}
      className="grid gap-4 border-b border-line pb-8 sm:grid-cols-2 lg:grid-cols-12 lg:items-end"
    >
      <div className="sm:col-span-2 lg:col-span-4">
        <label htmlFor="q" className={labelClass}>Search</label>
        <div className="flex">
          <input
            id="q"
            name="q"
            type="search"
            defaultValue={filters.q}
            placeholder="Name, colour, finish, SKU…"
            className={inputClass}
          />
          <button
            type="submit"
            className="h-12 shrink-0 bg-ink px-5 text-[11px] font-semibold uppercase tracking-[0.18em] text-ivory transition-colors hover:bg-accent-deep"
          >
            Go
          </button>
        </div>
      </div>

      {categories && (
        <div className="lg:col-span-2">
          <label htmlFor="category" className={labelClass}>Category</label>
          <select id="category" name="category" defaultValue={filters.category ?? ""} onChange={apply} className={inputClass}>
            <option value="">All categories</option>
            {categories.map((c) => (
              <option key={c.slug} value={c.slug}>{c.name}</option>
            ))}
          </select>
        </div>
      )}

      {brands && brands.length > 0 && (
        <div className="lg:col-span-2">
          <label htmlFor="brand" className={labelClass}>Brand</label>
          <select id="brand" name="brand" defaultValue={filters.brand ?? ""} onChange={apply} className={inputClass}>
            <option value="">All brands</option>
            {brands.map((b) => (
              <option key={b.slug} value={b.slug}>{b.name}</option>
            ))}
          </select>
        </div>
      )}

      <div className="lg:col-span-2">
        <label htmlFor="sort" className={labelClass}>Sort by</label>
        <select id="sort" name="sort" defaultValue={filters.sort ?? "newest"} onChange={apply} className={inputClass}>
          <option value="newest">Newest</option>
          <option value="price-asc">Price: low to high</option>
          <option value="price-desc">Price: high to low</option>
          <option value="name">Name A–Z</option>
        </select>
      </div>

      <label className="flex h-12 cursor-pointer items-center gap-3 text-[13px] text-ink lg:col-span-2">
        <input
          type="checkbox"
          name="stock"
          value="1"
          defaultChecked={filters.inStock}
          onChange={apply}
          className="h-4 w-4 accent-[var(--color-accent)]"
        />
        Buy online now
      </label>

      <p aria-live="polite" className="text-[12px] text-muted sm:col-span-2 lg:col-span-12">
        {pending ? "Updating…" : `${resultCount} ${resultCount === 1 ? "product" : "products"}`}
      </p>
    </form>
  );
}
