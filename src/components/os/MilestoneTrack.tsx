"use client";

import Link from "next/link";
import { CSSProperties, useState } from "react";
import { IconCheck } from "./icons";

export type MilestoneStatus = "done" | "current" | "upcoming";
export type MilestoneTone = "accent" | "leadership" | "working" | "sales" | "operations";

export interface MilestoneNodeData {
  id: string;
  label: string;
  sublabel?: string;
  status: MilestoneStatus;
  href?: string;
  onClick?: () => void;
}

const TONE: Record<MilestoneTone, { text: string; bg: string; border: string; ring: string }> = {
  accent: { text: "text-accent", bg: "bg-accent", border: "border-accent", ring: "var(--accent-soft)" },
  leadership: { text: "text-lens-leadership", bg: "bg-lens-leadership", border: "border-lens-leadership", ring: "var(--lens-leadership-soft)" },
  working: { text: "text-lens-working", bg: "bg-lens-working", border: "border-lens-working", ring: "var(--lens-working-soft)" },
  sales: { text: "text-lens-sales", bg: "bg-lens-sales", border: "border-lens-sales", ring: "var(--lens-sales-soft)" },
  operations: { text: "text-lens-operations", bg: "bg-lens-operations", border: "border-lens-operations", ring: "var(--lens-operations-soft)" },
};

export function MilestoneTrack({
  nodes,
  tone = "leadership",
}: {
  nodes: MilestoneNodeData[];
  tone?: MilestoneTone;
}) {
  const [touchedId, setTouchedId] = useState<string | null>(null);
  const t = TONE[tone];

  function handleTouch(id: string) {
    setTouchedId(id);
    window.setTimeout(() => setTouchedId((cur) => (cur === id ? null : cur)), 700);
  }

  return (
    <div className="flex items-start overflow-x-auto -mx-1 px-1 pb-1">
      {nodes.map((node, i) => (
        <div key={node.id} className="flex items-start">
          <MilestoneNode
            node={node}
            tone={t}
            touched={touchedId === node.id}
            onTouch={() => handleTouch(node.id)}
          />
          {i < nodes.length - 1 && (
            <div
              className={`h-0.5 flex-1 min-w-6 sm:min-w-10 mt-5 rounded-full transition-colors ${
                node.status === "done" ? t.bg : "bg-border"
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );
}

function MilestoneNode({
  node,
  tone,
  touched,
  onTouch,
}: {
  node: MilestoneNodeData;
  tone: { text: string; bg: string; border: string; ring: string };
  touched: boolean;
  onTouch: () => void;
}) {
  const dotStyle: CSSProperties = { ["--ring-color" as string]: tone.ring };

  const dotClasses = `milestone-node-dot${touched ? " is-touched" : ""} relative inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 cursor-pointer ${
    node.status === "done"
      ? `${tone.bg} ${tone.border} text-white`
      : node.status === "current"
      ? `bg-surface ${tone.border} ${tone.text}`
      : "bg-surface-2 border-border text-muted"
  }`;

  const inner = (
    <>
      <span className={dotClasses} style={dotStyle}>
        {node.status === "done" ? (
          <IconCheck className="h-4 w-4" />
        ) : node.status === "current" ? (
          <span className={`h-2.5 w-2.5 rounded-full ${tone.bg}`} />
        ) : null}
      </span>
      <span
        className={`mt-2 text-xs font-medium text-center leading-tight ${
          node.status === "upcoming" ? "text-muted" : "text-foreground"
        }`}
      >
        {node.label}
      </span>
      {node.sublabel && <span className="text-[0.6875rem] text-muted text-center mt-0.5">{node.sublabel}</span>}
    </>
  );

  const className = "flex flex-col items-center shrink-0 w-20 sm:w-24 outline-none";

  if (node.href) {
    return (
      <Link href={node.href} className={className} onTouchStart={onTouch} onClick={node.onClick}>
        {inner}
      </Link>
    );
  }

  return (
    <button type="button" onClick={node.onClick} onTouchStart={onTouch} className={className}>
      {inner}
    </button>
  );
}
