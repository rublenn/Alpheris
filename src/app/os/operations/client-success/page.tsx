"use client";

import { useState } from "react";
import { useOsStore } from "@/lib/os/store";
import { Client, ClientHealth, newId, todayISO } from "@/lib/os/types";
import { daysUntil, formatCurrency, formatPct, revenueConcentration } from "@/lib/os/calc";
import {
  Badge,
  Button,
  DeleteButton,
  Drawer,
  EmptyState,
  Field,
  NumberInput,
  SectionHeader,
  SelectInput,
  StatTile,
  TextArea,
  TextInput,
} from "@/components/os/ui";
import { IconPlus } from "@/components/os/icons";

const HEALTH_TONE: Record<ClientHealth, "good" | "warn" | "critical"> = {
  Good: "good",
  Watch: "warn",
  "At risk": "critical",
};

function emptyClient(): Client {
  return { id: newId(), name: "", monthlyValue: 0, health: "Good", lastReportDate: "", notes: "" };
}

export default function ClientSuccessPage() {
  const { state, hydrated, addClient, updateClient, removeClient } = useOsStore();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Client>(emptyClient());

  if (!hydrated) return null;

  const concentration = revenueConcentration(state.clients);
  const flagged = state.clients.filter((c) => c.health !== "Good");

  function openNew() {
    setForm(emptyClient());
    setEditingId(null);
    setDrawerOpen(true);
  }

  function openEdit(c: Client) {
    setForm(c);
    setEditingId(c.id);
    setDrawerOpen(true);
  }

  function save() {
    if (!form.name.trim()) return;
    if (editingId) updateClient(editingId, form);
    else addClient(form);
    setDrawerOpen(false);
  }

  return (
    <div className="flex flex-col gap-8">
      <SectionHeader
        eyebrow="Operations"
        title="Client Success"
        action={
          <Button variant="primary" onClick={openNew}>
            <IconPlus className="h-4 w-4" /> Add client
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatTile label="Active clients" value={state.clients.length} />
        <StatTile
          label="Largest client share"
          value={concentration ? formatPct(concentration.share) : "—"}
          tone={concentration && concentration.share >= 0.35 ? "warn" : "neutral"}
          hint="Above ~35% is a structural risk for a one-person agency"
        />
        <StatTile label="Flagged" value={flagged.length} tone={flagged.length > 0 ? "warn" : "neutral"} />
      </div>

      {state.clients.length === 0 ? (
        <EmptyState
          title="No clients yet"
          body="Add clients as accounts move to Won. Health is a behavioural signal — track it here rather than waiting for a monthly report to find out someone's unhappy."
          action={
            <Button variant="primary" onClick={openNew}>
              <IconPlus className="h-4 w-4" /> Add your first client
            </Button>
          }
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {state.clients.map((c) => {
            const daysSinceReport = c.lastReportDate ? daysUntil(c.lastReportDate) : null;
            return (
              <button
                key={c.id}
                onClick={() => openEdit(c)}
                className="text-left rounded-xl border border-border bg-surface p-4 transition hover:border-muted"
              >
                <div className="flex items-center justify-between mb-2">
                  <p className="font-medium text-sm">{c.name}</p>
                  <Badge tone={HEALTH_TONE[c.health]}>{c.health}</Badge>
                </div>
                <p className="text-xs text-muted mb-1">{formatCurrency(c.monthlyValue)} / month</p>
                <p className="text-xs text-muted">
                  {c.lastReportDate
                    ? `Last report ${c.lastReportDate}${
                        daysSinceReport !== null && daysSinceReport < -35 ? " · overdue" : ""
                      }`
                    : "No report logged yet"}
                </p>
              </button>
            );
          })}
        </div>
      )}

      <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)} title={editingId ? "Edit client" : "New client"}>
        <div className="flex flex-col gap-4">
          <Field label="Client name">
            <TextInput value={form.name} onChange={(v) => setForm({ ...form, name: v })} placeholder="e.g. Northwind Studio" />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Monthly value">
              <NumberInput value={form.monthlyValue} onChange={(v) => setForm({ ...form, monthlyValue: v })} />
            </Field>
            <Field label="Health">
              <SelectInput
                value={form.health}
                onChange={(v: ClientHealth) => setForm({ ...form, health: v })}
                options={["Good", "Watch", "At risk"] as const}
              />
            </Field>
          </div>
          <Field label="Last monthly report">
            <div className="flex items-center gap-2">
              <TextInput type="date" value={form.lastReportDate} onChange={(v) => setForm({ ...form, lastReportDate: v })} />
              <Button variant="ghost" onClick={() => setForm({ ...form, lastReportDate: todayISO() })}>
                Today
              </Button>
            </div>
          </Field>
          <Field label="Notes">
            <TextArea value={form.notes} onChange={(v) => setForm({ ...form, notes: v })} placeholder="What's driving the health status" />
          </Field>

          <div className="flex items-center gap-2 pt-2">
            <Button variant="primary" onClick={save}>
              {editingId ? "Save changes" : "Add client"}
            </Button>
            {editingId && (
              <DeleteButton
                label="Delete client"
                onClick={() => {
                  removeClient(editingId);
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
