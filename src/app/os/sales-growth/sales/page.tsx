"use client";

import { useState } from "react";
import { useOsStore } from "@/lib/os/store";
import {
  Lead,
  LEAD_STATUSES,
  LeadStatus,
  Opportunity,
  SOURCES,
  Source,
  STAGES,
  Stage,
  newId,
  todayISO,
} from "@/lib/os/types";
import { formatCurrency, formatPct, openOpportunities, pipelineValue, winRate } from "@/lib/os/calc";
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
  TextArea,
  TextInput,
} from "@/components/os/ui";
import { IconPlus } from "@/components/os/icons";

const STAGE_TONE: Record<Stage, "neutral" | "good" | "critical" | "accent"> = {
  New: "neutral",
  Contacted: "neutral",
  Engaged: "accent",
  Qualified: "accent",
  Proposed: "accent",
  Won: "good",
  Lost: "critical",
};

const LEAD_STATUS_TONE: Record<LeadStatus, "neutral" | "accent" | "good"> = {
  New: "neutral",
  Contacted: "accent",
  Qualified: "good",
};

const IN_TALKS_STAGES: Stage[] = ["New", "Contacted", "Engaged", "Qualified", "Proposed", "Lost"];

const EMPTY_FORM: Opportunity = {
  id: "",
  name: "",
  source: "Referral",
  stage: "New",
  value: 0,
  nextAction: "",
  nextActionDate: todayISO(),
  lostReason: "",
  createdAt: todayISO(),
};

function emptyLead(): Lead {
  return { id: newId(), name: "", source: "Referral", contact: "", status: "New", capturedAt: todayISO() };
}

function addDays(dateStr: string, days: number): string {
  const base = dateStr ? new Date(dateStr) : new Date();
  base.setDate(base.getDate() + days);
  return base.toISOString().slice(0, 10);
}

export default function SalesPage() {
  const {
    state,
    hydrated,
    setTarget,
    addOpportunity,
    updateOpportunity,
    removeOpportunity,
    addLead,
    updateLead,
    removeLead,
  } = useOsStore();

  const [tab, setTab] = useState<"Leads" | "InTalks" | "Clients" | "FollowUps">("Leads");

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Opportunity>(EMPTY_FORM);
  const [editingTarget, setEditingTarget] = useState(false);
  const [targetForm, setTargetForm] = useState(state.target);

  const [leadDrawer, setLeadDrawer] = useState(false);
  const [editingLeadId, setEditingLeadId] = useState<string | null>(null);
  const [leadForm, setLeadForm] = useState<Lead>(emptyLead());

  if (!hydrated) return null;

  const pipeline = pipelineValue(state.opportunities);
  const win = winRate(state.opportunities);
  const wonThisSet = state.opportunities.filter((o) => o.stage === "Won").length;
  const qualifiedPlus = state.opportunities.filter((o) =>
    (["Qualified", "Proposed", "Won"] as Stage[]).includes(o.stage)
  ).length;
  const revenueWon = state.opportunities
    .filter((o) => o.stage === "Won")
    .reduce((s, o) => s + o.value, 0);

  const clients = state.opportunities.filter((o) => o.stage === "Won");
  const today = todayISO();
  const followUps = state.opportunities
    .filter((o) => IN_TALKS_STAGES.includes(o.stage) && o.nextActionDate)
    .slice()
    .sort((a, b) => a.nextActionDate.localeCompare(b.nextActionDate));
  const overdueCount = followUps.filter((o) => o.nextActionDate < today).length;

  function openNew() {
    setForm({ ...EMPTY_FORM, id: newId(), createdAt: todayISO() });
    setEditingId(null);
    setDrawerOpen(true);
  }

  function openEdit(o: Opportunity) {
    setForm(o);
    setEditingId(o.id);
    setDrawerOpen(true);
  }

  function save() {
    if (!form.name.trim()) return;
    if (editingId) {
      updateOpportunity(editingId, form);
    } else {
      addOpportunity(form);
    }
    setDrawerOpen(false);
  }

  function saveTarget() {
    setTarget(targetForm);
    setEditingTarget(false);
  }

  function openNewLead() {
    setLeadForm(emptyLead());
    setEditingLeadId(null);
    setLeadDrawer(true);
  }

  function openEditLead(l: Lead) {
    setLeadForm(l);
    setEditingLeadId(l.id);
    setLeadDrawer(true);
  }

  function saveLead() {
    if (!leadForm.name.trim()) return;
    if (editingLeadId) updateLead(editingLeadId, leadForm);
    else addLead(leadForm);
    setLeadDrawer(false);
  }

  function convertLead(l: Lead) {
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
    setTab("InTalks");
  }

  return (
    <div className="flex flex-col gap-8">
      <SectionHeader
        eyebrow="Sales & Marketing"
        title="Sales"
        action={
          tab === "Leads" ? (
            <Button variant="primary" onClick={openNewLead}>
              <IconPlus className="h-4 w-4" /> Add lead
            </Button>
          ) : tab === "InTalks" ? (
            <Button variant="primary" onClick={openNew}>
              <IconPlus className="h-4 w-4" /> New opportunity
            </Button>
          ) : undefined
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
            <TargetProgress label="New clients" value={wonThisSet} goal={state.target.newClientsGoal} format={(n) => String(n)} />
            <TargetProgress label="Qualified leads" value={qualifiedPlus} goal={state.target.qualifiedLeadsGoal} format={(n) => String(n)} />
          </div>
        )}
      </Card>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatTile label="Open pipeline value" value={formatCurrency(pipeline)} />
        <StatTile label="Win rate" value={formatPct(win)} hint="Won ÷ (Won + Lost)" />
        <StatTile label="Open opportunities" value={openOpportunities(state.opportunities).length} />
      </div>

      <Tabs
        value={tab}
        onChange={setTab}
        options={[
          { value: "Leads", label: "Leads", count: state.leads.length },
          { value: "InTalks", label: "In Talks", count: openOpportunities(state.opportunities).length },
          { value: "Clients", label: "Clients", count: clients.length },
          { value: "FollowUps", label: "Follow Ups", count: overdueCount },
        ]}
      />

      {tab === "Leads" && (state.leads.length === 0 ? (
        <EmptyState
          title="No leads yet"
          body="Raw, uncontacted names and companies land here first. Qualify them, then convert — that moves them into In Talks."
          action={
            <Button variant="primary" onClick={openNewLead}>
              <IconPlus className="h-4 w-4" /> Add your first lead
            </Button>
          }
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {state.leads.map((l) => (
            <Card key={l.id} className="flex flex-col gap-3">
              <div onClick={() => openEditLead(l)} className="flex flex-col gap-2 cursor-pointer">
                <div className="flex items-center justify-between">
                  <p className="font-medium text-sm">{l.name}</p>
                  <Badge tone={LEAD_STATUS_TONE[l.status]}>{l.status}</Badge>
                </div>
                <p className="text-xs text-muted">{l.source}{l.contact ? ` · ${l.contact}` : ""}</p>
                <p className="text-xs text-muted">Captured {l.capturedAt}</p>
              </div>
              <button
                onClick={() => convertLead(l)}
                className="text-left text-xs font-medium text-accent hover:opacity-80 transition"
              >
                Convert → In Talks
              </button>
            </Card>
          ))}
        </div>
      ))}

      {tab === "InTalks" && (openOpportunities(state.opportunities).length === 0 && state.opportunities.filter((o) => o.stage === "Lost").length === 0 ? (
        <EmptyState
          title="Nothing in talks yet"
          body="Add an opportunity directly, or convert a lead from the Leads tab. Every stage move updates your win rate and pipeline value automatically."
          action={
            <Button variant="primary" onClick={openNew}>
              <IconPlus className="h-4 w-4" /> Add an opportunity
            </Button>
          }
        />
      ) : (
        <div className="overflow-x-auto pb-2 -mx-1 px-1">
          <div className="flex gap-4 min-w-max">
            {IN_TALKS_STAGES.map((stage) => {
              const items = state.opportunities.filter((o) => o.stage === stage);
              return (
                <div key={stage} className="w-64 shrink-0">
                  <div className="flex items-center justify-between mb-3 px-1">
                    <Badge tone={STAGE_TONE[stage]}>{stage}</Badge>
                    <span className="text-xs text-muted">{items.length}</span>
                  </div>
                  <div className="flex flex-col gap-2">
                    {items.map((o) => (
                      <button
                        key={o.id}
                        onClick={() => openEdit(o)}
                        className="text-left rounded-xl border border-border bg-surface p-3.5 transition hover:border-muted"
                      >
                        <p className="font-medium text-sm mb-1">{o.name}</p>
                        <p className="text-xs text-muted mb-2">{formatCurrency(o.value)} · {o.source}</p>
                        {o.nextAction && (
                          <p className="text-xs text-muted line-clamp-2">
                            Next: {o.nextAction}
                            {o.nextActionDate && ` · ${o.nextActionDate}`}
                          </p>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {tab === "Clients" && (clients.length === 0 ? (
        <EmptyState title="No clients yet" body="Move an opportunity to Won from In Talks and it shows up here." />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {clients.map((o) => (
            <button
              key={o.id}
              onClick={() => openEdit(o)}
              className="text-left rounded-xl border border-border bg-surface p-4 transition hover:border-muted"
            >
              <div className="flex items-center justify-between mb-1">
                <p className="font-medium text-sm">{o.name}</p>
                <Badge tone="good">Won</Badge>
              </div>
              <p className="text-xs text-muted">{formatCurrency(o.value)} · {o.source}</p>
            </button>
          ))}
        </div>
      ))}

      {tab === "FollowUps" && (followUps.length === 0 ? (
        <EmptyState title="Nothing waiting on you" body="Every open opportunity with a next action and date shows up here, earliest first." />
      ) : (
        <div className="flex flex-col gap-2">
          {followUps.map((o) => {
            const overdueItem = o.nextActionDate < today;
            const dueTodayItem = o.nextActionDate === today;
            return (
              <Card key={o.id} className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-medium text-sm">{o.name}</p>
                    <Badge tone={STAGE_TONE[o.stage]}>{o.stage}</Badge>
                    {o.value > 0 && <span className="text-xs text-muted">{formatCurrency(o.value)}</span>}
                  </div>
                  <input
                    value={o.nextAction}
                    onChange={(e) => updateOpportunity(o.id, { nextAction: e.target.value })}
                    placeholder="What's the next action?"
                    className="w-full rounded-lg border border-border bg-surface-2 px-3 py-1.5 text-sm outline-none focus:border-accent transition"
                  />
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <input
                    type="date"
                    value={o.nextActionDate}
                    onChange={(e) => updateOpportunity(o.id, { nextActionDate: e.target.value })}
                    className={`rounded-lg border bg-surface-2 px-2.5 py-1.5 text-sm outline-none focus:border-accent transition ${
                      overdueItem ? "border-critical text-critical" : dueTodayItem ? "border-warn text-warn" : "border-border"
                    }`}
                  />
                  <Button variant="ghost" onClick={() => updateOpportunity(o.id, { nextActionDate: addDays(o.nextActionDate, 3) })}>
                    +3d
                  </Button>
                  <Button variant="secondary" onClick={() => updateOpportunity(o.id, { nextAction: "", nextActionDate: "" })}>
                    Done
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      ))}

      <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)} title={editingId ? "Edit opportunity" : "New opportunity"}>
        <div className="flex flex-col gap-4">
          <Field label="Account name">
            <TextInput value={form.name} onChange={(v) => setForm({ ...form, name: v })} placeholder="e.g. Northwind Studio" />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Source">
              <SelectInput value={form.source} onChange={(v: Source) => setForm({ ...form, source: v })} options={SOURCES} />
            </Field>
            <Field label="Stage">
              <SelectInput value={form.stage} onChange={(v: Stage) => setForm({ ...form, stage: v })} options={STAGES} />
            </Field>
          </div>
          <Field label="Deal value">
            <NumberInput value={form.value} onChange={(v) => setForm({ ...form, value: v })} placeholder="0" />
          </Field>
          <Field label="Next action">
            <TextInput value={form.nextAction} onChange={(v) => setForm({ ...form, nextAction: v })} placeholder="e.g. Send proposal" />
          </Field>
          <Field label="Next action date">
            <TextInput type="date" value={form.nextActionDate} onChange={(v) => setForm({ ...form, nextActionDate: v })} />
          </Field>
          {form.stage === "Lost" && (
            <Field label="Lost reason">
              <TextArea value={form.lostReason ?? ""} onChange={(v) => setForm({ ...form, lostReason: v })} placeholder="What happened?" />
            </Field>
          )}

          <div className="flex items-center gap-2 pt-2">
            <Button variant="primary" onClick={save}>
              {editingId ? "Save changes" : "Add opportunity"}
            </Button>
            {editingId && (
              <DeleteButton
                label="Delete opportunity"
                onClick={() => {
                  removeOpportunity(editingId);
                  setDrawerOpen(false);
                }}
              />
            )}
          </div>
        </div>
      </Drawer>

      <Drawer open={leadDrawer} onClose={() => setLeadDrawer(false)} title={editingLeadId ? "Edit lead" : "New lead"}>
        <div className="flex flex-col gap-4">
          <Field label="Name">
            <TextInput value={leadForm.name} onChange={(v) => setLeadForm({ ...leadForm, name: v })} placeholder="e.g. Northwind Studio" />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Source">
              <SelectInput value={leadForm.source} onChange={(v: Source) => setLeadForm({ ...leadForm, source: v })} options={SOURCES} />
            </Field>
            <Field label="Status">
              <SelectInput value={leadForm.status} onChange={(v: LeadStatus) => setLeadForm({ ...leadForm, status: v })} options={LEAD_STATUSES} />
            </Field>
          </div>
          <Field label="Contact">
            <TextInput value={leadForm.contact} onChange={(v) => setLeadForm({ ...leadForm, contact: v })} placeholder="Email or phone" />
          </Field>
          <div className="flex items-center gap-2 pt-2">
            <Button variant="primary" onClick={saveLead}>
              {editingLeadId ? "Save changes" : "Add lead"}
            </Button>
            {editingLeadId && (
              <DeleteButton
                label="Delete lead"
                onClick={() => {
                  removeLead(editingLeadId);
                  setLeadDrawer(false);
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
