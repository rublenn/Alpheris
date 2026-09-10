"use client";

import { createContext, ReactNode, useCallback, useContext, useEffect, useRef, useState } from "react";

interface BackNavContextValue {
  registerHandler: (handler: (() => void) | null) => void;
  canGoBack: boolean;
  goBack: () => void;
}

const BackNavContext = createContext<BackNavContextValue | null>(null);

export function BackNavProvider({ children }: { children: ReactNode }) {
  const handlerRef = useRef<(() => void) | null>(null);
  const [hasHandler, setHasHandler] = useState(false);

  const registerHandler = useCallback((handler: (() => void) | null) => {
    handlerRef.current = handler;
    setHasHandler(handler !== null);
  }, []);

  const goBack = useCallback(() => {
    handlerRef.current?.();
  }, []);

  return (
    <BackNavContext.Provider value={{ registerHandler, canGoBack: hasHandler, goBack }}>
      {children}
    </BackNavContext.Provider>
  );
}

/** Pages with an internal drill-down stack register their "go up one level" handler here.
 * Pass null when already at the page's root level, so the global back gesture falls through
 * to real route navigation instead. */
export function useRegisterBack(handler: (() => void) | null) {
  const ctx = useContext(BackNavContext);
  useEffect(() => {
    ctx?.registerHandler(handler);
    return () => ctx?.registerHandler(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [handler]);
}

export function useBackNav(): { canGoBack: boolean; goBack: () => void } {
  const ctx = useContext(BackNavContext);
  if (!ctx) throw new Error("useBackNav must be used within BackNavProvider");
  return { canGoBack: ctx.canGoBack, goBack: ctx.goBack };
}
