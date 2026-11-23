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
  // TO CONFIRM: the full written address (street, area, PIN code).
  address: "At Purvanchal Panels, near Phoenix Palassio, Lucknow, Uttar Pradesh",
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
