"use client";

import { FormEvent, useState } from "react";
import { useOsStore } from "@/lib/os/store";
import { newId, todayISO } from "@/lib/os/types";
import { TimelineBucket, TIMELINE_BUCKETS, addDays, bucketForDate } from "@/lib/os/calc";
import { Badge, Card, DeleteButton, EmptyState, SectionHeader } from "@/components/os/ui";
import { MilestoneNodeData, MilestoneTrack } from "@/components/os/MilestoneTrack";

const BUCKET_INFO: Record<TimelineBucket, { blurb: string; placeholder: string; defaultOffset: number }> = {
  Today: { blurb: "What has to happen today. Timebox it, don't just list it.", placeholder: "e.g. Call Northwind about the proposal", defaultOffset: 0 },
  Tomorrow: { blurb: "Queued up for tomorrow.", placeholder: "e.g. Send the revised quote", defaultOffset: 1 },
  "This Week": { blurb: "Due before the week is out.", placeholder: "e.g. Send 3 proposals", defaultOffset: 3 },
  "This Month": { blurb: "What this month has to ship or land.", placeholder: "e.g. Launch the Q3 campaign", defaultOffset: 20 },
};

function anchorId(bucket: TimelineBucket) {
  return `bucket-${bucket.toLowerCase().replace(/\s+/g, "-")}`;
}

export default function TimelinePage() {
  const { state, hydrated, addTimelineEntry, updateTimelineEntry, removeTimelineEntry } = useOsStore();

  if (!hydrated) return null;

  const grouped: Record<TimelineBucket, typeof state.timeline> = {
    Today: [],
    Tomorrow: [],
    "This Week": [],
    "This Month": [],
  };
  for (const entry of state.timeline) {
    grouped[bucketForDate(entry.date)].push(entry);
  }
  for (const bucket of TIMELINE_BUCKETS) {
    grouped[bucket].sort((a, b) => a.date.localeCompare(b.date));
  }

  const nodes: MilestoneNodeData[] = TIMELINE_BUCKETS.map((bucket) => {
    const items = grouped[bucket];
    const cleared = items.length > 0 && items.every((i) => i.done);
    return {
      id: bucket,
      label: bucket,
      sublabel: items.length > 0 ? `${items.filter((i) => !i.done).length} open` : "Clear",
      status: cleared ? "done" : bucket === "Today" ? "current" : "upcoming",
      href: `#${anchorId(bucket)}`,
    };
  });

  return (
    <div className="flex flex-col gap-8">
      <SectionHeader eyebrow="Leadership" title="Business Timeline" />

      <Card>
        <p className="text-sm text-muted mb-4">Today first — follow the path for what&apos;s coming next.</p>
        <MilestoneTrack nodes={nodes} tone="leadership" />
      </Card>

      {TIMELINE_BUCKETS.map((bucket) => (
        <BucketSection
          key={bucket}
          bucket={bucket}
          items={grouped[bucket]}
          onAdd={(title, date) => addTimelineEntry({ id: newId(), title, date, done: false })}
          onToggle={(id, done) => updateTimelineEntry(id, { done })}
          onRemove={removeTimelineEntry}
        />
      ))}
    </div>
  );
}

function BucketSection({
  bucket,
  items,
  onAdd,
  onToggle,
  onRemove,
}: {
  bucket: TimelineBucket;
  items: { id: string; title: string; date: string; done: boolean }[];
  onAdd: (title: string, date: string) => void;
  onToggle: (id: string, done: boolean) => void;
  onRemove: (id: string) => void;
}) {
  const info = BUCKET_INFO[bucket];
  const [title, setTitle] = useState("");
  const [date, setDate] = useState(addDays(todayISO(), info.defaultOffset));

  function handleAdd(e: FormEvent) {
    e.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) return;
    onAdd(trimmed, date);
    setTitle("");
  }

  return (
    <Card id={anchorId(bucket)} className="scroll-mt-24">
      <div className="flex items-center justify-between mb-1">
        <h3 className="font-semibold">{bucket}</h3>
        <Badge tone={bucket === "Today" ? "accent" : "neutral"}>{items.length}</Badge>
      </div>
      <p className="text-sm text-muted mb-4">{info.blurb}</p>

      <form onSubmit={handleAdd} className="flex flex-col sm:flex-row gap-2 mb-5">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={info.placeholder}
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

      {items.length === 0 ? (
        <EmptyState title={`Nothing for ${bucket.toLowerCase()}`} body="Add what has to happen — one line is enough." />
      ) : (
        <ul className="flex flex-col gap-2">
          {items.map((entry) => (
            <li
              key={entry.id}
              className={`flex items-center gap-3 rounded-lg border border-border-soft bg-surface-2 px-3.5 py-2.5 transition ${
                entry.done ? "opacity-50" : ""
              }`}
            >
              <input
                type="checkbox"
                checked={entry.done}
                onChange={(e) => onToggle(entry.id, e.target.checked)}
                className="h-4 w-4 rounded border-border accent-[var(--accent)]"
              />
              <span className={`flex-1 text-sm ${entry.done ? "line-through" : ""}`}>{entry.title}</span>
              <Badge>{entry.date}</Badge>
              <DeleteButton label="Remove" onClick={() => onRemove(entry.id)} />
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
