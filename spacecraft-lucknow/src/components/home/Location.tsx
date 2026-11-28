"use client";

import dynamic from "next/dynamic";

// The map is heavy, so it loads separately and only in the browser.
const LocationJourney = dynamic(() => import("./LocationJourney"), {
  ssr: false,
  loading: () => <section id="location" aria-label="Where to find us" className="h-[100svh] bg-beige" />,
});

export function Location() {
  return <LocationJourney />;
}
