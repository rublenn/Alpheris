"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useOsStore } from "@/lib/os/store";
import { createClientLearn, Playbook, PlaybookStep, newId } from "@/lib/os/types";
import {
  Badge,
  Button,
  Card,
  DeleteButton,
  Drawer,
  EmptyState,
  Field,
  IconButton,
  SaveButton,
  SectionHeader,
  SelectInput,
  Tabs,
  TextArea,
  TextInput,
} from "@/components/os/ui";
import { IconClose, IconPlus, IconStrategies } from "@/components/os/icons";

function LearnFieldEditor({
  label,
  placeholder,
  value,
  onChange,
}: {
  label: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <Card className="flex flex-col gap-2">
      <p className="font-semibold">{label}</p>
      <TextArea value={value} onChange={onChange} placeholder={placeholder} />
    </Card>
  );
}

function emptyPlaybook(): Playbook {
  return { id: newId(), name: "", version: 1, steps: [] };
}

const LEARN_BLOCKS = [
  { key: "business", label: "Business", placeholder: "Their story and what they sell" },
  { key: "problem", label: "Problem", placeholder: "What it's costing them, and the root cause" },
  { key: "audience", label: "Audience", placeholder: "Their ideal customer profile" },
  { key: "aim", label: "Aim", placeholder: "The growth objective beyond immediate sales" },
  {
    key: "targetAudience",
    label: "Target Audience (Demographics, Interests, Behaviour)",
    placeholder: "Age, location, interests, and online behaviour of who they should target",
  },
  {
    key: "bestCompetitor",
    label: "Best Performing Competitor",
    placeholder: "Who's winning in this space, and what they're doing well",
  },
  {
    key: "contentReference",
    label: "Content Reference",
    placeholder: "Links or examples of content style/format to reference",
  },
  {
    key: "usp",
    label: "Unique Selling Point",
    placeholder: "What makes this client different from everyone else",
  },
] as const;

type LearnFormState = Record<(typeof LEARN_BLOCKS)[number]["key"], string>;

function emptyLearnForm(): LearnFormState {
  const form = {} as LearnFormState;
  for (const block of LEARN_BLOCKS) form[block.key] = "";
  return form;
}

export default function DataPage() {
  return (
    <Suspense>
      <DataPageInner />
    </Suspense>
  );
}

function DataPageInner() {
  const {
    state,
    hydrated,
    addPlaybook,
    updatePlaybook,
    removePlaybook,
    addClientLearn,
    updateClientLearn,
  } = useOsStore();
  const searchParams = useSearchParams();
  const queryClient = searchParams.get("client") || "";
  const initialTab = searchParams.get("tab") === "playbooks" ? "Playbooks" : "Learn";
  const [tab, setTab] = useState<"Learn" | "Playbooks">(initialTab);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Playbook>(emptyPlaybook());

  const clientNames = Array.from(new Set(state.leads.filter((l) => l.stage === "Client").map((l) => l.name))).sort();
  const [learnClientSel, setLearnClient] = useState("");
  const learnClient = learnClientSel || queryClient || clientNames[0] || "";

  const [learnForm, setLearnForm] = useState<LearnFormState>(emptyLearnForm());

  useEffect(() => {
    const source = state.clientLearn.find((r) => r.client.toLowerCase() === learnClient.toLowerCase());
    const next = emptyLearnForm();
    if (source) for (const block of LEARN_BLOCKS) next[block.key] = source[block.key] ?? "";
    // eslint-disable-next-line react-hooks/set-state-in-effect -- resets the draft form when switching to a different client
    setLearnForm(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [learnClient]);

  if (!hydrated) return null;

  const activeLearn = learnClient
    ? state.clientLearn.find((r) => r.client.toLowerCase() === learnClient.toLowerCase())
    : undefined;

  function saveLearnAll() {
    if (!learnClient) return;
    if (activeLearn) updateClientLearn(activeLearn.id, learnForm);
    else addClientLearn({ ...createClientLearn(learnClient), ...learnForm });
  }

  function openNew() {
    setForm(emptyPlaybook());
    setEditingId(null);
    setDrawerOpen(true);
  }

  function openEdit(p: Playbook) {
    setForm(p);
    setEditingId(p.id);
    setDrawerOpen(true);
  }

  function addStep() {
    setForm({ ...form, steps: [...form.steps, { id: newId(), title: "", gate: false }] });
  }

  function updateStep(id: string, patch: Partial<PlaybookStep>) {
    setForm({ ...form, steps: form.steps.map((s) => (s.id === id ? { ...s, ...patch } : s)) });
  }

  function removeStep(id: string) {
    setForm({ ...form, steps: form.steps.filter((s) => s.id !== id) });
  }

  function persist() {
    const cleanSteps = form.steps.filter((s) => s.title.trim());
    const toSave = { ...form, steps: cleanSteps };
    if (editingId) updatePlaybook(editingId, toSave);
    else addPlaybook(toSave);
  }

  function bumpVersion() {
    setForm({ ...form, version: form.version + 1 });
  }

  return (
    <div className="flex flex-col gap-8">
      <SectionHeader
        eyebrow="Working"
        title="Data"
        action={
          tab === "Playbooks" ? (
            <Button variant="primary" onClick={openNew}>
              <IconPlus className="h-4 w-4" /> New playbook
            </Button>
          ) : undefined
        }
      />

      <Tabs
        value={tab}
        onChange={setTab}
        options={[
          { value: "Learn", label: "Learn", count: state.clientLearn.length },
          { value: "Playbooks", label: "Playbooks", count: state.playbooks.length },
        ]}
      />

      {tab === "Learn" && (
        <>
          <p className="text-sm text-muted -mt-2">
            What to learn about every client before anything else — their business, problem, audience, aim, target audience, competition, content style, and USP.
          </p>

          {clientNames.length === 0 ? (
            <EmptyState
              title="No clients yet"
              body="Move a lead to Client in Sales first — data is learned per client, same as the client timeline and creative board."
            />
          ) : (
            <>
              <div className="flex items-end gap-3">
                <div className="flex-1">
                  <Field label="Client">
                    <SelectInput value={learnClient} onChange={setLearnClient} options={clientNames} />
                  </Field>
                </div>
                {learnClient && (
                  <Link
                    href={`/os/working/production?client=${encodeURIComponent(learnClient)}`}
                    className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-full bg-accent px-4 py-2.5 text-sm font-medium text-white transition duration-150 ease-[var(--ease-smooth)] hover:opacity-90 active:scale-[0.97]"
                  >
                    Go to Creative →
                  </Link>
                )}
              </div>

              {learnClient && (
                <>
                  <div className="grid gap-4 sm:grid-cols-2">
                    {LEARN_BLOCKS.map((block) => (
                      <LearnFieldEditor
                        key={block.key}
                        label={block.label}
                        placeholder={block.placeholder}
                        value={learnForm[block.key]}
                        onChange={(v) => setLearnForm({ ...learnForm, [block.key]: v })}
                      />
                    ))}
                  </div>
                  <SaveButton onSave={saveLearnAll} className="self-start" />
                </>
              )}
            </>
          )}
        </>
      )}

      {tab === "Playbooks" && (state.playbooks.length === 0 ? (
        <EmptyState
          title="No playbooks yet"
          body="Turn how you actually deliver a service into an ordered checklist — the same process every time, with gates on the steps that can't be skipped."
          action={
            <Button variant="primary" onClick={openNew}>
              <IconPlus className="h-4 w-4" /> Build your first playbook
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {state.playbooks.map((p) => (
            <Card key={p.id} className="flex flex-col">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2.5">
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-lens-working-soft text-lens-working">
                    <IconStrategies className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="font-semibold leading-tight">{p.name}</p>
                    <p className="text-xs text-muted">Version {p.version}</p>
                  </div>
                </div>
                <Button variant="ghost" onClick={() => openEdit(p)}>Edit</Button>
              </div>
              {p.steps.length === 0 ? (
                <p className="text-sm text-muted">No steps yet.</p>
              ) : (
                <ol className="flex flex-col gap-1.5">
                  {p.steps.map((s, i) => (
                    <li key={s.id} className="flex items-center gap-2.5 text-sm">
                      <span className="text-xs text-muted w-4 tabular-nums">{i + 1}</span>
                      <span className="flex-1">{s.title}</span>
                      {s.gate && <Badge tone="warn">Gate</Badge>}
                    </li>
                  ))}
                </ol>
              )}
            </Card>
          ))}
        </div>
      ))}

      <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)} title={editingId ? "Edit playbook" : "New playbook"}>
        <div className="flex flex-col gap-4">
          <Field label="Service name">
            <TextInput value={form.name} onChange={(v) => setForm({ ...form, name: v })} placeholder="e.g. Social content retainer" />
          </Field>

          {editingId && (
            <div className="flex items-center justify-between rounded-lg border border-border-soft bg-surface-2 px-3.5 py-2.5">
              <span className="text-sm text-muted">Version {form.version}</span>
              <Button variant="ghost" onClick={bumpVersion}>Bump version</Button>
            </div>
          )}

          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Steps</span>
              <Button variant="ghost" onClick={addStep}>
                <IconPlus className="h-3.5 w-3.5" /> Add step
              </Button>
            </div>
            <div className="flex flex-col gap-2">
              {form.steps.map((s, i) => (
                <div key={s.id} className="flex items-center gap-2">
                  <span className="text-xs text-muted w-4 tabular-nums">{i + 1}</span>
                  <input
                    value={s.title}
                    onChange={(e) => updateStep(s.id, { title: e.target.value })}
                    placeholder="Step title"
                    className="flex-1 rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm outline-none focus:border-accent transition"
                  />
                  <label className="flex items-center gap-1.5 text-xs text-muted shrink-0" title="Blocks progress until satisfied">
                    <input
                      type="checkbox"
                      checked={s.gate}
                      onChange={(e) => updateStep(s.id, { gate: e.target.checked })}
                      className="h-3.5 w-3.5 rounded border-border accent-[var(--accent)]"
                    />
                    Gate
                  </label>
                  <IconButton label="Remove step" onClick={() => removeStep(s.id)}>
                    <IconClose className="h-3.5 w-3.5" />
                  </IconButton>
                </div>
              ))}
              {form.steps.length === 0 && (
                <p className="text-xs text-muted">No steps yet — add the first one above.</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <SaveButton
              onSave={persist}
              onDone={() => setDrawerOpen(false)}
              disabled={!form.name.trim()}
              idleLabel={editingId ? "Save changes" : "Create playbook"}
            />
            {editingId && (
              <DeleteButton
                label="Delete playbook"
                onClick={() => {
                  removePlaybook(editingId);
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
