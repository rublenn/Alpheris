import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AlperisMedien — Instant AI Marketing Solutions",
  description:
    "Tell us your business, problem, and goals. Get an instant AI-generated marketing plan, sales projection, and sample creative — free to try, ours to run for you.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
