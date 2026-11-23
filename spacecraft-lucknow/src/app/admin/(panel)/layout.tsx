import Link from "next/link";
import { Suspense } from "react";
import { logoutAction } from "@/actions/admin";
import { AdminNav, AdminNavLive } from "./AdminNav";

/** Admin panel frame. Each page checks the login itself (requireAdmin). */
export default function PanelLayout({ children }: LayoutProps<"/admin">) {
  return (
    <div className="lg:flex">
      <aside className="border-b border-line bg-white lg:sticky lg:top-0 lg:h-screen lg:w-60 lg:shrink-0 lg:border-b-0 lg:border-r">
        <div className="flex items-center justify-between px-5 py-5 lg:block">
          <Link href="/admin" className="display text-[1.6rem]">Space Craft</Link>
          <p className="hidden text-[10px] font-semibold uppercase tracking-[0.2em] text-accent-deep lg:mt-1 lg:block">Admin panel</p>
          <form action={logoutAction} className="lg:hidden">
            <button className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted hover:text-ink">Log out</button>
          </form>
        </div>
        <Suspense fallback={<AdminNav path="" />}>
          <AdminNavLive />
        </Suspense>
        <div className="hidden px-5 pt-6 lg:block">
          <Link href="/" target="_blank" className="block text-[12px] text-muted hover:text-ink">View website ↗</Link>
          <form action={logoutAction} className="mt-4">
            <button className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted hover:text-ink">Log out</button>
          </form>
        </div>
      </aside>
      <main className="min-w-0 flex-1 px-5 py-8 sm:px-8 lg:px-12 lg:py-10">
        <Suspense fallback={<p className="text-muted">Loading…</p>}>{children}</Suspense>
      </main>
    </div>
  );
}
