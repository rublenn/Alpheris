"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useOsStore } from "@/lib/os/store";
import { CreativeScript } from "@/lib/os/types";
import { Badge, Card, EmptyState, Field, SectionHeader, SelectInput } from "@/components/os/ui";

const OUTCOME_STEPS = [
  { key: "delivered", label: "Delivered" },
  { key: "scheduled", label: "Scheduled" },
  { key: "posted", label: "Posted" },
] as const;

export default function DeliverablesPage() {
  return (
    <Suspense>
      <DeliverablesPageInner />
    </Suspense>
  );
}

function DeliverablesPageInner() {
  const { state, hydrated, updateCreativeScript } = useOsStore();
  const searchParams = useSearchParams();
  const queryClient = searchParams.get("client") || "";

  const clientNames = Array.from(new Set(state.leads.filter((l) => l.stage === "Client").map((l) => l.name))).sort();

  const [clientSel, setClient] = useState("");
  const client = clientSel || queryClient || clientNames[0] || "";
  const [outcomeId, setOutcomeId] = useState("");

  if (!hydrated) return null;

  const finalisedForClient = client
    ? state.creativeScripts.filter((s) => s.client === client && s.finalised)
    : [];

  const activeOutcome: CreativeScript | undefined = finalisedForClient.find((s) => s.id === outcomeId) ?? finalisedForClient[0];

  return (
    <div className="flex flex-col gap-8">
      <SectionHeader eyebrow="Working" title="Deliverables" />

      {clientNames.length === 0 ? (
        <EmptyState
          title="No clients yet"
          body="Move a lead to Client in Sales first — final outcomes are picked per client, same as Creative and Production."
        />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Client">
              <SelectInput
                value={client}
                onChange={(v) => {
                  setClient(v);
                  setOutcomeId("");
                }}
                options={clientNames}
              />
            </Field>
            <Field label="Final outcome">
              <select
                value={activeOutcome?.id ?? ""}
                onChange={(e) => setOutcomeId(e.target.value)}
                disabled={finalisedForClient.length === 0}
                className="w-full rounded-lg border border-border bg-surface-2 px-3.5 py-2.5 text-sm outline-none focus:border-accent transition appearance-none disabled:opacity-50"
              >
                <option value="">Select a finalised ad or post</option>
                {finalisedForClient.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name.trim() || s.genre}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          {client && finalisedForClient.length === 0 && (
            <EmptyState
              title={`Nothing finalised yet for ${client}`}
              body="Mark an ad or post Finalised in Creative & Production's Production tab first — it shows up here automatically."
            />
          )}

          {activeOutcome && (
            <Card className="flex flex-col gap-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold">{activeOutcome.name.trim() || activeOutcome.genre}</p>
                  <p className="text-xs text-muted">{activeOutcome.genre} · {activeOutcome.client} · {activeOutcome.kind}</p>
                </div>
                <Badge tone={activeOutcome.posted ? "good" : "accent"}>
                  {activeOutcome.posted ? "Posted" : "Live pipeline"}
                </Badge>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {OUTCOME_STEPS.map((step) => (
                  <label
                    key={step.key}
                    className={`flex items-center gap-2 rounded-lg border px-3 py-2.5 text-sm cursor-pointer transition ${
                      activeOutcome[step.key] ? "border-good/40 bg-good-soft" : "border-border bg-surface-2"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={activeOutcome[step.key]}
                      onChange={(e) => updateCreativeScript(activeOutcome.id, { [step.key]: e.target.checked })}
                      className="h-4 w-4 rounded border-border accent-[var(--good)]"
                    />
                    {step.label}
                  </label>
                ))}
              </div>

              {activeOutcome.posted && (
                <Link
                  href={`/os/operations/client-success?focus=report&client=${encodeURIComponent(activeOutcome.client)}`}
                  className="text-sm text-accent hover:underline"
                >
                  Report performance in Client Success →
                </Link>
              )}
            </Card>
          )}
        </>
      )}
    </div>
  );
}
