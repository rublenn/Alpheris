import { revalidateTag } from "next/cache";
import { adminDb } from "@/lib/supabase";
import { verifyWebhookSignature } from "@/lib/razorpay";
import { CATALOG_TAG } from "@/lib/shop";

/**
 * Backup confirmation from Razorpay's servers. If the customer closes the tab
 * right after paying, the browser never reports back — this webhook still
 * marks the order paid. Set it up in Razorpay Dashboard → Webhooks with the
 * URL https://<your-site>/api/razorpay/webhook, events "payment.captured" and
 * "order.paid", and put the same secret in RAZORPAY_WEBHOOK_SECRET.
 */
export async function POST(request: Request) {
  const raw = await request.text();
  if (!verifyWebhookSignature(raw, request.headers.get("x-razorpay-signature") ?? "")) {
    return new Response("Invalid signature", { status: 400 });
  }

  let event: { event?: string; payload?: { payment?: { entity?: { id?: string; order_id?: string } } } };
  try {
    event = JSON.parse(raw);
  } catch {
    return new Response("Bad JSON", { status: 400 });
  }

  if (event.event === "payment.captured" || event.event === "order.paid") {
    const payment = event.payload?.payment?.entity;
    if (payment?.order_id && payment.id) {
      const { error } = await adminDb().rpc("mark_order_paid", {
        p_razorpay_order_id: payment.order_id,
        p_payment_id: payment.id,
      });
      // ORDER_NOT_FOUND = a payment for something else on the same account; ignore it.
      if (error && !error.message.includes("ORDER_NOT_FOUND")) {
        console.error("Webhook could not mark order paid", error);
        return new Response("Retry later", { status: 500 });
      }
      revalidateTag(CATALOG_TAG, "max");
    }
  }
  return new Response("ok");
}
