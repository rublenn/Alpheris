"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useOsStore } from "@/lib/os/store";
import {
  Client,
  ClientHealth,
  CreativeScript,
  emptyMonthlyReport,
  emptyPostPerformance,
  IMPROVEMENT_SUGGESTED_QUESTIONS,
  MONTHLY_REPORT_FIELDS,
  MonthlyReport,
  newId,
  POST_PERFORMANCE_FIELDS,
  PostPerformance,
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
  IconButton,
  NumberInput,
  SectionHeader,
  SelectInput,
  StatTile,
  Tabs,
  TextArea,
  TextInput,
} from "@/components/os/ui";
import { IconChevron, IconEdit, IconPlus } from "@/components/os/icons";

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
    addImprovementNote,
    updateImprovementNote,
    removeImprovementNote,
    addPostPerformance,
    updatePostPerformance,
    addMonthlyReport,
    updateMonthlyReport,
  } = useOsStore();

  const searchParams = useSearchParams();
  const queryClient = searchParams.get("client") || "";
  const initialTab = searchParams.get("focus") === "report" ? "Reports" : "Clients";

  const [tab, setTab] = useState<"Clients" | "Reports" | "Problems" | "Satisfaction">(initialTab);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Client>(emptyClient());

  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [selectedPost, setSelectedPost] = useState<Record<string, string>>({});
  const [reportClientSel, setReportClient] = useState("");
  const [newProblem, setNewProblem] = useState<Record<string, string>>({});
  const [newSolution, setNewSolution] = useState<Record<string, string>>({});
  const [newQuestion, setNewQuestion] = useState<Record<string, string>>({});
  const [newAnswer, setNewAnswer] = useState<Record<string, string>>({});

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

  function toggleExpand(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function postPerformanceFor(scriptId: string) {
    return state.postPerformance.find((p) => p.creativeScriptId === scriptId);
  }

  function patchPerformance(script: CreativeScript, patch: Partial<PostPerformance>) {
    const existing = postPerformanceFor(script.id);
    if (existing) updatePostPerformance(existing.id, patch);
    else addPostPerformance({ ...emptyPostPerformance(script.client, script.id), ...patch });
  }

  const reportClient = reportClientSel || queryClient || state.clients[0]?.name || "";
  const activeMonthlyReport = state.monthlyReports.find((r) => r.client === reportClient);

  function patchMonthlyReport(patch: Partial<MonthlyReport>) {
    if (!reportClient) return;
    if (activeMonthlyReport) updateMonthlyReport(activeMonthlyReport.id, patch);
    else addMonthlyReport({ ...emptyMonthlyReport(reportClient), ...patch });
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
          {state.clients.map((c) => {
            const posts = state.creativeScripts.filter((s) => s.client === c.name);
            const isOpen = expanded.has(c.id);
            const activePostId = selectedPost[c.id] ?? posts[0]?.id ?? "";
            const activePost = posts.find((s) => s.id === activePostId) ?? posts[0];
            const perf = activePost ? postPerformanceFor(activePost.id) : undefined;
            return (
              <Card key={c.id} className="flex flex-col gap-3">
                <div className="flex items-center justify-between gap-2">
                  <button
                    onClick={() => toggleExpand(c.id)}
                    className="flex flex-1 items-center gap-2 text-left min-w-0"
                  >
                    <IconChevron
                      className={`h-3.5 w-3.5 shrink-0 text-muted transition-transform duration-[250ms] ease-[var(--ease-smooth)] ${
                        isOpen ? "rotate-90" : ""
                      }`}
                    />
                    <span className="font-medium text-sm truncate">{c.name}</span>
                    <Badge tone={HEALTH_TONE[c.health]}>{c.health}</Badge>
                  </button>
                  <IconButton label="Edit client" onClick={() => openEdit(c)}>
                    <IconEdit className="h-4 w-4" />
                  </IconButton>
                </div>
                <p className="text-xs text-muted">{formatCurrency(c.monthlyValue)} / month</p>

                <div className={`collapsible ${isOpen ? "is-open" : ""}`}>
                  <div className={isOpen ? "pt-3 border-t border-border-soft flex flex-col gap-3" : ""}>
                    {posts.length === 0 ? (
                      <p className="text-xs text-muted">
                        Nothing yet — confirm an ad or post in Creative & Production first.
                      </p>
                    ) : (
                      <>
                        <Field label="Ad / post">
                          <select
                            value={activePostId}
                            onChange={(e) => setSelectedPost({ ...selectedPost, [c.id]: e.target.value })}
                            className="w-full rounded-lg border border-border bg-surface-2 px-3.5 py-2.5 text-sm outline-none focus:border-accent transition appearance-none"
                          >
                            {posts.map((s) => (
                              <option key={s.id} value={s.id}>
                                {s.name.trim() || s.genre}
                              </option>
                            ))}
                          </select>
                        </Field>
                        {activePost && (
                          <div className="grid grid-cols-2 gap-2">
                            {POST_PERFORMANCE_FIELDS.map((f) => (
                              <Field key={f.key} label={f.label}>
                                <NumberInput
                                  value={perf?.[f.key] ?? 0}
                                  onChange={(v) => patchPerformance(activePost, { [f.key]: v })}
                                />
                              </Field>
                            ))}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      ))}

      {tab === "Reports" && (state.clients.length === 0 ? (
        <EmptyState title="No clients yet" body="Add a client first — the monthly report is logged per client." />
      ) : (
        <div className="flex flex-col gap-6">
          <Field label="Client">
            <SelectInput
              value={reportClient}
              onChange={setReportClient}
              options={state.clients.map((c) => c.name)}
            />
          </Field>

          <Card className="flex flex-col gap-4">
            <div>
              <p className="font-semibold">Monthly report</p>
              <p className="text-xs text-muted">Overall month & profile — {reportClient}</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {MONTHLY_REPORT_FIELDS.map((f) => (
                <Field key={f.key} label={f.label}>
                  <NumberInput
                    value={activeMonthlyReport?.[f.key] ?? 0}
                    onChange={(v) => patchMonthlyReport({ [f.key]: v })}
                  />
                </Field>
              ))}
            </div>
          </Card>
        </div>
      ))}

      {tab === "Problems" && (state.clients.length === 0 ? (
        <EmptyState title="No clients yet" body="Add a client first." />
      ) : (
        <div className="flex flex-col gap-5">
          {state.clients.map((c) => {
            const pairs = state.problemSolutions.filter((p) => p.client === c.name);
            const notes = state.improvementNotes.filter((n) => n.client === c.name);
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

                <div className="mt-2 rounded-xl border border-dashed border-border-soft bg-surface-2/60 p-3 flex flex-col gap-2.5">
                  <p className="text-xs font-medium tracking-wide uppercase text-muted">Improvement notes</p>

                  {notes.length > 0 && (
                    <div className="flex flex-col gap-2">
                      {notes.map((n) => (
                        <div key={n.id} className="flex items-start justify-between gap-2 rounded-lg border border-border-soft bg-surface px-3 py-2">
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium">{n.question}</p>
                            <textarea
                              value={n.answer}
                              onChange={(e) => updateImprovementNote(n.id, { answer: e.target.value })}
                              placeholder="Answer / notes"
                              className="w-full bg-transparent text-sm outline-none resize-y min-h-8 mt-1"
                            />
                          </div>
                          <DeleteButton label="Remove" onClick={() => removeImprovementNote(n.id)} />
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex flex-wrap gap-1.5">
                    {IMPROVEMENT_SUGGESTED_QUESTIONS.map((q) => (
                      <button
                        key={q}
                        type="button"
                        onClick={() => setNewQuestion({ ...newQuestion, [c.name]: q })}
                        className="rounded-full border border-border-soft bg-surface px-2.5 py-1 text-xs text-muted hover:text-foreground hover:border-muted transition"
                      >
                        {q}
                      </button>
                    ))}
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      value={newQuestion[c.name] ?? ""}
                      onChange={(e) => setNewQuestion({ ...newQuestion, [c.name]: e.target.value })}
                      placeholder="Question"
                      className="flex-1 rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-accent transition"
                    />
                    <input
                      value={newAnswer[c.name] ?? ""}
                      onChange={(e) => setNewAnswer({ ...newAnswer, [c.name]: e.target.value })}
                      placeholder="Answer (optional)"
                      className="flex-1 rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-accent transition"
                    />
                    <Button
                      variant="secondary"
                      onClick={() => {
                        const question = (newQuestion[c.name] ?? "").trim();
                        if (!question) return;
                        addImprovementNote({
                          id: newId(),
                          client: c.name,
                          question,
                          answer: (newAnswer[c.name] ?? "").trim(),
                        });
                        setNewQuestion({ ...newQuestion, [c.name]: "" });
                        setNewAnswer({ ...newAnswer, [c.name]: "" });
                      }}
                    >
                      <IconPlus className="h-4 w-4" /> Add
                    </Button>
                  </div>
                </div>
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
