import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { Header } from "@/components/layout/Header";
import { MotionProvider } from "@/components/layout/MotionProvider";
import { SmoothScroll } from "@/components/layout/SmoothScroll";
import { Footer } from "@/components/layout/Footer";
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
  openGraph: {
    title: site.fullName,
    description: site.description,
    type: "website",
    locale: "en_IN",
  },
};

export const viewport: Viewport = {
  themeColor: "#faf9f6",
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
      <body className="flex min-h-screen flex-col overflow-x-clip">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:bg-ink focus:px-4 focus:py-2 focus:text-white"
        >
          Skip to content
        </a>
        <MotionProvider>
          <SmoothScroll />
          <Header />
          <main id="main" className="relative z-10 flex-1">
            {children}
          </main>
          <Footer />
        </MotionProvider>
      </body>
    </html>
  );
}
