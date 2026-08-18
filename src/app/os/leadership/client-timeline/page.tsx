"use client";

import { useOsStore } from "@/lib/os/store";
import { CLIENT_TIMELINE_STAGES, CLIENT_TIMELINE_STAGE_INFO, ClientTimelineStage } from "@/lib/os/types";
import { Badge, Card, EmptyState, SectionHeader } from "@/components/os/ui";
import { MilestoneNodeData, MilestoneTrack } from "@/components/os/MilestoneTrack";

export default function ClientTimelinePage() {
  const { state, hydrated, updateClientTimelineStep } = useOsStore();

  if (!hydrated) return null;

  return (
    <div className="flex flex-col gap-8">
      <SectionHeader eyebrow="Leadership" title="Client Timeline" />

      {state.clientTimelines.length === 0 ? (
        <EmptyState
          title="No client timelines yet"
          body="A timeline is created automatically the moment an opportunity moves to Won in Sales — same six stages every time, only the dates change."
        />
      ) : (
        <div className="flex flex-col gap-5">
          {state.clientTimelines.map((timeline) => {
            const doneCount = timeline.steps.filter((s) => s.done).length;
            const firstOpenIndex = timeline.steps.findIndex((s) => !s.done);

            const nodes: MilestoneNodeData[] = timeline.steps.map((step, i) => ({
              id: step.stage,
              label: step.stage,
              sublabel: step.date,
              status: step.done ? "done" : i === firstOpenIndex ? "current" : "upcoming",
              href: CLIENT_TIMELINE_STAGE_INFO[step.stage].href(timeline.client),
            }));

            return (
              <Card key={timeline.id} className="flex flex-col gap-5">
                <div className="flex items-center justify-between">
                  <p className="font-semibold">{timeline.client}</p>
                  <Badge tone={doneCount === CLIENT_TIMELINE_STAGES.length ? "good" : "neutral"}>
                    {doneCount} / {CLIENT_TIMELINE_STAGES.length}
                  </Badge>
                </div>

                <MilestoneTrack nodes={nodes} tone="leadership" />

                <div className="flex flex-col gap-1.5 pt-1 border-t border-border-soft">
                  {timeline.steps.map((step) => (
                    <div
                      key={step.stage}
                      className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 py-1.5"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{step.stage}</p>
                        <p className="text-xs text-muted">{CLIENT_TIMELINE_STAGE_INFO[step.stage].description}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <input
                          type="date"
                          value={step.date}
                          onChange={(e) =>
                            updateClientTimelineStep(timeline.id, step.stage as ClientTimelineStage, {
                              date: e.target.value,
                            })
                          }
                          className="rounded-lg border border-border bg-surface-2 px-2.5 py-1.5 text-sm outline-none focus:border-accent transition"
                        />
                        <label className="flex items-center gap-1.5 text-xs text-muted">
                          <input
                            type="checkbox"
                            checked={step.done}
                            onChange={(e) =>
                              updateClientTimelineStep(timeline.id, step.stage as ClientTimelineStage, {
                                done: e.target.checked,
                              })
                            }
                            className="h-4 w-4 rounded border-border accent-[var(--accent)]"
                          />
                          Done
                        </label>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
