"use client";

import { useState } from "react";
import { useOsStore } from "@/lib/os/store";
import { Playbook, PlaybookStep, newId } from "@/lib/os/types";
import {
  Badge,
  Button,
  Card,
  DeleteButton,
  Drawer,
  EmptyState,
  Field,
  IconButton,
  SectionHeader,
  TextInput,
} from "@/components/os/ui";
import { IconClose, IconPlus, IconStrategies } from "@/components/os/icons";

function emptyPlaybook(): Playbook {
  return { id: newId(), name: "", version: 1, steps: [] };
}

export default function StrategiesPage() {
  const { state, hydrated, addPlaybook, updatePlaybook, removePlaybook } = useOsStore();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Playbook>(emptyPlaybook());

  if (!hydrated) return null;

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

  function save() {
    if (!form.name.trim()) return;
    const cleanSteps = form.steps.filter((s) => s.title.trim());
    const toSave = { ...form, steps: cleanSteps };
    if (editingId) updatePlaybook(editingId, toSave);
    else addPlaybook(toSave);
    setDrawerOpen(false);
  }

  function bumpVersion() {
    setForm({ ...form, version: form.version + 1 });
  }

  return (
    <div className="flex flex-col gap-8">
      <SectionHeader
        eyebrow="Working"
        title="Strategies"
        action={
          <Button variant="primary" onClick={openNew}>
            <IconPlus className="h-4 w-4" /> New playbook
          </Button>
        }
      />

      {state.playbooks.length === 0 ? (
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
      )}

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
            <Button variant="primary" onClick={save}>
              {editingId ? "Save changes" : "Create playbook"}
            </Button>
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
