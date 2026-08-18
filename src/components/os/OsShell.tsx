"use client";

import { ReactNode, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { OsStoreProvider } from "@/lib/os/store";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

export default function OsShell({ children }: { children: ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  return (
    <OsStoreProvider>
      <div className="flex h-dvh bg-background text-foreground">
        <aside className="hidden md:flex w-64 shrink-0 border-r border-border">
          <Sidebar />
        </aside>

        <div
          className={`md:hidden fixed inset-0 z-40 transition-opacity duration-300 ease-[var(--ease-smooth)] ${
            mobileOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
          }`}
        >
          <div className="absolute inset-0 bg-black/60" onClick={() => setMobileOpen(false)} />
          <div
            className={`absolute left-0 top-0 h-full w-72 border-r border-border bg-background transition-transform duration-300 ease-[var(--ease-smooth)] ${
              mobileOpen ? "translate-x-0" : "-translate-x-full"
            }`}
            style={{ paddingTop: "env(safe-area-inset-top)" }}
          >
            <Sidebar onNavigate={() => setMobileOpen(false)} />
          </div>
        </div>

        <div className="flex-1 flex flex-col min-w-0">
          <Topbar onMenuClick={() => setMobileOpen(true)} />
          <main className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
            <div
              key={pathname}
              className="page-transition mx-auto max-w-6xl"
              style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
            >
              {children}
            </div>
          </main>
        </div>
      </div>
    </OsStoreProvider>
  );
}
