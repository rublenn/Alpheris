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
  Capture,
  Client,
  CompanyStrategy,
  Deliverable,
  EMPTY_STATE,
  Experiment,
  Medium,
  MoneyEvent,
  Opportunity,
  OsState,
  Playbook,
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

  addOpportunity: (o: Opportunity) => void;
  updateOpportunity: (id: string, patch: Partial<Opportunity>) => void;
  removeOpportunity: (id: string) => void;

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

  const opp = useMemo(() => collection(setState, "opportunities"), [setState]);
  const med = useMemo(() => collection(setState, "mediums"), [setState]);
  const exp = useMemo(() => collection(setState, "experiments"), [setState]);
  const play = useMemo(() => collection(setState, "playbooks"), [setState]);
  const del = useMemo(() => collection(setState, "deliverables"), [setState]);
  const cli = useMemo(() => collection(setState, "clients"), [setState]);
  const money = useMemo(() => collection(setState, "moneyEvents"), [setState]);
  const cap = useMemo(() => collection(setState, "captures"), [setState]);
  const tl = useMemo(() => collection(setState, "timeline"), [setState]);

  const value: OsStore = {
    state,
    hydrated,
    setTarget: (target) => setState((prev) => ({ ...prev, target })),
    setStrategy: (strategy) => setState((prev) => ({ ...prev, strategy })),

    addOpportunity: opp.add,
    updateOpportunity: opp.update,
    removeOpportunity: opp.remove,

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
  };

  return <OsContext.Provider value={value}>{children}</OsContext.Provider>;
}

export function useOsStore(): OsStore {
  const ctx = useContext(OsContext);
  if (!ctx) throw new Error("useOsStore must be used within OsStoreProvider");
  return ctx;
}
