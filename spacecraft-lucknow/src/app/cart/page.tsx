import type { Metadata } from "next";
import { ComingSoon } from "@/components/ui/ComingSoon";

export const metadata: Metadata = { title: "Cart" };

export default function CartPage() {
  return (
    <ComingSoon phase="Phase 3" title="The shopping cart is not active yet.">
      <p>
        Cart, checkout and online payment are planned for later phases. Until then, please send an
        enquiry and the Space Craft team will help you directly.
      </p>
    </ComingSoon>
  );
}
