"use client";

import Link from "next/link";
import { useOsStore } from "@/lib/os/store";
import {
  financeSummary,
  flaggedClients,
  formatCurrency,
  formatPct,
  pipelineValue,
  referralShare,
  revenueConcentration,
  winRate,
  wip,
} from "@/lib/os/calc";
import { Badge, Card, DeleteButton, EmptyState, ProgressBar } from "@/components/os/ui";
import { IconGrowth, IconSales, IconStrategies, IconProduction, IconDeliverables, IconClientSuccess, IconFinance } from "@/components/os/icons";

export default function OverviewPage() {
  const { state, hydrated, removeCapture } = useOsStore();

  if (!hydrated) return null;

  const pipeline = pipelineValue(state.opportunities);
  const win = winRate(state.opportunities);
  const referral = referralShare(state.opportunities);
  const finance = financeSummary(state.moneyEvents);
  const concentration = revenueConcentration(state.clients);
  const flagged = flaggedClients(state.clients);
  const w = wip(state);

  const openDeliverables = state.deliverables.filter((d) => d.status !== "Delivered");
  const overdueInvoices = state.moneyEvents.filter((m) => m.status === "Overdue");

  return (
    <div className="flex flex-col gap-8">
      <div>
        <p className="text-sm text-muted mb-1">
          {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
        </p>
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">
          Everything you&apos;re running, in one place.
        </h1>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <LensCard
          title="Leadership"
          subtitle="Sales & growth"
          icon={<IconSales className="h-4 w-4" />}
          tone="leadership"
          href="/os/leadership/sales"
          stats={[
            { label: "Open pipeline", value: formatCurrency(pipeline) },
            { label: "Win rate", value: formatPct(win) },
            { label: "Referral share", value: formatPct(referral) },
          ]}
        />
        <LensCard
          title="Working"
          subtitle="Strategy, production, deliverables"
          icon={<IconProduction className="h-4 w-4" />}
          tone="working"
          href="/os/working/deliverables"
          stats={[
            { label: "In production", value: `${w.production} / ${w.productionLimit}`, warn: w.production > w.productionLimit },
            { label: "Active engagements", value: `${w.engagements} / ${w.engagementsLimit}`, warn: w.engagements > w.engagementsLimit },
            { label: "Open deliverables", value: openDeliverables.length },
          ]}
        />
        <LensCard
          title="Operations"
          subtitle="Client success & finance"
          icon={<IconFinance className="h-4 w-4" />}
          tone="operations"
          href="/os/operations/finance"
          stats={[
            { label: "Remaining", value: formatCurrency(finance.remaining) },
            { label: "Overdue invoices", value: overdueInvoices.length, warn: overdueInvoices.length > 0 },
            { label: "Clients flagged", value: flagged.length, warn: flagged.length > 0 },
          ]}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.1fr,1fr]">
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Capture inbox</h3>
            <span className="text-xs text-muted">{state.captures.length} open</span>
          </div>
          {state.captures.length === 0 ? (
            <EmptyState
              title="Nothing captured"
              body="Use the box at the top of the screen to drop a thought in — triage it here during your weekly review."
            />
          ) : (
            <ul className="flex flex-col gap-2">
              {state.captures
                .slice()
                .reverse()
                .map((c) => (
                  <li
                    key={c.id}
                    className="flex items-center justify-between gap-3 rounded-lg border border-border-soft bg-surface-2 px-3.5 py-2.5"
                  >
                    <span className="text-sm">{c.text}</span>
                    <DeleteButton onClick={() => removeCapture(c.id)} label="Clear" />
                  </li>
                ))}
            </ul>
          )}
        </Card>

        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Work in progress</h3>
            <Badge tone={w.production > w.productionLimit || w.engagements > w.engagementsLimit ? "warn" : "good"}>
              {w.production > w.productionLimit || w.engagements > w.engagementsLimit ? "Over limit" : "Within limits"}
            </Badge>
          </div>
          <div className="flex flex-col gap-4">
            <WipRow label="Active engagements" value={w.engagements} limit={w.engagementsLimit} />
            <WipRow label="Deliverables in production" value={w.production} limit={w.productionLimit} />
            <WipRow label="Active growth experiments" value={w.experiments} limit={w.experimentsLimit} />
          </div>
          {concentration && (
            <div className="mt-5 pt-4 border-t border-border-soft">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted">Largest client share of revenue</span>
                <span className={concentration.share >= 0.35 ? "text-warn font-medium" : "font-medium"}>
                  {formatPct(concentration.share)}
                </span>
              </div>
            </div>
          )}
        </Card>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <QuickLink href="/os/leadership/growth" icon={<IconGrowth className="h-4 w-4" />} label="Growth experiments" />
        <QuickLink href="/os/working/strategies" icon={<IconStrategies className="h-4 w-4" />} label="Playbooks" />
        <QuickLink href="/os/working/deliverables" icon={<IconDeliverables className="h-4 w-4" />} label="Deliverables" />
        <QuickLink href="/os/operations/client-success" icon={<IconClientSuccess className="h-4 w-4" />} label="Client health" />
      </div>
    </div>
  );
}

function LensCard({
  title,
  subtitle,
  icon,
  tone,
  href,
  stats,
}: {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  tone: "leadership" | "working" | "operations";
  href: string;
  stats: { label: string; value: React.ReactNode; warn?: boolean }[];
}) {
  const toneBg: Record<string, string> = {
    leadership: "bg-lens-leadership-soft text-lens-leadership",
    working: "bg-lens-working-soft text-lens-working",
    operations: "bg-lens-operations-soft text-lens-operations",
  };
  return (
    <Link href={href} className="group block">
      <Card className="h-full transition group-hover:border-muted">
        <div className="flex items-center gap-3 mb-4">
          <span className={`inline-flex h-8 w-8 items-center justify-center rounded-full ${toneBg[tone]}`}>
            {icon}
          </span>
          <div>
            <p className="font-semibold leading-tight">{title}</p>
            <p className="text-xs text-muted">{subtitle}</p>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {stats.map((s) => (
            <div key={s.label}>
              <p className="text-xs text-muted mb-0.5">{s.label}</p>
              <p className={`text-sm font-semibold tabular-nums ${s.warn ? "text-warn" : ""}`}>{s.value}</p>
            </div>
          ))}
        </div>
      </Card>
    </Link>
  );
}

function WipRow({ label, value, limit }: { label: string; value: number; limit: number }) {
  const over = value > limit;
  return (
    <div>
      <div className="flex items-center justify-between text-sm mb-1.5">
        <span className="text-muted">{label}</span>
        <span className={`font-medium tabular-nums ${over ? "text-warn" : ""}`}>
          {value} / {limit}
        </span>
      </div>
      <ProgressBar value={(value / Math.max(limit, 1)) * 100} tone={over ? "warn" : "accent"} />
    </div>
  );
}

function QuickLink({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 rounded-xl border border-border bg-surface px-4 py-3.5 text-sm font-medium transition hover:border-muted"
    >
      <span className="text-muted">{icon}</span>
      {label}
    </Link>
  );
}
