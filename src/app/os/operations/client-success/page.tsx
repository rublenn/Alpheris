"use client";

import { useState } from "react";
import { useOsStore } from "@/lib/os/store";
import { Client, ClientHealth, newId, todayISO } from "@/lib/os/types";
import { daysUntil, formatCurrency, formatPct, revenueConcentration } from "@/lib/os/calc";
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
  return {
    id: newId(),
    name: "",
    monthlyValue: 0,
    health: "Good",
    lastReportDate: "",
    lastReportNotes: "",
    notes: "",
    currentProblem: "",
    proposedSolution: "",
    satisfaction: 0,
  };
}

export default function ClientSuccessPage() {
  const {
    state,
    hydrated,
    addClient,
    updateClient,
    removeClient,
    addRelationshipNote,
    removeRelationshipNote,
  } = useOsStore();
  const [tab, setTab] = useState<"Clients" | "Reports" | "Relationship" | "Problems" | "Satisfaction">("Clients");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Client>(emptyClient());

  const [noteClient, setNoteClient] = useState("");
  const [noteText, setNoteText] = useState("");

  if (!hydrated) return null;

  const concentration = revenueConcentration(state.clients);
  const flagged = state.clients.filter((c) => c.health !== "Good");
  const rated = state.clients.filter((c) => c.satisfaction > 0);
  const avgSatisfaction = rated.length > 0 ? rated.reduce((s, c) => s + c.satisfaction, 0) / rated.length : null;

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

  function addNote() {
    if (!noteClient.trim() || !noteText.trim()) return;
    addRelationshipNote({ id: newId(), client: noteClient.trim(), date: todayISO(), note: noteText.trim() });
    setNoteText("");
  }

  const notes = [...state.relationshipNotes].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div className="flex flex-col gap-8">
      <SectionHeader
        eyebrow="Operations"
        title="Client Success"
        action={
          tab === "Clients" && (
            <Button variant="primary" onClick={openNew}>
              <IconPlus className="h-4 w-4" /> Add client
            </Button>
          )
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

      <Tabs
        value={tab}
        onChange={setTab}
        options={[
          { value: "Clients", label: "Clients", count: state.clients.length },
          { value: "Reports", label: "Monthly Report" },
          { value: "Relationship", label: "Relationship Management", count: notes.length },
          { value: "Problems", label: "Problems & Solutions" },
          { value: "Satisfaction", label: "Satisfaction" },
        ]}
      />

      {tab === "Clients" && (state.clients.length === 0 ? (
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
      ))}

      {tab === "Reports" && (state.clients.length === 0 ? (
        <EmptyState title="No clients yet" body="Add a client first — monthly reports are logged per client." />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {state.clients.map((c) => (
            <Card key={c.id} className="flex flex-col gap-2.5">
              <div className="flex items-center justify-between">
                <p className="font-medium text-sm">{c.name}</p>
                <Button variant="ghost" onClick={() => updateClient(c.id, { lastReportDate: todayISO() })}>
                  Mark reviewed today
                </Button>
              </div>
              <p className="text-xs text-muted">{c.lastReportDate ? `Last sent ${c.lastReportDate}` : "Never sent"}</p>
              <textarea
                value={c.lastReportNotes}
                onChange={(e) => updateClient(c.id, { lastReportNotes: e.target.value })}
                placeholder="What went in the last report — headline numbers, wins, next month's focus"
                className="w-full rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm outline-none focus:border-accent transition min-h-20 resize-y"
              />
            </Card>
          ))}
        </div>
      ))}

      {tab === "Relationship" && (
        <div className="flex flex-col gap-5">
          <Card>
            <p className="text-sm font-medium mb-3">Log an interaction</p>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                value={noteClient}
                onChange={(e) => setNoteClient(e.target.value)}
                placeholder="Client"
                list="rel-client-names"
                className="sm:w-48 rounded-lg border border-border bg-surface-2 px-3.5 py-2.5 text-sm outline-none focus:border-accent transition"
              />
              <datalist id="rel-client-names">
                {state.clients.map((c) => (
                  <option key={c.id} value={c.name} />
                ))}
              </datalist>
              <input
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder="e.g. Call to walk through Q3 results, went well"
                className="flex-1 rounded-lg border border-border bg-surface-2 px-3.5 py-2.5 text-sm outline-none focus:border-accent transition"
              />
              <button
                onClick={addNote}
                className="rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-white hover:opacity-90 transition"
              >
                Log
              </button>
            </div>
          </Card>

          {notes.length === 0 ? (
            <EmptyState title="No interactions logged yet" body="Every call, check-in, or note worth remembering goes here." />
          ) : (
            <div className="flex flex-col gap-2">
              {notes.map((n) => (
                <Card key={n.id} className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm"><span className="font-medium">{n.client}</span> <span className="text-muted">· {n.date}</span></p>
                    <p className="text-sm text-muted mt-0.5">{n.note}</p>
                  </div>
                  <DeleteButton label="Remove" onClick={() => removeRelationshipNote(n.id)} />
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === "Problems" && (state.clients.length === 0 ? (
        <EmptyState title="No clients yet" body="Add a client first." />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {state.clients.map((c) => (
            <Card key={c.id} className="flex flex-col gap-3">
              <p className="font-medium text-sm">{c.name}</p>
              <Field label="Current problem">
                <TextArea value={c.currentProblem} onChange={(v) => updateClient(c.id, { currentProblem: v })} placeholder="What's stuck right now" />
              </Field>
              <Field label="Proposed solution">
                <TextArea value={c.proposedSolution} onChange={(v) => updateClient(c.id, { proposedSolution: v })} placeholder="What you're doing about it" />
              </Field>
            </Card>
          ))}
        </div>
      ))}

      {tab === "Satisfaction" && (
        <div className="flex flex-col gap-5">
          <StatTile
            label="Average satisfaction"
            value={avgSatisfaction === null ? "—" : `${avgSatisfaction.toFixed(1)} / 5`}
            hint="Direct rating, not NPS — a better predictor of actual retention"
          />
          {state.clients.length === 0 ? (
            <EmptyState title="No clients yet" body="Add a client first." />
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {state.clients.map((c) => (
                <Card key={c.id} className="flex items-center justify-between gap-3">
                  <p className="font-medium text-sm">{c.name}</p>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <button
                        key={n}
                        onClick={() => updateClient(c.id, { satisfaction: c.satisfaction === n ? 0 : n })}
                        className={`h-7 w-7 rounded-full text-xs font-medium transition ${
                          c.satisfaction >= n ? "bg-accent text-white" : "bg-surface-2 text-muted hover:text-foreground"
                        }`}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                </Card>
              ))}
            </div>
          )}
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
