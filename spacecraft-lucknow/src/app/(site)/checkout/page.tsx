import type { Metadata } from "next";
import { PageIntro } from "@/components/shop/bits";
import { CheckoutForm } from "@/components/shop/CheckoutForm";
import { deliveryFeePaise } from "@/lib/orders";
import { isRazorpayConfigured, isTestMode } from "@/lib/razorpay";

export const metadata: Metadata = { title: "Checkout" };

export default function CheckoutPage() {
  return (
    <>
      <PageIntro crumbs={[{ label: "Cart", href: "/cart" }, { label: "Checkout" }]} title="Checkout">
        {isRazorpayConfigured() && isTestMode() && (
          <span className="inline-block border border-accent/50 px-3 py-2 text-[12px] font-semibold uppercase tracking-[0.16em] text-accent-deep">
            Test mode — use Razorpay test cards / UPI, no real money moves
          </span>
        )}
      </PageIntro>
      <section className="shell py-12 lg:py-16">
        <CheckoutForm deliveryPaise={deliveryFeePaise()} paymentsEnabled={isRazorpayConfigured()} />
      </section>
    </>
  );
}
