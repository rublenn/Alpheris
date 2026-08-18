"use client";

import Link from "next/link";
import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useOsStore } from "@/lib/os/store";
import {
  DeliverableStatus,
  Outsource,
  OutsourceRole,
  OUTSOURCE_ROLES,
  ProductionPlan,
  ProductionPlanStatus,
  PRODUCTION_PLAN_STATUSES,
  WIP_LIMITS,
  newId,
  todayISO,
} from "@/lib/os/types";
import { inProductionCount } from "@/lib/os/calc";
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
  Tabs,
  TextArea,
  TextInput,
} from "@/components/os/ui";
import { IconPlus } from "@/components/os/icons";

const COLUMNS: DeliverableStatus[] = ["Brief", "Production", "Review"];
const PLAN_TONE: Record<ProductionPlanStatus, "neutral" | "good"> = { Draft: "neutral", Approved: "good" };

function emptyPlan(): ProductionPlan {
  return { id: newId(), project: "", title: "", details: "", shootDate: todayISO(), status: "Draft" };
}

function emptyOutsource(): Outsource {
  return { id: newId(), role: "Cameraman", name: "", contact: "", rate: "", notes: "" };
}

export default function ProductionPage() {
  return (
    <Suspense>
      <ProductionPageInner />
    </Suspense>
  );
}

function ProductionPageInner() {
  const {
    state,
    hydrated,
    updateDeliverable,
    addProductionPlan,
    updateProductionPlan,
    removeProductionPlan,
    addOutsource,
    updateOutsource,
    removeOutsource,
  } = useOsStore();

  const searchParams = useSearchParams();
  const focusClient = searchParams.get("client") || "";
  const initialTab = searchParams.get("focus") === "plan" ? "Plan" : searchParams.get("focus") === "board" ? "Board" : "Board";
  const [tab, setTab] = useState<"Board" | "Workflow" | "Plan" | "Outsources">(initialTab);

  const [planDrawer, setPlanDrawer] = useState(false);
  const [editingPlanId, setEditingPlanId] = useState<string | null>(null);
  const [planForm, setPlanForm] = useState<ProductionPlan>(emptyPlan());

  const [outDrawer, setOutDrawer] = useState(false);
  const [editingOutId, setEditingOutId] = useState<string | null>(null);
  const [outForm, setOutForm] = useState<Outsource>(emptyOutsource());

  if (!hydrated) return null;

  const inProduction = inProductionCount(state.deliverables);
  const overLimit = inProduction > WIP_LIMITS.inProduction;
  const queue = state.deliverables.filter(
    (d) => d.status !== "Delivered" && (!focusClient || d.client.toLowerCase() === focusClient.toLowerCase())
  );
  const visiblePlans = focusClient
    ? state.productionPlans.filter((p) => p.project.toLowerCase() === focusClient.toLowerCase())
    : state.productionPlans;

  function moveTo(id: string, status: DeliverableStatus) {
    if (status === "Production" && inProduction >= WIP_LIMITS.inProduction) {
      const current = state.deliverables.find((d) => d.id === id);
      if (current?.status !== "Production") {
        const proceed = window.confirm(
          `Production is already at your ${WIP_LIMITS.inProduction}-item limit. Move it in anyway?`
        );
        if (!proceed) return;
      }
    }
    updateDeliverable(id, { status });
  }

  function openNewPlan() {
    setPlanForm({ ...emptyPlan(), project: focusClient });
    setEditingPlanId(null);
    setPlanDrawer(true);
  }
  function openEditPlan(p: ProductionPlan) {
    setPlanForm(p);
    setEditingPlanId(p.id);
    setPlanDrawer(true);
  }
  function savePlan() {
    if (!planForm.title.trim()) return;
    if (editingPlanId) updateProductionPlan(editingPlanId, planForm);
    else addProductionPlan(planForm);
    setPlanDrawer(false);
  }

  function openNewOutsource() {
    setOutForm(emptyOutsource());
    setEditingOutId(null);
    setOutDrawer(true);
  }
  function openEditOutsource(o: Outsource) {
    setOutForm(o);
    setEditingOutId(o.id);
    setOutDrawer(true);
  }
  function saveOutsource() {
    if (!outForm.name.trim()) return;
    if (editingOutId) updateOutsource(editingOutId, outForm);
    else addOutsource(outForm);
    setOutDrawer(false);
  }

  return (
    <div className="flex flex-col gap-8">
      <SectionHeader
        eyebrow="Working"
        title="Creative & Production"
        action={
          tab === "Board" ? (
            <Link href="/os/working/deliverables" className="text-sm font-medium text-accent hover:opacity-80">
              Manage all deliverables →
            </Link>
          ) : tab === "Plan" ? (
            <Button variant="primary" onClick={openNewPlan}>
              <IconPlus className="h-4 w-4" /> New plan
            </Button>
          ) : tab === "Outsources" ? (
            <Button variant="primary" onClick={openNewOutsource}>
              <IconPlus className="h-4 w-4" /> Add outsource
            </Button>
          ) : undefined
        }
      />

      <Tabs
        value={tab}
        onChange={setTab}
        options={[
          { value: "Board", label: "Production Board" },
          { value: "Workflow", label: "Our Workflow" },
          { value: "Plan", label: "Production Plan", count: state.productionPlans.length },
          { value: "Outsources", label: "Outsources", count: state.outsources.length },
        ]}
      />

      {focusClient && (tab === "Board" || tab === "Plan") && (
        <div className="flex items-center gap-2 text-sm">
          <span className="text-muted">Filtered to</span>
          <Badge tone="accent">{focusClient}</Badge>
          <Link href="/os/working/production" className="text-accent hover:opacity-80">
            Clear
          </Link>
        </div>
      )}

      {tab === "Board" && (
        <>
          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">In production</p>
                <p className="text-xs text-muted mt-0.5">
                  Hard limit: {WIP_LIMITS.inProduction} at once — fewer things open means faster delivery.
                </p>
              </div>
              <Badge tone={overLimit ? "warn" : "good"}>
                {inProduction} / {WIP_LIMITS.inProduction}
              </Badge>
            </div>
          </Card>

          {queue.length === 0 ? (
            <EmptyState
              title="Nothing in the queue"
              body="Add a deliverable from the Deliverables page and it will show up here as it moves through brief, production, and review."
            />
          ) : (
            <div className="grid gap-4 sm:grid-cols-3">
              {COLUMNS.map((col) => {
                const items = queue.filter((d) => d.status === col);
                return (
                  <div key={col}>
                    <div className="flex items-center justify-between mb-3 px-1">
                      <p className="text-sm font-semibold">{col}</p>
                      <span className="text-xs text-muted">{items.length}</span>
                    </div>
                    <div className="flex flex-col gap-2">
                      {items.map((d) => (
                        <div key={d.id} className="rounded-xl border border-border bg-surface p-3.5">
                          <p className="font-medium text-sm mb-0.5">{d.title}</p>
                          <p className="text-xs text-muted mb-3">{d.client}{d.dueDate ? ` · due ${d.dueDate}` : ""}</p>
                          <div className="flex items-center gap-1.5">
                            {COLUMNS.map((target) => (
                              <button
                                key={target}
                                onClick={() => moveTo(d.id, target)}
                                disabled={target === d.status}
                                className={`rounded-full px-2.5 py-1 text-xs font-medium transition disabled:opacity-100 ${
                                  target === d.status
                                    ? "bg-accent text-white"
                                    : "bg-surface-2 text-muted hover:text-foreground"
                                }`}
                              >
                                {target}
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}
                      {items.length === 0 && (
                        <div className="rounded-xl border border-dashed border-border-soft p-4 text-center">
                          <p className="text-xs text-muted">Empty</p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {tab === "Workflow" && (
        <EmptyState
          title="Our go-to creativity workflow"
          body="Not filled in yet — this is where the standard creative process goes once it's mapped out."
        />
      )}

      {tab === "Plan" && (visiblePlans.length === 0 ? (
        <EmptyState
          title={focusClient ? `No production plan yet for ${focusClient}` : "No production plans yet"}
          body="The final, locked plan for a shoot or build — what's being made, when, and the details that matter on the day."
          action={
            <Button variant="primary" onClick={openNewPlan}>
              <IconPlus className="h-4 w-4" /> Add a plan
            </Button>
          }
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {visiblePlans.map((p) => (
            <Card key={p.id} className="cursor-pointer flex flex-col gap-2" padded>
              <div onClick={() => openEditPlan(p)}>
                <div className="flex items-center justify-between mb-1">
                  <p className="font-medium text-sm">{p.title}</p>
                  <Badge tone={PLAN_TONE[p.status]}>{p.status}</Badge>
                </div>
                <p className="text-xs text-muted mb-2">{p.project}{p.shootDate ? ` · ${p.shootDate}` : ""}</p>
                {p.details && <p className="text-sm text-muted line-clamp-2">{p.details}</p>}
              </div>
            </Card>
          ))}
        </div>
      ))}

      {tab === "Outsources" && (state.outsources.length === 0 ? (
        <EmptyState
          title="No outsources yet"
          body="Cameramen, editors, actors — anyone external you bring in for production. Keep their contact and rate here."
          action={
            <Button variant="primary" onClick={openNewOutsource}>
              <IconPlus className="h-4 w-4" /> Add an outsource
            </Button>
          }
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {state.outsources.map((o) => (
            <Card key={o.id} className="cursor-pointer flex flex-col gap-1.5">
              <div onClick={() => openEditOutsource(o)}>
                <div className="flex items-center justify-between">
                  <p className="font-medium text-sm">{o.name}</p>
                  <Badge>{o.role}</Badge>
                </div>
                <p className="text-xs text-muted">{o.contact}{o.rate ? ` · ${o.rate}` : ""}</p>
                {o.notes && <p className="text-xs text-muted line-clamp-2">{o.notes}</p>}
              </div>
            </Card>
          ))}
        </div>
      ))}

      <Drawer open={planDrawer} onClose={() => setPlanDrawer(false)} title={editingPlanId ? "Edit plan" : "New production plan"}>
        <div className="flex flex-col gap-4">
          <Field label="Project / client">
            <TextInput value={planForm.project} onChange={(v) => setPlanForm({ ...planForm, project: v })} placeholder="e.g. Northwind Studio" />
          </Field>
          <Field label="Title">
            <TextInput value={planForm.title} onChange={(v) => setPlanForm({ ...planForm, title: v })} placeholder="e.g. October reel shoot" />
          </Field>
          <Field label="Details">
            <TextArea value={planForm.details} onChange={(v) => setPlanForm({ ...planForm, details: v })} placeholder="Locations, shot list, equipment, cast, crew call time" />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Shoot / build date">
              <TextInput type="date" value={planForm.shootDate} onChange={(v) => setPlanForm({ ...planForm, shootDate: v })} />
            </Field>
            <Field label="Status">
              <SelectInput value={planForm.status} onChange={(v: ProductionPlanStatus) => setPlanForm({ ...planForm, status: v })} options={PRODUCTION_PLAN_STATUSES} />
            </Field>
          </div>
          <div className="flex items-center gap-2 pt-2">
            <Button variant="primary" onClick={savePlan}>
              {editingPlanId ? "Save changes" : "Add plan"}
            </Button>
            {editingPlanId && (
              <DeleteButton
                label="Delete plan"
                onClick={() => {
                  removeProductionPlan(editingPlanId);
                  setPlanDrawer(false);
                }}
              />
            )}
          </div>
        </div>
      </Drawer>

      <Drawer open={outDrawer} onClose={() => setOutDrawer(false)} title={editingOutId ? "Edit outsource" : "New outsource"}>
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Role">
              <SelectInput value={outForm.role} onChange={(v: OutsourceRole) => setOutForm({ ...outForm, role: v })} options={OUTSOURCE_ROLES} />
            </Field>
            <Field label="Name">
              <TextInput value={outForm.name} onChange={(v) => setOutForm({ ...outForm, name: v })} placeholder="e.g. Sam Rivera" />
            </Field>
          </div>
          <Field label="Contact">
            <TextInput value={outForm.contact} onChange={(v) => setOutForm({ ...outForm, contact: v })} placeholder="Email or phone" />
          </Field>
          <Field label="Rate">
            <TextInput value={outForm.rate} onChange={(v) => setOutForm({ ...outForm, rate: v })} placeholder="e.g. $400/day" />
          </Field>
          <Field label="Notes">
            <TextArea value={outForm.notes} onChange={(v) => setOutForm({ ...outForm, notes: v })} placeholder="Availability, style, past work" />
          </Field>
          <div className="flex items-center gap-2 pt-2">
            <Button variant="primary" onClick={saveOutsource}>
              {editingOutId ? "Save changes" : "Add outsource"}
            </Button>
            {editingOutId && (
              <DeleteButton
                label="Delete outsource"
                onClick={() => {
                  removeOutsource(editingOutId);
                  setOutDrawer(false);
                }}
              />
            )}
          </div>
        </div>
      </Drawer>
    </div>
  );
}
