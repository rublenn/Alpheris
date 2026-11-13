import { useId } from "react";
import type { Swatch } from "@/lib/catalog";

/**
 * Draws an illustrated material texture (fluted louver, marble, wood…)
 * entirely in code. These stand in for real product photography until
 * photos are supplied — they are illustrations, not product images.
 */
export function MaterialSwatch({ swatch, className = "" }: { swatch: Swatch; className?: string }) {
  const id = useId().replace(/[^a-zA-Z0-9]/g, "");
  const { kind, base, shade, light } = swatch;
  const ref = (name: string) => `url(#${id}${name})`;

  return (
    <svg
      viewBox="0 0 400 500"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
      className={`block h-full w-full ${className}`}
    >
      <defs>
        {/* Soft diagonal light falling across every material. */}
        <linearGradient id={`${id}sheen`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity="0.35" />
          <stop offset="0.5" stopColor="#fff" stopOpacity="0" />
          <stop offset="1" stopColor="#000" stopOpacity="0.1" />
        </linearGradient>
        <linearGradient id={`${id}slat`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor={shade} />
          <stop offset="0.18" stopColor={light} />
          <stop offset="0.6" stopColor={base} />
          <stop offset="1" stopColor={shade} />
        </linearGradient>
        <pattern id={`${id}flutes`} width="40" height="500" patternUnits="userSpaceOnUse">
          <rect width="40" height="500" fill={shade} />
          <rect x="3" width="31" height="500" fill={ref("slat")} />
        </pattern>
        <filter id={`${id}grain`} x="0" y="0" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency="0.008 0.35" numOctaves="3" seed="7" />
          <feColorMatrix values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -1.4 1.05" />
          <feComposite in2="SourceGraphic" operator="in" />
        </filter>
        {/* Bends straight strokes into natural, wandering marble veins. */}
        <filter id={`${id}veins`} x="-10%" y="-10%" width="120%" height="120%">
          <feTurbulence type="fractalNoise" baseFrequency="0.012" numOctaves="3" seed="4" result="noise" />
          <feDisplacementMap in="SourceGraphic" in2="noise" scale="70" />
          <feGaussianBlur stdDeviation="0.6" />
        </filter>
        <linearGradient id={`${id}gloss`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={light} />
          <stop offset="0.38" stopColor={base} />
          <stop offset="0.4" stopColor={light} />
          <stop offset="0.55" stopColor={base} />
          <stop offset="1" stopColor={shade} />
        </linearGradient>
        <linearGradient id={`${id}metal`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={light} />
          <stop offset="0.45" stopColor={base} />
          <stop offset="0.55" stopColor={shade} />
          <stop offset="1" stopColor={base} />
        </linearGradient>
      </defs>

      <rect width="400" height="500" fill={base} />

      {kind === "flute" && <rect width="400" height="500" fill={ref("flutes")} />}

      {kind === "wood" && (
        <rect width="400" height="500" fill={shade} opacity="0.55" filter={ref("grain")} />
      )}

      {kind === "marble" && (
        <g fill="none" filter={ref("veins")} strokeLinecap="round">
          <path d="M-40 60 L 180 250 L 440 300" stroke={shade} strokeWidth="5" opacity="0.28" />
          <path d="M-40 330 L 150 300 L 300 470 L 440 520" stroke={shade} strokeWidth="3" opacity="0.32" />
          <path d="M120 -40 L 200 180 L 150 330 L 260 540" stroke={shade} strokeWidth="1.5" opacity="0.45" />
          <path d="M330 -40 L 280 150 L 380 300 L 340 540" stroke={shade} strokeWidth="1" opacity="0.4" />
          <path d="M-40 150 L 200 120 L 440 40" stroke={light} strokeWidth="1.6" opacity="0.75" />
          <path d="M-40 430 L 190 380 L 440 420" stroke={light} strokeWidth="1.1" opacity="0.6" />
        </g>
      )}

      {kind === "gloss" && <rect width="400" height="500" fill={ref("gloss")} />}

      {kind === "panel" && (
        <g fill="none" stroke={shade} strokeWidth="2">
          {[0, 1, 2].map((row) =>
            [0, 1].map((col) => (
              <g key={`${row}-${col}`}>
                <rect x={30 + col * 180} y={30 + row * 150} width="160" height="130" fill={light} />
                <rect x={48 + col * 180} y={48 + row * 150} width="124" height="94" fill={base} />
              </g>
            )),
          )}
        </g>
      )}

      {kind === "ply" && (
        <>
          <rect width="400" height="500" fill={shade} opacity="0.3" filter={ref("grain")} />
          {/* Stacked board edges showing the layered core. */}
          {[300, 362, 424].map((y) => (
            <g key={y}>
              <rect y={y} width="400" height="50" fill={light} />
              {[8, 18, 28, 38].map((dy) => (
                <rect key={dy} y={y + dy} width="400" height="4" fill={shade} opacity="0.7" />
              ))}
              <rect y={y + 50} width="400" height="12" fill="#000" opacity="0.12" />
            </g>
          ))}
        </>
      )}

      {kind === "door" && (
        <>
          <rect width="400" height="500" fill="#F3EEE6" />
          <rect x="95" y="50" width="210" height="450" fill={base} />
          <rect x="95" y="50" width="210" height="450" fill={shade} opacity="0.35" filter={ref("grain")} />
          <g fill="none" stroke={shade} strokeWidth="2">
            <rect x="122" y="80" width="156" height="160" />
            <rect x="122" y="268" width="156" height="200" />
          </g>
          <rect x="272" y="262" width="8" height="46" rx="4" fill={ref("metal")} stroke={shade} />
        </>
      )}

      {kind === "furniture" && (
        <>
          <rect y="400" width="400" height="100" fill={light} />
          {/* A simple sideboard silhouette. */}
          <rect x="60" y="210" width="280" height="170" fill={light} stroke={shade} strokeWidth="2" />
          <line x1="153" y1="210" x2="153" y2="380" stroke={shade} strokeWidth="2" />
          <line x1="247" y1="210" x2="247" y2="380" stroke={shade} strokeWidth="2" />
          {[106, 200, 294].map((x) => (
            <rect key={x} x={x - 14} y="232" width="28" height="4" fill={shade} />
          ))}
          <rect x="80" y="380" width="6" height="40" fill={shade} />
          <rect x="314" y="380" width="6" height="40" fill={shade} />
          <circle cx="200" cy="130" r="46" fill="none" stroke={shade} strokeWidth="2" />
        </>
      )}

      {kind === "metal" && (
        <>
          <rect width="400" height="500" fill="#F3EEE6" />
          {/* Three bar handles in a brushed champagne finish. */}
          {[120, 200, 280].map((x, i) => (
            <g key={x}>
              <rect x={x - 5} y={110 + i * 30} width="10" height="26" fill={shade} />
              <rect x={x - 5} y={364 - i * 30} width="10" height="26" fill={shade} />
              <rect
                x={x - 11}
                y={90 + i * 30}
                width="22"
                height={320 - i * 60}
                rx="11"
                fill={ref("metal")}
                stroke={shade}
              />
            </g>
          ))}
        </>
      )}

      <rect width="400" height="500" fill={ref("sheen")} />
    </svg>
  );
}
