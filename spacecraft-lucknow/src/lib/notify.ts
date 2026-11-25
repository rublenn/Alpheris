import "server-only";
import { adminDb } from "./supabase";
import { getOrderById } from "./orders";
import { formatINR } from "./money";

/**
 * Emails the shop when an order is paid, using Resend (resend.com).
 *   RESEND_API_KEY      — from resend.com → API Keys
 *   ORDER_ALERT_EMAIL   — who gets the alert (comma-separated for several)
 *   ORDER_ALERT_FROM    — optional sender. Until a domain is verified in Resend,
 *                         keep the default; it can only send to the Resend account's own email.
 * If the key or email is missing, nothing is sent (orders still work).
 */
const esc = (s: string) => s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

export async function notifyNewOrder(orderId: string) {
  const key = process.env.RESEND_API_KEY;
  const to = (process.env.ORDER_ALERT_EMAIL ?? "").split(",").map((s) => s.trim()).filter(Boolean);
  if (!key || !to.length) return;

  const db = adminDb();
  // Claim the alert first, so the browser and the webhook never both send it.
  const { data: claimed } = await db
    .from("orders")
    .update({ alert_sent_at: new Date().toISOString() })
    .eq("id", orderId)
    .is("alert_sent_at", null)
    .select("id")
    .maybeSingle();
  if (!claimed) return;

  const order = await getOrderById(orderId);
  if (!order) return;

  const site = process.env.URL ?? "https://spacecraft-lucknow-preview.netlify.app"; // Netlify sets URL
  const items = order.items.map((i) => `${i.productName} — ${i.variantLabel} (${i.sku}) × ${i.quantity} = ${formatINR(i.lineTotalPaise)}`);
  const text = [
    `New paid order ${order.orderNumber} — ${formatINR(order.totalPaise)}`,
    "",
    ...items,
    "",
    `Customer: ${order.customerName}, +91 ${order.customerPhone}, ${order.customerEmail}`,
    order.customerGstin ? `Business: ${order.customerBusinessName} — GSTIN ${order.customerGstin}` : "",
    `Invoice: ${order.invoiceNumber ?? "—"}`,
    `Address: ${order.address.join(", ")}`,
    order.notes ? `Notes: ${order.notes}` : "",
    "",
    `Open in admin: ${site}/admin/orders/${order.id}`,
  ].join("\n");

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: process.env.ORDER_ALERT_FROM || "Space Craft Orders <onboarding@resend.dev>",
        to,
        subject: `🛒 New order ${order.orderNumber} — ${formatINR(order.totalPaise)}`,
        text,
        html: `<pre style="font:14px/1.5 sans-serif;white-space:pre-wrap">${esc(text)}</pre>`,
      }),
      signal: AbortSignal.timeout(6000),
    });
    if (!res.ok) throw new Error(`Resend ${res.status}: ${await res.text()}`);
  } catch (e) {
    console.error("Order alert email failed", e);
    // Let the next confirmation (e.g. the webhook) try again.
    await db.from("orders").update({ alert_sent_at: null }).eq("id", orderId);
  }
}
