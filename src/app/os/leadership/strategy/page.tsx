"use client";

import { useState } from "react";
import { useOsStore } from "@/lib/os/store";
import { CompanyStrategy, todayISO } from "@/lib/os/types";
import { daysUntil } from "@/lib/os/calc";
import { Badge, Button, Card, Field, SectionHeader, TextArea, TextInput } from "@/components/os/ui";

export default function CompanyStrategyPage() {
  const { state, hydrated, setStrategy } = useOsStore();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<CompanyStrategy>(state.strategy);

  if (!hydrated) return null;

  const s = state.strategy;
  const isEmpty = !s.mission && !s.positioning && !s.idealClient && !s.quarterlyPriority;
  const daysSinceReview = s.lastReviewed ? daysUntil(s.lastReviewed) : null;
  const stale = daysSinceReview !== null && daysSinceReview < -100;

  function startEdit() {
    setForm(state.strategy);
    setEditing(true);
  }

  function save() {
    setStrategy(form);
    setEditing(false);
  }

  function markReviewed() {
    setStrategy({ ...state.strategy, lastReviewed: todayISO() });
  }

  return (
    <div className="flex flex-col gap-8">
      <SectionHeader
        eyebrow="Leadership"
        title="Company Strategy"
        action={
          !editing && (
            <div className="flex items-center gap-2">
              <Button variant="secondary" onClick={markReviewed}>
                Mark reviewed today
              </Button>
              <Button variant="primary" onClick={startEdit}>
                {isEmpty ? "Set strategy" : "Edit"}
              </Button>
            </div>
          )
        }
      />

      <Card>
        <div className="flex items-center justify-between mb-1">
          <p className="text-sm font-medium text-muted">Last reviewed</p>
          {s.lastReviewed && <Badge tone={stale ? "warn" : "neutral"}>{s.lastReviewed}</Badge>}
        </div>
        <p className="text-xs text-muted">
          {s.lastReviewed
            ? stale
              ? "Over 100 days since the last review — revisit this quarterly, alongside pricing and offer."
              : "Reviewed within the last quarter."
            : "Never reviewed. Set your strategy and revisit it every quarter."}
        </p>
      </Card>

      {editing ? (
        <Card className="flex flex-col gap-4">
          <Field label="Mission / one-liner">
            <TextInput value={form.mission} onChange={(v) => setForm({ ...form, mission: v })} placeholder="What Alpheris does, in one sentence" />
          </Field>
          <Field label="Ideal client profile">
            <TextArea value={form.idealClient} onChange={(v) => setForm({ ...form, idealClient: v })} placeholder="Who you do your best work for" />
          </Field>
          <Field label="Positioning statement">
            <TextArea value={form.positioning} onChange={(v) => setForm({ ...form, positioning: v })} placeholder="How you're different from the obvious alternative" />
          </Field>
          <Field label="Differentiators">
            <TextArea value={form.differentiators} onChange={(v) => setForm({ ...form, differentiators: v })} placeholder="What you have that competitors don't" />
          </Field>
          <Field label="This quarter's priority">
            <TextInput value={form.quarterlyPriority} onChange={(v) => setForm({ ...form, quarterlyPriority: v })} placeholder="One specific, hard goal — not 'grow the business'" />
          </Field>
          <div className="flex items-center gap-2 pt-2">
            <Button variant="primary" onClick={save}>Save strategy</Button>
            <Button variant="ghost" onClick={() => setEditing(false)}>Cancel</Button>
          </div>
        </Card>
      ) : isEmpty ? (
        <Card className="text-center py-14">
          <p className="font-medium mb-1">No strategy set yet</p>
          <p className="text-sm text-muted max-w-sm mx-auto mb-5">
            One page: who you serve, how you&apos;re positioned, and the one thing you&apos;re prioritizing this quarter. Everything else in Leadership should trace back to it.
          </p>
          <Button variant="primary" onClick={startEdit}>Set strategy</Button>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          <StrategyCard label="Mission" value={s.mission} span />
          <StrategyCard label="Ideal client profile" value={s.idealClient} />
          <StrategyCard label="Positioning" value={s.positioning} />
          <StrategyCard label="Differentiators" value={s.differentiators} />
          <StrategyCard label="This quarter's priority" value={s.quarterlyPriority} accent />
        </div>
      )}
    </div>
  );
}

function StrategyCard({
  label,
  value,
  span,
  accent,
}: {
  label: string;
  value: string;
  span?: boolean;
  accent?: boolean;
}) {
  return (
    <Card className={span ? "sm:col-span-2" : ""}>
      <p className="text-xs font-medium tracking-wide uppercase text-muted mb-2">{label}</p>
      <p className={`text-sm leading-relaxed whitespace-pre-wrap ${accent ? "text-accent font-medium" : ""}`}>
        {value || <span className="text-muted">Not set</span>}
      </p>
    </Card>
  );
}
