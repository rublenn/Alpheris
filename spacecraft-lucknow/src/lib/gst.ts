/**
 * GST helpers. Prices on the site INCLUDE GST, so the tax is worked out
 * backwards from the price:  taxable value = price × 100 / (100 + rate).
 * Online orders are delivered only inside Lucknow (same state as the seller),
 * so the GST is split equally into CGST and SGST. All amounts are in paise.
 */

export type GstLine = {
  grossPaise: number; // what the customer paid for this line (incl. GST)
  taxablePaise: number;
  cgstPaise: number;
  sgstPaise: number;
  rate: number; // e.g. 18
};

export function splitInclusive(grossPaise: number, rate: number): GstLine {
  const taxable = Math.round((grossPaise * 100) / (100 + rate));
  const tax = grossPaise - taxable;
  const cgst = Math.round(tax / 2);
  return { grossPaise, taxablePaise: taxable, cgstPaise: cgst, sgstPaise: tax - cgst, rate };
}

export function sumLines(lines: GstLine[]) {
  return lines.reduce(
    (t, l) => ({
      grossPaise: t.grossPaise + l.grossPaise,
      taxablePaise: t.taxablePaise + l.taxablePaise,
      cgstPaise: t.cgstPaise + l.cgstPaise,
      sgstPaise: t.sgstPaise + l.sgstPaise,
    }),
    { grossPaise: 0, taxablePaise: 0, cgstPaise: 0, sgstPaise: 0 },
  );
}

/** Plain number with two decimals, Indian grouping: 1,23,456.78 (for invoice tables). */
export function amount(paise: number) {
  return new Intl.NumberFormat("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(paise / 100);
}

const ones = [
  "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten",
  "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen",
];
const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

function belowHundred(n: number) {
  return n < 20 ? ones[n] : `${tens[Math.floor(n / 10)]}${n % 10 ? ` ${ones[n % 10]}` : ""}`;
}

function belowThousand(n: number) {
  const h = Math.floor(n / 100);
  const rest = n % 100;
  return [h ? `${ones[h]} Hundred` : "", rest ? belowHundred(rest) : ""].filter(Boolean).join(" ");
}

/** Whole number in the Indian system: crore, lakh, thousand. */
function indianWords(n: number): string {
  if (n === 0) return "Zero";
  const parts: string[] = [];
  const crore = Math.floor(n / 1_00_00_000);
  const lakh = Math.floor((n % 1_00_00_000) / 1_00_000);
  const thousand = Math.floor((n % 1_00_000) / 1000);
  const rest = n % 1000;
  if (crore) parts.push(`${indianWords(crore)} Crore`);
  if (lakh) parts.push(`${belowHundred(lakh)} Lakh`);
  if (thousand) parts.push(`${belowHundred(thousand)} Thousand`);
  if (rest) parts.push(belowThousand(rest));
  return parts.join(" ");
}

/** 125050 → "Rupees One Thousand Two Hundred Fifty and Fifty Paise Only" */
export function rupeesInWords(paise: number) {
  const rupees = Math.floor(paise / 100);
  const p = paise % 100;
  return `Rupees ${indianWords(rupees)}${p ? ` and ${belowHundred(p)} Paise` : ""} Only`;
}
