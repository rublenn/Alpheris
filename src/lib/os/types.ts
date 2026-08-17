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
  scheduledDate: string;
  publishedDate: string;
  publishedLink: string;
}

export type ClientHealth = "Good" | "Watch" | "At risk";

export interface Client {
  id: string;
  name: string;
  monthlyValue: number;
  health: ClientHealth;
  lastReportDate: string;
  lastReportNotes: string;
  notes: string;
  currentProblem: string;
  proposedSolution: string;
  satisfaction: number;
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

export interface CompanyStrategy {
  mission: string;
  idealClient: string;
  positioning: string;
  differentiators: string;
  quarterlyPriority: string;
  lastReviewed: string;
}

export type TimelineHorizon = "Day" | "Week" | "Month";

export const TIMELINE_HORIZONS: TimelineHorizon[] = ["Day", "Week", "Month"];

export interface TimelineEntry {
  id: string;
  horizon: TimelineHorizon;
  title: string;
  date: string;
  done: boolean;
}

export interface ProjectMilestone {
  id: string;
  project: string;
  title: string;
  date: string;
  done: boolean;
}

export const LEAD_STATUSES = ["New", "Contacted", "Qualified"] as const;
export type LeadStatus = (typeof LEAD_STATUSES)[number];

export interface Lead {
  id: string;
  name: string;
  source: Source;
  contact: string;
  status: LeadStatus;
  capturedAt: string;
}

export interface ClientResearch {
  id: string;
  client: string;
  background: string;
  goals: string;
  challenges: string;
  questionnaire: string;
}

export const PRODUCTION_PLAN_STATUSES = ["Draft", "Approved"] as const;
export type ProductionPlanStatus = (typeof PRODUCTION_PLAN_STATUSES)[number];

export interface ProductionPlan {
  id: string;
  project: string;
  title: string;
  details: string;
  shootDate: string;
  status: ProductionPlanStatus;
}

export const OUTSOURCE_ROLES = ["Cameraman", "Editor", "Actor", "Other"] as const;
export type OutsourceRole = (typeof OUTSOURCE_ROLES)[number];

export interface Outsource {
  id: string;
  role: OutsourceRole;
  name: string;
  contact: string;
  rate: string;
  notes: string;
}

export interface RelationshipNote {
  id: string;
  client: string;
  date: string;
  note: string;
}

export interface Asset {
  id: string;
  name: string;
  value: number;
  purchasedDate: string;
  notes: string;
}

export type MarketingIdeaStatus = "Idea" | "Planned" | "Posted";
export const MARKETING_IDEA_STATUSES: MarketingIdeaStatus[] = ["Idea", "Planned", "Posted"];

export interface MarketingIdea {
  id: string;
  channel: Channel;
  title: string;
  notes: string;
  date: string;
  status: MarketingIdeaStatus;
}

export interface OsState {
  target: Target;
  strategy: CompanyStrategy;
  opportunities: Opportunity[];
  mediums: Medium[];
  experiments: Experiment[];
  playbooks: Playbook[];
  deliverables: Deliverable[];
  clients: Client[];
  moneyEvents: MoneyEvent[];
  captures: Capture[];
  timeline: TimelineEntry[];
  projectTimeline: ProjectMilestone[];
  leads: Lead[];
  clientResearch: ClientResearch[];
  productionPlans: ProductionPlan[];
  outsources: Outsource[];
  relationshipNotes: RelationshipNote[];
  assets: Asset[];
  marketingIdeas: MarketingIdea[];
}

export const EMPTY_STATE: OsState = {
  target: { revenueGoal: 0, newClientsGoal: 0, qualifiedLeadsGoal: 0 },
  strategy: {
    mission: "",
    idealClient: "",
    positioning: "",
    differentiators: "",
    quarterlyPriority: "",
    lastReviewed: "",
  },
  opportunities: [],
  mediums: [],
  experiments: [],
  playbooks: [],
  deliverables: [],
  clients: [],
  moneyEvents: [],
  captures: [],
  timeline: [],
  projectTimeline: [],
  leads: [],
  clientResearch: [],
  productionPlans: [],
  outsources: [],
  relationshipNotes: [],
  assets: [],
  marketingIdeas: [],
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
