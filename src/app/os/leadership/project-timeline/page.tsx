"use client";

import { FormEvent, useState } from "react";
import { useOsStore } from "@/lib/os/store";
import { ProjectMilestone, newId, todayISO } from "@/lib/os/types";
import { Badge, Card, DeleteButton, EmptyState, ProgressBar, SectionHeader } from "@/components/os/ui";

export default function ProjectTimelinePage() {
  const { state, hydrated, addProjectMilestone, updateProjectMilestone, removeProjectMilestone } = useOsStore();
  const [project, setProject] = useState("");
  const [title, setTitle] = useState("");
  const [date, setDate] = useState(todayISO());

  if (!hydrated) return null;

  const projects = Array.from(new Set(state.projectTimeline.map((m) => m.project))).sort();
  const knownProjects = Array.from(
    new Set([...state.clients.map((c) => c.name), ...state.deliverables.map((d) => d.client)])
  ).filter(Boolean);

  function handleAdd(e: FormEvent) {
    e.preventDefault();
    const p = project.trim();
    const t = title.trim();
    if (!p || !t) return;
    const entry: ProjectMilestone = { id: newId(), project: p, title: t, date, done: false };
    addProjectMilestone(entry);
    setTitle("");
  }

  return (
    <div className="flex flex-col gap-8">
      <SectionHeader eyebrow="Leadership" title="Project Timeline" />

      <Card>
        <p className="text-sm text-muted mb-4">Milestones for a specific project or client — separate from the company-wide Business Timeline.</p>
        <form onSubmit={handleAdd} className="flex flex-col sm:flex-row gap-2">
          <input
            value={project}
            onChange={(e) => setProject(e.target.value)}
            placeholder="Project or client"
            list="project-names"
            className="sm:w-56 rounded-lg border border-border bg-surface-2 px-3.5 py-2.5 text-sm outline-none focus:border-accent transition"
          />
          <datalist id="project-names">
            {knownProjects.map((n) => (
              <option key={n} value={n} />
            ))}
          </datalist>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Milestone — e.g. Kickoff call"
            className="flex-1 rounded-lg border border-border bg-surface-2 px-3.5 py-2.5 text-sm outline-none focus:border-accent transition"
          />
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="rounded-lg border border-border bg-surface-2 px-3.5 py-2.5 text-sm outline-none focus:border-accent transition"
          />
          <button
            type="submit"
            className="rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-white hover:opacity-90 transition"
          >
            Add
          </button>
        </form>
      </Card>

      {projects.length === 0 ? (
        <EmptyState title="No project timelines yet" body="Add a milestone above — each new project name gets its own timeline." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {projects.map((p) => {
            const milestones = state.projectTimeline
              .filter((m) => m.project === p)
              .slice()
              .sort((a, b) => a.date.localeCompare(b.date));
            const doneCount = milestones.filter((m) => m.done).length;
            return (
              <Card key={p} className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <p className="font-semibold">{p}</p>
                  <Badge>{doneCount} / {milestones.length}</Badge>
                </div>
                <ProgressBar value={(doneCount / Math.max(milestones.length, 1)) * 100} tone="good" />
                <ul className="flex flex-col gap-1.5 mt-1">
                  {milestones.map((m) => (
                    <li key={m.id} className="flex items-center gap-2.5">
                      <input
                        type="checkbox"
                        checked={m.done}
                        onChange={(e) => updateProjectMilestone(m.id, { done: e.target.checked })}
                        className="h-4 w-4 rounded border-border accent-[var(--accent)]"
                      />
                      <span className={`flex-1 text-sm ${m.done ? "line-through text-muted" : ""}`}>{m.title}</span>
                      <span className="text-xs text-muted shrink-0">{m.date}</span>
                      <DeleteButton label="Remove" onClick={() => removeProjectMilestone(m.id)} />
                    </li>
                  ))}
                </ul>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
