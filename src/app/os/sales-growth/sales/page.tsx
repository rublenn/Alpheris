"use client";

import { useState } from "react";
import { useOsStore } from "@/lib/os/store";
import {
  LEAD_STAGE_LABELS,
  LEAD_STAGES,
  Lead,
  LeadStage,
  SOURCES,
  Source,
  newId,
  todayISO,
} from "@/lib/os/types";
import { conversionRate, formatCurrency, formatPct, openLeads, pipelineValue } from "@/lib/os/calc";
import {
  Badge,
  Button,
  Card,
  DeleteButton,
  Drawer,
  EmptyState,
  Field,
  NumberInput,
  ProgressBar,
  SectionHeader,
  SelectInput,
  StatTile,
  Tabs,
  TextInput,
} from "@/components/os/ui";
import { IconPlus } from "@/components/os/icons";

const STAGE_TONE: Record<LeadStage, "neutral" | "good" | "critical" | "accent" | "warn"> = {
  Lead: "neutral",
  InTalk: "accent",
  Client: "good",
  FollowUp: "warn",
};

function addDays(dateStr: string, days: number): string {
  const base = dateStr ? new Date(dateStr) : new Date();
  base.setDate(base.getDate() + days);
  return base.toISOString().slice(0, 10);
}

function emptyLead(): Lead {
  return {
    id: newId(),
    name: "",
    source: "Referral",
    contact: "",
    instagramFollowers: 0,
    address: "",
    stage: "Lead",
    value: 0,
    nextAction: "",
    nextActionDate: todayISO(),
    capturedAt: todayISO(),
  };
}

export default function SalesPage() {
  const { state, hydrated, setTarget, addLead, updateLead, removeLead } = useOsStore();

  const [tab, setTab] = useState<LeadStage>("Lead");

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Lead>(emptyLead());

  const [editingTarget, setEditingTarget] = useState(false);
  const [targetForm, setTargetForm] = useState(state.target);

  if (!hydrated) return null;

  const pipeline = pipelineValue(state.leads);
  const conversion = conversionRate(state.leads);
  const clients = state.leads.filter((l) => l.stage === "Client");
  const revenueWon = clients.reduce((s, l) => s + l.value, 0);
  const qualifiedPlus = state.leads.filter((l) => l.stage !== "Lead").length;
  const today = todayISO();

  const byTab = state.leads.filter((l) => l.stage === tab);
  const overdueFollowUps = state.leads.filter(
    (l) => l.stage === "FollowUp" && l.nextActionDate && l.nextActionDate < today
  ).length;

  function openNew() {
    setForm({ ...emptyLead(), stage: tab });
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
    if (editingId) {
      updateLead(editingId, form);
    } else {
      addLead(form);
    }
    setDrawerOpen(false);
  }

  function saveTarget() {
    setTarget(targetForm);
    setEditingTarget(false);
  }

  function moveTo(l: Lead, stage: LeadStage) {
    updateLead(l.id, { stage });
  }

  return (
    <div className="flex flex-col gap-8">
      <SectionHeader
        eyebrow="Sales & Marketing"
        title="Sales"
        action={
          <Button variant="primary" onClick={openNew}>
            <IconPlus className="h-4 w-4" /> Add lead
          </Button>
        }
      />

      <Card>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold">This period&apos;s target</h3>
          {!editingTarget && (
            <Button
              variant="ghost"
              onClick={() => {
                setTargetForm(state.target);
                setEditingTarget(true);
              }}
            >
              Edit
            </Button>
          )}
        </div>

        {editingTarget ? (
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Revenue goal">
              <NumberInput value={targetForm.revenueGoal} onChange={(v) => setTargetForm({ ...targetForm, revenueGoal: v })} />
            </Field>
            <Field label="New clients goal">
              <NumberInput value={targetForm.newClientsGoal} onChange={(v) => setTargetForm({ ...targetForm, newClientsGoal: v })} />
            </Field>
            <Field label="Qualified leads goal">
              <NumberInput value={targetForm.qualifiedLeadsGoal} onChange={(v) => setTargetForm({ ...targetForm, qualifiedLeadsGoal: v })} />
            </Field>
            <div className="sm:col-span-3 flex gap-2">
              <Button variant="primary" onClick={saveTarget}>Save target</Button>
              <Button variant="ghost" onClick={() => setEditingTarget(false)}>Cancel</Button>
            </div>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-3">
            <TargetProgress label="Revenue" value={revenueWon} goal={state.target.revenueGoal} format={formatCurrency} />
            <TargetProgress label="New clients" value={clients.length} goal={state.target.newClientsGoal} format={(n) => String(n)} />
            <TargetProgress label="Qualified leads" value={qualifiedPlus} goal={state.target.qualifiedLeadsGoal} format={(n) => String(n)} />
          </div>
        )}
      </Card>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatTile label="Open pipeline value" value={formatCurrency(pipeline)} />
        <StatTile label="Conversion rate" value={formatPct(conversion)} hint="Clients ÷ all leads" />
        <StatTile label="In talks" value={openLeads(state.leads).length} />
      </div>

      <Tabs
        value={tab}
        onChange={setTab}
        options={[
          { value: "Lead", label: "Leads", count: state.leads.filter((l) => l.stage === "Lead").length },
          { value: "InTalk", label: "In Talks", count: state.leads.filter((l) => l.stage === "InTalk").length },
          { value: "Client", label: "Clients", count: clients.length },
          { value: "FollowUp", label: "Follow Ups", count: overdueFollowUps },
        ]}
      />

      {byTab.length === 0 ? (
        <EmptyState
          title={
            tab === "Lead"
              ? "No leads yet"
              : tab === "InTalk"
              ? "Nothing in talks yet"
              : tab === "Client"
              ? "No clients yet"
              : "No follow ups yet"
          }
          body={
            tab === "Lead"
              ? "Raw, uncontacted names land here first. Add one, then move it forward once you're talking."
              : tab === "Client"
              ? "Move a lead to Client from the In Talks tab and a timeline builds for it automatically."
              : tab === "FollowUp"
              ? "Anything you're keeping warm for later shows up here."
              : "Leads you're actively talking to show up here."
          }
          action={
            <Button variant="primary" onClick={openNew}>
              <IconPlus className="h-4 w-4" /> Add lead
            </Button>
          }
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {byTab.map((l) => {
            const overdueItem = l.stage === "FollowUp" && l.nextActionDate && l.nextActionDate < today;
            return (
              <Card key={l.id} className="flex flex-col gap-3">
                <div onClick={() => openEdit(l)} className="flex flex-col gap-2 cursor-pointer">
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-sm">{l.name}</p>
                    <Badge tone={STAGE_TONE[l.stage]}>{LEAD_STAGE_LABELS[l.stage]}</Badge>
                  </div>
                  <p className="text-xs text-muted">
                    {l.source}
                    {l.instagramFollowers > 0 ? ` · ${l.instagramFollowers.toLocaleString()} IG followers` : ""}
                  </p>
                  {l.address && <p className="text-xs text-muted line-clamp-1">{l.address}</p>}
                  {l.value > 0 && <p className="text-xs text-muted">{formatCurrency(l.value)}</p>}
                  {l.stage === "FollowUp" && l.nextAction && (
                    <p className={`text-xs line-clamp-2 ${overdueItem ? "text-critical" : "text-muted"}`}>
                      Next: {l.nextAction}
                      {l.nextActionDate && ` · ${l.nextActionDate}`}
                    </p>
                  )}
                  <p className="text-xs text-muted">Captured {l.capturedAt}</p>
                </div>
                <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-border-soft">
                  {LEAD_STAGES.filter((s) => s !== l.stage).map((s) => (
                    <button
                      key={s}
                      onClick={() => moveTo(l, s)}
                      className="rounded-full border border-border px-2.5 py-1 text-xs font-medium text-muted transition hover:border-accent hover:text-accent"
                    >
                      → {LEAD_STAGE_LABELS[s]}
                    </button>
                  ))}
                </div>
                {l.stage === "FollowUp" && (
                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="date"
                      value={l.nextActionDate}
                      onChange={(e) => updateLead(l.id, { nextActionDate: e.target.value })}
                      className={`flex-1 rounded-lg border bg-surface-2 px-2.5 py-1.5 text-sm outline-none focus:border-accent transition ${
                        overdueItem ? "border-critical text-critical" : "border-border"
                      }`}
                    />
                    <Button variant="ghost" onClick={() => updateLead(l.id, { nextActionDate: addDays(l.nextActionDate, 3) })}>
                      +3d
                    </Button>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)} title={editingId ? "Edit lead" : "New lead"}>
        <div className="flex flex-col gap-4">
          <Field label="Name">
            <TextInput value={form.name} onChange={(v) => setForm({ ...form, name: v })} placeholder="e.g. Northwind Studio" />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Instagram followers">
              <NumberInput
                value={form.instagramFollowers}
                onChange={(v) => setForm({ ...form, instagramFollowers: v })}
                placeholder="0"
              />
            </Field>
            <Field label="Source">
              <SelectInput value={form.source} onChange={(v: Source) => setForm({ ...form, source: v })} options={SOURCES} />
            </Field>
          </div>
          <Field label="Address">
            <TextInput value={form.address} onChange={(v) => setForm({ ...form, address: v })} placeholder="e.g. 12 Main St, Springfield" />
          </Field>
          <Field label="Contact">
            <TextInput value={form.contact} onChange={(v) => setForm({ ...form, contact: v })} placeholder="Email or phone" />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Stage">
              <SelectInput
                value={form.stage}
                onChange={(v: LeadStage) => setForm({ ...form, stage: v })}
                options={LEAD_STAGES}
                labels={LEAD_STAGE_LABELS}
              />
            </Field>
            <Field label="Deal value">
              <NumberInput value={form.value} onChange={(v) => setForm({ ...form, value: v })} placeholder="0" />
            </Field>
          </div>
          <Field label="Next action">
            <TextInput value={form.nextAction} onChange={(v) => setForm({ ...form, nextAction: v })} placeholder="e.g. Send proposal" />
          </Field>
          <Field label="Next action date">
            <TextInput type="date" value={form.nextActionDate} onChange={(v) => setForm({ ...form, nextActionDate: v })} />
          </Field>

          {form.stage === "Client" && !editingId && (
            <p className="text-xs text-muted">
              Saving this as a Client builds its client timeline automatically — same six stages every time.
            </p>
          )}

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

function TargetProgress({
  label,
  value,
  goal,
  format,
}: {
  label: string;
  value: number;
  goal: number;
  format: (n: number) => string;
}) {
  const pct = goal > 0 ? (value / goal) * 100 : 0;
  return (
    <div>
      <div className="flex items-center justify-between text-sm mb-1.5">
        <span className="text-muted">{label}</span>
        <span className="font-medium tabular-nums">
          {format(value)} {goal > 0 && <span className="text-muted">/ {format(goal)}</span>}
        </span>
      </div>
      <ProgressBar value={pct} tone={pct >= 100 ? "good" : "accent"} />
    </div>
  );
}
