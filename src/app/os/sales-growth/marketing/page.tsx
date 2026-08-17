"use client";

import { useState } from "react";
import { useOsStore } from "@/lib/os/store";
import {
  Channel,
  Experiment,
  ExperimentStatus,
  MARKETING_IDEA_STATUSES,
  MarketingIdea,
  MarketingIdeaStatus,
  Medium,
  WIP_LIMITS,
  newId,
  todayISO,
} from "@/lib/os/types";
import { daysUntil, formatCurrency } from "@/lib/os/calc";
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
  Tabs,
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

const IDEA_STATUS_TONE: Record<MarketingIdeaStatus, "neutral" | "accent" | "good"> = {
  Idea: "neutral",
  Planned: "accent",
  Posted: "good",
};

function emptyIdea(channel: Channel): MarketingIdea {
  return { id: newId(), channel, title: "", notes: "", date: todayISO(), status: "Idea" };
}

const CHANNEL_COPY: Record<Channel, { blurb: string; titlePlaceholder: string; dateLabel: string }> = {
  Online: {
    blurb: "Content calendar and video ideas — everything meant to post online.",
    titlePlaceholder: "e.g. Reel: behind the scenes at a shoot",
    dateLabel: "Post date",
  },
  Offline: {
    blurb: "Real-world ideas — a flyer drop, a local event, a networking day.",
    titlePlaceholder: "e.g. Table at the farmers market",
    dateLabel: "Day",
  },
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
    addMarketingIdea,
    updateMarketingIdea,
    removeMarketingIdea,
  } = useOsStore();

  const [tab, setTab] = useState<"Channels" | "Online" | "Offline">("Channels");

  const [mediumDrawer, setMediumDrawer] = useState(false);
  const [mediumForm, setMediumForm] = useState<Medium>(EMPTY_MEDIUM);
  const [editingMediumId, setEditingMediumId] = useState<string | null>(null);

  const [expDrawer, setExpDrawer] = useState(false);
  const [expForm, setExpForm] = useState<Experiment>(EMPTY_EXPERIMENT);
  const [editingExpId, setEditingExpId] = useState<string | null>(null);

  const [ideaDrawer, setIdeaDrawer] = useState(false);
  const [editingIdeaId, setEditingIdeaId] = useState<string | null>(null);
  const [ideaForm, setIdeaForm] = useState<MarketingIdea>(emptyIdea("Online"));

  if (!hydrated) return null;

  const activeExperiments = state.experiments.filter((e) => e.status === "Active");
  const overLimit = activeExperiments.length > WIP_LIMITS.activeExperiments;

  const onlineIdeas = state.marketingIdeas.filter((i) => i.channel === "Online").sort((a, b) => a.date.localeCompare(b.date));
  const offlineIdeas = state.marketingIdeas.filter((i) => i.channel === "Offline").sort((a, b) => a.date.localeCompare(b.date));

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

  function openNewIdea(channel: Channel) {
    setIdeaForm(emptyIdea(channel));
    setEditingIdeaId(null);
    setIdeaDrawer(true);
  }

  function openEditIdea(i: MarketingIdea) {
    setIdeaForm(i);
    setEditingIdeaId(i.id);
    setIdeaDrawer(true);
  }

  function saveIdea() {
    if (!ideaForm.title.trim()) return;
    if (editingIdeaId) updateMarketingIdea(editingIdeaId, ideaForm);
    else addMarketingIdea(ideaForm);
    setIdeaDrawer(false);
  }

  const currentChannel: Channel = tab === "Offline" ? "Offline" : "Online";
  const currentIdeas = tab === "Offline" ? offlineIdeas : onlineIdeas;

  return (
    <div className="flex flex-col gap-8">
      <SectionHeader
        eyebrow="Sales & Marketing"
        title="Marketing"
        action={
          tab === "Channels" ? undefined : (
            <Button variant="primary" onClick={() => openNewIdea(currentChannel)}>
              <IconPlus className="h-4 w-4" /> Add idea
            </Button>
          )
        }
      />

      <Tabs
        value={tab}
        onChange={setTab}
        options={[
          { value: "Channels", label: "Channels" },
          { value: "Online", label: "Online", count: onlineIdeas.length },
          { value: "Offline", label: "Offline", count: offlineIdeas.length },
        ]}
      />

      {tab === "Channels" && (
        <>
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
        </>
      )}

      {(tab === "Online" || tab === "Offline") && (
        <>
          <p className="text-sm text-muted -mt-2">{CHANNEL_COPY[currentChannel].blurb}</p>
          {currentIdeas.length === 0 ? (
            <EmptyState
              title={`No ${tab.toLowerCase()} ideas yet`}
              body={`Add what you're planning to ${tab === "Online" ? "post" : "do"} — a title and a date is enough to start.`}
              action={
                <Button variant="primary" onClick={() => openNewIdea(currentChannel)}>
                  <IconPlus className="h-4 w-4" /> Add idea
                </Button>
              }
            />
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {currentIdeas.map((i) => (
                <Card key={i.id} className="cursor-pointer flex flex-col gap-1.5">
                  <div onClick={() => openEditIdea(i)}>
                    <div className="flex items-center justify-between mb-1">
                      <p className="font-medium text-sm">{i.title}</p>
                      <Badge tone={IDEA_STATUS_TONE[i.status]}>{i.status}</Badge>
                    </div>
                    <p className="text-xs text-muted">{CHANNEL_COPY[currentChannel].dateLabel}: {i.date}</p>
                    {i.notes && <p className="text-xs text-muted line-clamp-2 mt-1">{i.notes}</p>}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </>
      )}

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

      <Drawer open={ideaDrawer} onClose={() => setIdeaDrawer(false)} title={editingIdeaId ? "Edit idea" : "New idea"}>
        <div className="flex flex-col gap-4">
          <Field label="Channel">
            <SelectInput value={ideaForm.channel} onChange={(v: Channel) => setIdeaForm({ ...ideaForm, channel: v })} options={["Online", "Offline"] as const} />
          </Field>
          <Field label="Title">
            <TextInput
              value={ideaForm.title}
              onChange={(v) => setIdeaForm({ ...ideaForm, title: v })}
              placeholder={CHANNEL_COPY[ideaForm.channel].titlePlaceholder}
            />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label={CHANNEL_COPY[ideaForm.channel].dateLabel}>
              <TextInput type="date" value={ideaForm.date} onChange={(v) => setIdeaForm({ ...ideaForm, date: v })} />
            </Field>
            <Field label="Status">
              <SelectInput value={ideaForm.status} onChange={(v: MarketingIdeaStatus) => setIdeaForm({ ...ideaForm, status: v })} options={MARKETING_IDEA_STATUSES} />
            </Field>
          </div>
          <Field label="Notes">
            <TextArea value={ideaForm.notes} onChange={(v) => setIdeaForm({ ...ideaForm, notes: v })} placeholder="Optional" />
          </Field>
          <div className="flex items-center gap-2 pt-2">
            <Button variant="primary" onClick={saveIdea}>
              {editingIdeaId ? "Save changes" : "Add idea"}
            </Button>
            {editingIdeaId && (
              <DeleteButton
                label="Delete idea"
                onClick={() => {
                  removeMarketingIdea(editingIdeaId);
                  setIdeaDrawer(false);
                }}
              />
            )}
          </div>
        </div>
      </Drawer>
    </div>
  );
}
