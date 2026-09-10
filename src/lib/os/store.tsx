"use client";

import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { doc, DocumentSnapshot, getDoc, onSnapshot, setDoc } from "firebase/firestore";
import { ensureAnonymousAuth, getDb } from "./firebase";
import {
  Asset,
  Capture,
  Client,
  ClientLearn,
  ClientTimeline,
  ClientTimelineStage,
  ClientTimelineStep,
  CompanyStrategy,
  CreativeScript,
  createClientLearn,
  createClientRecord,
  createClientTimeline,
  EMPTY_STATE,
  Experiment,
  ImprovementNote,
  Lead,
  MarketingIdea,
  Medium,
  MonthlyReport,
  MoneyEvent,
  normalizeCreativeScript,
  normalizeLead,
  normalizeMonthlyReport,
  normalizePostPerformance,
  OsState,
  Playbook,
  PostPerformance,
  ProblemSolution,
  Target,
  TimelineEntry,
} from "./types";

const STORAGE_KEY = "alperis:os:v1";
const UPDATED_AT_KEY = "alperis:os:v1:updatedAt";
const SYNC_DOC_PATH = ["alperisOS", "state"] as const;
const FIRESTORE_WRITE_DEBOUNCE_MS = 500;

function normalizeState(raw: Partial<OsState>): OsState {
  const parsed = { ...EMPTY_STATE, ...raw };
  parsed.leads = (parsed.leads ?? []).map(normalizeLead);
  parsed.creativeScripts = (parsed.creativeScripts ?? []).map(normalizeCreativeScript);
  parsed.postPerformance = (parsed.postPerformance ?? []).map(normalizePostPerformance);
  parsed.monthlyReports = (parsed.monthlyReports ?? []).map(normalizeMonthlyReport);
  const missingClients = (parsed.leads ?? [])
    .filter((l) => l.stage === "Client" && !parsed.clients.some((c) => c.name === l.name))
    .map((l) => createClientRecord(l.name));
  if (missingClients.length > 0) parsed.clients = [...parsed.clients, ...missingClients];
  return parsed;
}

function readLocalState(): OsState {
  if (typeof window === "undefined") return EMPTY_STATE;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY_STATE;
    return normalizeState(JSON.parse(raw) as Partial<OsState>);
  } catch {
    return EMPTY_STATE;
  }
}

function readLocalUpdatedAt(): number {
  if (typeof window === "undefined") return 0;
  return Number(window.localStorage.getItem(UPDATED_AT_KEY) ?? 0) || 0;
}

function writeLocalState(state: OsState, updatedAt: number) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  window.localStorage.setItem(UPDATED_AT_KEY, String(updatedAt));
}

interface SyncDocShape {
  data: Partial<OsState>;
  updatedAt: number;
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

  addClientLearn: (r: ClientLearn) => void;
  updateClientLearn: (id: string, patch: Partial<ClientLearn>) => void;
  removeClientLearn: (id: string) => void;

  addCreativeScript: (s: CreativeScript) => void;
  updateCreativeScript: (id: string, patch: Partial<CreativeScript>) => void;
  removeCreativeScript: (id: string) => void;

  setEquipmentDefault: (genre: string, equipment: string[]) => void;

  addProblemSolution: (p: ProblemSolution) => void;
  updateProblemSolution: (id: string, patch: Partial<ProblemSolution>) => void;
  removeProblemSolution: (id: string) => void;

  addImprovementNote: (n: ImprovementNote) => void;
  updateImprovementNote: (id: string, patch: Partial<ImprovementNote>) => void;
  removeImprovementNote: (id: string) => void;

  addPostPerformance: (p: PostPerformance) => void;
  updatePostPerformance: (id: string, patch: Partial<PostPerformance>) => void;
  removePostPerformance: (id: string) => void;

  addMonthlyReport: (r: MonthlyReport) => void;
  updateMonthlyReport: (id: string, patch: Partial<MonthlyReport>) => void;
  removeMonthlyReport: (id: string) => void;

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

  // Tracks the freshness of `state` for last-writer-wins reconciliation against
  // the shared Firestore document, and guards against a stale remote snapshot
  // clobbering a newer local edit that hasn't been confirmed by the server yet.
  const localUpdatedAtRef = useRef(0);
  const writeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cloudReadyRef = useRef(false);

  const pushToCloud = useCallback((next: OsState, updatedAt: number) => {
    if (!cloudReadyRef.current) return;
    if (writeTimerRef.current) clearTimeout(writeTimerRef.current);
    writeTimerRef.current = setTimeout(() => {
      const payload: SyncDocShape = { data: next, updatedAt };
      setDoc(doc(getDb(), ...SYNC_DOC_PATH), payload).catch((err) => {
        console.warn("Alpheris OS: cloud sync write failed, staying local-only for now.", err);
      });
    }, FIRESTORE_WRITE_DEBOUNCE_MS);
  }, []);

  const setState = useCallback(
    (updater: (prev: OsState) => OsState) => {
      setStateRaw((prev) => {
        const next = updater(prev);
        const updatedAt = Date.now();
        localUpdatedAtRef.current = updatedAt;
        writeLocalState(next, updatedAt);
        pushToCloud(next, updatedAt);
        return next;
      });
    },
    [pushToCloud]
  );

  /** Applies state that arrived from Firestore (our own confirmed write, or another
   * device's), without re-pushing it back up. */
  const applyRemote = useCallback((raw: Partial<OsState>, updatedAt: number) => {
    const next = normalizeState(raw);
    localUpdatedAtRef.current = updatedAt;
    writeLocalState(next, updatedAt);
    setStateRaw(next);
  }, []);

  useEffect(() => {
    // Paint immediately from whatever's cached locally so the app never blocks on a
    // network round trip, then reconcile with the shared cloud copy underneath.
    const local = readLocalState();
    const localUpdatedAt = readLocalUpdatedAt();
    localUpdatedAtRef.current = localUpdatedAt;
    setStateRaw(local);
    setHydrated(true);

    let unsubscribeSnapshot: (() => void) | null = null;
    let cancelled = false;

    (async () => {
      try {
        await ensureAnonymousAuth();
        if (cancelled) return;
        const db = getDb();
        const docRef = doc(db, ...SYNC_DOC_PATH);

        const snap = await getDoc(docRef);
        if (cancelled) return;

        if (snap.exists()) {
          const remote = snap.data() as SyncDocShape;
          if ((remote.updatedAt ?? 0) > localUpdatedAtRef.current) {
            applyRemote(remote.data ?? {}, remote.updatedAt);
          } else if ((remote.updatedAt ?? 0) < localUpdatedAtRef.current) {
            // This device has newer local edits (e.g. made while offline) — push them up.
            cloudReadyRef.current = true;
            await setDoc(docRef, { data: local, updatedAt: localUpdatedAtRef.current } satisfies SyncDocShape);
          }
        } else {
          // First time this project's cloud document is created — seed it from
          // whatever this device already has (or a clean slate).
          const seedAt = localUpdatedAtRef.current || Date.now();
          localUpdatedAtRef.current = seedAt;
          writeLocalState(local, seedAt);
          cloudReadyRef.current = true;
          await setDoc(docRef, { data: local, updatedAt: seedAt } satisfies SyncDocShape);
        }

        cloudReadyRef.current = true;

        unsubscribeSnapshot = onSnapshot(docRef, (snapshot: DocumentSnapshot) => {
          if (snapshot.metadata.hasPendingWrites) return; // our own optimistic echo
          const remote = snapshot.data() as SyncDocShape | undefined;
          if (!remote) return;
          if ((remote.updatedAt ?? 0) > localUpdatedAtRef.current) {
            applyRemote(remote.data ?? {}, remote.updatedAt);
          }
        });
      } catch (err) {
        console.warn("Alpheris OS: cloud sync unavailable, continuing with this device's local data only.", err);
      }
    })();

    return () => {
      cancelled = true;
      unsubscribeSnapshot?.();
      if (writeTimerRef.current) clearTimeout(writeTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const med = useMemo(() => collection(setState, "mediums"), [setState]);
  const exp = useMemo(() => collection(setState, "experiments"), [setState]);
  const play = useMemo(() => collection(setState, "playbooks"), [setState]);
  const cli = useMemo(() => collection(setState, "clients"), [setState]);
  const money = useMemo(() => collection(setState, "moneyEvents"), [setState]);
  const cap = useMemo(() => collection(setState, "captures"), [setState]);
  const tl = useMemo(() => collection(setState, "timeline"), [setState]);
  const ct = useMemo(() => collection(setState, "clientTimelines"), [setState]);
  const lead = useMemo(() => collection(setState, "leads"), [setState]);
  const learn = useMemo(() => collection(setState, "clientLearn"), [setState]);
  const script = useMemo(() => collection(setState, "creativeScripts"), [setState]);
  const probSol = useMemo(() => collection(setState, "problemSolutions"), [setState]);
  const improveNote = useMemo(() => collection(setState, "improvementNotes"), [setState]);
  const postPerf = useMemo(() => collection(setState, "postPerformance"), [setState]);
  const monthlyReport = useMemo(() => collection(setState, "monthlyReports"), [setState]);
  const asset = useMemo(() => collection(setState, "assets"), [setState]);
  const idea = useMemo(() => collection(setState, "marketingIdeas"), [setState]);

  const addLeadAndMaybeCreateTimeline = useCallback(
    (newLead: Lead) => {
      setState((prev) => {
        const leads = [...prev.leads, newLead];
        if (newLead.stage !== "Client") return { ...prev, leads };
        const next: OsState = { ...prev, leads };
        if (!prev.clientTimelines.some((t) => t.client === newLead.name)) {
          next.clientTimelines = [...prev.clientTimelines, createClientTimeline(newLead.name)];
        }
        if (!prev.clientLearn.some((l) => l.client === newLead.name)) {
          next.clientLearn = [...prev.clientLearn, createClientLearn(newLead.name)];
        }
        if (!prev.clients.some((c) => c.name === newLead.name)) {
          next.clients = [...prev.clients, createClientRecord(newLead.name)];
        }
        return next;
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
        const next: OsState = { ...prev, leads };
        if (!prev.clientTimelines.some((t) => t.client === clientName)) {
          next.clientTimelines = [...prev.clientTimelines, createClientTimeline(clientName)];
        }
        if (!prev.clientLearn.some((l) => l.client === clientName)) {
          next.clientLearn = [...prev.clientLearn, createClientLearn(clientName)];
        }
        if (!prev.clients.some((c) => c.name === clientName)) {
          next.clients = [...prev.clients, createClientRecord(clientName)];
        }
        return next;
      });
    },
    [setState]
  );

  const setEquipmentDefault = useCallback(
    (genre: string, equipment: string[]) => {
      setState((prev) => ({
        ...prev,
        equipmentDefaults: { ...prev.equipmentDefaults, [genre]: equipment },
      }));
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

    addClientLearn: learn.add,
    updateClientLearn: learn.update,
    removeClientLearn: learn.remove,

    addCreativeScript: script.add,
    updateCreativeScript: script.update,
    removeCreativeScript: script.remove,

    setEquipmentDefault,

    addProblemSolution: probSol.add,
    updateProblemSolution: probSol.update,
    removeProblemSolution: probSol.remove,

    addImprovementNote: improveNote.add,
    updateImprovementNote: improveNote.update,
    removeImprovementNote: improveNote.remove,

    addPostPerformance: postPerf.add,
    updatePostPerformance: postPerf.update,
    removePostPerformance: postPerf.remove,

    addMonthlyReport: monthlyReport.add,
    updateMonthlyReport: monthlyReport.update,
    removeMonthlyReport: monthlyReport.remove,

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
