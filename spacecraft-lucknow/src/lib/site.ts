/**
 * Business details for Space Craft Lucknow.
 *
 * Legal name, GSTIN and address were confirmed by the business (Nov 2026).
 * Phone, email, hours and map were taken from the existing public website.
 * Change a value here and it updates everywhere on the site.
 */
export const site = {
  name: "Space Craft",
  city: "Lucknow",
  fullName: "Space Craft Lucknow",
  /** The public web address (used for Google, sitemaps and links in emails). */
  url: "https://www.spacecraftlucknow.com",
  tagline: "Interior & architectural materials",
  description:
    "Space Craft Lucknow supplies interior and architectural materials — louvers, wall panels, laminates, UV marble sheets, plywood, doors and hardware — for homes and commercial spaces across Lucknow and nearby areas.",
  phoneDisplay: "+91 88822 26272",
  phoneHref: "tel:+918882226272",
  whatsappNumber: "918882226272",
  email: "amittranslite@gmail.com",
  address: "Saffron Villa, Saidata Road, Roberts Lines, Sarsawan, Lucknow, Uttar Pradesh 226002",
  /** The company that runs the shop — shown on invoices, policies and the footer. */
  legalName: "Purvanchal Panels Private Limited",
  gstin: "09AANCP9203E1ZP",
  /** GST state code for Uttar Pradesh (first two digits of the GSTIN). */
  stateCode: "09",
  stateName: "Uttar Pradesh",
  /** Online orders are delivered only inside Lucknow, by Porter. */
  deliveryArea: "Lucknow",
  deliveryPartner: "Porter",
  /** Where the "Find us" map flies to. Coordinates are [longitude, latitude]. */
  location: {
    label: "Space Craft Interior",
    premises: "at Purvanchal Panels",
    coordinates: [80.9885701, 26.7977664] as [number, number],
    mapsUrl: "https://maps.app.goo.gl/8TUf4sxhn7jmthuGA",
    landmark: {
      name: "Phoenix Palassio",
      coordinates: [81.0127929, 26.8087716] as [number, number],
    },
    /** Straight-line distance between the two points (not the driving distance). */
    distanceKm: 2.7,
  },
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
  { label: "Shop", href: "/search" },
  { label: "Categories", href: "/categories" },
  { label: "Brands", href: "/brands" },
  { label: "Why Space Craft", href: "/#why" },
  { label: "Track order", href: "/track" },
  { label: "Enquire now", href: "/#contact" },
] as const;
