"use client";

import Link from "next/link";
import { useOsStore } from "@/lib/os/store";
import { DeliverableStatus, WIP_LIMITS } from "@/lib/os/types";
import { inProductionCount } from "@/lib/os/calc";
import { Badge, Card, EmptyState, SectionHeader } from "@/components/os/ui";

const COLUMNS: DeliverableStatus[] = ["Brief", "Production", "Review"];

export default function ProductionPage() {
  const { state, hydrated, updateDeliverable } = useOsStore();

  if (!hydrated) return null;

  const inProduction = inProductionCount(state.deliverables);
  const overLimit = inProduction > WIP_LIMITS.inProduction;
  const queue = state.deliverables.filter((d) => d.status !== "Delivered");

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

  return (
    <div className="flex flex-col gap-8">
      <SectionHeader
        eyebrow="Working"
        title="Creative & Production"
        action={
          <Link href="/os/working/deliverables" className="text-sm font-medium text-accent hover:opacity-80">
            Manage all deliverables →
          </Link>
        }
      />

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
    </div>
  );
}
