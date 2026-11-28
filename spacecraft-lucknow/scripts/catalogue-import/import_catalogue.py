# Imports one catalogue (one product, many design options) into Supabase.
# usage: python3 import_catalogue.py spec.json [--dry]
# spec: {product:{slug,name,category,brand,description,material,specifications,hsn,gst},
#        price_rupees, sku_prefix, page_image: "dir/pg-{p:03d}-{i:03d}.jpg",
#        clean_text_band: bool, items:[{label, finish, colour, dimensions, page, box:[x0,y0,x1,y1]}]}
import io, json, os, sys, uuid, urllib.request
from PIL import Image

URL = os.environ["SUPABASE_URL"]; KEY = os.environ["SUPABASE_SECRET_KEY"]
spec = json.load(open(sys.argv[1])); dry = "--dry" in sys.argv


def api(method, path, body=None, raw=None, ctype="application/json", extra=None):
    h = {"apikey": KEY, "Authorization": f"Bearer {KEY}", "Content-Type": ctype, **(extra or {})}
    data = raw if raw is not None else (json.dumps(body).encode() if body is not None else None)
    with urllib.request.urlopen(urllib.request.Request(URL + path, data=data, method=method, headers=h)) as r:
        t = r.read()
        return json.loads(t) if t else None


def crop(item):
    page = Image.open(spec["page_image"].format(p=item["page"], i=item["page"] - 1)).convert("RGB")
    box = item.get("box") or [round(v * (page.width if k % 2 == 0 else page.height)) for k, v in enumerate(item["fbox"])]
    im = page.crop(tuple(box))
    if spec.get("clean_text_band"):
        # Paint over the small "size" text printed across the middle of the sample chip
        # by copying the strip just above it.
        h = im.height; band = max(8, int(h * 0.045)); cy = h // 2
        im.paste(im.crop((0, cy - 3 * band, im.width, cy - band)), (0, cy - band))
    if max(im.size) > 1400:
        im.thumbnail((1400, 1400))
    buf = io.BytesIO(); im.save(buf, "JPEG", quality=88)
    return buf.getvalue(), im


items = spec["items"]
skus = [spec["sku_prefix"] + "-" + (it.get("sku") or it["label"].split(" · ")[0].replace(" ", "")) for it in items]
assert len(set(skus)) == len(skus), "duplicate SKU"

if dry:
    from PIL import ImageDraw
    W, T = 6, 220
    sheet = Image.new("RGB", (W * T, ((len(items) + W - 1) // W) * (T + 30)), "white"); d = ImageDraw.Draw(sheet)
    for n, it in enumerate(items):
        _, im = crop(it); im.thumbnail((T - 10, T - 10))
        x, y = (n % W) * T, (n // W) * (T + 30)
        sheet.paste(im, (x + 5, y + 5)); d.text((x + 5, y + T), f"{n+1}. {it['label']} (p{it['page']})", fill="red")
    out = sys.argv[1].replace(".json", "-preview.jpg"); sheet.save(out, quality=85); print("preview:", out, len(items), "items")
    sys.exit()

p = spec["product"]
cat = api("GET", f"/rest/v1/categories?slug=eq.{p['category']}&select=id")[0]["id"]
brand_id = None
if p.get("brand"):
    b = api("GET", f"/rest/v1/brands?slug=eq.{p['brand']['slug']}&select=id")
    brand_id = b[0]["id"] if b else api("POST", "/rest/v1/brands", {**p["brand"], "is_sample": False},
                                        extra={"Prefer": "return=representation"})[0]["id"]
existing = api("GET", f"/rest/v1/products?slug=eq.{p['slug']}&select=id,slug")
prod = existing[0] if existing and "--resume" in sys.argv else api("POST", "/rest/v1/products", {
    "slug": p["slug"], "name": p["name"], "category_id": cat, "brand_id": brand_id,
    "description": p["description"], "material": p.get("material"), "specifications": p.get("specifications", {}),
    "hsn_code": p.get("hsn", "3920"), "gst_rate": p.get("gst", 18), "is_featured": True, "is_sample": False,
}, extra={"Prefer": "return=representation"})[0]
if isinstance(prod, list): prod = prod[0]
print("product", prod["slug"], prod["id"])
have = {v["sku"]: v for v in api("GET", f"/rest/v1/variants?product_id=eq.{prod['id']}&select=id,sku,image_url")}

for n, (it, sku) in enumerate(zip(items, skus), 1):
    if sku in have and have[sku]["image_url"]:
        continue
    v = have.get(sku) or api("POST", "/rest/v1/variants", {
        "product_id": prod["id"], "sku": sku, "label": it["label"], "colour": it.get("colour"),
        "finish": it.get("finish"), "dimensions": it.get("dimensions"),
        "price_paise": spec["price_rupees"] * 100, "stock": 0, "sort_order": n,
    }, extra={"Prefer": "return=representation"})[0]
    data, _ = crop(it)
    path = f"variant/{v['id']}/{uuid.uuid4()}.jpg"
    api("POST", f"/storage/v1/object/product-images/{path}", raw=data, ctype="image/jpeg")
    api("PATCH", f"/rest/v1/variants?id=eq.{v['id']}",
        {"image_url": f"{URL}/storage/v1/object/public/product-images/{path}", "image_path": path})
    print(n, sku, "|", it["label"])
