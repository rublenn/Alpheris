"use client";

import { useState } from "react";
import { useOsStore } from "@/lib/os/store";
import { Asset, MoneyEvent, MoneyKind, MoneyStatus, newId, todayISO } from "@/lib/os/types";
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
  Tabs,
  TextArea,
  TextInput,
} from "@/components/os/ui";
import { IconPlus } from "@/components/os/icons";

const STATUS_TONE: Record<MoneyStatus, "neutral" | "good" | "critical"> = {
  Pending: "neutral",
  Paid: "good",
  Overdue: "critical",
};

function emptyEvent(kind: MoneyKind = "Invoice"): MoneyEvent {
  return {
    id: newId(),
    kind,
    party: "",
    amount: 0,
    issuedDate: todayISO(),
    dueDate: todayISO(),
    paidDate: "",
    status: "Pending",
  };
}

function emptyAsset(): Asset {
  return { id: newId(), name: "", value: 0, purchasedDate: todayISO(), notes: "" };
}

function MoneyTable({
  rows,
  onRowClick,
}: {
  rows: MoneyEvent[];
  onRowClick: (m: MoneyEvent) => void;
}) {
  return (
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
            {rows.map((m) => (
              <tr
                key={m.id}
                onClick={() => onRowClick(m)}
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
  );
}

export default function FinancePage() {
  const {
    state,
    hydrated,
    addMoneyEvent,
    updateMoneyEvent,
    removeMoneyEvent,
    addAsset,
    updateAsset,
    removeAsset,
  } = useOsStore();
  const [tab, setTab] = useState<"Overview" | "Invoices" | "Expenses" | "Assets" | "Profits">("Overview");

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<MoneyEvent>(emptyEvent());

  const [assetDrawer, setAssetDrawer] = useState(false);
  const [editingAssetId, setEditingAssetId] = useState<string | null>(null);
  const [assetForm, setAssetForm] = useState<Asset>(emptyAsset());

  if (!hydrated) return null;

  const summary = financeSummary(state.moneyEvents);
  const margin = summary.made > 0 ? summary.remaining / summary.made : null;
  const totalAssetValue = state.assets.reduce((s, a) => s + a.value, 0);

  function openNew(kind?: MoneyKind) {
    setForm(emptyEvent(kind));
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

  function openNewAsset() {
    setAssetForm(emptyAsset());
    setEditingAssetId(null);
    setAssetDrawer(true);
  }

  function openEditAsset(a: Asset) {
    setAssetForm(a);
    setEditingAssetId(a.id);
    setAssetDrawer(true);
  }

  function saveAsset() {
    if (!assetForm.name.trim()) return;
    if (editingAssetId) updateAsset(editingAssetId, assetForm);
    else addAsset(assetForm);
    setAssetDrawer(false);
  }

  const sorted = [...state.moneyEvents].sort((a, b) => b.issuedDate.localeCompare(a.issuedDate));
  const invoices = sorted.filter((m) => m.kind === "Invoice");
  const expenses = sorted.filter((m) => m.kind === "Expense");

  return (
    <div className="flex flex-col gap-8">
      <SectionHeader
        eyebrow="Operations"
        title="Finance"
        action={
          tab === "Assets" ? (
            <Button variant="primary" onClick={openNewAsset}>
              <IconPlus className="h-4 w-4" /> Add asset
            </Button>
          ) : tab === "Profits" ? undefined : (
            <Button variant="primary" onClick={() => openNew(tab === "Expenses" ? "Expense" : "Invoice")}>
              <IconPlus className="h-4 w-4" /> New entry
            </Button>
          )
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

      <Tabs
        value={tab}
        onChange={setTab}
        options={[
          { value: "Overview", label: "Overview", count: state.moneyEvents.length },
          { value: "Invoices", label: "Invoices", count: invoices.length },
          { value: "Expenses", label: "Expenses", count: expenses.length },
          { value: "Assets", label: "Assets", count: state.assets.length },
          { value: "Profits", label: "Profits" },
        ]}
      />

      {tab === "Overview" && (state.moneyEvents.length === 0 ? (
        <EmptyState
          title="No entries yet"
          body="Log invoices and expenses as they happen — issued date, due date, and when they're actually paid. That's what powers the cash buffer and AR numbers above."
          action={
            <Button variant="primary" onClick={() => openNew()}>
              <IconPlus className="h-4 w-4" /> Add your first entry
            </Button>
          }
        />
      ) : (
        <MoneyTable rows={sorted} onRowClick={openEdit} />
      ))}

      {tab === "Invoices" && (invoices.length === 0 ? (
        <EmptyState title="No invoices yet" body="Every invoice you send, with its due date and payment status." />
      ) : (
        <MoneyTable rows={invoices} onRowClick={openEdit} />
      ))}

      {tab === "Expenses" && (expenses.length === 0 ? (
        <EmptyState title="No expenses yet" body="Everything you spend running the agency." />
      ) : (
        <MoneyTable rows={expenses} onRowClick={openEdit} />
      ))}

      {tab === "Assets" && (state.assets.length === 0 ? (
        <EmptyState
          title="No assets logged yet"
          body="Equipment, subscriptions, anything with lasting value — cameras, software licenses, gear."
          action={
            <Button variant="primary" onClick={openNewAsset}>
              <IconPlus className="h-4 w-4" /> Add an asset
            </Button>
          }
        />
      ) : (
        <>
          <StatTile label="Total asset value" value={formatCurrency(totalAssetValue)} />
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {state.assets.map((a) => (
              <Card key={a.id} className="cursor-pointer flex flex-col gap-1">
                <div onClick={() => openEditAsset(a)}>
                  <p className="font-medium text-sm">{a.name}</p>
                  <p className="text-xs text-muted">{formatCurrency(a.value)} · purchased {a.purchasedDate}</p>
                  {a.notes && <p className="text-xs text-muted line-clamp-2">{a.notes}</p>}
                </div>
              </Card>
            ))}
          </div>
        </>
      ))}

      {tab === "Profits" && (
        <div className="grid gap-4 sm:grid-cols-2">
          <StatTile label="Net profit" value={formatCurrency(summary.remaining)} tone={summary.remaining < 0 ? "critical" : "good"} />
          <StatTile label="Margin" value={margin === null ? "—" : `${Math.round(margin * 100)}%`} hint="Remaining ÷ made" />
          <StatTile label="Total made" value={formatCurrency(summary.made)} />
          <StatTile label="Total spent" value={formatCurrency(summary.spent)} />
          <StatTile label="Pending invoices" value={formatCurrency(summary.pending)} />
          <StatTile label="Overdue" value={formatCurrency(summary.overdueAmount)} tone={summary.overdueAmount > 0 ? "critical" : "neutral"} />
        </div>
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

      <Drawer open={assetDrawer} onClose={() => setAssetDrawer(false)} title={editingAssetId ? "Edit asset" : "New asset"}>
        <div className="flex flex-col gap-4">
          <Field label="Name">
            <TextInput value={assetForm.name} onChange={(v) => setAssetForm({ ...assetForm, name: v })} placeholder="e.g. Sony A7 IV" />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Value">
              <NumberInput value={assetForm.value} onChange={(v) => setAssetForm({ ...assetForm, value: v })} />
            </Field>
            <Field label="Purchased">
              <TextInput type="date" value={assetForm.purchasedDate} onChange={(v) => setAssetForm({ ...assetForm, purchasedDate: v })} />
            </Field>
          </div>
          <Field label="Notes">
            <TextArea value={assetForm.notes} onChange={(v) => setAssetForm({ ...assetForm, notes: v })} placeholder="Serial number, condition, who has it" />
          </Field>
          <div className="flex items-center gap-2 pt-2">
            <Button variant="primary" onClick={saveAsset}>
              {editingAssetId ? "Save changes" : "Add asset"}
            </Button>
            {editingAssetId && (
              <DeleteButton
                label="Delete asset"
                onClick={() => {
                  removeAsset(editingAssetId);
                  setAssetDrawer(false);
                }}
              />
            )}
          </div>
        </div>
      </Drawer>
    </div>
  );
}
