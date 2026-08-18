"use client";

import Link from "next/link";
import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useOsStore } from "@/lib/os/store";
import { DELIVERABLE_STATUSES, Deliverable, DeliverableStatus, newId, todayISO } from "@/lib/os/types";
import { estimateVariance, onTimeRate } from "@/lib/os/calc";
import {
  Badge,
  Button,
  Card,
  DeleteButton,
  Drawer,
  EmptyState,
  Field,
  NumberInput,
  SectionHeader,
  SelectInput,
  StatTile,
  Tabs,
  TextInput,
} from "@/components/os/ui";
import { IconPlus } from "@/components/os/icons";

const STATUS_TONE: Record<DeliverableStatus, "neutral" | "accent" | "warn" | "good"> = {
  "In Production": "accent",
  "To Be Reviewed": "neutral",
  "Need Changes": "warn",
  Final: "good",
};

const POST_PRODUCTION_COLUMNS: DeliverableStatus[] = ["In Production", "To Be Reviewed", "Need Changes", "Final"];

function emptyDeliverable(client = ""): Deliverable {
  return {
    id: newId(),
    client,
    title: "",
    playbookId: "",
    status: "In Production",
    estimateHours: 0,
    loggedHours: 0,
    dueDate: todayISO(),
    scheduledDate: "",
    publishedDate: "",
    publishedLink: "",
  };
}

function monthLabel(dateStr: string) {
  if (!dateStr) return "No date";
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

export default function DeliverablesPage() {
  return (
    <Suspense>
      <DeliverablesPageInner />
    </Suspense>
  );
}

function DeliverablesPageInner() {
  const { state, hydrated, addDeliverable, updateDeliverable, removeDeliverable } = useOsStore();
  const searchParams = useSearchParams();
  const focusClient = searchParams.get("client") || "";
  const initialTab = searchParams.get("tab") === "live" ? "Live" : "PostProduction";
  const [tab, setTab] = useState<"PostProduction" | "Live">(initialTab);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Deliverable>(emptyDeliverable());

  if (!hydrated) return null;

  const variance = estimateVariance(state.deliverables);
  const onTime = onTimeRate(state.deliverables);

  function openNew() {
    setForm(emptyDeliverable(focusClient));
    setEditingId(null);
    setDrawerOpen(true);
  }

  function openEdit(d: Deliverable) {
    setForm(d);
    setEditingId(d.id);
    setDrawerOpen(true);
  }

  function save() {
    if (!form.title.trim() || !form.client.trim()) return;
    if (editingId) updateDeliverable(editingId, form);
    else addDeliverable(form);
    setDrawerOpen(false);
  }

  const queue = state.deliverables.filter(
    (d) => !focusClient || d.client.toLowerCase() === focusClient.toLowerCase()
  );

  const sorted = [...state.deliverables].sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  const calendarSource = focusClient
    ? sorted.filter((d) => d.client.toLowerCase() === focusClient.toLowerCase())
    : sorted;

  const byMonth = new Map<string, Deliverable[]>();
  for (const d of calendarSource) {
    const key = monthLabel(d.dueDate);
    if (!byMonth.has(key)) byMonth.set(key, []);
    byMonth.get(key)!.push(d);
  }

  const scheduled = state.deliverables
    .filter((d) => d.scheduledDate)
    .slice()
    .sort((a, b) => a.scheduledDate.localeCompare(b.scheduledDate));

  const published = state.deliverables
    .filter((d) => d.status === "Final" || d.publishedDate)
    .slice()
    .sort((a, b) => (b.publishedDate || "").localeCompare(a.publishedDate || ""));

  return (
    <div className="flex flex-col gap-8">
      <SectionHeader
        eyebrow="Working"
        title="Deliverables"
        action={
          <Button variant="primary" onClick={openNew}>
            <IconPlus className="h-4 w-4" /> New deliverable
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatTile label="Open" value={state.deliverables.filter((d) => d.status !== "Final").length} />
        <StatTile
          label="Estimate variance"
          value={variance === null ? "—" : `${variance >= 0 ? "+" : ""}${Math.round(variance * 100)}%`}
          tone={variance !== null && variance > 0.2 ? "warn" : "neutral"}
          hint="Logged vs. estimated hours, final work"
        />
        <StatTile
          label="On-time rate"
          value={onTime === null ? "—" : `${Math.round(onTime * 100)}%`}
          tone={onTime !== null && onTime < 0.9 ? "warn" : "neutral"}
        />
      </div>

      <Tabs
        value={tab}
        onChange={setTab}
        options={[
          { value: "PostProduction", label: "Post-Production", count: queue.filter((d) => d.status !== "Final").length },
          { value: "Live", label: "Live" },
        ]}
      />

      {focusClient && (
        <div className="flex items-center gap-2 text-sm -mt-2">
          <span className="text-muted">Filtered to</span>
          <Badge tone="accent">{focusClient}</Badge>
          <Link href={`/os/working/deliverables?tab=${tab === "Live" ? "live" : "postproduction"}`} className="text-accent hover:opacity-80">
            Clear
          </Link>
        </div>
      )}

      {tab === "PostProduction" && (queue.length === 0 ? (
        <EmptyState
          title={focusClient ? `Nothing for ${focusClient} yet` : "Nothing in post-production yet"}
          body="Add a deliverable and move it through in production, to be reviewed, need changes, and final."
          action={
            <Button variant="primary" onClick={openNew}>
              <IconPlus className="h-4 w-4" /> Add a deliverable
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {POST_PRODUCTION_COLUMNS.map((col) => {
            const items = queue.filter((d) => d.status === col);
            return (
              <div key={col}>
                <div className="flex items-center justify-between mb-3 px-1">
                  <p className="text-sm font-semibold">{col}</p>
                  <span className="text-xs text-muted">{items.length}</span>
                </div>
                <div className="flex flex-col gap-2">
                  {items.map((d) => (
                    <div key={d.id} className="rounded-xl border border-border bg-surface p-3.5">
                      <div onClick={() => openEdit(d)} className="cursor-pointer">
                        <p className="font-medium text-sm mb-0.5">{d.title}</p>
                        <p className="text-xs text-muted mb-3">{d.client}{d.dueDate ? ` · due ${d.dueDate}` : ""}</p>
                      </div>
                      <div className="flex flex-wrap items-center gap-1.5">
                        {POST_PRODUCTION_COLUMNS.map((target) => (
                          <button
                            key={target}
                            onClick={() => updateDeliverable(d.id, { status: target })}
                            disabled={target === d.status}
                            className={`rounded-full px-2.5 py-1 text-xs font-medium transition disabled:opacity-100 ${
                              target === d.status
                                ? "bg-accent text-white"
                                : "bg-surface-2 text-muted hover:text-foreground"
                            }`}
                          >
                            {target}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                  {items.length === 0 && (
                    <div className="rounded-xl border border-dashed border-border-soft p-4 text-center">
                      <p className="text-xs text-muted">Empty</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ))}

      {tab === "Live" && (
        <div className="flex flex-col gap-8">
          <div>
            <p className="text-sm font-semibold mb-3">Content calendar</p>
            {calendarSource.length === 0 ? (
              <EmptyState
                title={focusClient ? `Nothing on the calendar for ${focusClient}` : "Nothing on the calendar"}
                body="Deliverables appear here grouped by due month, earliest first."
              />
            ) : (
              <div className="flex flex-col gap-5">
                {Array.from(byMonth.entries()).map(([month, items]) => (
                  <Card key={month}>
                    <p className="text-sm font-semibold mb-3">{month}</p>
                    <div className="flex flex-col gap-2">
                      {items.map((d) => (
                        <div key={d.id} onClick={() => openEdit(d)} className="flex items-center justify-between gap-3 rounded-lg border border-border-soft bg-surface-2 px-3.5 py-2.5 cursor-pointer hover:border-muted transition">
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate">{d.title}</p>
                            <p className="text-xs text-muted">{d.client}</p>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-xs text-muted tabular-nums">{d.dueDate}</span>
                            <Badge tone={STATUS_TONE[d.status]}>{d.status}</Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>

          <div>
            <p className="text-sm font-semibold mb-3">Scheduling</p>
            {scheduled.length === 0 ? (
              <EmptyState title="Nothing scheduled" body="Set a scheduled date on a deliverable to have it show up here as a publishing queue." />
            ) : (
              <div className="flex flex-col gap-2">
                {scheduled.map((d) => (
                  <Card key={d.id} className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{d.title}</p>
                      <p className="text-xs text-muted">{d.client}</p>
                    </div>
                    <input
                      type="date"
                      value={d.scheduledDate}
                      onChange={(e) => updateDeliverable(d.id, { scheduledDate: e.target.value })}
                      className="rounded-lg border border-border bg-surface-2 px-2.5 py-1.5 text-sm outline-none focus:border-accent transition shrink-0"
                    />
                  </Card>
                ))}
              </div>
            )}
          </div>

          <div>
            <p className="text-sm font-semibold mb-3">Publishing</p>
            {published.length === 0 ? (
              <EmptyState title="Nothing published yet" body="Deliverables marked Final, or with a published date set, show up here as your publishing log." />
            ) : (
              <div className="flex flex-col gap-2">
                {published.map((d) => (
                  <Card key={d.id} className="flex flex-col sm:flex-row sm:items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{d.title}</p>
                      <p className="text-xs text-muted">{d.client}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <input
                        type="date"
                        value={d.publishedDate}
                        onChange={(e) => updateDeliverable(d.id, { publishedDate: e.target.value })}
                        className="rounded-lg border border-border bg-surface-2 px-2.5 py-1.5 text-sm outline-none focus:border-accent transition"
                      />
                      <input
                        value={d.publishedLink}
                        onChange={(e) => updateDeliverable(d.id, { publishedLink: e.target.value })}
                        placeholder="Link"
                        className="w-40 rounded-lg border border-border bg-surface-2 px-2.5 py-1.5 text-sm outline-none focus:border-accent transition"
                      />
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)} title={editingId ? "Edit deliverable" : "New deliverable"}>
        <div className="flex flex-col gap-4">
          <Field label="Title">
            <TextInput value={form.title} onChange={(v) => setForm({ ...form, title: v })} placeholder="e.g. October reel batch" />
          </Field>
          <Field label="Client">
            <TextInput value={form.client} onChange={(v) => setForm({ ...form, client: v })} placeholder="e.g. Northwind Studio" />
          </Field>
          {state.playbooks.length > 0 && (
            <Field label="Playbook">
              <select
                value={form.playbookId}
                onChange={(e) => setForm({ ...form, playbookId: e.target.value })}
                className="w-full rounded-lg border border-border bg-surface-2 px-3.5 py-2.5 text-sm outline-none focus:border-accent transition appearance-none"
              >
                <option value="">None</option>
                {state.playbooks.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </Field>
          )}
          <Field label="Status">
            <SelectInput value={form.status} onChange={(v: DeliverableStatus) => setForm({ ...form, status: v })} options={DELIVERABLE_STATUSES} />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Estimate (hours)">
              <NumberInput value={form.estimateHours} onChange={(v) => setForm({ ...form, estimateHours: v })} />
            </Field>
            <Field label="Logged (hours)">
              <NumberInput value={form.loggedHours} onChange={(v) => setForm({ ...form, loggedHours: v })} />
            </Field>
          </div>
          <Field label="Due date">
            <TextInput type="date" value={form.dueDate} onChange={(v) => setForm({ ...form, dueDate: v })} />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Scheduled date">
              <TextInput type="date" value={form.scheduledDate} onChange={(v) => setForm({ ...form, scheduledDate: v })} />
            </Field>
            <Field label="Published date">
              <TextInput type="date" value={form.publishedDate} onChange={(v) => setForm({ ...form, publishedDate: v })} />
            </Field>
          </div>
          <Field label="Published link">
            <TextInput value={form.publishedLink} onChange={(v) => setForm({ ...form, publishedLink: v })} placeholder="https://…" />
          </Field>

          <div className="flex items-center gap-2 pt-2">
            <Button variant="primary" onClick={save}>
              {editingId ? "Save changes" : "Add deliverable"}
            </Button>
            {editingId && (
              <DeleteButton
                label="Delete deliverable"
                onClick={() => {
                  removeDeliverable(editingId);
                  setDrawerOpen(false);
                }}
              />
            )}
          </div>
        </div>
      </Drawer>
    </div>
  );
}
