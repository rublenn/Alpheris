"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode, type RefObject } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Environment, Float, Lightformer } from "@react-three/drei";
import * as THREE from "three";

/**
 * The site's living 3D backdrop.
 *
 * It sits behind the whole homepage. At the top of the page the material
 * samples form the hero composition; as you scroll they drift apart and keep
 * floating behind every section (softly blurred so text stays readable),
 * each one moving and turning at its own speed.
 *
 * Kept deliberately light: simple shapes, no downloaded models or textures.
 */

/** Where one piece sits in the hero, and how it behaves once scattered. */
type Motion = {
  hero: [number, number, number];
  heroRot: [number, number, number];
  /** Scattered spot: x/y as a fraction of the screen, z = how far back. */
  away: [number, number, number];
  /** How fast it travels up the screen while scrolling (1 = same as the page). */
  speed: number;
  /** How much it turns per screen scrolled. */
  spin: [number, number, number];
};

const MOTION: Record<string, Motion> = {
  marble: { hero: [0.75, 0.25, -0.9], heroRot: [0, -0.2, 0.02], away: [0.86, 0.1, -4.5], speed: 0.22, spin: [0.1, 0.5, 0.05] },
  louver: { hero: [-0.75, -0.1, 0], heroRot: [0, -0.05, -0.03], away: [-0.9, 0.34, -2.2], speed: 0.42, spin: [0.15, 0.7, -0.1] },
  charcoal: { hero: [1.55, -0.95, 0.55], heroRot: [0, -0.6, 0.05], away: [0.9, -0.36, -3], speed: 0.34, spin: [-0.2, -0.6, 0.15] },
  acrylic: { hero: [1.75, 1.25, 0.2], heroRot: [0.1, -0.8, 0.12], away: [-0.8, -0.22, -5], speed: 0.18, spin: [0.5, 0.4, 0.3] },
  plywood: { hero: [-2.0, -1.05, 0.7], heroRot: [1.05, 0.2, 0.45], away: [0.62, 0.42, -4], speed: 0.2, spin: [0.3, 0.2, 0.5] },
  handle: { hero: [-2.25, 1.35, 0.5], heroRot: [0.35, -0.45, 0.12], away: [-0.6, 0, -1.2], speed: 0.6, spin: [0.9, 0.7, 0.3] },
  chip: { hero: [0.45, -1.45, 1.1], heroRot: [0.25, -0.35, 0.3], away: [0.55, -0.1, -0.8], speed: 0.7, spin: [0.6, 0.9, 0.2] },
};

/**
 * Shared by every piece: the smoothed scroll position, plus (on phones) where
 * the empty "slot" under the hero text is, so the composition sits inside it.
 */
type ScrollState = { pages: number; slot: { centre: number; height: number } | null };

const smoothstep = (x: number) => {
  const t = Math.min(1, Math.max(0, x));
  return t * t * (3 - 2 * t);
};
const mix = (a: number, b: number, t: number) => a + (b - a) * t;
const wrap = (value: number, range: number) => ((value % range) + range) % range;

/** Moves one piece between its hero position and its scattered, drifting path. */
function Drift({
  name,
  scroll,
  floatSpeed,
  children,
}: {
  name: keyof typeof MOTION;
  scroll: RefObject<ScrollState>;
  floatSpeed: number;
  children: ReactNode;
}) {
  const ref = useRef<THREE.Group>(null);
  const nudge = useRef({ x: 0, y: 0 }); // how far the cursor is currently pushing this piece
  const m = MOTION[name];

  useFrame(({ viewport, pointer }, delta) => {
    const group = ref.current;
    if (!group) return;
    const pages = scroll.current.pages;
    const t = smoothstep(pages / 0.9); // 0 = hero composition, 1 = fully scattered
    const narrow = viewport.width < viewport.height * 0.9;

    // Hero composition: right half on wide screens, lower half on phones.
    const slot = scroll.current.slot; // measured in screen-heights from the top of the page
    const room = narrow ? viewport.width : viewport.width * 0.5;
    const tall = slot ? slot.height * viewport.height : viewport.height;
    const fit = Math.min(1, room / 5.4, tall / 4.2);
    const anchorX = slot || narrow ? 0 : viewport.width * 0.25;
    const anchorY = slot ? (0.5 - slot.centre) * viewport.height : 0;
    // "+ pages * height" keeps the composition attached to the page as it scrolls.
    const heroX = anchorX + m.hero[0] * fit;
    const heroY = anchorY + m.hero[1] * fit + pages * viewport.height;
    const heroZ = m.hero[2] * fit;

    // Scattered: pieces rise at their own speed and loop back in from below.
    const depth = (9 - m.away[2]) / 9; // things further back cover more screen
    const range = viewport.height * depth + 4;
    const awayX = m.away[0] * (viewport.width / 2) * depth;
    const awayY = wrap((m.away[1] + 0.5) * range + pages * m.speed * viewport.height, range) - range / 2;

    const x = mix(heroX, awayX, t);
    const y = mix(heroY, awayY, t);
    const z = mix(heroZ, m.away[2], t);

    // Pieces lean and slide away from the cursor, as if it stirs the air.
    const reach = (9 - z) / 9;
    const dx = x - pointer.x * (viewport.width / 2) * reach;
    const dy = y - pointer.y * (viewport.height / 2) * reach;
    const distance = Math.hypot(dx, dy) || 1;
    const push = floatSpeed > 0 ? Math.max(0, 1 - distance / 2.6) ** 2 * 0.55 : 0;
    const k = 1 - Math.exp(-delta * 4);
    nudge.current.x += ((dx / distance) * push - nudge.current.x) * k;
    nudge.current.y += ((dy / distance) * push - nudge.current.y) * k;

    group.position.set(x + nudge.current.x, y + nudge.current.y, z);
    group.rotation.set(
      m.heroRot[0] + pages * m.spin[0] - nudge.current.y * 0.7,
      m.heroRot[1] + pages * m.spin[1] + nudge.current.x * 0.7,
      m.heroRot[2] + pages * m.spin[2],
    );
    group.scale.setScalar(mix(fit, narrow ? 0.55 : 0.9, t));
  });

  return (
    <group ref={ref}>
      <Float speed={floatSpeed} rotationIntensity={0.25} floatIntensity={0.8}>
        {children}
      </Float>
    </group>
  );
}

/** Paints a soft marble pattern onto a canvas so no image file is needed. */
function useMarbleTexture() {
  return useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 512;
    canvas.height = 768;
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = "#f1ece3";
    ctx.fillRect(0, 0, 512, 768);
    // Fixed numbers (not random) so the slab looks the same on every visit.
    const veins = [
      [-20, 90, 180, 260, 340, 180, 540, 330, 7, "rgba(120,110,98,0.55)"],
      [-20, 420, 140, 360, 330, 560, 540, 470, 5, "rgba(120,110,98,0.45)"],
      [60, -20, 200, 240, 120, 470, 300, 790, 3, "rgba(181,139,96,0.75)"],
      [300, -20, 420, 200, 330, 380, 470, 790, 2, "rgba(120,110,98,0.55)"],
      [-20, 640, 200, 600, 300, 720, 540, 660, 2, "rgba(181,139,96,0.6)"],
    ] as const;
    for (const [x0, y0, x1, y1, x2, y2, x3, y3, width, colour] of veins) {
      ctx.strokeStyle = colour;
      ctx.lineWidth = width;
      ctx.filter = `blur(${width / 2}px)`;
      ctx.beginPath();
      ctx.moveTo(x0, y0);
      ctx.bezierCurveTo(x1, y1, x2, y2, x3, y3);
      ctx.stroke();
    }
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  }, []);
}

function FlutedPanel({ colour, slats = 9, height = 3 }: { colour: string; slats?: number; height?: number }) {
  const pitch = 0.21;
  return (
    <group>
      <mesh position={[0, 0, -0.06]}>
        <boxGeometry args={[slats * pitch + 0.04, height, 0.05]} />
        <meshStandardMaterial color={colour} roughness={0.8} />
      </mesh>
      {Array.from({ length: slats }, (_, i) => (
        <mesh key={i} position={[(i - (slats - 1) / 2) * pitch, 0, 0]}>
          <cylinderGeometry args={[0.085, 0.085, height, 20, 1, false, -Math.PI / 2, Math.PI]} />
          <meshStandardMaterial color={colour} roughness={0.55} />
        </mesh>
      ))}
    </group>
  );
}

/** Three stacked plywood boards, each showing its layered edge. */
function PlywoodStack() {
  const layers = ["#e9d5b3", "#b99468", "#e2cba6", "#b99468", "#e9d5b3"];
  return (
    <group>
      {[0, 1, 2].map((board) => (
        <group key={board} position={[board * 0.09, board * -0.06, board * 0.15 - 0.15]} rotation={[0, 0, board * 0.05]}>
          {layers.map((colour, i) => (
            <mesh key={i} position={[0, 0, (i - 2) * 0.022]}>
              <boxGeometry args={[1.35, 0.95, 0.022]} />
              <meshStandardMaterial color={colour} roughness={0.75} />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  );
}

/** A champagne bar handle on two short posts, like a cabinet pull. */
function CabinetHandle() {
  const metal = <meshStandardMaterial color="#b58b60" metalness={1} roughness={0.22} />;
  return (
    <group>
      <mesh rotation={[0, 0, Math.PI / 2]}>
        <capsuleGeometry args={[0.045, 1.15, 8, 24]} />
        {metal}
      </mesh>
      {[-0.42, 0.42].map((x) => (
        <mesh key={x} position={[x, 0, -0.1]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.032, 0.032, 0.2, 20]} />
          {metal}
        </mesh>
      ))}
    </group>
  );
}

function Pieces({
  animate,
  onDepth,
}: {
  animate: boolean;
  /** Reports how far past the hero we are (0–1) so the page can soften the backdrop. */
  onDepth: (t: number) => void;
}) {
  const rig = useRef<THREE.Group>(null);
  const scroll = useRef<ScrollState>({ pages: 0, slot: null });
  const marble = useMarbleTexture();

  // On phones the hero leaves an empty slot under the text; find where it is.
  useEffect(() => {
    const measure = () => {
      const el = document.querySelector<HTMLElement>("[data-scene-slot]");
      const box = el?.getBoundingClientRect();
      scroll.current.slot =
        box && box.height > 0
          ? {
              centre: (box.top + window.scrollY + box.height / 2) / window.innerHeight,
              height: box.height / window.innerHeight,
            }
          : null;
    };
    measure();
    window.addEventListener("resize", measure);
    document.fonts?.ready.then(measure);
    return () => window.removeEventListener("resize", measure);
  }, []);
  const float = animate ? 1 : 0;

  // Runs first each frame (priority -1) so every piece reads a fresh scroll value.
  useFrame((state, delta) => {
    const target = window.scrollY / window.innerHeight;
    const s = scroll.current;
    // Ease toward the real scroll position, so pieces glide rather than snap.
    s.pages = animate ? s.pages + (target - s.pages) * (1 - Math.exp(-delta * 5)) : target;

    // Past the hero the backdrop softens and blurs, like out-of-focus depth.
    onDepth(smoothstep(s.pages / 0.9));

    // The whole scene leans gently toward the pointer.
    if (rig.current && animate) {
      const k = 1 - Math.exp(-delta * 2.5);
      rig.current.rotation.y += (state.pointer.x * 0.12 - rig.current.rotation.y) * k;
      rig.current.rotation.x += (-state.pointer.y * 0.08 - rig.current.rotation.x) * k;
    }
  }, -1);

  return (
    <group ref={rig}>
      <Drift name="marble" scroll={scroll} floatSpeed={1.1 * float}>
        <mesh>
          <boxGeometry args={[2.1, 3.3, 0.06]} />
          <meshPhysicalMaterial map={marble} roughness={0.12} clearcoat={1} clearcoatRoughness={0.08} />
        </mesh>
      </Drift>
      <Drift name="louver" scroll={scroll} floatSpeed={1.4 * float}>
        <FlutedPanel colour="#b88d62" />
      </Drift>
      <Drift name="charcoal" scroll={scroll} floatSpeed={1.7 * float}>
        <FlutedPanel colour="#4a4642" slats={5} height={1.7} />
      </Drift>
      <Drift name="acrylic" scroll={scroll} floatSpeed={1.5 * float}>
        <mesh>
          <boxGeometry args={[1.05, 1.05, 0.04]} />
          <meshPhysicalMaterial color="#e6dccd" roughness={0.04} clearcoat={1} reflectivity={1} />
        </mesh>
      </Drift>
      <Drift name="plywood" scroll={scroll} floatSpeed={1.2 * float}>
        <PlywoodStack />
      </Drift>
      <Drift name="handle" scroll={scroll} floatSpeed={2 * float}>
        <CabinetHandle />
      </Drift>
      {/* A small walnut laminate sample chip */}
      <Drift name="chip" scroll={scroll} floatSpeed={2.2 * float}>
        <mesh>
          <boxGeometry args={[0.5, 0.7, 0.035]} />
          <meshPhysicalMaterial color="#7a5637" roughness={0.35} clearcoat={0.6} clearcoatRoughness={0.3} />
        </mesh>
      </Drift>
    </group>
  );
}

/** With "reduce motion" on, we only redraw when the page actually scrolls. */
function RedrawOnScroll() {
  const invalidate = useThree((state) => state.invalidate);
  useEffect(() => {
    const redraw = () => invalidate();
    window.addEventListener("scroll", redraw, { passive: true });
    window.addEventListener("resize", redraw);
    return () => {
      window.removeEventListener("scroll", redraw);
      window.removeEventListener("resize", redraw);
    };
  }, [invalidate]);
  return null;
}

export default function MaterialScene() {
  const wrapper = useRef<HTMLDivElement>(null);
  const [reduceMotion, setReduceMotion] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduceMotion(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  const soften = (t: number) => {
    const el = wrapper.current;
    if (!el) return;
    // Phones have no empty margins, so the backdrop fades further there.
    const fade = window.innerWidth < 768 ? 0.72 : 0.58;
    el.style.opacity = String(1 - fade * t);
    el.style.filter = t > 0.02 ? `blur(${(t * 7).toFixed(1)}px)` : "none";
  };

  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none fixed inset-0 -z-10 transition-opacity duration-[1600ms] ease-luxe ${ready ? "opacity-100" : "opacity-0"}`}
    >
      {/* Soft warm glow that the pieces float in front of */}
      <div className="absolute right-[-10%] top-[8%] h-[70vmin] w-[70vmin] rounded-full bg-[radial-gradient(closest-side,rgba(181,139,96,0.18),transparent)]" />
      <div ref={wrapper} className="h-full w-full will-change-[opacity,filter]">
        <Canvas
          dpr={[1, 1.5]}
          camera={{ fov: 32, position: [0, 0, 9] }}
          frameloop={reduceMotion ? "demand" : "always"}
          gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
          // Let pointer movement anywhere on the page drive the parallax.
          eventSource={typeof document !== "undefined" ? document.body : undefined}
          eventPrefix="client"
          style={{ pointerEvents: "none" }}
          onCreated={() => setReady(true)}
        >
          <ambientLight intensity={0.25} />
          <directionalLight position={[4, 6, 6]} intensity={1.6} color="#fff1dd" />
          <directionalLight position={[-6, 2, 3]} intensity={0.3} color="#ffffff" />
          {/* A bright "studio" built from light panels — nothing is downloaded. */}
          <Environment resolution={128} environmentIntensity={0.55}>
            <color attach="background" args={["#8f867a"]} />
            <Lightformer form="rect" intensity={4} position={[0, 5, 2]} scale={[10, 4, 1]} rotation-x={Math.PI / 2} />
            <Lightformer form="rect" intensity={2.5} position={[-6, 1, 2]} scale={[2, 8, 1]} rotation-y={Math.PI / 2} />
            <Lightformer form="rect" intensity={2} position={[6, 0, 3]} scale={[2, 8, 1]} rotation-y={-Math.PI / 2} color="#ffe9cf" />
            <Lightformer form="rect" intensity={1.2} position={[0, -5, 2]} scale={[10, 3, 1]} rotation-x={-Math.PI / 2} color="#e8dccb" />
          </Environment>
          <Pieces animate={!reduceMotion} onDepth={soften} />
          {reduceMotion && <RedrawOnScroll />}
        </Canvas>
      </div>
    </div>
  );
}
