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
    description: "Learn the business, problem, audience and aim",
    href: (client) => `/os/working/data?tab=learn&client=${encodeURIComponent(client)}`,
  },
  Workflow: {
    description: "Runs through the playbook to produce scripts",
    href: (client) => `/os/working/data?tab=playbooks&client=${encodeURIComponent(client)}`,
  },
  Production: {
    description: "Equipment and setup for each confirmed script",
    href: (client) => `/os/working/production?focus=production&client=${encodeURIComponent(client)}`,
  },
  "Post-Production": {
    description: "Shooting, editing, finalised — per ad/post",
    href: (client) => `/os/working/production?focus=production&client=${encodeURIComponent(client)}`,
  },
  Deliverables: {
    description: "Delivered, scheduled, posted — per final outcome",
    href: (client) => `/os/working/deliverables?client=${encodeURIComponent(client)}`,
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

export interface ClientLearn {
  id: string;
  client: string;
  business: string;
  problem: string;
  audience: string;
  aim: string;
}

export function createClientLearn(client: string): ClientLearn {
  return { id: newId(), client, business: "", problem: "", audience: "", aim: "" };
}

export const AD_GENRES = [
  "Problem/Awareness",
  "Desire/Outcome",
  "Product/Service Demo",
  "Social Proof",
  "Differentiation",
  "Objection-Killing",
  "Offer/Conversion",
  "Retargeting",
] as const;
export type AdGenre = (typeof AD_GENRES)[number];

export const POST_GENRES = [
  "Carousel (Educational)",
  "High-Quality Photo",
  "Carousel (Trust/Expertise)",
  "Photo + Storytelling Caption",
] as const;
export type PostGenre = (typeof POST_GENRES)[number];

export type CreativeGenre = AdGenre | PostGenre;
export const ALL_CREATIVE_GENRES: CreativeGenre[] = [...AD_GENRES, ...POST_GENRES];

export const AD_QUESTION_FIELDS = [
  { key: "vibe", label: "What's the vibe?", placeholder: "Aesthetic and tonal direction" },
  { key: "why", label: "Why are we making this?", placeholder: "The strategic rationale" },
  { key: "who", label: "Who are we making it for?", placeholder: "Who exactly this is for" },
  { key: "whyWillItWork", label: "Why will it work?", placeholder: "The effectiveness hypothesis" },
  { key: "emotion", label: "What emotion should it trigger?", placeholder: "The psychological response it triggers" },
  { key: "offer", label: "What are we offering?", placeholder: "The value proposition" },
  { key: "whyShareable", label: "Why is it shareable?", placeholder: "Viral / distribution potential" },
] as const;
export type AdQuestionKey = (typeof AD_QUESTION_FIELDS)[number]["key"];

export const AMPLIFIER_FIELDS = [
  { key: "creativity", label: "What's the creativity?", placeholder: "The novel hook or unexpected approach" },
  { key: "hypeCreation", label: "What's the hype creation?", placeholder: "What makes people rewatch it" },
  { key: "neuromarketing", label: "What's the neuromarketing?", placeholder: "Curiosity, social proof, reciprocity triggers" },
] as const;
export type AmplifierKey = (typeof AMPLIFIER_FIELDS)[number]["key"];

export interface CreativeScript {
  id: string;
  client: string;
  kind: "Ad" | "Post";
  genre: CreativeGenre;
  name: string;
  script: string;
  vibe: string;
  why: string;
  who: string;
  whyWillItWork: string;
  emotion: string;
  offer: string;
  whyShareable: string;
  creativity: string;
  hypeCreation: string;
  neuromarketing: string;
  equipment: string[];
  shooting: boolean;
  editing: boolean;
  finalised: boolean;
  delivered: boolean;
  scheduled: boolean;
  posted: boolean;
  createdAt: string;
}

export function emptyCreativeScript(client: string, kind: "Ad" | "Post", genre: CreativeGenre): CreativeScript {
  return {
    id: newId(),
    client,
    kind,
    genre,
    name: "",
    script: "",
    vibe: "",
    why: "",
    who: "",
    whyWillItWork: "",
    emotion: "",
    offer: "",
    whyShareable: "",
    creativity: "",
    hypeCreation: "",
    neuromarketing: "",
    equipment: [],
    shooting: false,
    editing: false,
    finalised: false,
    delivered: false,
    scheduled: false,
    posted: false,
    createdAt: todayISO(),
  };
}

export function normalizeCreativeScript(s: Partial<CreativeScript>): CreativeScript {
  const empty = emptyCreativeScript(s.client ?? "", s.kind ?? "Ad", s.genre ?? AD_GENRES[0]);
  return {
    ...empty,
    ...s,
    id: s.id ?? empty.id,
    equipment: Array.isArray(s.equipment) ? s.equipment : empty.equipment,
    createdAt: s.createdAt ?? empty.createdAt,
  };
}

export const DEFAULT_EQUIPMENT: Record<CreativeGenre, string[]> = {
  "Problem/Awareness": ["Camera", "Lav mic", "Tripod"],
  "Desire/Outcome": ["Camera", "Gimbal", "Lifestyle b-roll props"],
  "Product/Service Demo": ["Camera", "Tripod", "Product samples", "Macro lens"],
  "Social Proof": ["Camera", "Lav mic", "Client testimonial release form"],
  Differentiation: ["Camera", "Tripod", "Comparison props/graphics"],
  "Objection-Killing": ["Camera", "Lav mic", "Whiteboard or graphics"],
  "Offer/Conversion": ["Camera", "Tripod", "Countdown/offer graphics"],
  Retargeting: ["Camera", "Existing footage library"],
  "Carousel (Educational)": ["Camera or phone", "Design template"],
  "High-Quality Photo": ["Camera", "Tripod", "Lighting kit"],
  "Carousel (Trust/Expertise)": ["Camera", "Design template", "Client quotes/photos"],
  "Photo + Storytelling Caption": ["Camera", "Notebook for caption draft"],
};

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
  clients: Client[];
  moneyEvents: MoneyEvent[];
  captures: Capture[];
  timeline: TimelineEntry[];
  clientTimelines: ClientTimeline[];
  leads: Lead[];
  clientLearn: ClientLearn[];
  creativeScripts: CreativeScript[];
  equipmentDefaults: Record<string, string[]>;
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
  clients: [],
  moneyEvents: [],
  captures: [],
  timeline: [],
  clientTimelines: [],
  leads: [],
  clientLearn: [],
  creativeScripts: [],
  equipmentDefaults: { ...DEFAULT_EQUIPMENT },
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
