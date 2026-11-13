/**
 * Business details for Space Craft Lucknow.
 *
 * Everything here was taken from the existing public website
 * (spacecraftlucknow.com). Please confirm each value before launch.
 * Change a value here and it updates everywhere on the site.
 */
export const site = {
  name: "Space Craft",
  city: "Lucknow",
  fullName: "Space Craft Lucknow",
  tagline: "Interior & architectural materials",
  description:
    "Space Craft Lucknow supplies interior and architectural materials — louvers, wall panels, laminates, UV marble sheets, plywood, doors and hardware — for homes and commercial spaces across Lucknow and nearby areas.",
  phoneDisplay: "+91 88822 26272",
  phoneHref: "tel:+918882226272",
  whatsappNumber: "918882226272",
  email: "amittranslite@gmail.com",
  address: "Lucknow – 226002, Uttar Pradesh, India",
  hours: "9:00 AM – 9:00 PM",
  days: "Open all 7 days",
  serviceAreas: ["Lucknow", "Nearby regions", "Ballia"],
  copyrightYear: 2026,
} as const;

/** Builds a WhatsApp chat link with a pre-filled message. */
export function whatsappLink(message: string) {
  return `https://wa.me/${site.whatsappNumber}?text=${encodeURIComponent(message)}`;
}

export const navLinks = [
  { label: "Categories", href: "/#categories" },
  { label: "Brands", href: "/#brands" },
  { label: "Products", href: "/#products" },
  { label: "Why Space Craft", href: "/#why" },
  { label: "About", href: "/#about" },
  { label: "Contact", href: "/#contact" },
] as const;
