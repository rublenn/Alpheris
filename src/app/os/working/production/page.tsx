"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useOsStore } from "@/lib/os/store";
import {
  AD_GENRES,
  AD_QUESTION_FIELDS,
  ALL_CREATIVE_GENRES,
  AMPLIFIER_FIELDS,
  CreativeGenre,
  CreativeScript,
  DEFAULT_EQUIPMENT,
  Outsource,
  OutsourceRole,
  OUTSOURCE_ROLES,
  POST_GENRES,
  emptyCreativeScript,
  newId,
} from "@/lib/os/types";
import {
  Badge,
  Button,
  Card,
  DeleteButton,
  Drawer,
  EmptyState,
  Field,
  SectionHeader,
  SelectInput,
  Tabs,
  TextArea,
  TextInput,
} from "@/components/os/ui";
import { IconClose, IconPlus } from "@/components/os/icons";

function emptyOutsource(): Outsource {
  return { id: newId(), role: "Cameraman", name: "", contact: "", rate: "", notes: "" };
}

export default function ProductionPage() {
  return (
    <Suspense>
      <ProductionPageInner />
    </Suspense>
  );
}

function ProductionPageInner() {
  const {
    state,
    hydrated,
    addCreativeScript,
    updateCreativeScript,
    removeCreativeScript,
    setEquipmentDefault,
    addOutsource,
    updateOutsource,
    removeOutsource,
  } = useOsStore();

  const searchParams = useSearchParams();
  const queryClient = searchParams.get("client") || "";
  const initialTab = searchParams.get("focus") === "production" ? "Production" : "Creative";
  const [tab, setTab] = useState<"Creative" | "Production" | "Outsources">(initialTab);

  const clientNames = Array.from(new Set(state.leads.filter((l) => l.stage === "Client").map((l) => l.name))).sort();

  const [creativeClientSel, setCreativeClient] = useState("");
  const [productionClientSel, setProductionClient] = useState("");
  const creativeClient = creativeClientSel || queryClient || clientNames[0] || "";
  const productionClient = productionClientSel || queryClient || clientNames[0] || "";
  const [productionGenre, setProductionGenre] = useState<CreativeGenre | "">("");
  const [equipmentDraft, setEquipmentDraft] = useState("");

  const [scriptDrawer, setScriptDrawer] = useState(false);
  const [editingScriptId, setEditingScriptId] = useState<string | null>(null);
  const [scriptForm, setScriptForm] = useState<CreativeScript | null>(null);

  const [outDrawer, setOutDrawer] = useState(false);
  const [editingOutId, setEditingOutId] = useState<string | null>(null);
  const [outForm, setOutForm] = useState<Outsource>(emptyOutsource());

  if (!hydrated) return null;

  function scriptFor(client: string, kind: "Ad" | "Post", genre: CreativeGenre) {
    return state.creativeScripts.find((s) => s.client === client && s.kind === kind && s.genre === genre);
  }

  function openSlot(client: string, kind: "Ad" | "Post", genre: CreativeGenre) {
    const existing = scriptFor(client, kind, genre);
    if (existing) {
      setScriptForm(existing);
      setEditingScriptId(existing.id);
    } else {
      setScriptForm(emptyCreativeScript(client, kind, genre));
      setEditingScriptId(null);
    }
    setScriptDrawer(true);
  }

  function saveScript() {
    if (!scriptForm) return;
    if (editingScriptId) {
      updateCreativeScript(editingScriptId, scriptForm);
    } else {
      const equipment = state.equipmentDefaults[scriptForm.genre] ?? DEFAULT_EQUIPMENT[scriptForm.genre] ?? [];
      addCreativeScript({ ...scriptForm, equipment });
    }
    setScriptDrawer(false);
  }

  const scriptsForProductionClient = productionClient
    ? state.creativeScripts.filter((s) => s.client === productionClient)
    : [];
  const genresWithScript = scriptsForProductionClient.map((s) => s.genre);
  const activeProductionScript = productionClient && productionGenre
    ? scriptFor(productionClient, ALL_CREATIVE_GENRES.indexOf(productionGenre as CreativeGenre) < AD_GENRES.length ? "Ad" : "Post", productionGenre as CreativeGenre)
    : undefined;

  function addEquipmentItem() {
    if (!activeProductionScript || !equipmentDraft.trim()) return;
    updateCreativeScript(activeProductionScript.id, {
      equipment: [...activeProductionScript.equipment, equipmentDraft.trim()],
    });
    setEquipmentDraft("");
  }

  function removeEquipmentItem(item: string) {
    if (!activeProductionScript) return;
    updateCreativeScript(activeProductionScript.id, {
      equipment: activeProductionScript.equipment.filter((e) => e !== item),
    });
  }

  function resetEquipmentToDefault() {
    if (!activeProductionScript) return;
    const fallback = state.equipmentDefaults[activeProductionScript.genre] ?? DEFAULT_EQUIPMENT[activeProductionScript.genre] ?? [];
    updateCreativeScript(activeProductionScript.id, { equipment: fallback });
  }

  function openNewOutsource() {
    setOutForm(emptyOutsource());
    setEditingOutId(null);
    setOutDrawer(true);
  }
  function openEditOutsource(o: Outsource) {
    setOutForm(o);
    setEditingOutId(o.id);
    setOutDrawer(true);
  }
  function saveOutsource() {
    if (!outForm.name.trim()) return;
    if (editingOutId) updateOutsource(editingOutId, outForm);
    else addOutsource(outForm);
    setOutDrawer(false);
  }

  return (
    <div className="flex flex-col gap-8">
      <SectionHeader
        eyebrow="Working"
        title="Creative & Production"
        action={
          tab === "Outsources" ? (
            <Button variant="primary" onClick={openNewOutsource}>
              <IconPlus className="h-4 w-4" /> Add outsource
            </Button>
          ) : undefined
        }
      />

      <Tabs
        value={tab}
        onChange={setTab}
        options={[
          { value: "Creative", label: "Creative" },
          { value: "Production", label: "Production" },
          { value: "Outsources", label: "Outsources", count: state.outsources.length },
        ]}
      />

      {tab === "Creative" && (
        <>
          {clientNames.length === 0 ? (
            <EmptyState
              title="No clients yet"
              body="Move a lead to Client in Sales first — the creative board is built per client."
            />
          ) : (
            <>
              <Field label="Client">
                <SelectInput value={creativeClient} onChange={setCreativeClient} options={clientNames} />
              </Field>

              {creativeClient && (
                <>
                  <div>
                    <p className="text-sm font-semibold mb-3">Ads</p>
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                      {AD_GENRES.map((genre) => (
                        <GenreSlot
                          key={genre}
                          genre={genre}
                          script={scriptFor(creativeClient, "Ad", genre)}
                          onClick={() => openSlot(creativeClient, "Ad", genre)}
                        />
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-semibold mb-3">Posts</p>
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                      {POST_GENRES.map((genre) => (
                        <GenreSlot
                          key={genre}
                          genre={genre}
                          script={scriptFor(creativeClient, "Post", genre)}
                          onClick={() => openSlot(creativeClient, "Post", genre)}
                        />
                      ))}
                    </div>
                  </div>
                </>
              )}
            </>
          )}
        </>
      )}

      {tab === "Production" && (
        <>
          {clientNames.length === 0 ? (
            <EmptyState title="No clients yet" body="Confirmed scripts from the Creative tab show up here with their equipment list." />
          ) : (
            <>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Client">
                  <SelectInput
                    value={productionClient}
                    onChange={(v) => {
                      setProductionClient(v);
                      setProductionGenre("");
                    }}
                    options={clientNames}
                  />
                </Field>
                <Field label="Ad / post genre">
                  <select
                    value={productionGenre}
                    onChange={(e) => setProductionGenre(e.target.value as CreativeGenre)}
                    className="w-full rounded-lg border border-border bg-surface-2 px-3.5 py-2.5 text-sm outline-none focus:border-accent transition appearance-none"
                  >
                    <option value="">Select a confirmed script</option>
                    {genresWithScript.map((g) => (
                      <option key={g} value={g}>
                        {g}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>

              {productionClient && genresWithScript.length === 0 && (
                <EmptyState
                  title={`No scripts yet for ${productionClient}`}
                  body="Confirm an Ad or Post genre in the Creative tab first — its equipment checklist shows up here."
                />
              )}

              {activeProductionScript && (
                <Card className="flex flex-col gap-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold">{activeProductionScript.genre}</p>
                      <p className="text-xs text-muted">{activeProductionScript.client} · {activeProductionScript.kind}</p>
                    </div>
                    <Badge tone="accent">Equipment</Badge>
                  </div>

                  <div className="flex flex-col gap-2">
                    {activeProductionScript.equipment.length === 0 ? (
                      <p className="text-sm text-muted">No equipment listed — add one below or reset to the genre default.</p>
                    ) : (
                      <ul className="flex flex-col gap-1.5">
                        {activeProductionScript.equipment.map((item) => (
                          <li key={item} className="flex items-center justify-between rounded-lg border border-border-soft bg-surface-2 px-3.5 py-2 text-sm">
                            {item}
                            <button onClick={() => removeEquipmentItem(item)} className="text-muted hover:text-critical transition" aria-label={`Remove ${item}`}>
                              <IconClose className="h-3.5 w-3.5" />
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                    <div className="flex items-center gap-2 pt-1">
                      <input
                        value={equipmentDraft}
                        onChange={(e) => setEquipmentDraft(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && addEquipmentItem()}
                        placeholder="Add an item"
                        className="flex-1 rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm outline-none focus:border-accent transition"
                      />
                      <Button variant="secondary" onClick={addEquipmentItem}>Add</Button>
                      <Button variant="ghost" onClick={resetEquipmentToDefault}>Reset to default</Button>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-border-soft flex flex-col gap-3">
                    <p className="text-xs font-medium tracking-wide uppercase text-muted">Script &amp; strategy (read-only here — edit in Creative)</p>
                    {activeProductionScript.script && (
                      <div>
                        <p className="text-xs text-muted">Script</p>
                        <p className="text-sm whitespace-pre-wrap">{activeProductionScript.script}</p>
                      </div>
                    )}
                    <div className="grid gap-2 sm:grid-cols-2">
                      {AD_QUESTION_FIELDS.map((f) => (
                        <div key={f.key}>
                          <p className="text-xs text-muted">{f.label}</p>
                          <p className="text-sm">{activeProductionScript[f.key] || "—"}</p>
                        </div>
                      ))}
                    </div>
                    <div className="grid gap-2 sm:grid-cols-3 pt-2 border-t border-border-soft">
                      {AMPLIFIER_FIELDS.map((f) => (
                        <div key={f.key}>
                          <p className="text-xs text-muted">{f.label}</p>
                          <p className="text-sm">{activeProductionScript[f.key] || "—"}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </Card>
              )}

              <details className="rounded-2xl border border-border-soft bg-surface p-4">
                <summary className="cursor-pointer text-sm font-medium">Default equipment per genre</summary>
                <div className="mt-4 flex flex-col gap-3">
                  {ALL_CREATIVE_GENRES.map((genre) => (
                    <EquipmentDefaultRow
                      key={genre}
                      genre={genre}
                      value={state.equipmentDefaults[genre] ?? DEFAULT_EQUIPMENT[genre] ?? []}
                      onSave={(list) => setEquipmentDefault(genre, list)}
                    />
                  ))}
                </div>
              </details>
            </>
          )}
        </>
      )}

      {tab === "Outsources" && (state.outsources.length === 0 ? (
        <EmptyState
          title="No outsources yet"
          body="Cameramen, editors, actors — anyone external you bring in for production. Keep their contact and rate here."
          action={
            <Button variant="primary" onClick={openNewOutsource}>
              <IconPlus className="h-4 w-4" /> Add an outsource
            </Button>
          }
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {state.outsources.map((o) => (
            <Card key={o.id} className="cursor-pointer flex flex-col gap-1.5">
              <div onClick={() => openEditOutsource(o)}>
                <div className="flex items-center justify-between">
                  <p className="font-medium text-sm">{o.name}</p>
                  <Badge>{o.role}</Badge>
                </div>
                <p className="text-xs text-muted">{o.contact}{o.rate ? ` · ${o.rate}` : ""}</p>
                {o.notes && <p className="text-xs text-muted line-clamp-2">{o.notes}</p>}
              </div>
            </Card>
          ))}
        </div>
      ))}

      <Drawer
        open={scriptDrawer}
        onClose={() => setScriptDrawer(false)}
        title={scriptForm ? `${scriptForm.genre} · ${scriptForm.client}` : "Script"}
      >
        {scriptForm && (
          <div className="flex flex-col gap-4">
            <div>
              <p className="text-xs font-medium tracking-wide uppercase text-muted mb-1">1. Type of ad</p>
              <div className="rounded-lg border border-border bg-surface-2 px-3.5 py-2.5 text-sm">
                {scriptForm.genre} <span className="text-muted">· {scriptForm.kind}</span>
              </div>
            </div>

            <Field label="2. Script">
              <TextArea
                value={scriptForm.script}
                onChange={(v) => setScriptForm({ ...scriptForm, script: v })}
                placeholder="Write out the actual script or copy for this piece"
              />
            </Field>

            <p className="text-xs font-medium tracking-wide uppercase text-muted pt-2 border-t border-border-soft">3. Questions for this {scriptForm.kind.toLowerCase()}</p>
            {AD_QUESTION_FIELDS.map((f) => (
              <Field key={f.key} label={f.label}>
                <TextArea
                  value={scriptForm[f.key]}
                  onChange={(v) => setScriptForm({ ...scriptForm, [f.key]: v })}
                  placeholder={f.placeholder}
                />
              </Field>
            ))}

            <p className="text-xs font-medium tracking-wide uppercase text-muted pt-2 border-t border-border-soft">Amplifiers</p>
            {AMPLIFIER_FIELDS.map((f) => (
              <Field key={f.key} label={f.label}>
                <TextArea
                  value={scriptForm[f.key]}
                  onChange={(v) => setScriptForm({ ...scriptForm, [f.key]: v })}
                  placeholder={f.placeholder}
                />
              </Field>
            ))}

            <div className="flex items-center gap-2 pt-2">
              <Button variant="primary" onClick={saveScript}>
                {editingScriptId ? "Save changes" : "Confirm this " + scriptForm.kind.toLowerCase()}
              </Button>
              {editingScriptId && (
                <DeleteButton
                  label="Delete"
                  onClick={() => {
                    removeCreativeScript(editingScriptId);
                    setScriptDrawer(false);
                  }}
                />
              )}
            </div>
          </div>
        )}
      </Drawer>

      <Drawer open={outDrawer} onClose={() => setOutDrawer(false)} title={editingOutId ? "Edit outsource" : "New outsource"}>
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Role">
              <SelectInput value={outForm.role} onChange={(v: OutsourceRole) => setOutForm({ ...outForm, role: v })} options={OUTSOURCE_ROLES} />
            </Field>
            <Field label="Name">
              <TextInput value={outForm.name} onChange={(v) => setOutForm({ ...outForm, name: v })} placeholder="e.g. Sam Rivera" />
            </Field>
          </div>
          <Field label="Contact">
            <TextInput value={outForm.contact} onChange={(v) => setOutForm({ ...outForm, contact: v })} placeholder="Email or phone" />
          </Field>
          <Field label="Rate">
            <TextInput value={outForm.rate} onChange={(v) => setOutForm({ ...outForm, rate: v })} placeholder="e.g. $400/day" />
          </Field>
          <Field label="Notes">
            <TextArea value={outForm.notes} onChange={(v) => setOutForm({ ...outForm, notes: v })} placeholder="Availability, style, past work" />
          </Field>
          <div className="flex items-center gap-2 pt-2">
            <Button variant="primary" onClick={saveOutsource}>
              {editingOutId ? "Save changes" : "Add outsource"}
            </Button>
            {editingOutId && (
              <DeleteButton
                label="Delete outsource"
                onClick={() => {
                  removeOutsource(editingOutId);
                  setOutDrawer(false);
                }}
              />
            )}
          </div>
        </div>
      </Drawer>
    </div>
  );
}

function GenreSlot({
  genre,
  script,
  onClick,
}: {
  genre: CreativeGenre;
  script: CreativeScript | undefined;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`text-left rounded-xl border p-3.5 transition ${
        script ? "border-border bg-surface hover:border-muted" : "border-dashed border-border-soft hover:border-accent"
      }`}
    >
      <div className="flex items-center justify-between mb-1.5">
        <p className="text-sm font-semibold leading-tight">{genre}</p>
        {script ? <Badge tone="good">Confirmed</Badge> : <Badge>Blank</Badge>}
      </div>
      <p className="text-xs text-muted line-clamp-2">
        {script ? script.vibe || script.why || "Confirmed — tap to edit" : "Tap to confirm this genre"}
      </p>
    </button>
  );
}

function EquipmentDefaultRow({
  genre,
  value,
  onSave,
}: {
  genre: CreativeGenre;
  value: string[];
  onSave: (list: string[]) => void;
}) {
  const [text, setText] = useState(value.join(", "));
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-2">
      <span className="text-xs font-medium w-48 shrink-0">{genre}</span>
      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        onBlur={() => onSave(text.split(",").map((s) => s.trim()).filter(Boolean))}
        placeholder="Comma-separated equipment"
        className="flex-1 rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm outline-none focus:border-accent transition"
      />
    </div>
  );
}
