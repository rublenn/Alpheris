"use server";

import { refresh, updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin, signInAdmin, signOutAdmin } from "@/lib/admin-auth";
import { adminDb, PRODUCT_IMAGE_BUCKET } from "@/lib/supabase";
import { CATALOG_TAG } from "@/lib/shop";
import { rupeesToPaise } from "@/lib/money";
import { ORDER_STATUSES } from "@/lib/orders";

/**
 * Everything the admin panel can change. EVERY action starts with
 * requireAdmin(), so these cannot be used without logging in.
 */

export type FormState = { error?: string; ok?: string };

const text = (fd: FormData, key: string) => String(fd.get(key) ?? "").trim();
const flag = (fd: FormData, key: string) => fd.get(key) === "on";
const int = (fd: FormData, key: string, fallback = 0) => {
  const n = parseInt(text(fd, key), 10);
  return Number.isFinite(n) ? n : fallback;
};

async function slugify(input: string) {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function dbError(message: string) {
  if (message.includes("duplicate key") && message.includes("slug")) return "That URL name (slug) is already used. Choose another.";
  if (message.includes("duplicate key") && message.includes("sku")) return "That SKU is already used by another variant.";
  if (message.includes("violates foreign key") || message.includes("still referenced"))
    return "This is still in use (for example, products are linked to it). Move or delete those first.";
  if (message.includes("sale_price")) return "Sale price must be lower than the normal price.";
  if (message.includes("price_paise")) return "Prices must be at least ₹1.";
  return `Could not save: ${message}`;
}

/** After a catalogue change: clear the shop cache and re-render the admin page. */
function catalogChanged() {
  updateTag(CATALOG_TAG);
  refresh();
}

// ───────────── login ─────────────

export async function loginAction(_prev: FormState, fd: FormData): Promise<FormState> {
  const error = await signInAdmin(text(fd, "email"), String(fd.get("password") ?? ""));
  if (error) return { error };
  redirect("/admin");
}

export async function logoutAction() {
  await signOutAdmin();
  redirect("/admin/login");
}

// ───────────── categories ─────────────

export async function saveCategory(_prev: FormState, fd: FormData): Promise<FormState> {
  await requireAdmin();
  const id = text(fd, "id");
  const name = text(fd, "name");
  if (!name) return { error: "Name is required." };
  const row = {
    name,
    slug: (await slugify(text(fd, "slug") || name)) || "category",
    blurb: text(fd, "blurb"),
    sort_order: int(fd, "sort_order"),
    is_active: flag(fd, "is_active"),
  };
  const db = adminDb();
  const { error } = id ? await db.from("categories").update(row).eq("id", id) : await db.from("categories").insert(row);
  if (error) return { error: dbError(error.message) };
  catalogChanged();
  return { ok: id ? "Category saved." : `Category “${name}” added.` };
}

export async function deleteCategory(fd: FormData) {
  await requireAdmin();
  const { error } = await adminDb().from("categories").delete().eq("id", text(fd, "id"));
  if (error) redirect(`/admin/categories?error=${encodeURIComponent(dbError(error.message))}`);
  catalogChanged();
  redirect("/admin/categories");
}

// ───────────── brands ─────────────

export async function saveBrand(_prev: FormState, fd: FormData): Promise<FormState> {
  await requireAdmin();
  const id = text(fd, "id");
  const name = text(fd, "name");
  if (!name) return { error: "Name is required." };
  const row = {
    name,
    slug: (await slugify(text(fd, "slug") || name)) || "brand",
    description: text(fd, "description"),
    sort_order: int(fd, "sort_order"),
    is_active: flag(fd, "is_active"),
    is_sample: flag(fd, "is_sample"),
  };
  const db = adminDb();
  const { error } = id ? await db.from("brands").update(row).eq("id", id) : await db.from("brands").insert(row);
  if (error) return { error: dbError(error.message) };
  catalogChanged();
  return { ok: id ? "Brand saved." : `Brand “${name}” added.` };
}

export async function deleteBrand(fd: FormData) {
  await requireAdmin();
  // Products of this brand are kept; their brand becomes empty.
  const { error } = await adminDb().from("brands").delete().eq("id", text(fd, "id"));
  if (error) redirect(`/admin/brands?error=${encodeURIComponent(dbError(error.message))}`);
  catalogChanged();
  redirect("/admin/brands");
}

// ───────────── products ─────────────

function parseSpecs(input: string) {
  const specs: Record<string, string> = {};
  for (const line of input.split("\n")) {
    const at = line.indexOf(":");
    if (at < 1) continue;
    const key = line.slice(0, at).trim().slice(0, 60);
    const value = line.slice(at + 1).trim().slice(0, 300);
    if (key && value) specs[key] = value;
  }
  return specs;
}

export async function saveProduct(_prev: FormState, fd: FormData): Promise<FormState> {
  await requireAdmin();
  const id = text(fd, "id");
  const name = text(fd, "name");
  const categoryId = text(fd, "category_id");
  if (!name) return { error: "Name is required." };
  if (!categoryId) return { error: "Choose a category." };
  const row = {
    name,
    slug: (await slugify(text(fd, "slug") || name)) || "product",
    category_id: categoryId,
    brand_id: text(fd, "brand_id") || null,
    description: text(fd, "description"),
    material: text(fd, "material") || null,
    specifications: parseSpecs(String(fd.get("specifications") ?? "")),
    is_active: flag(fd, "is_active"),
    is_featured: flag(fd, "is_featured"),
    is_sample: flag(fd, "is_sample"),
  };
  const db = adminDb();
  if (id) {
    const { error } = await db.from("products").update(row).eq("id", id);
    if (error) return { error: dbError(error.message) };
    catalogChanged();
    return { ok: "Product saved." };
  }
  const { data, error } = await db.from("products").insert(row).select("id").single();
  if (error) return { error: dbError(error.message) };
  updateTag(CATALOG_TAG);
  redirect(`/admin/products/${data.id}?created=1`);
}

export async function deleteProduct(fd: FormData) {
  await requireAdmin();
  const id = text(fd, "id");
  const db = adminDb();
  const { data: images } = await db.from("product_images").select("storage_path").eq("product_id", id);
  const { error } = await db.from("products").delete().eq("id", id);
  if (error) redirect(`/admin/products/${id}?error=${encodeURIComponent(dbError(error.message))}`);
  const paths = (images ?? []).map((i) => i.storage_path).filter(Boolean) as string[];
  if (paths.length) await db.storage.from(PRODUCT_IMAGE_BUCKET).remove(paths);
  updateTag(CATALOG_TAG);
  redirect("/admin/products");
}

// ───────────── variants & stock ─────────────

export async function saveVariant(_prev: FormState, fd: FormData): Promise<FormState> {
  await requireAdmin();
  const id = text(fd, "id");
  const productId = text(fd, "product_id");
  const label = text(fd, "label");
  const sku = text(fd, "sku").toUpperCase();
  if (!label) return { error: "Option name is required (e.g. “8 ft × 4 ft, Matt”)." };
  if (!sku) return { error: "SKU is required (your own product code)." };

  let price: number | null, sale: number | null;
  try {
    price = rupeesToPaise(fd.get("price"));
    sale = rupeesToPaise(fd.get("sale_price"));
  } catch (e) {
    return { error: (e as Error).message };
  }
  if (sale != null && price == null) return { error: "Add a normal price before a sale price." };
  if (sale != null && price != null && sale >= price) return { error: "Sale price must be lower than the normal price." };

  const stock = int(fd, "stock", -1);
  if (stock < 0 || stock > 1_000_000) return { error: "Stock must be 0 or more." };

  const row = {
    product_id: productId,
    label,
    sku,
    colour: text(fd, "colour") || null,
    finish: text(fd, "finish") || null,
    dimensions: text(fd, "dimensions") || null,
    price_paise: price,
    sale_price_paise: sale,
    sort_order: int(fd, "sort_order"),
    is_active: flag(fd, "is_active"),
  };
  const db = adminDb();

  if (id) {
    const { error } = await db.from("variants").update(row).eq("id", id);
    if (error) return { error: dbError(error.message) };
    // Stock goes through a function so every change is written to the stock log.
    const { error: stockError } = await db.rpc("set_variant_stock", {
      p_variant_id: id,
      p_stock: stock,
      p_note: text(fd, "stock_note") || null,
    });
    if (stockError) return { error: dbError(stockError.message) };
  } else {
    const { data, error } = await db.from("variants").insert({ ...row, stock }).select("id").single();
    if (error) return { error: dbError(error.message) };
    if (stock > 0) {
      await db.from("stock_movements").insert({ variant_id: data.id, change: stock, stock_after: stock, reason: "initial" });
    }
  }
  catalogChanged();
  return { ok: id ? `Saved “${label}”.` : `Added “${label}”.` };
}

export async function deleteVariant(fd: FormData) {
  await requireAdmin();
  const { error } = await adminDb().from("variants").delete().eq("id", text(fd, "id"));
  if (error) throw new Error(dbError(error.message));
  catalogChanged();
}

// ───────────── photos ─────────────

const IMAGE_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
};

/**
 * Step 1 of a photo upload: the server hands out a one-time upload link, and
 * the browser sends the file straight to Supabase Storage (no size limits on
 * our server, and the secret key never reaches the browser).
 */
export async function createImageUpload(target: { kind: "product" | "category"; id: string }, contentType: string, size: number) {
  await requireAdmin();
  const ext = IMAGE_TYPES[contentType];
  if (!ext) return { error: "Please upload a JPG, PNG, WebP or AVIF image." };
  if (size > 5 * 1024 * 1024) return { error: "Each photo must be 5 MB or smaller." };
  const path = `${target.kind}/${target.id}/${crypto.randomUUID()}.${ext}`;
  const { data, error } = await adminDb().storage.from(PRODUCT_IMAGE_BUCKET).createSignedUploadUrl(path);
  if (error || !data) return { error: `Upload could not start: ${error?.message}` };
  return { signedUrl: data.signedUrl, path };
}

/** Step 2: the file is uploaded — record it. */
export async function finishImageUpload(target: { kind: "product" | "category"; id: string }, path: string, alt: string) {
  await requireAdmin();
  if (!path.startsWith(`${target.kind}/${target.id}/`)) return { error: "Bad upload path." };
  const db = adminDb();
  const url = db.storage.from(PRODUCT_IMAGE_BUCKET).getPublicUrl(path).data.publicUrl;

  if (target.kind === "category") {
    const { data: old } = await db.from("categories").select("image_url").eq("id", target.id).single();
    await db.from("categories").update({ image_url: url }).eq("id", target.id);
    const oldPath = old?.image_url?.split(`/${PRODUCT_IMAGE_BUCKET}/`)[1];
    if (oldPath) await db.storage.from(PRODUCT_IMAGE_BUCKET).remove([oldPath]);
  } else {
    const { count } = await db.from("product_images").select("id", { count: "exact", head: true }).eq("product_id", target.id);
    const { error } = await db
      .from("product_images")
      .insert({ product_id: target.id, url, storage_path: path, alt: alt.slice(0, 200), sort_order: count ?? 0 });
    if (error) return { error: dbError(error.message) };
  }
  catalogChanged();
  return { ok: true };
}

export async function deleteImage(fd: FormData) {
  await requireAdmin();
  const db = adminDb();
  const { data } = await db.from("product_images").delete().eq("id", text(fd, "id")).select("storage_path").single();
  if (data?.storage_path) await db.storage.from(PRODUCT_IMAGE_BUCKET).remove([data.storage_path]);
  catalogChanged();
}

export async function makeCoverImage(fd: FormData) {
  await requireAdmin();
  const db = adminDb();
  const productId = text(fd, "product_id");
  const { data } = await db.from("product_images").select("id").eq("product_id", productId).order("sort_order");
  const ids = (data ?? []).map((r) => r.id);
  const chosen = text(fd, "id");
  const ordered = [chosen, ...ids.filter((i) => i !== chosen)];
  await Promise.all(ordered.map((id, i) => db.from("product_images").update({ sort_order: i }).eq("id", id)));
  catalogChanged();
}

export async function removeCategoryImage(fd: FormData) {
  await requireAdmin();
  const db = adminDb();
  const id = text(fd, "id");
  const { data } = await db.from("categories").select("image_url").eq("id", id).single();
  await db.from("categories").update({ image_url: null }).eq("id", id);
  const path = data?.image_url?.split(`/${PRODUCT_IMAGE_BUCKET}/`)[1];
  if (path) await db.storage.from(PRODUCT_IMAGE_BUCKET).remove([path]);
  catalogChanged();
}

// ───────────── orders ─────────────

export async function updateOrderStatus(_prev: FormState, fd: FormData): Promise<FormState> {
  await requireAdmin();
  const status = text(fd, "status");
  if (!(ORDER_STATUSES as readonly string[]).includes(status)) return { error: "Unknown status." };
  const { error } = await adminDb().rpc("set_order_status", {
    p_order_id: text(fd, "id"),
    p_status: status,
    p_note: text(fd, "note") || null,
  });
  if (error) {
    return { error: error.message.includes("ALREADY_CANCELLED") ? "A cancelled order cannot be changed." : dbError(error.message) };
  }
  if (status === "cancelled") updateTag(CATALOG_TAG); // stock may have been returned
  refresh();
  return { ok: "Status updated." };
}
