"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useOsStore } from "@/lib/os/store";
import {
  AD_REPORT_IMPROVEMENT_FIELDS,
  AD_REPORT_METRIC_FIELDS,
  AdReport,
  Client,
  ClientHealth,
  emptyAdReport,
  newId,
} from "@/lib/os/types";
import { formatCurrency, formatPct, revenueConcentration } from "@/lib/os/calc";
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
    notes: "",
    satisfaction: 0,
    roi: 0,
    organicViews: 0,
  };
}

export default function ClientSuccessPage() {
  return (
    <Suspense>
      <ClientSuccessPageInner />
    </Suspense>
  );
}

function ClientSuccessPageInner() {
  const {
    state,
    hydrated,
    addClient,
    updateClient,
    removeClient,
    addProblemSolution,
    updateProblemSolution,
    removeProblemSolution,
    addAdReport,
    updateAdReport,
  } = useOsStore();

  const searchParams = useSearchParams();
  const queryClient = searchParams.get("client") || "";
  const initialTab = searchParams.get("focus") === "report" ? "Reports" : "Clients";

  const [tab, setTab] = useState<"Clients" | "Reports" | "Problems" | "Satisfaction">(initialTab);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Client>(emptyClient());

  const [reportClientSel, setReportClient] = useState("");
  const [reportScriptId, setReportScriptId] = useState("");
  const [newProblem, setNewProblem] = useState<Record<string, string>>({});
  const [newSolution, setNewSolution] = useState<Record<string, string>>({});

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

  const reportClient = reportClientSel || queryClient || state.clients[0]?.name || "";
  const postedScripts = reportClient
    ? state.creativeScripts.filter((s) => s.client === reportClient && s.posted)
    : [];
  const activeScript = postedScripts.find((s) => s.id === reportScriptId) ?? postedScripts[0];
  const activeReport: AdReport | undefined = activeScript
    ? state.adReports.find((r) => r.creativeScriptId === activeScript.id)
    : undefined;

  function patchReport(patch: Partial<AdReport>) {
    if (!activeScript) return;
    if (activeReport) updateAdReport(activeReport.id, patch);
    else addAdReport({ ...emptyAdReport(activeScript.client, activeScript.id), ...patch });
  }

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
          {state.clients.map((c) => (
            <button
              key={c.id}
              onClick={() => openEdit(c)}
              className="text-left rounded-xl border border-border bg-surface p-4 transition hover:border-muted"
            >
              <div className="flex items-center justify-between mb-2">
                <p className="font-medium text-sm">{c.name}</p>
                <Badge tone={HEALTH_TONE[c.health]}>{c.health}</Badge>
              </div>
              <p className="text-xs text-muted">{formatCurrency(c.monthlyValue)} / month</p>
            </button>
          ))}
        </div>
      ))}

      {tab === "Reports" && (state.clients.length === 0 ? (
        <EmptyState title="No clients yet" body="Add a client first — monthly reports are logged per posted ad/post." />
      ) : (
        <div className="flex flex-col gap-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Client">
              <SelectInput
                value={reportClient}
                onChange={(v) => {
                  setReportClient(v);
                  setReportScriptId("");
                }}
                options={state.clients.map((c) => c.name)}
              />
            </Field>
            <Field label="Ad / post">
              <select
                value={activeScript?.id ?? ""}
                onChange={(e) => setReportScriptId(e.target.value)}
                disabled={postedScripts.length === 0}
                className="w-full rounded-lg border border-border bg-surface-2 px-3.5 py-2.5 text-sm outline-none focus:border-accent transition appearance-none disabled:opacity-50"
              >
                <option value="">Select a posted ad or post</option>
                {postedScripts.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name.trim() || s.genre}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          {reportClient && postedScripts.length === 0 && (
            <EmptyState
              title={`Nothing posted yet for ${reportClient}`}
              body="Check Posted for an ad/post in Deliverables first — it shows up here automatically for reporting."
            />
          )}

          {activeScript && (
            <div className="grid gap-4 lg:grid-cols-2">
              <Card className="flex flex-col gap-4">
                <div>
                  <p className="font-semibold">Monthly report</p>
                  <p className="text-xs text-muted">{activeScript.name.trim() || activeScript.genre} · {activeScript.client}</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {AD_REPORT_METRIC_FIELDS.map((f) => (
                    <Field key={f.key} label={f.label}>
                      <NumberInput
                        value={activeReport?.[f.key] ?? 0}
                        onChange={(v) => patchReport({ [f.key]: v })}
                      />
                    </Field>
                  ))}
                </div>
              </Card>

              <Card className="flex flex-col gap-4">
                <div>
                  <p className="font-semibold">Improvement</p>
                  <p className="text-xs text-muted">What to test or fix next month</p>
                </div>
                <div className="flex flex-col gap-3">
                  {AD_REPORT_IMPROVEMENT_FIELDS.map((f) => (
                    <Field key={f.key} label={f.label}>
                      <TextArea
                        value={activeReport?.[f.key] ?? ""}
                        onChange={(v) => patchReport({ [f.key]: v })}
                      />
                    </Field>
                  ))}
                </div>
              </Card>
            </div>
          )}
        </div>
      ))}

      {tab === "Problems" && (state.clients.length === 0 ? (
        <EmptyState title="No clients yet" body="Add a client first." />
      ) : (
        <div className="flex flex-col gap-5">
          {state.clients.map((c) => {
            const pairs = state.problemSolutions.filter((p) => p.client === c.name);
            return (
              <Card key={c.id} className="flex flex-col gap-3">
                <p className="font-medium text-sm">{c.name}</p>

                {pairs.length > 0 && (
                  <div className="flex flex-col gap-2">
                    {pairs.map((p) => (
                      <div key={p.id} className="grid grid-cols-2 gap-2 items-start">
                        <textarea
                          value={p.problem}
                          onChange={(e) => updateProblemSolution(p.id, { problem: e.target.value })}
                          placeholder="Problem"
                          className="w-full rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm outline-none focus:border-accent transition min-h-16 resize-y"
                        />
                        <div className="flex items-start gap-1.5">
                          <textarea
                            value={p.solution}
                            onChange={(e) => updateProblemSolution(p.id, { solution: e.target.value })}
                            placeholder="Solution"
                            className="w-full rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm outline-none focus:border-accent transition min-h-16 resize-y"
                          />
                          <DeleteButton label="Remove" onClick={() => removeProblemSolution(p.id)} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2 items-start pt-1 border-t border-border-soft">
                  <textarea
                    value={newProblem[c.name] ?? ""}
                    onChange={(e) => setNewProblem({ ...newProblem, [c.name]: e.target.value })}
                    placeholder="New problem"
                    className="w-full rounded-lg border border-dashed border-border bg-surface-2 px-3 py-2 text-sm outline-none focus:border-accent transition min-h-16 resize-y"
                  />
                  <textarea
                    value={newSolution[c.name] ?? ""}
                    onChange={(e) => setNewSolution({ ...newSolution, [c.name]: e.target.value })}
                    placeholder="Solution"
                    className="w-full rounded-lg border border-dashed border-border bg-surface-2 px-3 py-2 text-sm outline-none focus:border-accent transition min-h-16 resize-y"
                  />
                </div>
                <Button
                  variant="secondary"
                  onClick={() => {
                    const problem = (newProblem[c.name] ?? "").trim();
                    const solution = (newSolution[c.name] ?? "").trim();
                    if (!problem && !solution) return;
                    addProblemSolution({ id: newId(), client: c.name, problem, solution });
                    setNewProblem({ ...newProblem, [c.name]: "" });
                    setNewSolution({ ...newSolution, [c.name]: "" });
                  }}
                  className="self-start"
                >
                  <IconPlus className="h-4 w-4" /> Add block
                </Button>
              </Card>
            );
          })}
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
                <Card key={c.id} className="flex flex-col gap-3">
                  <div className="flex items-center justify-between gap-3">
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
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="ROI">
                      <NumberInput value={c.roi} onChange={(v) => updateClient(c.id, { roi: v })} />
                    </Field>
                    <Field label="Organic views">
                      <NumberInput value={c.organicViews} onChange={(v) => updateClient(c.id, { organicViews: v })} />
                    </Field>
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
