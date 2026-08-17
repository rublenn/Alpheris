"use client";

import { useState } from "react";
import { useOsStore } from "@/lib/os/store";
import { MoneyEvent, MoneyKind, MoneyStatus, newId, todayISO } from "@/lib/os/types";
import { financeSummary, formatCurrency } from "@/lib/os/calc";
import {
  Badge,
  Button,
  Card,
  DeleteButton,
  Drawer,
  EmptyState,
  Field,
  NumberInput,
  SectionHeader,
  SelectInput,
  StatTile,
  TextInput,
} from "@/components/os/ui";
import { IconPlus } from "@/components/os/icons";

const STATUS_TONE: Record<MoneyStatus, "neutral" | "good" | "critical"> = {
  Pending: "neutral",
  Paid: "good",
  Overdue: "critical",
};

function emptyEvent(): MoneyEvent {
  return {
    id: newId(),
    kind: "Invoice",
    party: "",
    amount: 0,
    issuedDate: todayISO(),
    dueDate: todayISO(),
    paidDate: "",
    status: "Pending",
  };
}

export default function FinancePage() {
  const { state, hydrated, addMoneyEvent, updateMoneyEvent, removeMoneyEvent } = useOsStore();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<MoneyEvent>(emptyEvent());

  if (!hydrated) return null;

  const summary = financeSummary(state.moneyEvents);

  function openNew() {
    setForm(emptyEvent());
    setEditingId(null);
    setDrawerOpen(true);
  }

  function openEdit(m: MoneyEvent) {
    setForm(m);
    setEditingId(m.id);
    setDrawerOpen(true);
  }

  function save() {
    if (!form.party.trim() || form.amount <= 0) return;
    if (editingId) updateMoneyEvent(editingId, form);
    else addMoneyEvent(form);
    setDrawerOpen(false);
  }

  const sorted = [...state.moneyEvents].sort((a, b) => b.issuedDate.localeCompare(a.issuedDate));

  return (
    <div className="flex flex-col gap-8">
      <SectionHeader
        eyebrow="Operations"
        title="Finance"
        action={
          <Button variant="primary" onClick={openNew}>
            <IconPlus className="h-4 w-4" /> New entry
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile label="Made" value={formatCurrency(summary.made)} tone="good" />
        <StatTile label="Spent" value={formatCurrency(summary.spent)} />
        <StatTile label="Remaining" value={formatCurrency(summary.remaining)} tone={summary.remaining < 0 ? "critical" : "neutral"} />
        <StatTile
          label="Cash buffer"
          value={summary.bufferDays === null ? "—" : `${summary.bufferDays}d`}
          tone={summary.bufferDays !== null && summary.bufferDays < 27 ? "warn" : "neutral"}
          hint="Median small business runs on 27 days"
        />
      </div>

      {summary.overdueCount > 0 && (
        <Card className="border-critical/30 bg-critical-soft">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <p className="text-sm font-medium text-critical">
              {summary.overdueCount} invoice{summary.overdueCount === 1 ? "" : "s"} overdue — {formatCurrency(summary.overdueAmount)}
            </p>
          </div>
        </Card>
      )}

      {state.moneyEvents.length === 0 ? (
        <EmptyState
          title="No entries yet"
          body="Log invoices and expenses as they happen — issued date, due date, and when they're actually paid. That's what powers the cash buffer and AR numbers above."
          action={
            <Button variant="primary" onClick={openNew}>
              <IconPlus className="h-4 w-4" /> Add your first entry
            </Button>
          }
        />
      ) : (
        <Card padded={false} className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[40rem]">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted">
                  <th className="px-5 py-3 font-medium">Party</th>
                  <th className="px-5 py-3 font-medium">Type</th>
                  <th className="px-5 py-3 font-medium text-right">Amount</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium">Due</th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((m) => (
                  <tr
                    key={m.id}
                    onClick={() => openEdit(m)}
                    className="border-b border-border-soft last:border-0 cursor-pointer hover:bg-surface-2 transition"
                  >
                    <td className="px-5 py-3 font-medium">{m.party}</td>
                    <td className="px-5 py-3 text-muted">{m.kind}</td>
                    <td className="px-5 py-3 text-right tabular-nums">{formatCurrency(m.amount)}</td>
                    <td className="px-5 py-3">
                      <Badge tone={STATUS_TONE[m.status]}>{m.status}</Badge>
                    </td>
                    <td className="px-5 py-3 text-muted">{m.dueDate}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)} title={editingId ? "Edit entry" : "New entry"}>
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Type">
              <SelectInput value={form.kind} onChange={(v: MoneyKind) => setForm({ ...form, kind: v })} options={["Invoice", "Expense"] as const} />
            </Field>
            <Field label="Status">
              <SelectInput value={form.status} onChange={(v: MoneyStatus) => setForm({ ...form, status: v })} options={["Pending", "Paid", "Overdue"] as const} />
            </Field>
          </div>
          <Field label={form.kind === "Invoice" ? "Client" : "Paid to"}>
            <TextInput value={form.party} onChange={(v) => setForm({ ...form, party: v })} placeholder="e.g. Northwind Studio" />
          </Field>
          <Field label="Amount">
            <NumberInput value={form.amount} onChange={(v) => setForm({ ...form, amount: v })} />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Issued">
              <TextInput type="date" value={form.issuedDate} onChange={(v) => setForm({ ...form, issuedDate: v })} />
            </Field>
            <Field label="Due">
              <TextInput type="date" value={form.dueDate} onChange={(v) => setForm({ ...form, dueDate: v })} />
            </Field>
          </div>
          {form.status === "Paid" && (
            <Field label="Paid on">
              <TextInput type="date" value={form.paidDate} onChange={(v) => setForm({ ...form, paidDate: v })} />
            </Field>
          )}

          <div className="flex items-center gap-2 pt-2">
            <Button variant="primary" onClick={save}>
              {editingId ? "Save changes" : "Add entry"}
            </Button>
            {editingId && (
              <DeleteButton
                label="Delete entry"
                onClick={() => {
                  removeMoneyEvent(editingId);
                  setDrawerOpen(false);
                }}
              />
            )}
          </div>
        </div>
      </Drawer>
    </div>
  );
}
