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
  };
}

export default function DeliverablesPage() {
  const { state, hydrated, addDeliverable, updateDeliverable, removeDeliverable } = useOsStore();
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

      {state.deliverables.length === 0 ? (
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
