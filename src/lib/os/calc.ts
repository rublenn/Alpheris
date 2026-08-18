import {
  Client,
  CreativeScript,
  Lead,
  MoneyEvent,
  OsState,
  WIP_LIMITS,
} from "./types";

export function openLeads(leads: Lead[]) {
  return leads.filter((l) => l.stage === "InTalk" || l.stage === "FollowUp");
}

export function pipelineValue(leads: Lead[]) {
  return openLeads(leads).reduce((sum, l) => sum + l.value, 0);
}

export function conversionRate(leads: Lead[]) {
  if (leads.length === 0) return null;
  const clients = leads.filter((l) => l.stage === "Client").length;
  return clients / leads.length;
}

export function referralShare(leads: Lead[]) {
  if (leads.length === 0) return null;
  const referred = leads.filter((l) => l.source === "Referral").length;
  return referred / leads.length;
}

export function activeEngagements(scripts: CreativeScript[]) {
  return new Set(scripts.filter((s) => !s.posted).map((s) => s.client)).size;
}

export function inProductionCount(scripts: CreativeScript[]) {
  return scripts.filter((s) => (s.shooting || s.editing) && !s.finalised).length;
}

export function wip(state: OsState) {
  return {
    engagements: activeEngagements(state.creativeScripts),
    engagementsLimit: WIP_LIMITS.activeEngagements,
    production: inProductionCount(state.creativeScripts),
    productionLimit: WIP_LIMITS.inProduction,
    experiments: state.experiments.filter((e) => e.status === "Active").length,
    experimentsLimit: WIP_LIMITS.activeExperiments,
  };
}

export function financeSummary(events: MoneyEvent[]) {
  const invoices = events.filter((e) => e.kind === "Invoice");
  const expenses = events.filter((e) => e.kind === "Expense");
  const made = invoices.filter((e) => e.status === "Paid").reduce((s, e) => s + e.amount, 0);
  const spent = expenses.filter((e) => e.status === "Paid").reduce((s, e) => s + e.amount, 0);
  const remaining = made - spent;
  const pending = invoices
    .filter((e) => e.status !== "Paid")
    .reduce((s, e) => s + e.amount, 0);
  const overdue = invoices.filter((e) => e.status === "Overdue");
  const overdueAmount = overdue.reduce((s, e) => s + e.amount, 0);

  const avgDailySpend = spent > 0 ? spent / 30 : 0;
  const bufferDays = avgDailySpend > 0 ? Math.round(remaining / avgDailySpend) : null;

  return {
    made,
    spent,
    remaining,
    pending,
    overdueCount: overdue.length,
    overdueAmount,
    bufferDays,
  };
}

export function revenueConcentration(clients: Client[]) {
  const total = clients.reduce((s, c) => s + c.monthlyValue, 0);
  if (total <= 0) return null;
  const max = Math.max(...clients.map((c) => c.monthlyValue), 0);
  return { share: max / total, total };
}

export function flaggedClients(clients: Client[]) {
  return clients.filter((c) => c.health !== "Good");
}

export function formatCurrency(n: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
}

export function formatPct(n: number | null, digits = 0) {
  if (n === null) return "—";
  return `${(n * 100).toFixed(digits)}%`;
}

export function daysUntil(dateStr: string) {
  if (!dateStr) return null;
  const target = new Date(dateStr).getTime();
  const now = new Date().setHours(0, 0, 0, 0);
  return Math.round((target - now) / 86400000);
}

export function addDays(dateStr: string, days: number): string {
  const base = dateStr ? new Date(dateStr) : new Date();
  base.setDate(base.getDate() + days);
  return base.toISOString().slice(0, 10);
}

export type TimelineBucket = "Today" | "Tomorrow" | "This Week" | "This Month";
export const TIMELINE_BUCKETS: TimelineBucket[] = ["Today", "Tomorrow", "This Week", "This Month"];

export function bucketForDate(dateStr: string): TimelineBucket {
  const diff = daysUntil(dateStr) ?? 0;
  if (diff <= 0) return "Today";
  if (diff === 1) return "Tomorrow";
  if (diff <= 7) return "This Week";
  return "This Month";
}
