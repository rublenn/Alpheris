"use client";

import { PointerEvent as ReactPointerEvent, ReactNode, useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { OsStoreProvider } from "@/lib/os/store";
import { BackNavProvider, useBackNav } from "@/lib/os/backNav";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

const EDGE_ZONE_PX = 24;
const SIDEBAR_WIDTH_PX = 288; // w-72
const OPEN_THRESHOLD = 0.35;
const BACK_THRESHOLD_PX = 90;
const DIRECTION_LOCK_PX = 8;

export default function OsShell({ children }: { children: ReactNode }) {
  return (
    <BackNavProvider>
      <OsStoreProvider>
        <OsShellInner>{children}</OsShellInner>
      </OsStoreProvider>
    </BackNavProvider>
  );
}

function OsShellInner({ children }: { children: ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { canGoBack, goBack } = useBackNav();

  const overlayRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const contentDragRef = useRef<HTMLDivElement>(null);

  const gesture = useRef<{
    mode: "none" | "pending" | "edge" | "back";
    startX: number;
    startY: number;
    dx: number;
    pointerId: number;
  } | null>(null);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // Keep the sidebar's rest transform in sync with settled open/closed state
  // whenever we're not mid-drag (drag handlers own the transform while active).
  useEffect(() => {
    if (gesture.current?.mode === "edge") return;
    if (panelRef.current) panelRef.current.style.transform = mobileOpen ? "translate3d(0,0,0)" : "translate3d(-100%,0,0)";
    if (overlayRef.current) overlayRef.current.style.opacity = mobileOpen ? "1" : "0";
  }, [mobileOpen]);

  function onPointerDown(e: ReactPointerEvent<HTMLDivElement>) {
    if (e.pointerType !== "touch") return;
    if (window.innerWidth >= 768) return; // desktop: gestures never engage
    if (mobileOpen) return; // let the overlay/close-tap handle it while open
    // Capture the pointer so move/up events keep reaching us even if the finger
    // drifts off this element mid-swipe — without this, a fast or wide swipe can
    // stop delivering events entirely, leaving the drag transform stuck on screen.
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // Pointer capture can throw for an already-released pointer; safe to ignore.
    }
    gesture.current = {
      mode: "pending",
      startX: e.clientX,
      startY: e.clientY,
      dx: 0,
      pointerId: e.pointerId,
    };
  }

  function onPointerMove(e: ReactPointerEvent<HTMLDivElement>) {
    const g = gesture.current;
    if (!g || g.pointerId !== e.pointerId) return;
    const dx = e.clientX - g.startX;
    const dy = e.clientY - g.startY;

    if (g.mode === "pending") {
      if (Math.abs(dx) < DIRECTION_LOCK_PX && Math.abs(dy) < DIRECTION_LOCK_PX) return;
      if (Math.abs(dy) > Math.abs(dx) * 1.5) {
        // Predominantly vertical — this is a scroll, not our gesture.
        gesture.current = null;
        return;
      }
      if (g.startX <= EDGE_ZONE_PX && dx > 0) {
        g.mode = "edge";
      } else if (dx > 0) {
        g.mode = "back";
      } else {
        gesture.current = null;
        return;
      }
      document.body.style.userSelect = "none";
    }

    if (g.mode === "edge") {
      e.preventDefault();
      g.dx = Math.max(0, Math.min(dx, SIDEBAR_WIDTH_PX));
      const progress = g.dx / SIDEBAR_WIDTH_PX;
      if (panelRef.current) panelRef.current.style.transform = `translate3d(${g.dx - SIDEBAR_WIDTH_PX}px,0,0)`;
      if (overlayRef.current) overlayRef.current.style.opacity = String(progress);
    } else if (g.mode === "back") {
      e.preventDefault();
      g.dx = Math.max(0, Math.min(dx, 160));
      if (contentDragRef.current) {
        contentDragRef.current.style.transform = `translate3d(${g.dx}px,0,0)`;
        contentDragRef.current.style.opacity = String(1 - g.dx / 320);
      }
    }
  }

  function endGesture(e: ReactPointerEvent<HTMLDivElement>) {
    const g = gesture.current;
    if (!g || g.pointerId !== e.pointerId) return;
    document.body.style.userSelect = "";
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      // Already released — safe to ignore.
    }

    if (g.mode === "edge") {
      const shouldOpen = g.dx / SIDEBAR_WIDTH_PX >= OPEN_THRESHOLD;
      if (panelRef.current) panelRef.current.style.transform = "";
      if (overlayRef.current) overlayRef.current.style.opacity = "";
      setMobileOpen(shouldOpen);
    } else if (g.mode === "back") {
      const shouldGoBack = g.dx >= BACK_THRESHOLD_PX;
      if (contentDragRef.current) {
        contentDragRef.current.style.transition = `transform 220ms var(--ease-smooth), opacity 220ms var(--ease-smooth)`;
        contentDragRef.current.style.transform = shouldGoBack ? "translate3d(100%,0,0)" : "translate3d(0,0,0)";
        contentDragRef.current.style.opacity = shouldGoBack ? "0" : "1";
        window.setTimeout(() => {
          if (!contentDragRef.current) return;
          contentDragRef.current.style.transition = "";
          contentDragRef.current.style.transform = "";
          contentDragRef.current.style.opacity = "";
        }, 240);
      }
      if (shouldGoBack) {
        if (canGoBack) goBack();
        else router.back();
      }
    }

    gesture.current = null;
  }

  return (
    <div className="flex h-dvh bg-background text-foreground">
      <aside className="hidden md:flex w-64 shrink-0 border-r border-border">
        <Sidebar />
      </aside>

      <div
        className={`md:hidden fixed inset-0 z-40 ${mobileOpen ? "pointer-events-auto" : "pointer-events-none"}`}
      >
        <div
          ref={overlayRef}
          className="absolute inset-0 bg-black/60 transition-opacity duration-300 ease-[var(--ease-smooth)]"
          style={{ opacity: mobileOpen ? 1 : 0 }}
          onClick={() => setMobileOpen(false)}
        />
        <div
          ref={panelRef}
          className="absolute left-0 top-0 h-full w-72 border-r border-border bg-background transition-transform duration-300 ease-[var(--ease-smooth)]"
          style={{ transform: mobileOpen ? "translate3d(0,0,0)" : "translate3d(-100%,0,0)", paddingTop: "env(safe-area-inset-top)" }}
        >
          <Sidebar onNavigate={() => setMobileOpen(false)} />
        </div>
      </div>

      <div
        className="flex-1 flex flex-col min-w-0"
        style={{ touchAction: "pan-y", overscrollBehaviorX: "none" }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endGesture}
        onPointerCancel={endGesture}
      >
        <Topbar onMenuClick={() => setMobileOpen(true)} />
        <main className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <div ref={contentDragRef}>
            <div
              key={pathname}
              className="page-transition mx-auto max-w-6xl"
              style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
            >
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
