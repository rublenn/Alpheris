"use server";

import { revalidateTag } from "next/cache";
import { adminDb } from "@/lib/supabase";
import { CATALOG_TAG, getCatalog } from "@/lib/shop";
import { deliveryFeePaise, normalisePhone } from "@/lib/orders";
import {
  createRazorpayOrder,
  isRazorpayConfigured,
  isTestMode,
  razorpayKeyId,
  verifyPaymentSignature,
} from "@/lib/razorpay";
import { unitPrice } from "@/lib/shop-types";
import { notifyNewOrder } from "@/lib/notify";

export type CartLine = {
  variantId: string;
  productSlug: string;
  productName: string;
  variantLabel: string;
  sku: string;
  unitPricePaise: number | null;
  stock: number;
  image: string | null;
  swatch: import("@/lib/catalog").Swatch | null;
};

/** Fresh prices and stock for the variants in the cart (the browser copy may be old). */
export async function getCartLines(variantIds: string[]): Promise<CartLine[]> {
  const wanted = new Set(variantIds.slice(0, 50));
  const { products } = await getCatalog();
  const lines: CartLine[] = [];
  for (const p of products) {
    for (const v of p.variants) {
      if (!wanted.has(v.id)) continue;
      lines.push({
        variantId: v.id,
        productSlug: p.slug,
        productName: p.name,
        variantLabel: v.label,
        sku: v.sku,
        unitPricePaise: unitPrice(v),
        stock: v.stock,
        image: p.images[0]?.url ?? null,
        swatch: p.swatch ?? p.category.swatch,
      });
    }
  }
  return lines;
}

export type CustomerInput = {
  name: string;
  phone: string;
  email: string;
  address_line1: string;
  address_line2: string;
  city: string;
  state: string;
  pincode: string;
  notes: string;
};

export type CheckoutResult =
  | {
      ok: true;
      payment: {
        keyId: string;
        razorpayOrderId: string;
        amountPaise: number;
        orderNumber: string;
        token: string;
        testMode: boolean;
        prefill: { name: string; email: string; contact: string };
      };
    }
  | { ok: false; error: string; fields?: Partial<Record<keyof CustomerInput, string>> };

function validate(c: CustomerInput) {
  const fields: Partial<Record<keyof CustomerInput, string>> = {};
  const t = (s: unknown) => String(s ?? "").trim();
  const clean: CustomerInput = {
    name: t(c.name),
    phone: normalisePhone(t(c.phone)),
    email: t(c.email).toLowerCase(),
    address_line1: t(c.address_line1),
    address_line2: t(c.address_line2),
    city: t(c.city),
    state: t(c.state),
    pincode: t(c.pincode),
    notes: t(c.notes).slice(0, 500),
  };
  if (clean.name.length < 2 || clean.name.length > 80) fields.name = "Please enter your full name.";
  if (!/^[6-9]\d{9}$/.test(clean.phone)) fields.phone = "Please enter a 10-digit Indian mobile number.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(clean.email) || clean.email.length > 120)
    fields.email = "Please enter a valid email address.";
  if (clean.address_line1.length < 5 || clean.address_line1.length > 200)
    fields.address_line1 = "Please enter the house / flat number and street.";
  if (clean.address_line2.length > 200) fields.address_line2 = "This line is too long.";
  if (clean.city.length < 2 || clean.city.length > 60) fields.city = "Please enter the city.";
  if (clean.state.length < 2 || clean.state.length > 60) fields.state = "Please enter the state.";
  if (!/^[1-9]\d{5}$/.test(clean.pincode)) fields.pincode = "Please enter a 6-digit PIN code.";
  return { clean, fields };
}

function friendly(message: string) {
  if (message.includes("OUT_OF_STOCK")) return "One of the items no longer has enough stock. Please update your cart.";
  if (message.includes("PRICE_ON_REQUEST")) return "One of the items is price-on-request and cannot be paid online.";
  if (message.includes("ITEM_UNAVAILABLE")) return "One of the items is no longer available. Please update your cart.";
  if (message.includes("CART_EMPTY")) return "Your cart is empty.";
  return "Something went wrong while placing the order. Please try again.";
}

/** Step 1 of payment: save the order (prices from the database) and open a Razorpay order. */
export async function startCheckout(
  items: { variantId: string; quantity: number }[],
  customer: CustomerInput,
): Promise<CheckoutResult> {
  if (!isRazorpayConfigured()) {
    return { ok: false, error: "Online payment is not switched on yet. Please send an enquiry on WhatsApp instead." };
  }
  const { clean, fields } = validate(customer);
  if (Object.keys(fields).length) return { ok: false, error: "Please check the highlighted fields.", fields };

  const cartItems = (Array.isArray(items) ? items : [])
    .slice(0, 50)
    .map((i) => ({ variant_id: String(i.variantId), quantity: Math.floor(Number(i.quantity)) }));

  const db = adminDb();
  const { data: order, error } = await db.rpc("create_pending_order", {
    p_customer: clean,
    p_items: cartItems,
    p_shipping_paise: deliveryFeePaise(),
  });
  if (error || !order) return { ok: false, error: friendly(error?.message ?? "") };

  try {
    const rp = await createRazorpayOrder({
      amountPaise: order.total_paise,
      receipt: order.order_number,
      notes: { order_number: order.order_number },
    });
    await db.from("orders").update({ razorpay_order_id: rp.id }).eq("id", order.id);
    return {
      ok: true,
      payment: {
        keyId: razorpayKeyId(),
        razorpayOrderId: rp.id,
        amountPaise: order.total_paise,
        orderNumber: order.order_number,
        token: order.access_token,
        testMode: isTestMode(),
        prefill: { name: clean.name, email: clean.email, contact: `+91${clean.phone}` },
      },
    };
  } catch (e) {
    console.error(e);
    await db.rpc("set_order_status", {
      p_order_id: order.id,
      p_status: "cancelled",
      p_note: "Payment could not be started",
    });
    return { ok: false, error: "The payment window could not be opened. Please try again in a minute." };
  }
}

/** Step 2: Razorpay says "paid" in the browser — we check the signature on the server. */
export async function confirmPayment(input: {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}): Promise<{ ok: true; orderNumber: string; token: string } | { ok: false; error: string }> {
  const orderId = String(input?.razorpay_order_id ?? "");
  const paymentId = String(input?.razorpay_payment_id ?? "");
  const signature = String(input?.razorpay_signature ?? "");
  if (!verifyPaymentSignature(orderId, paymentId, signature)) {
    return { ok: false, error: "We could not verify this payment. If money was deducted, please contact us with your order number." };
  }
  const { data: order, error } = await adminDb().rpc("mark_order_paid", {
    p_razorpay_order_id: orderId,
    p_payment_id: paymentId,
  });
  if (error || !order) {
    console.error(error);
    return { ok: false, error: "Payment received, but we could not update the order. Please contact us — your money is safe." };
  }
  revalidateTag(CATALOG_TAG, "max"); // stock changed
  await notifyNewOrder(order.id);
  return { ok: true, orderNumber: order.order_number, token: order.access_token };
}

/** Customer closed the payment window or it failed. */
export async function markPaymentFailed(razorpayOrderId: string) {
  const db = adminDb();
  const { data } = await db
    .from("orders")
    .select("id, status")
    .eq("razorpay_order_id", String(razorpayOrderId))
    .maybeSingle();
  if (data?.status === "pending_payment") {
    await db.rpc("set_order_status", { p_order_id: data.id, p_status: "payment_failed", p_note: "Payment failed or was cancelled" });
  }
}
