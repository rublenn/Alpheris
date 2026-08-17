"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ReactNode } from "react";
import {
  IconClientSuccess,
  IconCompanyStrategy,
  IconFinance,
  IconFollowUp,
  IconLeadGen,
  IconMarketing,
  IconOverview,
  IconProduction,
  IconProjectTimeline,
  IconSales,
  IconStrategies,
  IconDeliverables,
  IconTimeline,
} from "./icons";

type Lens = "leadership" | "sales" | "working" | "operations";

interface NavItem {
  href: string;
  label: string;
  icon: (props: { className?: string }) => ReactNode;
}

interface NavGroup {
  lens: Lens;
  label: string;
  items: NavItem[];
}

const GROUPS: NavGroup[] = [
  {
    lens: "leadership",
    label: "Leadership",
    items: [
      { href: "/os/leadership/strategy", label: "Company Strategy", icon: IconCompanyStrategy },
      { href: "/os/leadership/timeline", label: "Business Timeline", icon: IconTimeline },
      { href: "/os/leadership/project-timeline", label: "Project Timeline", icon: IconProjectTimeline },
    ],
  },
  {
    lens: "sales",
    label: "Sales & Growth",
    items: [
      { href: "/os/sales-growth/marketing", label: "Marketing", icon: IconMarketing },
      { href: "/os/sales-growth/lead-generation", label: "Lead Generation", icon: IconLeadGen },
      { href: "/os/sales-growth/sales", label: "Sales", icon: IconSales },
      { href: "/os/sales-growth/follow-ups", label: "Follow Ups", icon: IconFollowUp },
    ],
  },
  {
    lens: "working",
    label: "Working",
    items: [
      { href: "/os/working/strategies", label: "Strategies", icon: IconStrategies },
      { href: "/os/working/production", label: "Creative & Production", icon: IconProduction },
      { href: "/os/working/deliverables", label: "Deliverables", icon: IconDeliverables },
    ],
  },
  {
    lens: "operations",
    label: "Operations",
    items: [
      { href: "/os/operations/client-success", label: "Client Success", icon: IconClientSuccess },
      { href: "/os/operations/finance", label: "Finance", icon: IconFinance },
    ],
  },
];

const lensText: Record<Lens, string> = {
  leadership: "text-lens-leadership",
  sales: "text-lens-sales",
  working: "text-lens-working",
  operations: "text-lens-operations",
};

const lensBar: Record<Lens, string> = {
  leadership: "bg-lens-leadership",
  sales: "bg-lens-sales",
  working: "bg-lens-working",
  operations: "bg-lens-operations",
};

export default function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <nav className="flex h-full flex-col gap-6 overflow-y-auto px-4 py-6">
      <Link
        href="/os"
        onClick={onNavigate}
        className="px-2 font-semibold tracking-tight text-lg"
      >
        Alpheris<span className="text-accent">OS</span>
      </Link>

      <Link
        href="/os"
        onClick={onNavigate}
        className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition ${
          pathname === "/os"
            ? "bg-surface-2 text-foreground"
            : "text-muted hover:bg-surface-2 hover:text-foreground"
        }`}
      >
        <IconOverview className="h-4 w-4" />
        Overview
      </Link>

      <div className="flex flex-col gap-5">
        {GROUPS.map((group) => (
          <div key={group.label}>
            <div className="flex items-center gap-2 px-3 mb-1.5">
              <span className={`h-1.5 w-1.5 rounded-full ${lensBar[group.lens]}`} />
              <p className={`text-xs font-semibold tracking-wide uppercase ${lensText[group.lens]}`}>
                {group.label}
              </p>
            </div>
            <div className="flex flex-col gap-0.5">
              {group.items.map((item) => {
                const active = pathname === item.href;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onNavigate}
                    className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition ${
                      active
                        ? "bg-surface-2 text-foreground"
                        : "text-muted hover:bg-surface-2 hover:text-foreground"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-auto px-3 pt-4 border-t border-border-soft">
        <p className="text-xs text-muted leading-relaxed">
          Data stays on this device — stored in your browser, nothing sent anywhere.
        </p>
      </div>
    </nav>
  );
}
