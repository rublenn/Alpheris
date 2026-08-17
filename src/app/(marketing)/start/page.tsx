"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAppState } from "@/lib/useAppState";
import { IntakeForm } from "@/lib/types";

const EMPTY: IntakeForm = {
  businessName: "",
  industry: "",
  problem: "",
  goals: "",
  location: "",
  monthlyBudget: "",
};

export default function StartPage() {
  const router = useRouter();
  const { saveIntake } = useAppState();
  const [form, setForm] = useState<IntakeForm>(EMPTY);

  function update<K extends keyof IntakeForm>(key: K, value: IntakeForm[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    saveIntake(form);
    router.push("/results");
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-16">
      <h1 className="text-3xl font-semibold tracking-tight mb-2">
        Tell us about your business
      </h1>
      <p className="text-muted mb-8">
        Two minutes. This is what your instant AI plan gets built from.
      </p>

      <form onSubmit={handleSubmit} className="space-y-5">
        <Field
          label="Business name"
          value={form.businessName}
          onChange={(v) => update("businessName", v)}
          placeholder="e.g. Yep"
          required
        />
        <Field
          label="Industry"
          value={form.industry}
          onChange={(v) => update("industry", v)}
          placeholder="e.g. language learning app"
          required
        />
        <TextArea
          label="What problem are you stuck on right now?"
          value={form.problem}
          onChange={(v) => update("problem", v)}
          placeholder="e.g. we get downloads but no consistent paying users"
          required
        />
        <TextArea
          label="What are your goals?"
          value={form.goals}
          onChange={(v) => update("goals", v)}
          placeholder="e.g. 50 new paying users a month, more local awareness"
          required
        />
        <div className="grid grid-cols-2 gap-4">
          <Field
            label="Location / market"
            value={form.location}
            onChange={(v) => update("location", v)}
            placeholder="e.g. Berlin"
          />
          <Field
            label="Monthly budget (€)"
            value={form.monthlyBudget}
            onChange={(v) => update("monthlyBudget", v)}
            placeholder="e.g. 300"
          />
        </div>

        <button
          type="submit"
          className="w-full rounded-full bg-accent px-6 py-3 font-medium text-white hover:opacity-90 transition"
        >
          Generate my instant plan
        </button>
      </form>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  required,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="block text-sm font-medium mb-1.5">{label}</span>
      <input
        className="w-full rounded-lg border border-border bg-surface px-4 py-2.5 outline-none focus:border-accent transition"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
      />
    </label>
  );
}

function TextArea({
  label,
  value,
  onChange,
  placeholder,
  required,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="block text-sm font-medium mb-1.5">{label}</span>
      <textarea
        className="w-full rounded-lg border border-border bg-surface px-4 py-2.5 outline-none focus:border-accent transition min-h-24"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
      />
    </label>
  );
}
