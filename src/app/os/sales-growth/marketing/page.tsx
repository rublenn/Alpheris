"use client";

import { useState } from "react";
import { useOsStore } from "@/lib/os/store";
import { Channel, Experiment, ExperimentStatus, Medium, newId, todayISO } from "@/lib/os/types";
import { daysUntil, formatCurrency } from "@/lib/os/calc";
import { WIP_LIMITS } from "@/lib/os/types";
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
  TextArea,
  TextInput,
} from "@/components/os/ui";
import { IconPlus } from "@/components/os/icons";

const EMPTY_MEDIUM: Medium = { id: "", name: "", channel: "Online", active: true, notes: "" };
const EMPTY_EXPERIMENT: Experiment = {
  id: "",
  name: "",
  hypothesis: "",
  budget: 0,
  killDate: todayISO(),
  status: "Active",
};

const STATUS_TONE: Record<ExperimentStatus, "accent" | "good" | "critical"> = {
  Active: "accent",
  Won: "good",
  Killed: "critical",
};

export default function MarketingPage() {
  const {
    state,
    hydrated,
    addMedium,
    updateMedium,
    removeMedium,
    addExperiment,
    updateExperiment,
    removeExperiment,
  } = useOsStore();

  const [mediumDrawer, setMediumDrawer] = useState(false);
  const [mediumForm, setMediumForm] = useState<Medium>(EMPTY_MEDIUM);
  const [editingMediumId, setEditingMediumId] = useState<string | null>(null);

  const [expDrawer, setExpDrawer] = useState(false);
  const [expForm, setExpForm] = useState<Experiment>(EMPTY_EXPERIMENT);
  const [editingExpId, setEditingExpId] = useState<string | null>(null);

  if (!hydrated) return null;

  const activeExperiments = state.experiments.filter((e) => e.status === "Active");
  const overLimit = activeExperiments.length > WIP_LIMITS.activeExperiments;

  function openNewMedium() {
    setMediumForm({ ...EMPTY_MEDIUM, id: newId() });
    setEditingMediumId(null);
    setMediumDrawer(true);
  }

  function openEditMedium(m: Medium) {
    setMediumForm(m);
    setEditingMediumId(m.id);
    setMediumDrawer(true);
  }

  function saveMedium() {
    if (!mediumForm.name.trim()) return;
    if (editingMediumId) updateMedium(editingMediumId, mediumForm);
    else addMedium(mediumForm);
    setMediumDrawer(false);
  }

  function openNewExperiment() {
    setExpForm({ ...EMPTY_EXPERIMENT, id: newId() });
    setEditingExpId(null);
    setExpDrawer(true);
  }

  function openEditExperiment(e: Experiment) {
    setExpForm(e);
    setEditingExpId(e.id);
    setExpDrawer(true);
  }

  function saveExperiment() {
    if (!expForm.name.trim()) return;
    if (editingExpId) updateExperiment(editingExpId, expForm);
    else addExperiment(expForm);
    setExpDrawer(false);
  }

  return (
    <div className="flex flex-col gap-8">
      <SectionHeader eyebrow="Sales & Growth" title="Marketing" />

      <Card>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-semibold">Mediums</h3>
            <p className="text-sm text-muted mt-0.5">Where new business actually comes from.</p>
          </div>
          <Button variant="secondary" onClick={openNewMedium}>
            <IconPlus className="h-4 w-4" /> Add medium
          </Button>
        </div>

        {state.mediums.length === 0 ? (
          <EmptyState title="No mediums yet" body="Add the channels you actually use — referrals, outbound, a specific platform." />
        ) : (
          <div className="grid gap-2 sm:grid-cols-2">
            {state.mediums.map((m) => (
              <button
                key={m.id}
                onClick={() => openEditMedium(m)}
                className="text-left rounded-xl border border-border bg-surface-2 p-4 transition hover:border-muted"
              >
                <div className="flex items-center justify-between mb-1">
                  <p className="font-medium text-sm">{m.name}</p>
                  <Badge tone={m.active ? "good" : "neutral"}>{m.active ? "Active" : "Paused"}</Badge>
                </div>
                <p className="text-xs text-muted">{m.channel}{m.notes ? ` · ${m.notes}` : ""}</p>
              </button>
            ))}
          </div>
        )}
      </Card>

      <Card>
        <div className="flex items-center justify-between mb-1">
          <div>
            <h3 className="font-semibold">Growth experiments</h3>
            <p className="text-sm text-muted mt-0.5">One or two, precise — each with a budget you can afford to lose.</p>
          </div>
          <Button variant="secondary" onClick={openNewExperiment}>
            <IconPlus className="h-4 w-4" /> New experiment
          </Button>
        </div>
        <div className="flex items-center gap-2 mb-4">
          <Badge tone={overLimit ? "warn" : "neutral"}>
            {activeExperiments.length} / {WIP_LIMITS.activeExperiments} active
          </Badge>
          {overLimit && <span className="text-xs text-warn">Over your quarterly limit — consider killing one before starting another.</span>}
        </div>

        {state.experiments.length === 0 ? (
          <EmptyState
            title="No experiments yet"
            body="Start with one hypothesis and a budget you're willing to lose entirely if it doesn't work — that's the whole method."
          />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {state.experiments.map((e) => {
              const days = daysUntil(e.killDate);
              return (
                <button
                  key={e.id}
                  onClick={() => openEditExperiment(e)}
                  className="text-left rounded-xl border border-border bg-surface-2 p-4 transition hover:border-muted"
                >
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-medium text-sm">{e.name}</p>
                    <Badge tone={STATUS_TONE[e.status]}>{e.status}</Badge>
                  </div>
                  <p className="text-xs text-muted mb-3 line-clamp-2">{e.hypothesis}</p>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted">Affordable loss: {formatCurrency(e.budget)}</span>
                    {e.status === "Active" && days !== null && (
                      <span className={days < 0 ? "text-warn" : "text-muted"}>
                        {days < 0 ? "Kill date passed" : `${days}d to decide`}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </Card>

      <Drawer open={mediumDrawer} onClose={() => setMediumDrawer(false)} title={editingMediumId ? "Edit medium" : "New medium"}>
        <div className="flex flex-col gap-4">
          <Field label="Name">
            <TextInput value={mediumForm.name} onChange={(v) => setMediumForm({ ...mediumForm, name: v })} placeholder="e.g. Client referrals" />
          </Field>
          <Field label="Channel">
            <SelectInput value={mediumForm.channel} onChange={(v: Channel) => setMediumForm({ ...mediumForm, channel: v })} options={["Online", "Offline"] as const} />
          </Field>
          <Field label="Notes">
            <TextArea value={mediumForm.notes} onChange={(v) => setMediumForm({ ...mediumForm, notes: v })} placeholder="Optional" />
          </Field>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={mediumForm.active}
              onChange={(e) => setMediumForm({ ...mediumForm, active: e.target.checked })}
              className="h-4 w-4 rounded border-border accent-[var(--accent)]"
            />
            Currently active
          </label>
          <div className="flex items-center gap-2 pt-2">
            <Button variant="primary" onClick={saveMedium}>
              {editingMediumId ? "Save changes" : "Add medium"}
            </Button>
            {editingMediumId && (
              <DeleteButton
                label="Delete medium"
                onClick={() => {
                  removeMedium(editingMediumId);
                  setMediumDrawer(false);
                }}
              />
            )}
          </div>
        </div>
      </Drawer>

      <Drawer open={expDrawer} onClose={() => setExpDrawer(false)} title={editingExpId ? "Edit experiment" : "New experiment"}>
        <div className="flex flex-col gap-4">
          <Field label="Name">
            <TextInput value={expForm.name} onChange={(v) => setExpForm({ ...expForm, name: v })} placeholder="e.g. LinkedIn outbound sprint" />
          </Field>
          <Field label="Hypothesis">
            <TextArea value={expForm.hypothesis} onChange={(v) => setExpForm({ ...expForm, hypothesis: v })} placeholder="If we do X, we expect Y because Z" />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Affordable-loss budget">
              <NumberInput value={expForm.budget} onChange={(v) => setExpForm({ ...expForm, budget: v })} />
            </Field>
            <Field label="Kill / review date">
              <TextInput type="date" value={expForm.killDate} onChange={(v) => setExpForm({ ...expForm, killDate: v })} />
            </Field>
          </div>
          <Field label="Status">
            <SelectInput value={expForm.status} onChange={(v: ExperimentStatus) => setExpForm({ ...expForm, status: v })} options={["Active", "Won", "Killed"] as const} />
          </Field>
          <div className="flex items-center gap-2 pt-2">
            <Button variant="primary" onClick={saveExperiment}>
              {editingExpId ? "Save changes" : "Add experiment"}
            </Button>
            {editingExpId && (
              <DeleteButton
                label="Delete experiment"
                onClick={() => {
                  removeExperiment(editingExpId);
                  setExpDrawer(false);
                }}
              />
            )}
          </div>
        </div>
      </Drawer>
    </div>
  );
}
