"use server";

import { toPublicOrder, trackOrder } from "@/lib/orders";
import type { PublicOrder } from "@/components/shop/OrderDetails";

export type TrackState = { order: PublicOrder | null; error: string | null; submitted: boolean };

export async function trackAction(_prev: TrackState, form: FormData): Promise<TrackState> {
  const number = String(form.get("order") ?? "").trim();
  const phone = String(form.get("phone") ?? "").trim();
  if (!number || !phone) return { order: null, error: "Please enter both the order number and the mobile number.", submitted: true };
  const order = await trackOrder(number, phone);
  if (!order) {
    return { order: null, error: "No order matches these details. Check the order number (e.g. SC251123-AB12CD) and the mobile number used at checkout.", submitted: true };
  }
  return { order: toPublicOrder(order, { hideAddress: true }), error: null, submitted: true };
}
