"use client";

import { useOsStore } from "@/lib/os/store";
import { Stage, todayISO } from "@/lib/os/types";
import { formatCurrency } from "@/lib/os/calc";
import { Badge, Button, Card, EmptyState, SectionHeader, StatTile } from "@/components/os/ui";

const OPEN_STAGES: Stage[] = ["New", "Contacted", "Engaged", "Qualified", "Proposed"];

function addDays(dateStr: string, days: number): string {
  const base = dateStr ? new Date(dateStr) : new Date();
  base.setDate(base.getDate() + days);
  return base.toISOString().slice(0, 10);
}

export default function FollowUpsPage() {
  const { state, hydrated, updateOpportunity } = useOsStore();

  if (!hydrated) return null;

  const today = todayISO();

  const items = state.opportunities
    .filter((o) => OPEN_STAGES.includes(o.stage) && o.nextActionDate)
    .slice()
    .sort((a, b) => a.nextActionDate.localeCompare(b.nextActionDate));

  const overdue = items.filter((o) => o.nextActionDate < today);
  const dueToday = items.filter((o) => o.nextActionDate === today);

  return (
    <div className="flex flex-col gap-8">
      <SectionHeader eyebrow="Sales & Growth" title="Follow Ups" />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatTile label="Overdue" value={overdue.length} tone={overdue.length > 0 ? "critical" : "neutral"} />
        <StatTile label="Due today" value={dueToday.length} tone={dueToday.length > 0 ? "warn" : "neutral"} />
        <StatTile label="Total open" value={items.length} />
      </div>

      {items.length === 0 ? (
        <EmptyState
          title="Nothing waiting on you"
          body="Every open opportunity with a next action and date shows up here, earliest first. Set one from the Sales pipeline."
        />
      ) : (
        <div className="flex flex-col gap-2">
          {items.map((o) => {
            const overdueItem = o.nextActionDate < today;
            const dueTodayItem = o.nextActionDate === today;
            return (
              <Card key={o.id} className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-medium text-sm">{o.name}</p>
                    <Badge tone="neutral">{o.stage}</Badge>
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
      )}
    </div>
  );
}
