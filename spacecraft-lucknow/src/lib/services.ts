import type { Swatch } from "./catalog";

/**
 * Interior services offered by Space Craft (list confirmed by the business, Nov 2026).
 * Text is kept general on purpose: no timelines, warranties or prices are promised
 * here — those are agreed with each customer.
 */
export type Service = {
  slug: string;
  name: string;
  summary: string;
  includes: string[];
  swatch: Swatch;
};

const s = (kind: Swatch["kind"], base: string, shade: string, light: string): Swatch => ({ kind, base, shade, light });

export const services: Service[] = [
  {
    slug: "modular-kitchen",
    name: "Modular Kitchen",
    summary: "Kitchens planned around how you cook and store — cabinets, shutters and finishes chosen to suit your space and budget.",
    includes: ["Layout planning for your kitchen", "Cabinets, shutters and storage", "Choice of laminates, acrylic and hardware", "Fitting and finishing"],
    swatch: s("gloss", "#E6D6BF", "#BFA583", "#FBF4E8"),
  },
  {
    slug: "wall-to-wall-interior",
    name: "Wall to Wall Interior",
    summary: "Feature walls and full-room cladding with louvers, wall panels, marble sheets and more — for a single wall or the whole room.",
    includes: ["Feature and TV walls", "Louvers, panels and UV marble sheets", "Material and colour selection", "Installation"],
    swatch: s("flute", "#B98F66", "#7E5C3B", "#DDBB95"),
  },
  {
    slug: "modular-furniture",
    name: "Modular Furniture",
    summary: "Wardrobes, TV units, study tables and storage made to fit your room — in the finish and size you choose.",
    includes: ["Wardrobes and storage units", "TV units and study tables", "Plywood, laminates and hardware", "Made to your measurements"],
    swatch: s("furniture", "#E8E0D2", "#7A5A3E", "#FBF8F2"),
  },
  {
    slug: "complete-home-interior",
    name: "Complete Home Interior",
    summary: "One team for the whole home — kitchen, wardrobes, walls and furniture planned together so every room feels connected.",
    includes: ["Planning room by room", "Kitchen, furniture and wall work together", "Materials from one place", "Execution through to handover"],
    swatch: s("wood", "#C9A27A", "#8F6A43", "#E4C9A8"),
  },
  {
    slug: "retail-outlet-interior",
    name: "Retail Outlet Interior",
    summary: "Shop and showroom interiors that display your products well and stand up to daily customer traffic.",
    includes: ["Display walls and counters", "Storage and back-of-house units", "Durable finishes for busy spaces", "Fitting and finishing"],
    swatch: s("flute", "#6B6660", "#3F3B37", "#8F8980"),
  },
  {
    slug: "salon-interior",
    name: "Salon Interior",
    summary: "Salon interiors with styling stations, mirrors, waiting areas and easy-to-clean surfaces that look good every day.",
    includes: ["Styling stations and mirror walls", "Reception and waiting area", "Easy-to-clean, moisture-resistant finishes", "Lighting-friendly surfaces"],
    swatch: s("marble", "#F7F5F1", "#A9A297", "#B58B60"),
  },
];
