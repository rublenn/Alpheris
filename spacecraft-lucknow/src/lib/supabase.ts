import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Two ways the server talks to Supabase:
 *  - publicDb(): the "publishable" key. Can only READ active catalogue rows (RLS).
 *  - adminDb():  the "secret" key. Full access — used only on the server for
 *                orders and the admin panel. Never sent to the browser.
 */
const url = process.env.SUPABASE_URL;
const publishableKey = process.env.SUPABASE_PUBLISHABLE_KEY;
const secretKey = process.env.SUPABASE_SECRET_KEY;

const options = { auth: { persistSession: false, autoRefreshToken: false } };

export function isDbConfigured() {
  return Boolean(url && publishableKey && secretKey);
}

export function publicDb(): SupabaseClient {
  if (!url || !publishableKey) throw new Error("Supabase is not configured (SUPABASE_URL / SUPABASE_PUBLISHABLE_KEY).");
  return createClient(url, publishableKey, options);
}

export function adminDb(): SupabaseClient {
  if (!url || !secretKey) throw new Error("Supabase is not configured (SUPABASE_URL / SUPABASE_SECRET_KEY).");
  return createClient(url, secretKey, options);
}

export const PRODUCT_IMAGE_BUCKET = "product-images";
