"use client";

import { useState } from "react";
import { useOsStore } from "@/lib/os/store";
import {
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

export default function SalesPage() {
  const { state, hydrated, setTarget, addOpportunity, updateOpportunity, removeOpportunity } = useOsStore();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Opportunity>(EMPTY_FORM);
  const [editingTarget, setEditingTarget] = useState(false);
  const [targetForm, setTargetForm] = useState(state.target);

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

  return (
    <div className="flex flex-col gap-8">
      <SectionHeader
        eyebrow="Sales & Growth"
        title="Sales"
        action={
          <Button variant="primary" onClick={openNew}>
            <IconPlus className="h-4 w-4" /> New opportunity
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

      {state.opportunities.length === 0 ? (
        <EmptyState
          title="No opportunities yet"
          body="Add the accounts you&apos;re targeting or already talking to. Every stage move updates your win rate and pipeline value automatically."
          action={
            <Button variant="primary" onClick={openNew}>
              <IconPlus className="h-4 w-4" /> Add your first opportunity
            </Button>
          }
        />
      ) : (
        <div className="overflow-x-auto pb-2 -mx-1 px-1">
          <div className="flex gap-4 min-w-max">
            {STAGES.map((stage) => {
              const items = state.opportunities.filter((o) => o.stage === stage);
              return (
                <div key={stage} className="w-64 shrink-0">
                  <div className="flex items-center justify-between mb-3 px-1">
                    <div className="flex items-center gap-2">
                      <Badge tone={STAGE_TONE[stage]}>{stage}</Badge>
                    </div>
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
      )}

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
