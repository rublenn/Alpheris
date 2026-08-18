"use client";

import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  Asset,
  Capture,
  Client,
  ClientResearch,
  ClientTimeline,
  ClientTimelineStage,
  ClientTimelineStep,
  CompanyStrategy,
  createClientTimeline,
  Deliverable,
  EMPTY_STATE,
  Experiment,
  Lead,
  MarketingIdea,
  Medium,
  MoneyEvent,
  OsState,
  Outsource,
  Playbook,
  ProductionPlan,
  RelationshipNote,
  Target,
  TimelineEntry,
} from "./types";

const STORAGE_KEY = "alperis:os:v1";

function readState(): OsState {
  if (typeof window === "undefined") return EMPTY_STATE;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY_STATE;
    return { ...EMPTY_STATE, ...(JSON.parse(raw) as Partial<OsState>) };
  } catch {
    return EMPTY_STATE;
  }
}

function writeState(state: OsState) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

interface OsStore {
  state: OsState;
  hydrated: boolean;

  setTarget: (target: Target) => void;
  setStrategy: (strategy: CompanyStrategy) => void;

  addMedium: (m: Medium) => void;
  updateMedium: (id: string, patch: Partial<Medium>) => void;
  removeMedium: (id: string) => void;

  addExperiment: (e: Experiment) => void;
  updateExperiment: (id: string, patch: Partial<Experiment>) => void;
  removeExperiment: (id: string) => void;

  addPlaybook: (p: Playbook) => void;
  updatePlaybook: (id: string, patch: Partial<Playbook>) => void;
  removePlaybook: (id: string) => void;

  addDeliverable: (d: Deliverable) => void;
  updateDeliverable: (id: string, patch: Partial<Deliverable>) => void;
  removeDeliverable: (id: string) => void;

  addClient: (c: Client) => void;
  updateClient: (id: string, patch: Partial<Client>) => void;
  removeClient: (id: string) => void;

  addMoneyEvent: (m: MoneyEvent) => void;
  updateMoneyEvent: (id: string, patch: Partial<MoneyEvent>) => void;
  removeMoneyEvent: (id: string) => void;

  addCapture: (c: Capture) => void;
  removeCapture: (id: string) => void;

  addTimelineEntry: (t: TimelineEntry) => void;
  updateTimelineEntry: (id: string, patch: Partial<TimelineEntry>) => void;
  removeTimelineEntry: (id: string) => void;

  addClientTimeline: (t: ClientTimeline) => void;
  removeClientTimeline: (id: string) => void;
  updateClientTimelineStep: (timelineId: string, stage: ClientTimelineStage, patch: Partial<ClientTimelineStep>) => void;

  addLead: (l: Lead) => void;
  updateLead: (id: string, patch: Partial<Lead>) => void;
  removeLead: (id: string) => void;

  addClientResearch: (r: ClientResearch) => void;
  updateClientResearch: (id: string, patch: Partial<ClientResearch>) => void;
  removeClientResearch: (id: string) => void;

  addProductionPlan: (p: ProductionPlan) => void;
  updateProductionPlan: (id: string, patch: Partial<ProductionPlan>) => void;
  removeProductionPlan: (id: string) => void;

  addOutsource: (o: Outsource) => void;
  updateOutsource: (id: string, patch: Partial<Outsource>) => void;
  removeOutsource: (id: string) => void;

  addRelationshipNote: (n: RelationshipNote) => void;
  removeRelationshipNote: (id: string) => void;

  addAsset: (a: Asset) => void;
  updateAsset: (id: string, patch: Partial<Asset>) => void;
  removeAsset: (id: string) => void;

  addMarketingIdea: (m: MarketingIdea) => void;
  updateMarketingIdea: (id: string, patch: Partial<MarketingIdea>) => void;
  removeMarketingIdea: (id: string) => void;
}

const OsContext = createContext<OsStore | null>(null);

type ArrayKeys = {
  [K in keyof OsState]: OsState[K] extends { id: string }[] ? K : never;
}[keyof OsState];

function collection<K extends ArrayKeys>(
  setState: (updater: (prev: OsState) => OsState) => void,
  key: K
) {
  type Item = OsState[K][number];
  return {
    add: (item: Item) =>
      setState((prev) => ({ ...prev, [key]: [...prev[key], item] })),
    update: (id: string, patch: Partial<Item>) =>
      setState((prev) => ({
        ...prev,
        [key]: (prev[key] as Item[]).map((it) => (it.id === id ? { ...it, ...patch } : it)),
      })),
    remove: (id: string) =>
      setState((prev) => ({
        ...prev,
        [key]: (prev[key] as Item[]).filter((it) => it.id !== id),
      })),
  };
}

export function OsStoreProvider({ children }: { children: ReactNode }) {
  const [state, setStateRaw] = useState<OsState>(EMPTY_STATE);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setStateRaw(readState());
    setHydrated(true);
  }, []);

  const setState = useCallback((updater: (prev: OsState) => OsState) => {
    setStateRaw((prev) => {
      const next = updater(prev);
      writeState(next);
      return next;
    });
  }, []);

  const med = useMemo(() => collection(setState, "mediums"), [setState]);
  const exp = useMemo(() => collection(setState, "experiments"), [setState]);
  const play = useMemo(() => collection(setState, "playbooks"), [setState]);
  const del = useMemo(() => collection(setState, "deliverables"), [setState]);
  const cli = useMemo(() => collection(setState, "clients"), [setState]);
  const money = useMemo(() => collection(setState, "moneyEvents"), [setState]);
  const cap = useMemo(() => collection(setState, "captures"), [setState]);
  const tl = useMemo(() => collection(setState, "timeline"), [setState]);
  const ct = useMemo(() => collection(setState, "clientTimelines"), [setState]);
  const lead = useMemo(() => collection(setState, "leads"), [setState]);
  const research = useMemo(() => collection(setState, "clientResearch"), [setState]);
  const prodPlan = useMemo(() => collection(setState, "productionPlans"), [setState]);
  const outsource = useMemo(() => collection(setState, "outsources"), [setState]);
  const relNote = useMemo(() => collection(setState, "relationshipNotes"), [setState]);
  const asset = useMemo(() => collection(setState, "assets"), [setState]);
  const idea = useMemo(() => collection(setState, "marketingIdeas"), [setState]);

  const addLeadAndMaybeCreateTimeline = useCallback(
    (newLead: Lead) => {
      setState((prev) => {
        const leads = [...prev.leads, newLead];
        if (newLead.stage !== "Client") return { ...prev, leads };
        const alreadyHasTimeline = prev.clientTimelines.some((t) => t.client === newLead.name);
        if (alreadyHasTimeline) return { ...prev, leads };
        return {
          ...prev,
          leads,
          clientTimelines: [...prev.clientTimelines, createClientTimeline(newLead.name)],
        };
      });
    },
    [setState]
  );

  const updateLeadAndMaybeCreateTimeline = useCallback(
    (id: string, patch: Partial<Lead>) => {
      setState((prev) => {
        const target = prev.leads.find((l) => l.id === id);
        const leads = prev.leads.map((l) => (l.id === id ? { ...l, ...patch } : l));
        const becomingClient = !!target && target.stage !== "Client" && patch.stage === "Client";
        if (!becomingClient) return { ...prev, leads };
        const clientName = patch.name ?? target!.name;
        const alreadyHasTimeline = prev.clientTimelines.some((t) => t.client === clientName);
        if (alreadyHasTimeline) return { ...prev, leads };
        return {
          ...prev,
          leads,
          clientTimelines: [...prev.clientTimelines, createClientTimeline(clientName)],
        };
      });
    },
    [setState]
  );

  const updateClientTimelineStep = useCallback(
    (timelineId: string, stage: ClientTimelineStage, patch: Partial<ClientTimelineStep>) => {
      setState((prev) => ({
        ...prev,
        clientTimelines: prev.clientTimelines.map((t) =>
          t.id === timelineId
            ? { ...t, steps: t.steps.map((s) => (s.stage === stage ? { ...s, ...patch } : s)) }
            : t
        ),
      }));
    },
    [setState]
  );

  const value: OsStore = {
    state,
    hydrated,
    setTarget: (target) => setState((prev) => ({ ...prev, target })),
    setStrategy: (strategy) => setState((prev) => ({ ...prev, strategy })),

    addMedium: med.add,
    updateMedium: med.update,
    removeMedium: med.remove,

    addExperiment: exp.add,
    updateExperiment: exp.update,
    removeExperiment: exp.remove,

    addPlaybook: play.add,
    updatePlaybook: play.update,
    removePlaybook: play.remove,

    addDeliverable: del.add,
    updateDeliverable: del.update,
    removeDeliverable: del.remove,

    addClient: cli.add,
    updateClient: cli.update,
    removeClient: cli.remove,

    addMoneyEvent: money.add,
    updateMoneyEvent: money.update,
    removeMoneyEvent: money.remove,

    addCapture: cap.add,
    removeCapture: cap.remove,

    addTimelineEntry: tl.add,
    updateTimelineEntry: tl.update,
    removeTimelineEntry: tl.remove,

    addClientTimeline: ct.add,
    removeClientTimeline: ct.remove,
    updateClientTimelineStep,

    addLead: addLeadAndMaybeCreateTimeline,
    updateLead: updateLeadAndMaybeCreateTimeline,
    removeLead: lead.remove,

    addClientResearch: research.add,
    updateClientResearch: research.update,
    removeClientResearch: research.remove,

    addProductionPlan: prodPlan.add,
    updateProductionPlan: prodPlan.update,
    removeProductionPlan: prodPlan.remove,

    addOutsource: outsource.add,
    updateOutsource: outsource.update,
    removeOutsource: outsource.remove,

    addRelationshipNote: relNote.add,
    removeRelationshipNote: relNote.remove,

    addAsset: asset.add,
    updateAsset: asset.update,
    removeAsset: asset.remove,

    addMarketingIdea: idea.add,
    updateMarketingIdea: idea.update,
    removeMarketingIdea: idea.remove,
  };

  return <OsContext.Provider value={value}>{children}</OsContext.Provider>;
}

export function useOsStore(): OsStore {
  const ctx = useContext(OsContext);
  if (!ctx) throw new Error("useOsStore must be used within OsStoreProvider");
  return ctx;
}
