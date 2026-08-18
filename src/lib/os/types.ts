export const SOURCES = [
  "Referral",
  "Outbound",
  "Inbound",
  "Partner",
  "Event",
  "Other",
] as const;
export type Source = (typeof SOURCES)[number];

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

export interface TimelineEntry {
  id: string;
  title: string;
  date: string;
  done: boolean;
}

export const CLIENT_TIMELINE_STAGES = [
  "Client",
  "Strategy",
  "Workflow",
  "Production",
  "Post-Production",
  "Deliverables",
] as const;
export type ClientTimelineStage = (typeof CLIENT_TIMELINE_STAGES)[number];

export const CLIENT_TIMELINE_STAGE_INFO: Record<
  ClientTimelineStage,
  { description: string; href: (client: string) => string }
> = {
  Client: {
    description: "Onboarded and kicked off",
    href: (client) => `/os/operations/client-success?client=${encodeURIComponent(client)}`,
  },
  Strategy: {
    description: "Research + client data",
    href: (client) => `/os/working/strategies?tab=research&client=${encodeURIComponent(client)}`,
  },
  Workflow: {
    description: "Runs through the playbook to produce scripts",
    href: (client) => `/os/working/strategies?tab=playbooks&client=${encodeURIComponent(client)}`,
  },
  Production: {
    description: "Production requirements set",
    href: (client) => `/os/working/production?focus=plan&client=${encodeURIComponent(client)}`,
  },
  "Post-Production": {
    description: "Editing, finalizing, captions, tags",
    href: (client) => `/os/working/production?focus=board&client=${encodeURIComponent(client)}`,
  },
  Deliverables: {
    description: "Content calendar, scheduling, posting",
    href: (client) => `/os/working/deliverables?tab=calendar&client=${encodeURIComponent(client)}`,
  },
};

export interface ClientTimelineStep {
  stage: ClientTimelineStage;
  date: string;
  done: boolean;
}

export interface ClientTimeline {
  id: string;
  client: string;
  createdAt: string;
  steps: ClientTimelineStep[];
}

const STAGE_OFFSET_DAYS: Record<ClientTimelineStage, number> = {
  Client: 0,
  Strategy: 2,
  Workflow: 5,
  Production: 9,
  "Post-Production": 14,
  Deliverables: 18,
};

export function createClientTimeline(client: string): ClientTimeline {
  const base = new Date(todayISO());
  return {
    id: newId(),
    client,
    createdAt: todayISO(),
    steps: CLIENT_TIMELINE_STAGES.map((stage) => {
      const d = new Date(base);
      d.setDate(d.getDate() + STAGE_OFFSET_DAYS[stage]);
      return { stage, date: d.toISOString().slice(0, 10), done: stage === "Client" };
    }),
  };
}

export const LEAD_STAGES = ["Lead", "InTalk", "Client", "FollowUp"] as const;
export type LeadStage = (typeof LEAD_STAGES)[number];

export const LEAD_STAGE_LABELS: Record<LeadStage, string> = {
  Lead: "Lead",
  InTalk: "In Talk",
  Client: "Client",
  FollowUp: "Follow Up",
};

export interface Lead {
  id: string;
  name: string;
  source: Source;
  contact: string;
  instagramFollowers: number;
  address: string;
  stage: LeadStage;
  value: number;
  nextAction: string;
  nextActionDate: string;
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
  mediums: Medium[];
  experiments: Experiment[];
  playbooks: Playbook[];
  deliverables: Deliverable[];
  clients: Client[];
  moneyEvents: MoneyEvent[];
  captures: Capture[];
  timeline: TimelineEntry[];
  clientTimelines: ClientTimeline[];
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
  mediums: [],
  experiments: [],
  playbooks: [],
  deliverables: [],
  clients: [],
  moneyEvents: [],
  captures: [],
  timeline: [],
  clientTimelines: [],
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
