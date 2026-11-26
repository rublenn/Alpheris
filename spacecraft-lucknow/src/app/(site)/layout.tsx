import { Header } from "@/components/layout/Header";
import { MotionProvider } from "@/components/layout/MotionProvider";
import { SmoothScroll } from "@/components/layout/SmoothScroll";
import { Cursor } from "@/components/layout/Cursor";
import { Marquee } from "@/components/home/Marquee";
import { SideRails } from "@/components/layout/SideRails";
import { Footer } from "@/components/layout/Footer";
import { CartProvider } from "@/components/shop/CartProvider";

/** The public website: header, footer, smooth scrolling, cart. (The admin panel has its own layout.) */
export default function SiteLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="flex min-h-screen flex-col pb-[58px]">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:bg-ink focus:px-4 focus:py-2 focus:text-white"
      >
        Skip to content
      </a>
      <CartProvider>
        <MotionProvider>
          <SmoothScroll />
          <Cursor />
          <Header />
          <main id="main" className="relative z-10 flex-1">
            {children}
          </main>
          <Footer />
          <Marquee />
          <SideRails />
        </MotionProvider>
      </CartProvider>
    </div>
  );
}
