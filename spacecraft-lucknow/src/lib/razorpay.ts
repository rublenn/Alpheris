import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Razorpay, server side only.
 *  - RAZORPAY_KEY_ID      starts with rzp_test_ (test mode) or rzp_live_ (real money)
 *  - RAZORPAY_KEY_SECRET  never leaves the server
 *  - RAZORPAY_WEBHOOK_SECRET (optional) the secret you type when adding the webhook
 */
const keyId = process.env.RAZORPAY_KEY_ID;
const keySecret = process.env.RAZORPAY_KEY_SECRET;

export function isRazorpayConfigured() {
  return Boolean(keyId && keySecret);
}

export function razorpayKeyId() {
  return keyId ?? "";
}

export function isTestMode() {
  return (keyId ?? "").startsWith("rzp_test_");
}

export type RazorpayOrder = { id: string; amount: number; currency: string; status: string };

/** Creates the payment "order" on Razorpay's side for the exact amount (in paise). */
export async function createRazorpayOrder(input: {
  amountPaise: number;
  receipt: string;
  notes?: Record<string, string>;
}): Promise<RazorpayOrder> {
  if (!keyId || !keySecret) throw new Error("Razorpay keys are not set.");
  const res = await fetch("https://api.razorpay.com/v1/orders", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString("base64")}`,
    },
    body: JSON.stringify({
      amount: input.amountPaise,
      currency: "INR",
      receipt: input.receipt.slice(0, 40),
      notes: input.notes,
    }),
    cache: "no-store",
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(`Razorpay error: ${body?.error?.description ?? res.statusText}`);
  }
  return body as RazorpayOrder;
}

function safeEqualHex(a: string, b: string) {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

/**
 * The browser tells us "payment done" with three values. We only believe it
 * if the signature matches HMAC_SHA256(order_id|payment_id, key_secret).
 */
export function verifyPaymentSignature(orderId: string, paymentId: string, signature: string) {
  if (!keySecret) return false;
  const expected = createHmac("sha256", keySecret).update(`${orderId}|${paymentId}`).digest("hex");
  return safeEqualHex(expected, signature);
}

/** Webhooks from Razorpay are signed with the webhook secret over the raw body. */
export function verifyWebhookSignature(rawBody: string, signature: string) {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret || !signature) return false;
  const expected = createHmac("sha256", secret).update(rawBody).digest("hex");
  return safeEqualHex(expected, signature);
}
