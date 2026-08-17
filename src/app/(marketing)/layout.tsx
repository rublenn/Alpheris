import { ReactNode } from "react";
import SiteHeader from "@/components/SiteHeader";

export default function MarketingLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <SiteHeader />
      <main className="flex-1">{children}</main>
      <footer className="border-t border-border px-6 py-8 text-sm text-muted">
        <div className="mx-auto max-w-6xl flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>© {new Date().getFullYear()} AlperisMedien</span>
          <span>Marketing that shows, not tells.</span>
        </div>
      </footer>
    </>
  );
}
