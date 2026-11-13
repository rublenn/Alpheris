"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import "maplibre-gl/dist/maplibre-gl.css";
import { Arrow } from "@/components/ui/Button";
import { site } from "@/lib/site";

/**
 * "Find us" — a map that flies in as you scroll:
 * India → Lucknow → Phoenix Palassio → the Space Craft location.
 *
 * It shows real satellite imagery (Esri World Imagery) drawn with the
 * open-source MapLibre library, with place names layered on top.
 *
 * The map cannot be dragged or zoomed by hand — scrolling drives the camera,
 * so it never traps the page scroll on phones.
 */

const esri = "https://server.arcgisonline.com/ArcGIS/rest/services";

/** Satellite photos, with a transparent layer of place names and borders above. */
const satelliteStyle = {
  version: 8,
  sources: {
    imagery: {
      type: "raster",
      tiles: [`${esri}/World_Imagery/MapServer/tile/{z}/{y}/{x}`],
      tileSize: 256,
      maxzoom: 18,
    },
    names: {
      type: "raster",
      tiles: [`${esri}/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}`],
      tileSize: 256,
      maxzoom: 15,
    },
  },
  layers: [
    { id: "ground", type: "background", paint: { "background-color": "#27313a" } },
    { id: "imagery", type: "raster", source: "imagery" },
    { id: "names", type: "raster", source: "names", maxzoom: 14.5 },
  ],
};
const { landmark, coordinates: shop } = site.location;

// The small part of the two map libraries that this section uses.
type MapLike = {
  jumpTo(camera: { center: [number, number]; zoom: number; pitch: number; bearing: number }): void;
  on(event: string, handler: () => void): void;
  addSource(id: string, source: unknown): void;
  addLayer(layer: unknown): void;
  resize(): void;
  remove(): void;
};
type MapLibrary = {
  Map: new (options: Record<string, unknown>) => MapLike;
  Marker: new (options: { element: HTMLElement; anchor: string }) => {
    setLngLat(position: [number, number]): { addTo(map: MapLike): unknown };
  };
};

type Shot = { at: number; center: [number, number]; zoom: number; pitch: number; bearing: number };

/** The camera path. "at" is how far through the scroll (0–1) each shot is reached. */
const shots: Shot[] = [
  { at: 0, center: [80.95, 24.5], zoom: 3.4, pitch: 0, bearing: 0 },
  { at: 0.3, center: [80.9462, 26.8467], zoom: 10.3, pitch: 0, bearing: 0 },
  { at: 0.58, center: landmark.coordinates, zoom: 15.4, pitch: 55, bearing: 25 },
  { at: 0.7, center: landmark.coordinates, zoom: 15.6, pitch: 58, bearing: 42 },
  { at: 0.93, center: shop, zoom: 16.4, pitch: 60, bearing: -18 },
  { at: 1, center: shop, zoom: 16.6, pitch: 60, bearing: -24 },
];

const steps = [
  { until: 0.2, kicker: "Find us", title: "From anywhere in India…", text: "Scroll to fly in." },
  { until: 0.47, kicker: "Uttar Pradesh", title: "…to Lucknow.", text: "The city we call home." },
  {
    until: 0.74,
    kicker: "Landmark",
    title: `Head for ${landmark.name}.`,
    text: "Lucknow’s landmark mall on Shaheed Path.",
  },
  {
    until: 2,
    kicker: "You have arrived",
    title: `About ${site.location.distanceKm} km from ${landmark.name}.`,
    text: `${site.location.label} — ${site.location.premises}.`,
  },
];

const ease = [0.22, 1, 0.36, 1] as const;
const smooth = (t: number) => t * t * (3 - 2 * t);
const mix = (a: number, b: number, t: number) => a + (b - a) * t;

function cameraAt(progress: number) {
  const next = Math.max(1, shots.findIndex((shot) => shot.at >= progress));
  const from = shots[next - 1];
  const to = shots[next];
  const t = smooth(Math.min(1, Math.max(0, (progress - from.at) / (to.at - from.at))));
  return {
    center: [mix(from.center[0], to.center[0], t), mix(from.center[1], to.center[1], t)] as [number, number],
    zoom: mix(from.zoom, to.zoom, t),
    pitch: mix(from.pitch, to.pitch, t),
    bearing: mix(from.bearing, to.bearing, t),
  };
}

/** Builds a map pin with a name tag. */
function pin(name: string, note: string, primary: boolean) {
  // The map library controls the outer element, so the visible part is an inner box
  // (marked data-pin) that we can fade in once the camera is close to the ground.
  const outer = document.createElement("div");
  const el = document.createElement("div");
  el.dataset.pin = "";
  el.className = "pointer-events-none flex flex-col items-center";
  outer.append(el);
  const tag = document.createElement("div");
  tag.className = primary
    ? "mb-2 whitespace-nowrap bg-ink px-3 py-2 text-center text-white shadow-lg"
    : "mb-2 whitespace-nowrap bg-white px-3 py-2 text-center text-ink shadow-lg";
  const title = document.createElement("div");
  title.className = "text-[12px] font-bold uppercase tracking-[0.14em]";
  title.textContent = name;
  const sub = document.createElement("div");
  sub.className = "mt-0.5 text-[10px] tracking-[0.06em] opacity-75";
  sub.textContent = note;
  tag.append(title, sub);
  const dot = document.createElement("div");
  dot.className = primary
    ? "h-4 w-4 rounded-full border-[3px] border-white bg-accent shadow-lg"
    : "h-3 w-3 rounded-full border-2 border-white bg-ink shadow-lg";
  el.append(tag, dot);
  return outer;
}

export default function LocationJourney() {
  const section = useRef<HTMLElement>(null);
  const frame = useRef<HTMLDivElement>(null);
  const holder = useRef<HTMLDivElement>(null);
  const [step, setStep] = useState(0);
  const [status, setStatus] = useState<"waiting" | "ready" | "failed">("waiting");
  const [credit, setCredit] = useState("");
  const [still, setStill] = useState(false); // true when the visitor prefers reduced motion

  useEffect(() => {
    const el = section.current;
    const box = holder.current;
    if (!el || !box) return;

    const calm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setStill(calm);

    let map: MapLike | null = null;
    let cancelled = false;
    let raf = 0;

    const progress = () => {
      if (calm) return 1;
      const rect = el.getBoundingClientRect();
      const distance = rect.height - window.innerHeight;
      return distance > 0 ? Math.min(1, Math.max(0, -rect.top / distance)) : 1;
    };

    const update = () => {
      raf = 0;
      const p = progress();
      const camera = cameraAt(p);
      map?.jumpTo(camera);
      // Pins only make sense once we are close to the ground.
      frame.current?.setAttribute("data-near", camera.zoom > 12.5 ? "true" : "false");
      setStep(steps.findIndex((s) => p < s.until));
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };

    // The map is only downloaded when the visitor gets close to this section.
    const start = async () => {
      try {
        const loaded: unknown = await import("maplibre-gl");
        const lib = ((loaded as { default?: unknown }).default ?? loaded) as MapLibrary;
        if (cancelled) return;
        map = new lib.Map({
          container: box,
          style: satelliteStyle,
          maxPitch: 70,
          interactive: false,
          attributionControl: false,
          ...cameraAt(progress()),
        });
        map.on("load", () => {
          if (cancelled || !map) return;
          setCredit("Imagery © Esri, Maxar, Earthstar Geographics");
          // Dashed line from the landmark to the shop.
          map.addSource("route", {
            type: "geojson",
            data: { type: "Feature", properties: {}, geometry: { type: "LineString", coordinates: [landmark.coordinates, shop] } },
          });
          // A dark outline under the white dashes keeps the line visible on any ground.
          map.addLayer({
            id: "route-shadow",
            type: "line",
            source: "route",
            layout: { "line-cap": "round" },
            paint: { "line-color": "#252525", "line-width": 6, "line-opacity": 0.45 },
          });
          map.addLayer({
            id: "route",
            type: "line",
            source: "route",
            layout: { "line-cap": "round" },
            paint: { "line-color": "#ffffff", "line-width": 3, "line-dasharray": [1, 2] },
          });
          new lib.Marker({ element: pin(landmark.name, "Shaheed Path", false), anchor: "bottom" })
            .setLngLat(landmark.coordinates)
            .addTo(map);
          new lib.Marker({ element: pin(site.location.label, site.location.premises, true), anchor: "bottom" })
            .setLngLat(shop)
            .addTo(map);
          setStatus("ready");
          update();
        });
        map.on("error", () => setStatus((now) => (now === "ready" ? now : "failed")));
      } catch {
        setStatus("failed");
      }
    };

    const watcher = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          watcher.disconnect();
          start();
        }
      },
      { rootMargin: "100% 0px" },
    );
    watcher.observe(el);

    const onResize = () => {
      map?.resize();
      onScroll();
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);
    update();

    return () => {
      cancelled = true;
      watcher.disconnect();
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      map?.remove();
    };
  }, []);

  const current = steps[Math.max(0, step)];
  const arrived = step === steps.length - 1;

  return (
    <section
      id="location"
      ref={section}
      aria-label="Where to find us"
      className={`relative bg-beige ${still ? "h-[100svh]" : "h-[380vh]"}`}
    >
      <div ref={frame} data-near="false" className="group sticky top-0 h-[100svh] overflow-hidden">
        {/* The map library restyles its own container, so it gets a plain inner box. */}
        <div
          className="absolute inset-0 [&_[data-pin]]:opacity-0 [&_[data-pin]]:transition-opacity [&_[data-pin]]:duration-500 group-data-[near=true]:[&_[data-pin]]:opacity-100"
        >
          <div ref={holder} className="h-full w-full" />
        </div>

        {/* Soft fades so the header and caption stay readable over the map */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-ivory via-ivory/40 to-transparent" />
        <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 h-56 bg-gradient-to-t from-ivory/90 to-transparent" />

        {/* Map data credit (required by the map providers) */}
        <p className="pointer-events-none absolute right-3 top-[84px] bg-white/80 px-2 py-1 text-[10px] text-ink/70">
          {credit}
        </p>

        {status === "failed" && (
          <p className="absolute inset-0 flex items-center justify-center px-8 text-center text-[15px] text-muted">
            The map could not be loaded. Use the Google Maps button below for directions.
          </p>
        )}

        <div className="shell pointer-events-none absolute inset-x-0 bottom-0 pb-10 sm:pb-12">
          <div className="pointer-events-auto max-w-lg border border-line bg-white/95 p-6 shadow-[0_30px_60px_-30px_rgba(37,37,37,0.45)] sm:p-8">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={step}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -14 }}
                transition={{ duration: 0.35, ease }}
              >
                <p className="eyebrow">{current.kicker}</p>
                <h2 className="display mt-3 text-[clamp(1.8rem,3.4vw,2.8rem)]">{current.title}</h2>
                <p className="mt-3 text-[15px] leading-relaxed text-muted">{current.text}</p>
                {arrived && (
                  <a
                    href={site.location.mapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group/link mt-5 inline-flex items-center gap-3 text-[12px] font-semibold uppercase tracking-[0.2em] text-ink hover:text-accent-deep"
                  >
                    Open in Google Maps
                    <Arrow className="transition-transform duration-500 ease-luxe group-hover/link:translate-x-1" />
                  </a>
                )}
              </motion.div>
            </AnimatePresence>

            {/* Progress: one bar per stop on the journey */}
            <div aria-hidden="true" className="mt-6 flex gap-2">
              {steps.map((s, i) => (
                <span
                  key={s.kicker}
                  className={`h-[3px] flex-1 transition-colors duration-500 ${i <= step ? "bg-accent" : "bg-line"}`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
