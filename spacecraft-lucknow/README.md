# Space Craft Lucknow — new website

A bright, premium e-commerce website for Space Craft Lucknow (interior and architectural materials).
This is a **preview build** on Netlify. It is not connected to the live domain and is hidden from Google.

## Run it

```bash
npm install
```

```bash
npm run dev
```

Then open http://localhost:3000

## Status

| Phase | What | Status |
| --- | --- | --- |
| 1 | Foundation, design system, homepage | Done |
| 2 | Supabase database: categories, brands, products, variants, stock, orders | Done |
| 3 | Admin panel at `/admin` (login, catalogue, photos, prices, stock, orders) | Done |
| 4 | Category, brand, product and search pages; cart and checkout | Done |
| 5 | Razorpay payments (test mode), order confirmation and tracking | Done — needs Razorpay keys |

**Setup steps (admin login, Razorpay keys, webhook, Netlify):** see [`SETUP.md`](SETUP.md).

## Where things live

- `src/lib/site.ts` — business details (phone, address, hours). Edit here, updates everywhere.
- `src/lib/shop.ts` — reads the catalogue from Supabase (cached; the admin panel refreshes it).
- `src/lib/orders.ts`, `src/actions/checkout.ts` — orders and the payment flow.
- `src/lib/razorpay.ts` — Razorpay order creation and signature checks (server only).
- `src/lib/admin-auth.ts`, `src/actions/admin.ts` — admin login and everything the admin panel can change.
- `src/app/(site)/` — the public website pages. `src/app/admin/` — the admin panel.
- `supabase/migrations/` — the database tables, security rules and order functions.
- `src/lib/catalog.ts` — illustrated texture data and the default category list (seed source).
- `src/app/globals.css` — the design system (colours, fonts).

## The "Find us" map

Uses Esri World Imagery (satellite) through the open-source MapLibre library.
No token is needed to run it. Before the public launch, check Esri's terms:
a free ArcGIS developer account / API key is the expected way to use it on a
business website.

## Important notes

- Sample brands and products are still in the database, clearly labelled "Sample", with no price.
  Replace or delete them in the admin panel once real products are added.
- Products without photos show the code-drawn illustrated texture.
- Products with no price show "Price on request" and an "Ask on WhatsApp" button; they cannot be bought online.
- Prices are stored in paise. Delivery charge is set with `DELIVERY_FEE_PAISE` (default 0).
