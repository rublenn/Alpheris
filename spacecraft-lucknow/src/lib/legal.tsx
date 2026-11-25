import Link from "next/link";
import type { ReactNode } from "react";
import { site } from "./site";

/**
 * Policy pages. Written from details confirmed by the business (Nov 2026).
 * Have them reviewed by your CA / lawyer before the public launch.
 */
export type LegalPage = { slug: string; title: string; summary: string; body: ReactNode };

const updated = "25 November 2026";
const contactLine = (
  <>
    {site.legalName}, {site.address}. Phone / WhatsApp {site.phoneDisplay}, email{" "}
    <a href={`mailto:${site.email}`}>{site.email}</a>.
  </>
);

export const legalPages: LegalPage[] = [
  {
    slug: "returns",
    title: "Return & Refund Policy",
    summary: "Returns within 7 days, refunds as shop credit or bank transfer.",
    body: (
      <>
        <h2>Returns</h2>
        <ul>
          <li>You can return an item within <strong>7 days of delivery</strong>.</li>
          <li>The item must be in its original, unused and saleable condition.</li>
          <li>
            We cannot take back items that have been <strong>used, cut, trimmed or altered</strong> in any way
            (for example, sheets or panels cut to size), or that were damaged after delivery.
          </li>
          <li>
            To start a return, call or WhatsApp us on {site.phoneDisplay} with your order number. Our team
            checks the request and tells you whether the item can be returned.
          </li>
          <li>
            <strong>Return transport is arranged and paid for by the customer</strong>, using {site.deliveryPartner}{" "}
            (or a similar service), to our address: {site.address}.
          </li>
        </ul>

        <h2>Refunds</h2>
        <ul>
          <li>We check the returned item when it reaches us.</li>
          <li>
            Once the return is accepted, the refund is completed within <strong>7 days</strong>, in one of two
            ways — you choose:
            <ul>
              <li><strong>Shop credit</strong> for a future purchase at {site.fullName}, or</li>
              <li><strong>Bank transfer</strong> to your account.</li>
            </ul>
          </li>
          <li>Delivery charges paid to {site.deliveryPartner} are not refunded by us.</li>
        </ul>

        <h2>Cancelling an order</h2>
        <p>
          You can cancel an order <strong>before it is dispatched</strong> by calling or messaging us with your order
          number. The amount you paid is refunded as described above. After dispatch, the return rules apply.
        </p>
        <p>
          If we cannot supply an item you paid for (for example, it went out of stock), we will tell you and refund
          that item in full.
        </p>
      </>
    ),
  },
  {
    slug: "shipping",
    title: "Shipping & Delivery Policy",
    summary: "Delivery inside Lucknow through Porter; charge paid separately.",
    body: (
      <>
        <h2>Where we deliver</h2>
        <p>Online orders are delivered <strong>only within {site.deliveryArea}</strong>.</p>

        <h2>How delivery works</h2>
        <ul>
          <li>Orders are delivered through <strong>{site.deliveryPartner}</strong>, a goods-transport service.</li>
          <li>After your payment, our team calls you to confirm the order and fix a delivery time.</li>
          <li>
            <strong>The delivery charge is not included in the online payment.</strong> It is set by{" "}
            {site.deliveryPartner} based on distance and the vehicle needed (larger items such as plywood or doors may
            need a bigger vehicle). Our team tells you the charge before dispatch, and it is paid separately.
          </li>
          <li>Please check the items when they arrive and tell us straight away if anything is wrong or damaged.</li>
        </ul>

        <h2>Collecting from the showroom</h2>
        <p>
          You are welcome to collect your order from our showroom: {site.address}. {site.days}, {site.hours}.
        </p>

        <h2>Order status</h2>
        <p>
          You can follow your order on the <Link href="/track">Track order</Link> page with your order number and mobile
          number.
        </p>
      </>
    ),
  },
  {
    slug: "terms",
    title: "Terms & Conditions",
    summary: "The rules for buying from this website.",
    body: (
      <>
        <h2>Who we are</h2>
        <p>
          This website is run by <strong>{site.legalName}</strong> (GSTIN {site.gstin}), trading as {site.fullName}.
          Address: {site.address}.
        </p>

        <h2>Products and prices</h2>
        <ul>
          <li>All prices are in Indian Rupees and <strong>include GST</strong>.</li>
          <li>Delivery charges are separate — see the <Link href="/legal/shipping">Shipping &amp; Delivery Policy</Link>.</li>
          <li>
            Colours and textures on screen can look different from the real material. Natural materials vary from
            piece to piece. Please visit the showroom to see samples if the exact look matters.
          </li>
          <li>Products marked “Sample” are for display only and cannot be bought.</li>
          <li>Items marked “Price on request” are not sold online; contact us for a quote.</li>
        </ul>

        <h2>Orders and payment</h2>
        <ul>
          <li>Payments are processed securely by Razorpay. We do not see or store your card or bank details.</li>
          <li>Your order is confirmed once the payment is received. You get an order number and a GST invoice.</li>
          <li>
            If an item becomes unavailable or a price was shown wrongly by mistake, we may cancel that item and refund
            what you paid for it in full.
          </li>
        </ul>

        <h2>Delivery, returns and refunds</h2>
        <p>
          See the <Link href="/legal/shipping">Shipping &amp; Delivery Policy</Link> and the{" "}
          <Link href="/legal/returns">Return &amp; Refund Policy</Link>.
        </p>

        <h2>Using the website</h2>
        <p>
          Please give correct contact and delivery details. Do not misuse the website or try to interfere with how it
          works. Content on this website belongs to {site.legalName} or its suppliers.
        </p>

        <h2>Law and disputes</h2>
        <p>
          These terms are governed by the laws of India. Disputes are subject to the jurisdiction of the courts at
          Lucknow, Uttar Pradesh.
        </p>

        <h2>Contact</h2>
        <p>{contactLine}</p>
      </>
    ),
  },
  {
    slug: "privacy",
    title: "Privacy Policy",
    summary: "What personal information we collect and how we use it.",
    body: (
      <>
        <h2>What we collect</h2>
        <ul>
          <li>When you order: your name, mobile number, email, delivery address and, if you give it, your business name and GSTIN.</li>
          <li>Payment details are collected by Razorpay, not by us. We only receive the payment status and reference.</li>
          <li>Your cart is saved only in your own browser, on your device.</li>
        </ul>

        <h2>How we use it</h2>
        <ul>
          <li>To process, deliver and support your order, and to issue the GST invoice.</li>
          <li>To contact you about your order (call, WhatsApp, SMS or email).</li>
          <li>To keep accounting and tax records as the law requires.</li>
        </ul>
        <p>We do not sell your information, and we do not use it for advertising.</p>

        <h2>Who we share it with</h2>
        <ul>
          <li><strong>Razorpay</strong> — to take the payment.</li>
          <li><strong>{site.deliveryPartner}</strong> — your name, phone and address, to deliver the order.</li>
          <li>Service providers that host and run this website and its emails, only to provide that service.</li>
          <li>Government or authorities, when the law requires it.</li>
        </ul>

        <h2>How long we keep it</h2>
        <p>Order and invoice records are kept as long as tax and accounting laws require. Other details are kept only as long as needed.</p>

        <h2>Your choices</h2>
        <p>
          You can ask us to show, correct or delete your personal information (except records the law requires us to
          keep). Contact: {contactLine}
        </p>

        <h2>Cookies</h2>
        <p>
          The website uses your browser’s storage to remember your cart, and a login cookie for staff. We do not use
          advertising or tracking cookies.
        </p>
      </>
    ),
  },
  {
    slug: "contact",
    title: "Contact Us",
    summary: "Address, phone, email and GST details.",
    body: (
      <>
        <dl>
          <dt>Business</dt>
          <dd>{site.legalName} (trading as {site.fullName})</dd>
          <dt>GSTIN</dt>
          <dd>{site.gstin}</dd>
          <dt>Address</dt>
          <dd>{site.address}</dd>
          <dt>Phone / WhatsApp</dt>
          <dd><a href={site.phoneHref}>{site.phoneDisplay}</a></dd>
          <dt>Email</dt>
          <dd><a href={`mailto:${site.email}`}>{site.email}</a></dd>
          <dt>Showroom hours</dt>
          <dd>{site.days}, {site.hours}</dd>
        </dl>
      </>
    ),
  },
];

export const legalUpdated = updated;
