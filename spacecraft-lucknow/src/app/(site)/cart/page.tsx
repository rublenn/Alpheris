import type { Metadata } from "next";
import { PageIntro } from "@/components/shop/bits";
import { CartView } from "@/components/shop/CartView";

export const metadata: Metadata = { title: "Cart" };

export default function CartPage() {
  return (
    <>
      <PageIntro crumbs={[{ label: "Cart" }]} title="Your cart" />
      <section className="shell py-12 lg:py-16">
        <CartView />
      </section>
    </>
  );
}
