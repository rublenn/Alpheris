import type { Metadata } from "next";
import "./globals.css";
import SiteHeader from "@/components/SiteHeader";

export const metadata: Metadata = {
  title: "AlperisMedien — Instant AI Marketing Solutions",
  description:
    "Tell us your business, problem, and goals. Get an instant AI-generated marketing plan, sales projection, and sample creative — free to try, ours to run for you.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        <SiteHeader />
        <main className="flex-1">{children}</main>
        <footer className="border-t border-border px-6 py-8 text-sm text-muted">
          <div className="mx-auto max-w-6xl flex flex-col sm:flex-row items-center justify-between gap-2">
            <span>© {new Date().getFullYear()} AlperisMedien</span>
            <span>Marketing that shows, not tells.</span>
          </div>
        </footer>
      </body>
    </html>
  );
}
