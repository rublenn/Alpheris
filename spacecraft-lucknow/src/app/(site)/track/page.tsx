import type { Metadata } from "next";
import { PageIntro } from "@/components/shop/bits";
import { TrackForm } from "./TrackForm";

export const metadata: Metadata = { title: "Track your order" };

export default function TrackPage() {
  return (
    <>
      <PageIntro crumbs={[{ label: "Track order" }]} eyebrow="Orders" title={<>Where is my <em>order?</em></>}>
        Enter the order number from your confirmation and the mobile number you used at checkout.
      </PageIntro>
      <section className="shell py-12 lg:py-16">
        <TrackForm />
      </section>
    </>
  );
}
