/** Prices are stored in paise (₹1 = 100 paise) so there are no rounding errors. */
export function formatINR(paise: number) {
  const rupees = paise / 100;
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: Number.isInteger(rupees) ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(rupees);
}

/** "1,250.50" (rupees, as typed in the admin form) → 125050 paise. Empty → null. */
export function rupeesToPaise(input: FormDataEntryValue | null): number | null {
  const text = String(input ?? "").replace(/[₹,\s]/g, "");
  if (!text) return null;
  if (!/^\d+(\.\d{1,2})?$/.test(text)) throw new Error(`"${input}" is not a valid price.`);
  return Math.round(Number(text) * 100);
}

export function paiseToRupeesInput(paise: number | null | undefined) {
  if (paise == null) return "";
  return (paise / 100).toFixed(paise % 100 === 0 ? 0 : 2);
}
