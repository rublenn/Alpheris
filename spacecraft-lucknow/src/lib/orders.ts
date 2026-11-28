import "server-only";
import { adminDb } from "./supabase";

export const ORDER_STATUSES = [
  "pending_payment",
  "payment_failed",
  "paid",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const statusLabel: Record<OrderStatus, string> = {
  pending_payment: "Waiting for payment",
  payment_failed: "Payment failed",
  paid: "Paid — order received",
  processing: "Being prepared",
  shipped: "Out for delivery",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

/** Colour of the status label in the admin panel. */
export const statusTone: Record<OrderStatus, "muted" | "good" | "warn" | "bad" | "gold"> = {
  pending_payment: "muted",
  payment_failed: "bad",
  paid: "gold",
  processing: "warn",
  shipped: "warn",
  delivered: "good",
  cancelled: "bad",
};

/** Delivery charge added to every order, in paise. Set DELIVERY_FEE_PAISE in the environment. */
export function deliveryFeePaise() {
  const n = Number(process.env.DELIVERY_FEE_PAISE ?? 0);
  return Number.isInteger(n) && n >= 0 ? n : 0;
}

export type OrderView = {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  address: string[];
  notes: string;
  subtotalPaise: number;
  shippingPaise: number;
  totalPaise: number;
  createdAt: string;
  paidAt: string | null;
  razorpayOrderId: string | null;
  razorpayPaymentId: string | null;
  customerGstin: string | null;
  customerBusinessName: string | null;
  invoiceNumber: string | null;
  invoiceDate: string | null;
  city: string;
  pincode: string;
  items: {
    id: string;
    productName: string;
    variantLabel: string;
    sku: string;
    unitPricePaise: number;
    quantity: number;
    lineTotalPaise: number;
    gstRate: number;
    hsnCode: string | null;
  }[];
  history: { status: string; note: string | null; createdAt: string }[];
};

const SELECT = `id, order_number, status, customer_name, customer_phone, customer_email,
  address_line1, address_line2, city, state, pincode, notes, subtotal_paise, shipping_paise, total_paise,
  created_at, paid_at, razorpay_order_id, razorpay_payment_id, access_token,
  customer_gstin, customer_business_name, invoice_number, invoice_date,
  order_items(id, product_name, variant_label, sku, unit_price_paise, quantity, line_total_paise, gst_rate, hsn_code),
  order_status_history(status, note, created_at)`;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toView(o: any): OrderView {
  return {
    id: o.id,
    orderNumber: o.order_number,
    status: o.status,
    customerName: o.customer_name,
    customerPhone: o.customer_phone,
    customerEmail: o.customer_email,
    address: [o.address_line1, o.address_line2, `${o.city}, ${o.state} ${o.pincode}`].filter(Boolean),
    notes: o.notes,
    subtotalPaise: o.subtotal_paise,
    shippingPaise: o.shipping_paise,
    totalPaise: o.total_paise,
    createdAt: o.created_at,
    paidAt: o.paid_at,
    razorpayOrderId: o.razorpay_order_id,
    razorpayPaymentId: o.razorpay_payment_id,
    customerGstin: o.customer_gstin,
    customerBusinessName: o.customer_business_name,
    invoiceNumber: o.invoice_number,
    invoiceDate: o.invoice_date,
    city: o.city,
    pincode: o.pincode,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    items: (o.order_items ?? []).map((i: any) => ({
      id: i.id,
      productName: i.product_name,
      variantLabel: i.variant_label,
      sku: i.sku,
      unitPricePaise: i.unit_price_paise,
      quantity: i.quantity,
      lineTotalPaise: i.line_total_paise,
      gstRate: Number(i.gst_rate),
      hsnCode: i.hsn_code,
    })),
    history: [...(o.order_status_history ?? [])]
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .sort((a: any, b: any) => a.created_at.localeCompare(b.created_at))
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .map((h: any) => ({ status: h.status, note: h.note, createdAt: h.created_at })),
  };
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Order confirmation page: needs the secret token from the link. */
export async function getOrderWithToken(orderNumber: string, token: string) {
  if (!UUID.test(token)) return null;
  const { data } = await adminDb()
    .from("orders")
    .select(SELECT)
    .eq("order_number", orderNumber.toUpperCase())
    .eq("access_token", token)
    .maybeSingle();
  return data ? toView(data) : null;
}

export function normalisePhone(input: string) {
  const digits = input.replace(/\D/g, "");
  return digits.length === 12 && digits.startsWith("91") ? digits.slice(2) : digits;
}

/** Tracking page: order number + the phone number used at checkout. */
export async function trackOrder(orderNumber: string, phone: string) {
  const { data } = await adminDb()
    .from("orders")
    .select(SELECT)
    .eq("order_number", orderNumber.trim().toUpperCase())
    .eq("customer_phone", normalisePhone(phone))
    .maybeSingle();
  return data ? toView(data) : null;
}

export async function getOrderById(id: string) {
  if (!UUID.test(id)) return null;
  const { data } = await adminDb().from("orders").select(SELECT).eq("id", id).maybeSingle();
  return data ? toView(data) : null;
}

/** Customer-facing timeline steps. */
export const TRACK_STEPS: OrderStatus[] = ["paid", "processing", "shipped", "delivered"];

/** Strips the order down to what the customer may see. */
export function toPublicOrder(o: OrderView, opts: { hideAddress?: boolean } = {}) {
  return {
    orderNumber: o.orderNumber,
    status: o.status,
    statusText: statusLabel[o.status],
    invoiceNumber: o.invoiceNumber,
    createdAt: o.createdAt,
    customerName: opts.hideAddress ? o.customerName.split(" ")[0] : o.customerName,
    address: opts.hideAddress ? [o.address[o.address.length - 1]] : o.address,
    subtotalPaise: o.subtotalPaise,
    shippingPaise: o.shippingPaise,
    totalPaise: o.totalPaise,
    items: o.items.map((i) => ({
      id: i.id,
      productName: i.productName,
      variantLabel: i.variantLabel,
      quantity: i.quantity,
      lineTotalPaise: i.lineTotalPaise,
    })),
    history: o.history.map((h) => ({
      status: h.status,
      label: statusLabel[h.status as OrderStatus] ?? h.status,
      note: h.note,
      createdAt: h.createdAt,
    })),
  };
}
