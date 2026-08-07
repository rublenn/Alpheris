"use client";

import Link from "next/link";
import { useAppState } from "@/lib/useAppState";
import { generateOutput } from "@/lib/generate";
import { OUTPUT_CARDS } from "@/lib/types";

export default function ResultsPage() {
  const { intake, credits, unlocked, hydrated, spendCredit } = useAppState();

  if (!hydrated) return null;

  if (!intake.businessName) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-24 text-center">
        <h1 className="text-2xl font-semibold mb-3">No intake yet</h1>
        <p className="text-muted mb-6">
          Fill out your business info first to generate a plan.
        </p>
        <Link
          href="/start"
          className="rounded-full bg-accent px-6 py-3 font-medium text-white hover:opacity-90 transition inline-block"
        >
          Start now
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-6 py-16">
      <div className="flex items-center justify-between flex-wrap gap-4 mb-2">
        <h1 className="text-3xl font-semibold tracking-tight">
          {intake.businessName}&apos;s instant plan
        </h1>
        <span className="rounded-full border border-border px-4 py-1.5 text-sm">
          <span className="text-accent font-semibold">{credits}</span> credit
          {credits === 1 ? "" : "s"} left
        </span>
      </div>
      <p className="text-muted mb-10">
        Spend a credit to unlock each result. Free to try — nothing is
        charged.
      </p>

      <div className="grid gap-6 sm:grid-cols-3 mb-16">
        {OUTPUT_CARDS.map((card) => (
          <OutputCard
            key={card.kind}
            title={card.title}
            description={card.description}
            cost={card.cost}
            content={unlocked[card.kind]}
            canAfford={credits >= card.cost}
            onUnlock={() =>
              spendCredit(card.kind, generateOutput(card.kind, intake))
            }
          />
        ))}
      </div>

      <div className="rounded-2xl border border-border bg-surface-alt p-10 text-center">
        <h2 className="text-2xl font-semibold mb-3">
          Like what you see? We can run it.
        </h2>
        <p className="text-muted max-w-xl mx-auto mb-6">
          Take this and run it yourself — or hand us the workload. Managed
          plans start at €500/month: content, paid ads, and business
          development, reported in real numbers.
        </p>
        <a
          href="mailto:hello@alperismedien.com?subject=Managed%20plan%20inquiry"
          className="rounded-full bg-accent px-6 py-3 font-medium text-white hover:opacity-90 transition inline-block"
        >
          Talk to us about the managed plan
        </a>
      </div>
    </div>
  );
}

function OutputCard({
  title,
  description,
  cost,
  content,
  canAfford,
  onUnlock,
}: {
  title: string;
  description: string;
  cost: number;
  content?: string;
  canAfford: boolean;
  onUnlock: () => void;
}) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-6 flex flex-col">
      <h3 className="font-semibold text-lg mb-1">{title}</h3>
      <p className="text-muted text-sm leading-relaxed mb-4">{description}</p>

      {content ? (
        <pre className="whitespace-pre-wrap text-sm bg-background rounded-lg p-4 flex-1 border border-border font-sans">
          {content}
        </pre>
      ) : (
        <div className="flex-1 flex flex-col justify-end">
          <button
            onClick={onUnlock}
            disabled={!canAfford}
            className="rounded-full bg-accent px-4 py-2.5 font-medium text-white hover:opacity-90 transition disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {canAfford ? `Unlock — ${cost} credit` : "Not enough credits"}
          </button>
        </div>
      )}
    </div>
  );
}
