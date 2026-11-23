# Space Craft shop — setup guide

Plain steps for switching on the admin panel and online payments.

## How the pieces fit

```
Customer's browser ──► Next.js site on Netlify ──► Supabase (database + photos)
                              │
                              └──► Razorpay (payments)
```

- **Supabase** stores categories, brands, products, options (variants), stock, photos and orders.
- **The website** reads the catalogue, takes orders and talks to Razorpay. Secret keys stay on the server.
- **Razorpay** takes the money. The site only marks an order "paid" after it checks Razorpay's signature.

## 1. Database (done)

Project **Spacecraft** (`abmjkwdnggqejhuvacth`, Mumbai). The tables come from
`supabase/migrations/0001_shop.sql` and `0002_grants.sql`. `supabase/seed.sql`
added the 11 categories plus the labelled sample brands/products.

Security: the public can only *read* active catalogue rows. Orders, stock and
admin changes need the server's secret key. Public sign-up is switched off.

## 2. Create the admin login

1. Supabase Dashboard → **Authentication → Users → Add user → Create new user**.
   Enter the admin's email and a strong password, tick **Auto Confirm User**.
2. Copy the new user's **UID**.
3. Supabase Dashboard → **SQL Editor**, run (paste the UID):
   ```sql
   insert into admins (user_id) values ('PASTE-UID-HERE');
   ```
4. Open `/admin` on the site and log in.

To remove someone's admin access: `delete from admins where user_id = '...';`

## 3. Environment variables (Netlify)

Netlify → site **spacecraft-lucknow-preview** → Site configuration → Environment variables.
Names are listed in `.env.example`:

| Name | Where it comes from |
| --- | --- |
| `SUPABASE_URL` | `https://abmjkwdnggqejhuvacth.supabase.co` |
| `SUPABASE_PUBLISHABLE_KEY` | Supabase → Project Settings → API Keys (`sb_publishable_…`) |
| `SUPABASE_SECRET_KEY` | Same page (`sb_secret_…`) — keep private |
| `RAZORPAY_KEY_ID` | Razorpay Dashboard (Test mode) → API Keys (`rzp_test_…`) |
| `RAZORPAY_KEY_SECRET` | Shown once when you generate the key — keep private |
| `RAZORPAY_WEBHOOK_SECRET` | The secret you choose in step 4 |
| `DELIVERY_FEE_PAISE` | Optional. `0` = no delivery charge |
| `RESEND_API_KEY` | resend.com → API Keys (for new-order emails) |
| `ORDER_ALERT_EMAIL` | Who receives new-order emails |

After changing variables, **redeploy** — some pages read them at build time.

## 4. Razorpay (test mode first)

1. Sign up at razorpay.com. Keep the dashboard on **Test Mode**.
2. Account & Settings → **API Keys → Generate Test Key**. Put the two values in Netlify (step 3).
3. Account & Settings → **Webhooks → Add New Webhook**:
   - URL: `https://spacecraft-lucknow-preview.netlify.app/api/razorpay/webhook`
   - Secret: any long random text → same value in `RAZORPAY_WEBHOOK_SECRET`
   - Events: `payment.captured` and `order.paid`
4. Redeploy, add a product **with a price and stock**, and buy it with Razorpay's
   test card / test UPI from their docs. No real money moves in test mode.

**Going live later:** complete Razorpay KYC, generate **Live** keys (`rzp_live_…`),
add a live webhook, swap the variables and redeploy. Before that, confirm GST
display, delivery charges, refund/cancellation policy and terms — Razorpay asks for
these pages on the website.

## 5. New-order email alert

1. Make a free account at resend.com **with the email that should receive the alerts**
   (e.g. the shop's email), and create an API key.
2. Put it in `RESEND_API_KEY`, and that same email in `ORDER_ALERT_EMAIL`. Redeploy.
3. Every paid order then sends one email with the items, customer, address and a link to the admin page.

Until a domain (e.g. spacecraftlucknow.com) is verified in Resend, it can only email the
account's own address. To send to several people, verify the domain and set `ORDER_ALERT_FROM`
(e.g. `Space Craft Orders <orders@spacecraftlucknow.com>`).

## 6. Daily use (admin panel)

Staff guide (Hinglish): [`STAFF-GUIDE.md`](STAFF-GUIDE.md).


- **Products & stock** → New product → save → add photos → add options (size/colour) with price and stock.
  Empty price = "price on request" (not sold online).
- **Orders** → open an order → change status (Paid → Being prepared → Out for delivery → Delivered).
  Cancelling a paid order puts the stock back; refund the money in the Razorpay Dashboard.
- Stock goes down automatically when an order is paid. Every change is logged on the product page.

## How payment is verified

1. Checkout: the server re-reads prices and stock from the database (the browser's numbers are ignored),
   saves the order as "waiting for payment" and creates a Razorpay order for that exact amount.
2. The Razorpay window takes the payment and returns `order_id`, `payment_id` and `signature`.
3. The server checks `HMAC-SHA256(order_id|payment_id, key_secret) == signature`. Only then is the order
   marked paid and the stock reduced (once — a repeat does nothing).
4. Backup: Razorpay's webhook does the same check with the webhook secret, in case the customer closes the tab.

Known limit: two customers can pay for the last unit at the same moment; stock then stops at 0 and the
team sorts it out manually.
