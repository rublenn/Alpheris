# Catalogue import

`import_catalogue.py` adds one supplier catalogue to the shop as **one product with many design options**
(each option = one design code, with its own photo cropped from the supplier PDF). New options start with
**stock 0**, so nothing can be bought until staff enter real stock in the admin panel.

Specs used on 26 Nov 2026 (prices from the PDF file names, HSN 3920 for now):

| Spec | Product | Price | Designs |
| --- | --- | --- | --- |
| spec-liner.json | Asian Liner Laminates | ₹499 | 48 |
| spec-foam.json | DSPL Self-adhesive Foam Wall Sticker | ₹599 | 21 |
| spec-mosaic.json | GM Glass Mosaic | ₹299 | 74 |
| spec-fabrico.json | Fabrico 3D Emboss Sheet | ₹11,999 | 27 |
| spec-a08.json | Asian Noor 0.8 mm Laminates | ₹950 | 205 |

Run (needs SUPABASE_URL and SUPABASE_SECRET_KEY): `python3 import_catalogue.py spec.json --dry` to preview, then without `--dry`.
`page_image` points to page images extracted from the PDF (pdfimages / pdftoppm / pypdfium2).
