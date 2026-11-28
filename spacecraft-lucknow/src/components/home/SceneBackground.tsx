"use client";

import dynamic from "next/dynamic";

// The 3D backdrop loads separately, after the text, so the page appears fast.
const MaterialScene = dynamic(() => import("./MaterialScene"), { ssr: false });

export function SceneBackground() {
  return <MaterialScene />;
}
