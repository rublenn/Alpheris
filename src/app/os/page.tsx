"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useOsStore } from "@/lib/os/store";
import { useRegisterBack } from "@/lib/os/backNav";
import { addDays, bucketForDate } from "@/lib/os/calc";
import { newId, todayISO } from "@/lib/os/types";
import { Badge, Card, DeleteButton, EmptyState, SaveButton, SectionHeader } from "@/components/os/ui";
import { IconChevron, IconSales, IconStrategies } from "@/components/os/icons";

type Screen = "root" | "work" | "today" | "tomorrow" | "week";

const SCREEN_PARENT: Record<Screen, Screen | null> = {
  root: null,
  work: "root",
  today: "work",
  tomorrow: "work",
  week: "work",
};

export default function OverviewPage() {
  const { state, hydrated, addTimelineEntry, updateTimelineEntry, removeTimelineEntry } = useOsStore();
  const [screen, setScreen] = useState<Screen>("root");

  useRegisterBack(screen === "root" ? null : () => setScreen(SCREEN_PARENT[screen]!));

  if (!hydrated) return null;

  const todayItems = state.timeline.filter((t) => bucketForDate(t.date) === "Today");
  const tomorrowItems = state.timeline.filter((t) => bucketForDate(t.date) === "Tomorrow");
  const weekItems = state.timeline.filter((t) => bucketForDate(t.date) === "This Week");

  function goBack() {
    const parent = SCREEN_PARENT[screen];
    if (parent) setScreen(parent);
  }

  return (
    <div className="flex flex-col gap-8">
      {screen === "root" && (
        <>
          <div>
            <p className="text-sm text-muted mb-1">
              {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
            </p>
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">Overview</h1>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <OverviewCard
              title="Work"
              subtitle="Today, tomorrow, this week"
              icon={<IconStrategies className="h-5 w-5" />}
              onClick={() => setScreen("work")}
            />
            <Link href="/os/sales-growth/sales" className="block">
              <OverviewCard title="Sales" subtitle="Pipeline, leads & clients" icon={<IconSales className="h-5 w-5" />} />
            </Link>
          </div>
        </>
      )}

      {screen === "work" && (
        <>
          <ScreenHeader title="Work" onBack={goBack} />
          <div className="grid gap-4 sm:grid-cols-3">
            <OverviewCard
              title="Today"
              subtitle={`${todayItems.filter((t) => !t.done).length} open`}
              onClick={() => setScreen("today")}
            />
            <OverviewCard
              title="Tomorrow"
              subtitle={`${tomorrowItems.filter((t) => !t.done).length} open`}
              onClick={() => setScreen("tomorrow")}
            />
            <OverviewCard
              title="This Week"
              subtitle={`${weekItems.filter((t) => !t.done).length} open`}
              onClick={() => setScreen("week")}
            />
          </div>
        </>
      )}

      {screen === "today" && (
        <>
          <ScreenHeader title="Today" onBack={goBack} />
          <TaskList
            items={todayItems}
            defaultDate={todayISO()}
            onAdd={(title, date) => addTimelineEntry({ id: newId(), title, date, done: false })}
            onToggle={(id, done) => updateTimelineEntry(id, { done })}
            onRemove={removeTimelineEntry}
          />
        </>
      )}

      {screen === "tomorrow" && (
        <>
          <ScreenHeader title="Tomorrow" onBack={goBack} />
          <TaskList
            items={tomorrowItems}
            defaultDate={addDays(todayISO(), 1)}
            onAdd={(title, date) => addTimelineEntry({ id: newId(), title, date, done: false })}
            onToggle={(id, done) => updateTimelineEntry(id, { done })}
            onRemove={removeTimelineEntry}
          />
        </>
      )}

      {screen === "week" && (
        <>
          <ScreenHeader title="This Week" onBack={goBack} />
          <WeekView
            items={weekItems}
            onAdd={(title, date) => addTimelineEntry({ id: newId(), title, date, done: false })}
            onToggle={(id, done) => updateTimelineEntry(id, { done })}
            onRemove={removeTimelineEntry}
          />
        </>
      )}
    </div>
  );
}

function ScreenHeader({ title, onBack }: { title: string; onBack: () => void }) {
  return (
    <div className="flex items-center gap-3">
      <button
        onClick={onBack}
        aria-label="Back"
        className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border text-muted transition duration-150 ease-[var(--ease-smooth)] hover:border-muted hover:text-foreground active:scale-[0.94]"
      >
        <IconChevron className="h-4 w-4 rotate-180" />
      </button>
      <SectionHeader title={title} />
    </div>
  );
}

function OverviewCard({
  title,
  subtitle,
  icon,
  onClick,
}: {
  title: string;
  subtitle: string;
  icon?: React.ReactNode;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left rise-in transition duration-150 ease-[var(--ease-smooth)] active:scale-[0.98]"
    >
      <Card className="flex items-center justify-between gap-4 h-full transition hover:border-muted">
        <div className="flex items-center gap-3">
          {icon && (
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-accent-soft text-accent shrink-0">
              {icon}
            </span>
          )}
          <div>
            <p className="font-semibold leading-tight">{title}</p>
            <p className="text-xs text-muted">{subtitle}</p>
          </div>
        </div>
        <IconChevron className="h-4 w-4 text-muted shrink-0" />
      </Card>
    </button>
  );
}

interface TaskItem {
  id: string;
  title: string;
  date: string;
  done: boolean;
}

function TaskList({
  items,
  defaultDate,
  onAdd,
  onToggle,
  onRemove,
}: {
  items: TaskItem[];
  defaultDate: string;
  onAdd: (title: string, date: string) => void;
  onToggle: (id: string, done: boolean) => void;
  onRemove: (id: string) => void;
}) {
  const sorted = [...items].sort((a, b) => a.date.localeCompare(b.date));
  return (
    <div className="flex flex-col gap-4">
      <AddTaskForm defaultDate={defaultDate} onAdd={onAdd} />
      {sorted.length === 0 ? (
        <EmptyState title="Nothing here yet" body="Add what has to happen — one line is enough." />
      ) : (
        <TaskListView items={sorted} onToggle={onToggle} onRemove={onRemove} />
      )}
    </div>
  );
}

function WeekView({
  items,
  onAdd,
  onToggle,
  onRemove,
}: {
  items: TaskItem[];
  onAdd: (title: string, date: string) => void;
  onToggle: (id: string, done: boolean) => void;
  onRemove: (id: string) => void;
}) {
  const byDate = new Map<string, TaskItem[]>();
  for (const item of items) {
    const list = byDate.get(item.date) ?? [];
    list.push(item);
    byDate.set(item.date, list);
  }
  const dates = Array.from(byDate.keys()).sort();

  return (
    <div className="flex flex-col gap-4">
      <AddTaskForm defaultDate={addDays(todayISO(), 3)} onAdd={onAdd} />
      {dates.length === 0 ? (
        <EmptyState title="Nothing due this week" body="Add what has to happen — one line is enough." />
      ) : (
        <div className="flex flex-col gap-5">
          {dates.map((date) => (
            <Card key={date}>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold">
                  {new Date(date).toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}
                </h3>
                <Badge>{byDate.get(date)!.length}</Badge>
              </div>
              <TaskListView items={byDate.get(date)!} onToggle={onToggle} onRemove={onRemove} bare />
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function TaskListView({
  items,
  onToggle,
  onRemove,
  bare = false,
}: {
  items: TaskItem[];
  onToggle: (id: string, done: boolean) => void;
  onRemove: (id: string) => void;
  bare?: boolean;
}) {
  const list = (
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
          {!bare && <Badge>{entry.date}</Badge>}
          <DeleteButton label="Remove" onClick={() => onRemove(entry.id)} />
        </li>
      ))}
    </ul>
  );
  return bare ? list : <Card>{list}</Card>;
}

function AddTaskForm({ defaultDate, onAdd }: { defaultDate: string; onAdd: (title: string, date: string) => void }) {
  const [title, setTitle] = useState("");
  const [date, setDate] = useState(defaultDate);

  function persist() {
    const trimmed = title.trim();
    if (!trimmed) return;
    onAdd(trimmed, date);
    setTitle("");
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2">
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="e.g. Call Northwind about the proposal"
        className="flex-1 rounded-lg border border-border bg-surface-2 px-3.5 py-2.5 text-sm outline-none focus:border-accent transition"
      />
      <input
        type="date"
        value={date}
        onChange={(e) => setDate(e.target.value)}
        className="rounded-lg border border-border bg-surface-2 px-3.5 py-2.5 text-sm outline-none focus:border-accent transition"
      />
      <SaveButton onSave={persist} disabled={!title.trim()} idleLabel="Add task" />
    </form>
  );
}
