"use client";

import { useCallback, useEffect, useState } from "react";
import { IntakeForm, OutputKind, STARTING_CREDITS } from "./types";

const INTAKE_KEY = "alperis:intake";
const CREDITS_KEY = "alperis:credits";
const UNLOCKED_KEY = "alperis:unlocked";

const EMPTY_INTAKE: IntakeForm = {
  businessName: "",
  industry: "",
  problem: "",
  goals: "",
  location: "",
  monthlyBudget: "",
};

function readJSON<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function useAppState() {
  const [intake, setIntakeState] = useState<IntakeForm>(EMPTY_INTAKE);
  const [credits, setCreditsState] = useState<number>(STARTING_CREDITS);
  const [unlocked, setUnlockedState] = useState<Partial<Record<OutputKind, string>>>({});
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setIntakeState(readJSON(INTAKE_KEY, EMPTY_INTAKE));
    setCreditsState(readJSON(CREDITS_KEY, STARTING_CREDITS));
    setUnlockedState(readJSON(UNLOCKED_KEY, {}));
    setHydrated(true);
  }, []);

  const saveIntake = useCallback((form: IntakeForm) => {
    setIntakeState(form);
    window.localStorage.setItem(INTAKE_KEY, JSON.stringify(form));
    // Starting a new intake resets credits and previously unlocked outputs.
    setCreditsState(STARTING_CREDITS);
    window.localStorage.setItem(CREDITS_KEY, JSON.stringify(STARTING_CREDITS));
    setUnlockedState({});
    window.localStorage.setItem(UNLOCKED_KEY, JSON.stringify({}));
  }, []);

  const spendCredit = useCallback(
    (kind: OutputKind, content: string) => {
      setCreditsState((prev) => {
        const next = Math.max(prev - 1, 0);
        window.localStorage.setItem(CREDITS_KEY, JSON.stringify(next));
        return next;
      });
      setUnlockedState((prev) => {
        const next = { ...prev, [kind]: content };
        window.localStorage.setItem(UNLOCKED_KEY, JSON.stringify(next));
        return next;
      });
    },
    []
  );

  return { intake, credits, unlocked, hydrated, saveIntake, spendCredit };
}
