export type Stage =
  | "New"
  | "Contacted"
  | "Engaged"
  | "Qualified"
  | "Proposed"
  | "Won"
  | "Lost";

export const STAGES: Stage[] = [
  "New",
  "Contacted",
  "Engaged",
  "Qualified",
  "Proposed",
  "Won",
  "Lost",
];

export const SOURCES = [
  "Referral",
  "Outbound",
  "Inbound",
  "Partner",
  "Event",
  "Other",
] as const;
export type Source = (typeof SOURCES)[number];

export interface Opportunity {
  id: string;
  name: string;
  source: Source;
  stage: Stage;
  value: number;
  nextAction: string;
  nextActionDate: string;
  lostReason?: string;
  createdAt: string;
}

export interface Target {
  revenueGoal: number;
  newClientsGoal: number;
  qualifiedLeadsGoal: number;
}

export type Channel = "Online" | "Offline";

export interface Medium {
  id: string;
  name: string;
  channel: Channel;
  active: boolean;
  notes: string;
}

export type ExperimentStatus = "Active" | "Won" | "Killed";

export interface Experiment {
  id: string;
  name: string;
  hypothesis: string;
  budget: number;
  killDate: string;
  status: ExperimentStatus;
}

export interface PlaybookStep {
  id: string;
  title: string;
  gate: boolean;
}

export interface Playbook {
  id: string;
  name: string;
  version: number;
  steps: PlaybookStep[];
}

export type DeliverableStatus = "Brief" | "Production" | "Review" | "Delivered";

export const DELIVERABLE_STATUSES: DeliverableStatus[] = [
  "Brief",
  "Production",
  "Review",
  "Delivered",
];

export interface Deliverable {
  id: string;
  client: string;
  title: string;
  playbookId: string;
  status: DeliverableStatus;
  estimateHours: number;
  loggedHours: number;
  dueDate: string;
}

export type ClientHealth = "Good" | "Watch" | "At risk";

export interface Client {
  id: string;
  name: string;
  monthlyValue: number;
  health: ClientHealth;
  lastReportDate: string;
  notes: string;
}

export type MoneyKind = "Invoice" | "Expense";
export type MoneyStatus = "Pending" | "Paid" | "Overdue";

export interface MoneyEvent {
  id: string;
  kind: MoneyKind;
  party: string;
  amount: number;
  issuedDate: string;
  dueDate: string;
  paidDate: string;
  status: MoneyStatus;
}

export interface Capture {
  id: string;
  text: string;
  createdAt: string;
}

export interface OsState {
  target: Target;
  opportunities: Opportunity[];
  mediums: Medium[];
  experiments: Experiment[];
  playbooks: Playbook[];
  deliverables: Deliverable[];
  clients: Client[];
  moneyEvents: MoneyEvent[];
  captures: Capture[];
}

export const EMPTY_STATE: OsState = {
  target: { revenueGoal: 0, newClientsGoal: 0, qualifiedLeadsGoal: 0 },
  opportunities: [],
  mediums: [],
  experiments: [],
  playbooks: [],
  deliverables: [],
  clients: [],
  moneyEvents: [],
  captures: [],
};

export const WIP_LIMITS = {
  activeEngagements: 5,
  inProduction: 2,
  activeExperiments: 1,
};

export function newId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}
