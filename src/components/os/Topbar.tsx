"use client";

import { usePathname } from "next/navigation";
import { FormEvent, useState } from "react";
import { useOsStore } from "@/lib/os/store";
import { newId, todayISO } from "@/lib/os/types";
import { IconMenu, IconPlus } from "./icons";

const TITLES: Record<string, string> = {
  "/os": "Overview",
  "/os/leadership/strategy": "Company Strategy",
  "/os/leadership/timeline": "Business Timeline",
  "/os/leadership/project-timeline": "Project Timeline",
  "/os/sales-growth/marketing": "Marketing",
  "/os/sales-growth/lead-generation": "Lead Generation",
  "/os/sales-growth/sales": "Sales",
  "/os/sales-growth/follow-ups": "Follow Ups",
  "/os/working/strategies": "Strategies",
  "/os/working/production": "Creative & Production",
  "/os/working/deliverables": "Deliverables",
  "/os/operations/client-success": "Client Success",
  "/os/operations/finance": "Finance",
};

export default function Topbar({ onMenuClick }: { onMenuClick: () => void }) {
  const pathname = usePathname();
  const { addCapture } = useOsStore();
  const [text, setText] = useState("");
  const [justAdded, setJustAdded] = useState(false);

  const title = TITLES[pathname] ?? "Alpheris OS";

  function handleCapture(e: FormEvent) {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed) return;
    addCapture({ id: newId(), text: trimmed, createdAt: todayISO() });
    setText("");
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1200);
  }

  return (
    <header
      className="sticky top-0 z-30 flex items-center gap-3 border-b border-border bg-background/80 backdrop-blur px-4 sm:px-6 py-3"
      style={{ paddingTop: "calc(env(safe-area-inset-top) + 0.75rem)" }}
    >
      <button
        onClick={onMenuClick}
        aria-label="Open navigation"
        className="md:hidden inline-flex h-9 w-9 items-center justify-center rounded-full border border-border text-muted"
      >
        <IconMenu className="h-4 w-4" />
      </button>

      <h1 className="font-semibold tracking-tight shrink-0">{title}</h1>

      <form onSubmit={handleCapture} className="ml-auto flex items-center gap-2 w-full max-w-sm">
        <div className="relative flex-1">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Capture a thought…"
            className="w-full rounded-full border border-border bg-surface px-4 py-2 text-sm outline-none focus:border-accent transition"
          />
          {justAdded && (
            <span className="absolute -bottom-5 right-1 text-xs text-good">Captured</span>
          )}
        </div>
        <button
          type="submit"
          aria-label="Add capture"
          className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent text-white hover:opacity-90 transition"
        >
          <IconPlus className="h-4 w-4" />
        </button>
      </form>
    </header>
  );
}
