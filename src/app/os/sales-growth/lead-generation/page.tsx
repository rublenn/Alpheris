"use client";

import { useState } from "react";
import { useOsStore } from "@/lib/os/store";
import { Lead, LEAD_STATUSES, LeadStatus, Source, SOURCES, newId, todayISO } from "@/lib/os/types";
import {
  Badge,
  Button,
  Card,
  DeleteButton,
  Drawer,
  EmptyState,
  Field,
  SectionHeader,
  SelectInput,
  StatTile,
  TextInput,
} from "@/components/os/ui";
import { IconPlus } from "@/components/os/icons";

const STATUS_TONE: Record<LeadStatus, "neutral" | "accent" | "good"> = {
  New: "neutral",
  Contacted: "accent",
  Qualified: "good",
};

function emptyLead(): Lead {
  return { id: newId(), name: "", source: "Referral", contact: "", status: "New", capturedAt: todayISO() };
}

export default function LeadGenerationPage() {
  const { state, hydrated, addLead, updateLead, removeLead, addOpportunity } = useOsStore();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Lead>(emptyLead());

  if (!hydrated) return null;

  function openNew() {
    setForm(emptyLead());
    setEditingId(null);
    setDrawerOpen(true);
  }

  function openEdit(l: Lead) {
    setForm(l);
    setEditingId(l.id);
    setDrawerOpen(true);
  }

  function save() {
    if (!form.name.trim()) return;
    if (editingId) updateLead(editingId, form);
    else addLead(form);
    setDrawerOpen(false);
  }

  function convert(l: Lead) {
    addOpportunity({
      id: newId(),
      name: l.name,
      source: l.source,
      stage: "New",
      value: 0,
      nextAction: "",
      nextActionDate: todayISO(),
      createdAt: todayISO(),
    });
    removeLead(l.id);
  }

  return (
    <div className="flex flex-col gap-8">
      <SectionHeader
        eyebrow="Sales & Growth"
        title="Lead Generation"
        action={
          <Button variant="primary" onClick={openNew}>
            <IconPlus className="h-4 w-4" /> Add lead
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatTile label="Total leads" value={state.leads.length} />
        <StatTile label="New" value={state.leads.filter((l) => l.status === "New").length} />
        <StatTile label="Qualified" value={state.leads.filter((l) => l.status === "Qualified").length} />
      </div>

      {state.leads.length === 0 ? (
        <EmptyState
          title="No leads yet"
          body="Raw, uncontacted names and companies land here first. Qualify them, then convert to an opportunity — that moves them into the Sales pipeline."
          action={
            <Button variant="primary" onClick={openNew}>
              <IconPlus className="h-4 w-4" /> Add your first lead
            </Button>
          }
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {state.leads.map((l) => (
            <Card key={l.id} className="flex flex-col gap-3 cursor-pointer" padded>
              <div onClick={() => openEdit(l)} className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <p className="font-medium text-sm">{l.name}</p>
                  <Badge tone={STATUS_TONE[l.status]}>{l.status}</Badge>
                </div>
                <p className="text-xs text-muted">{l.source}{l.contact ? ` · ${l.contact}` : ""}</p>
                <p className="text-xs text-muted">Captured {l.capturedAt}</p>
              </div>
              <button
                onClick={() => convert(l)}
                className="text-left text-xs font-medium text-accent hover:opacity-80 transition"
              >
                Convert to opportunity →
              </button>
            </Card>
          ))}
        </div>
      )}

      <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)} title={editingId ? "Edit lead" : "New lead"}>
        <div className="flex flex-col gap-4">
          <Field label="Name">
            <TextInput value={form.name} onChange={(v) => setForm({ ...form, name: v })} placeholder="e.g. Northwind Studio" />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Source">
              <SelectInput value={form.source} onChange={(v: Source) => setForm({ ...form, source: v })} options={SOURCES} />
            </Field>
            <Field label="Status">
              <SelectInput value={form.status} onChange={(v: LeadStatus) => setForm({ ...form, status: v })} options={LEAD_STATUSES} />
            </Field>
          </div>
          <Field label="Contact">
            <TextInput value={form.contact} onChange={(v) => setForm({ ...form, contact: v })} placeholder="Email or phone" />
          </Field>

          <div className="flex items-center gap-2 pt-2">
            <Button variant="primary" onClick={save}>
              {editingId ? "Save changes" : "Add lead"}
            </Button>
            {editingId && (
              <DeleteButton
                label="Delete lead"
                onClick={() => {
                  removeLead(editingId);
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
