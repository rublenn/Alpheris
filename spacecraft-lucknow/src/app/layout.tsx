import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { site } from "@/lib/site";

// Fonts are stored inside the project, so the site never calls a font CDN.
const manrope = localFont({
  src: "./fonts/manrope-normal.woff2",
  weight: "400 800",
  variable: "--font-manrope",
  display: "swap",
});

const instrument = localFont({
  src: [
    {
      path: "./fonts/instrumentserif-normal.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "./fonts/instrumentserif-italic.woff2",
      weight: "400",
      style: "italic",
    },
  ],
  variable: "--font-instrument",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: `${site.fullName} — ${site.tagline}`,
    template: `%s — ${site.fullName}`,
  },
  description: site.description,
  // PREVIEW ONLY: keeps this unfinished site out of Google so it cannot compete
  // with the live website. Remove this line when the site officially launches.
  robots: { index: false, follow: false },
  openGraph: {
    title: site.fullName,
    description: site.description,
    type: "website",
    locale: "en_IN",
  },
};

export const viewport: Viewport = {
  themeColor: "#1e1d1b",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // suppressHydrationWarning: browser extensions (e.g. translators) add their
    // own attributes to <html>; this stops a harmless dev-only warning about it.
    <html
      lang="en-IN"
      suppressHydrationWarning
      className={`${manrope.variable} ${instrument.variable} antialiased`}
    >
      <body className="flex min-h-screen flex-col overflow-x-clip">{children}</body>
    </html>
  );
}
