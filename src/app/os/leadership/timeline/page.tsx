"use client";

import { FormEvent, useState } from "react";
import { useOsStore } from "@/lib/os/store";
import { TIMELINE_HORIZONS, TimelineEntry, TimelineHorizon, newId, todayISO } from "@/lib/os/types";
import { Badge, Card, DeleteButton, EmptyState, SectionHeader } from "@/components/os/ui";

const HORIZON_COPY: Record<TimelineHorizon, { blurb: string; placeholder: string }> = {
  Day: { blurb: "What has to happen today. Timebox it, don't just list it.", placeholder: "e.g. Call Northwind about the proposal" },
  Week: { blurb: "What this week has to produce by Friday.", placeholder: "e.g. Send 3 proposals" },
  Month: { blurb: "What this month has to ship or land.", placeholder: "e.g. Launch the Q3 campaign" },
};

export default function TimelinePage() {
  const { state, hydrated, addTimelineEntry, updateTimelineEntry, removeTimelineEntry } = useOsStore();
  const [tab, setTab] = useState<TimelineHorizon>("Day");
  const [title, setTitle] = useState("");
  const [date, setDate] = useState(todayISO());

  if (!hydrated) return null;

  const entries = state.timeline
    .filter((t) => t.horizon === tab)
    .slice()
    .sort((a, b) => {
      if (a.done !== b.done) return a.done ? 1 : -1;
      return (a.date || "").localeCompare(b.date || "");
    });

  const openCounts: Record<TimelineHorizon, number> = {
    Day: state.timeline.filter((t) => t.horizon === "Day" && !t.done).length,
    Week: state.timeline.filter((t) => t.horizon === "Week" && !t.done).length,
    Month: state.timeline.filter((t) => t.horizon === "Month" && !t.done).length,
  };

  function handleAdd(e: FormEvent) {
    e.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) return;
    const entry: TimelineEntry = { id: newId(), horizon: tab, title: trimmed, date, done: false };
    addTimelineEntry(entry);
    setTitle("");
  }

  return (
    <div className="flex flex-col gap-8">
      <SectionHeader eyebrow="Leadership" title="Business Timeline" />

      <div className="flex items-center gap-1 rounded-full border border-border bg-surface p-1 w-fit">
        {TIMELINE_HORIZONS.map((h) => (
          <button
            key={h}
            onClick={() => setTab(h)}
            className={`relative rounded-full px-4 py-1.5 text-sm font-medium transition ${
              tab === h ? "bg-accent text-white" : "text-muted hover:text-foreground"
            }`}
          >
            {h}
            {openCounts[h] > 0 && (
              <span
                className={`ml-1.5 text-xs tabular-nums ${tab === h ? "text-white/80" : "text-muted"}`}
              >
                {openCounts[h]}
              </span>
            )}
          </button>
        ))}
      </div>

      <Card>
        <p className="text-sm text-muted mb-4">{HORIZON_COPY[tab].blurb}</p>

        <form onSubmit={handleAdd} className="flex flex-col sm:flex-row gap-2 mb-5">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={HORIZON_COPY[tab].placeholder}
            className="flex-1 rounded-lg border border-border bg-surface-2 px-3.5 py-2.5 text-sm outline-none focus:border-accent transition"
          />
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="rounded-lg border border-border bg-surface-2 px-3.5 py-2.5 text-sm outline-none focus:border-accent transition"
          />
          <button
            type="submit"
            className="rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-white hover:opacity-90 transition"
          >
            Add
          </button>
        </form>

        {entries.length === 0 ? (
          <EmptyState title={`Nothing on the ${tab.toLowerCase()} list`} body="Add what has to happen at this horizon — one line is enough." />
        ) : (
          <ul className="flex flex-col gap-2">
            {entries.map((entry) => (
              <li
                key={entry.id}
                className={`flex items-center gap-3 rounded-lg border border-border-soft bg-surface-2 px-3.5 py-2.5 transition ${
                  entry.done ? "opacity-50" : ""
                }`}
              >
                <input
                  type="checkbox"
                  checked={entry.done}
                  onChange={(e) => updateTimelineEntry(entry.id, { done: e.target.checked })}
                  className="h-4 w-4 rounded border-border accent-[var(--accent)]"
                />
                <span className={`flex-1 text-sm ${entry.done ? "line-through" : ""}`}>{entry.title}</span>
                {entry.date && <Badge>{entry.date}</Badge>}
                <DeleteButton label="Remove" onClick={() => removeTimelineEntry(entry.id)} />
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
