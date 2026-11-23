import type { ShopProduct } from "@/lib/shop-types";
import { ProductCard } from "./ProductCard";
import { EmptyState } from "./bits";

export function ProductGrid({ products, emptyText }: { products: ShopProduct[]; emptyText?: string }) {
  if (products.length === 0) {
    return (
      <EmptyState title="Nothing here yet.">
        {emptyText ?? "No products match these filters. Try clearing the search or choosing another category."}
      </EmptyState>
    );
  }
  return (
    <ul className="grid grid-cols-2 gap-x-4 gap-y-12 sm:gap-x-6 lg:grid-cols-4 lg:gap-x-8 lg:gap-y-16">
      {products.map((p) => (
        <li key={p.id}>
          <ProductCard product={p} />
        </li>
      ))}
    </ul>
  );
}

export function GridSkeleton() {
  return (
    <ul aria-hidden="true" className="grid animate-pulse grid-cols-2 gap-x-4 gap-y-12 sm:gap-x-6 lg:grid-cols-4 lg:gap-x-8">
      {Array.from({ length: 8 }, (_, i) => (
        <li key={i}>
          <div className="aspect-[4/5] bg-beige" />
          <div className="mt-4 h-3 w-1/2 bg-beige" />
          <div className="mt-3 h-6 w-3/4 bg-beige" />
        </li>
      ))}
    </ul>
  );
}
