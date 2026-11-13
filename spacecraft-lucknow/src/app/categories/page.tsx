import type { Metadata } from "next";
import { ComingSoon } from "@/components/ui/ComingSoon";
import { categories } from "@/lib/catalog";

export const metadata: Metadata = { title: "All categories" };

export default function CategoriesPage() {
  return (
    <ComingSoon phase="Phase 2" title="Category pages are being built.">
      <p>
        Full category, brand and product pages — with search and filters — are the next milestone.
        The planned categories are:
      </p>
      <p className="mt-4 text-ink">{categories.map((c) => c.name).join(" · ")}</p>
    </ComingSoon>
  );
}
