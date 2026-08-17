"use client";

import { useState } from "react";
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
  Brief: "neutral",
  Production: "accent",
  Review: "warn",
  Delivered: "good",
};

function emptyDeliverable(): Deliverable {
  return {
    id: newId(),
    client: "",
    title: "",
    playbookId: "",
    status: "Brief",
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
  const { state, hydrated, addDeliverable, updateDeliverable, removeDeliverable } = useOsStore();
  const [tab, setTab] = useState<"All" | "Calendar" | "Scheduling" | "Publishing">("All");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Deliverable>(emptyDeliverable());

  if (!hydrated) return null;

  const variance = estimateVariance(state.deliverables);
  const onTime = onTimeRate(state.deliverables);

  function openNew() {
    setForm(emptyDeliverable());
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

  const sorted = [...state.deliverables].sort((a, b) => a.dueDate.localeCompare(b.dueDate));

  const byMonth = new Map<string, Deliverable[]>();
  for (const d of sorted) {
    const key = monthLabel(d.dueDate);
    if (!byMonth.has(key)) byMonth.set(key, []);
    byMonth.get(key)!.push(d);
  }

  const scheduled = state.deliverables
    .filter((d) => d.scheduledDate)
    .slice()
    .sort((a, b) => a.scheduledDate.localeCompare(b.scheduledDate));

  const published = state.deliverables
    .filter((d) => d.status === "Delivered" || d.publishedDate)
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
        <StatTile label="Open" value={state.deliverables.filter((d) => d.status !== "Delivered").length} />
        <StatTile
          label="Estimate variance"
          value={variance === null ? "—" : `${variance >= 0 ? "+" : ""}${Math.round(variance * 100)}%`}
          tone={variance !== null && variance > 0.2 ? "warn" : "neutral"}
          hint="Logged vs. estimated hours, delivered work"
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
          { value: "All", label: "All Deliverables", count: state.deliverables.length },
          { value: "Calendar", label: "Content Calendar" },
          { value: "Scheduling", label: "Scheduling", count: scheduled.length },
          { value: "Publishing", label: "Publishing", count: published.length },
        ]}
      />

      {tab === "All" && (state.deliverables.length === 0 ? (
        <EmptyState
          title="No deliverables yet"
          body="This is the atomic unit everything else schedules and reports against. Add what you owe a client next."
          action={
            <Button variant="primary" onClick={openNew}>
              <IconPlus className="h-4 w-4" /> Add your first deliverable
            </Button>
          }
        />
      ) : (
        <Card padded={false} className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[40rem]">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted">
                  <th className="px-5 py-3 font-medium">Deliverable</th>
                  <th className="px-5 py-3 font-medium">Client</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium text-right">Est. / logged</th>
                  <th className="px-5 py-3 font-medium">Due</th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((d) => (
                  <tr
                    key={d.id}
                    onClick={() => openEdit(d)}
                    className="border-b border-border-soft last:border-0 cursor-pointer hover:bg-surface-2 transition"
                  >
                    <td className="px-5 py-3 font-medium">{d.title}</td>
                    <td className="px-5 py-3 text-muted">{d.client}</td>
                    <td className="px-5 py-3">
                      <Badge tone={STATUS_TONE[d.status]}>{d.status}</Badge>
                    </td>
                    <td className="px-5 py-3 text-right tabular-nums text-muted">
                      {d.estimateHours}h / {d.loggedHours}h
                    </td>
                    <td className="px-5 py-3 text-muted">{d.dueDate}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      ))}

      {tab === "Calendar" && (state.deliverables.length === 0 ? (
        <EmptyState title="Nothing on the calendar" body="Deliverables appear here grouped by due month, earliest first." />
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
      ))}

      {tab === "Scheduling" && (scheduled.length === 0 ? (
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
      ))}

      {tab === "Publishing" && (published.length === 0 ? (
        <EmptyState title="Nothing published yet" body="Deliverables marked Delivered, or with a published date set, show up here as your publishing log." />
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
      ))}

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
