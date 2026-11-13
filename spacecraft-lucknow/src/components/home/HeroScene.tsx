"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Environment, Float, Lightformer } from "@react-three/drei";
import * as THREE from "three";

/**
 * The 3D hero: a small composition of floating material samples
 * (fluted louver, marble sheet, charcoal panel, gloss acrylic, metal trim).
 * Kept deliberately light: simple shapes, no downloaded models or textures.
 */

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

function FlutedPanel({
  colour,
  slats = 9,
  height = 3,
  ...props
}: { colour: string; slats?: number; height?: number } & React.ComponentProps<"group">) {
  const pitch = 0.21;
  const width = slats * pitch;
  return (
    <group {...props}>
      <mesh position={[0, 0, -0.06]}>
        <boxGeometry args={[width + 0.04, height, 0.05]} />
        <meshStandardMaterial color={colour} roughness={0.8} />
      </mesh>
      {Array.from({ length: slats }, (_, i) => (
        <mesh key={i} position={[(i - (slats - 1) / 2) * pitch, 0, 0]} rotation={[0, 0, 0]}>
          <cylinderGeometry args={[0.085, 0.085, height, 20, 1, false, -Math.PI / 2, Math.PI]} />
          <meshStandardMaterial color={colour} roughness={0.55} />
        </mesh>
      ))}
    </group>
  );
}

function Materials({ animate }: { animate: boolean }) {
  const group = useRef<THREE.Group>(null);
  const marble = useMarbleTexture();
  const { viewport } = useThree();

  // Fit the composition to the canvas: smaller and centred on narrow screens.
  const scale = Math.min(1, viewport.width / 5.4, viewport.height / 4.6);

  useFrame((state, delta) => {
    if (!group.current || !animate) return;
    // Ease the whole group toward the pointer for a gentle parallax.
    const targetY = state.pointer.x * 0.28 - 0.32;
    const targetX = -state.pointer.y * 0.14 + 0.06;
    const k = 1 - Math.exp(-delta * 2.5);
    group.current.rotation.y += (targetY - group.current.rotation.y) * k;
    group.current.rotation.x += (targetX - group.current.rotation.x) * k;
  });

  const float = animate ? 1 : 0;

  return (
    <group ref={group} scale={scale} rotation={[0.06, -0.32, 0]}>
      {/* Marble sheet — the tall backdrop piece */}
      <Float speed={1.1 * float} rotationIntensity={0.12} floatIntensity={0.5}>
        <mesh position={[0.75, 0.25, -0.9]} rotation={[0, 0.08, 0.02]}>
          <boxGeometry args={[2.1, 3.3, 0.06]} />
          <meshPhysicalMaterial map={marble} roughness={0.12} clearcoat={1} clearcoatRoughness={0.08} />
        </mesh>
      </Float>

      {/* Warm fluted louver — the hero piece */}
      <Float speed={1.4 * float} rotationIntensity={0.18} floatIntensity={0.7}>
        <FlutedPanel colour="#b88d62" position={[-0.75, -0.1, 0]} rotation={[0, 0.25, -0.03]} />
      </Float>

      {/* Charcoal fluted panel */}
      <Float speed={1.7 * float} rotationIntensity={0.22} floatIntensity={0.9}>
        <FlutedPanel
          colour="#4a4642"
          slats={5}
          height={1.7}
          position={[1.55, -0.95, 0.55]}
          rotation={[0, -0.3, 0.05]}
        />
      </Float>

      {/* Gloss acrylic sheet */}
      <Float speed={1.5 * float} rotationIntensity={0.3} floatIntensity={1}>
        <mesh position={[1.75, 1.25, 0.2]} rotation={[0.1, -0.5, 0.12]}>
          <boxGeometry args={[1.05, 1.05, 0.04]} />
          <meshPhysicalMaterial color="#e6dccd" roughness={0.04} clearcoat={1} reflectivity={1} />
        </mesh>
      </Float>

      {/* Champagne metal trim + ring: the accent colour */}
      <Float speed={1.2 * float} rotationIntensity={0.15} floatIntensity={0.6}>
        <mesh position={[-2.05, 0.2, 0.3]} rotation={[0, 0, 0.04]}>
          <boxGeometry args={[0.05, 3.6, 0.05]} />
          <meshStandardMaterial color="#b58b60" metalness={1} roughness={0.25} />
        </mesh>
      </Float>
      <Float speed={2 * float} rotationIntensity={0.9} floatIntensity={1.2}>
        <mesh position={[-1.75, 1.55, 0.9]} rotation={[0.6, 0.5, 0]}>
          <torusGeometry args={[0.36, 0.035, 20, 72]} />
          <meshStandardMaterial color="#b58b60" metalness={1} roughness={0.2} />
        </mesh>
      </Float>
      <Float speed={2.2 * float} rotationIntensity={0.6} floatIntensity={1.4}>
        <mesh position={[0.1, -1.75, 1.1]}>
          <sphereGeometry args={[0.16, 40, 40]} />
          <meshStandardMaterial color="#e9dccb" metalness={1} roughness={0.15} />
        </mesh>
      </Float>
    </group>
  );
}

export default function HeroScene() {
  const wrapper = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(true);
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    // Stop rendering when the hero is scrolled out of view (saves battery).
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting));
    if (wrapper.current) observer.observe(wrapper.current);

    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduceMotion(query.matches);
    update();
    query.addEventListener("change", update);
    return () => {
      observer.disconnect();
      query.removeEventListener("change", update);
    };
  }, []);

  return (
    <div ref={wrapper} className="h-full w-full">
      <Canvas
        dpr={[1, 1.75]}
        camera={{ fov: 32, position: [0, 0, 9] }}
        frameloop={reduceMotion ? "demand" : visible ? "always" : "never"}
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
        // Let pointer movement anywhere on the page drive the parallax.
        eventSource={typeof document !== "undefined" ? document.body : undefined}
        eventPrefix="client"
        style={{ pointerEvents: "none" }}
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
        <Materials animate={!reduceMotion} />
      </Canvas>
    </div>
  );
}
