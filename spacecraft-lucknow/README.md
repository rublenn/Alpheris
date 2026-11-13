# Space Craft Lucknow — new website

A bright, premium e-commerce website for Space Craft Lucknow (interior and architectural materials).
This is a **local preview build**. It is not deployed and is not connected to the live domain.

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
| 2 | Category, brand, product and search pages | Next |
| 3 | Cart and checkout | Planned |
| 4 | Supabase database, login, admin dashboard | Planned |
| 5 | Razorpay payments, SEO, deployment | Planned |

## Where things live

- `src/lib/site.ts` — business details (phone, address, hours). Edit here, updates everywhere.
- `src/lib/catalog.ts` — catalogue structure (Category → Brand → Product → Variant) with **sample data**.
- `src/app/globals.css` — the design system (colours, fonts).
- `src/components/home/` — one file per homepage section.
- `src/components/ui/` — reusable pieces (buttons, reveal animations, material textures).
- `src/components/layout/` — header and footer.

## Important notes

- All brands and products are clearly labelled samples. No real prices, specs or stock are shown.
- Material images are code-drawn illustrations until real product photos are supplied.
- "Enquire" buttons and the enquiry form open WhatsApp. No data is stored and there is no payment yet.
