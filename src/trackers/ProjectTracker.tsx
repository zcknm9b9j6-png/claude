import { useState } from "react";
import { BRAND } from "../brand";
import { makeId, usePersistentState } from "../lib/storage";
import { CategorySelect, useCategories } from "../components/CategorySelect";

type Status = "Not Started" | "Active" | "On Hold" | "Complete" | "Overdue";
type Priority = "High" | "Medium" | "Low";

interface ProjectTask {
  id: string;
  text: string;
  done: boolean;
}
interface Project {
  id: string;
  name: string;
  category: string;
  status: Status;
  priority: Priority;
  target: string;
  update: string;
  notes: string;
  tasks: ProjectTask[];
}
// A standalone priority to-do (not tied to a project).
interface PriorityItem {
  id: string;
  text: string;
  done: boolean;
  priority: Priority;
}

const STATUS_COLORS: Record<Status, string> = {
  Active: BRAND.teal.base,
  "On Hold": BRAND.orange.base,
  Complete: BRAND.lime.base,
  "Not Started": "#9a96a8",
  Overdue: BRAND.pink.base,
};
const STATUS_OPTIONS: Status[] = ["Not Started", "Active", "On Hold", "Complete", "Overdue"];
const PRIORITY_OPTIONS: Priority[] = ["High", "Medium", "Low"];
const PRIORITY_COLORS: Record<Priority, string> = {
  High: BRAND.pink.base,
  Medium: BRAND.orange.base,
  Low: BRAND.teal.base,
};

function blankRow(): Project {
  return { id: makeId(), name: "", category: "", status: "Not Started", priority: "Medium", target: "", update: "", notes: "", tasks: [] };
}
function seed(): Project[] {
  return Array.from({ length: 4 }, blankRow);
}
function normalize(p: Project): Project {
  return { ...p, notes: p.notes ?? "", tasks: p.tasks ?? [], category: p.category ?? "" };
}

export default function ProjectTracker() {
  const [rawRows, setRows] = usePersistentState<Project[]>("projects", seed);
  const [priorityItems, setPriorityItems] = usePersistentState<PriorityItem[]>("priority-items", []);
  const [openId, setOpenId] = useState<string | null>(null);
  const { cats, add: addCat } = useCategories("projects", ["Operations", "Compliance", "Events", "Facilities"]);

  const rows = rawRows.map(normalize);
  const patch = (id: string, fields: Partial<Project>) =>
    setRows((rs) => rs.map((r) => (r.id === id ? { ...normalize(r), ...fields } : r)));
  const open = openId ? rows.find((r) => r.id === openId) ?? null : null;

  const patchTask = (pid: string, tid: string, fields: Partial<ProjectTask>) => {
    const proj = rows.find((r) => r.id === pid);
    if (!proj) return;
    patch(pid, { tasks: proj.tasks.map((t) => (t.id === tid ? { ...t, ...fields } : t)) });
  };

  const addPriority = (priority: Priority) =>
    setPriorityItems((xs) => [...xs, { id: makeId(), text: "", done: false, priority }]);

  return (
    <div className="mx-auto max-w-6xl space-y-5 p-4">
      {/* Priority lists — manually editable */}
      <div className="grid gap-4 md:grid-cols-3">
        {PRIORITY_OPTIONS.map((level) => {
          const items = priorityItems.filter((p) => p.priority === level);
          return (
            <div key={level} className="overflow-hidden rounded-xl bg-white shadow">
              <div className="flex items-center justify-between px-4 py-2 text-white" style={{ background: PRIORITY_COLORS[level] }}>
                <h3 className="font-heading font-bold">{level} priority</h3>
                <button onClick={() => addPriority(level)} className="rounded-full bg-white/25 px-2 py-0.5 text-xs font-bold hover:bg-white/40">+ Add</button>
              </div>
              <div className="space-y-1 p-3">
                {items.length === 0 && <p className="text-sm text-ink-soft">Nothing here yet.</p>}
                {items.map((it) => (
                  <div key={it.id} className="flex items-center gap-2">
                    <input type="checkbox" checked={it.done} onChange={(e) => setPriorityItems((xs) => xs.map((x) => (x.id === it.id ? { ...x, done: e.target.checked } : x)))} />
                    <input
                      value={it.text}
                      placeholder="Priority task…"
                      onChange={(e) => setPriorityItems((xs) => xs.map((x) => (x.id === it.id ? { ...x, text: e.target.value } : x)))}
                      className={`flex-1 bg-transparent text-sm outline-none ${it.done ? "text-ink-soft line-through" : "text-ink"}`}
                    />
                    <button onClick={() => setPriorityItems((xs) => xs.filter((x) => x.id !== it.id))} className="text-ink-soft/50 hover:text-pink">✕</button>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Project cards */}
      <div className="flex items-center justify-between">
        <h2 className="font-heading font-bold text-ink">Projects</h2>
        <button onClick={() => setRows((rs) => [...rs, blankRow()])} className="pill" style={{ background: BRAND.lime.base }}>+ New project</button>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {rows.map((p) => (
          <button key={p.id} onClick={() => setOpenId(p.id)} className="rounded-xl bg-white p-4 text-left shadow transition-shadow hover:shadow-md">
            <div className="mb-2 flex items-center justify-between gap-2">
              <span className="rounded-full px-2 py-0.5 text-[11px] font-bold text-white" style={{ background: PRIORITY_COLORS[p.priority] }}>{p.priority}</span>
              <span className="rounded-full px-2 py-0.5 text-[11px] font-bold text-white" style={{ background: STATUS_COLORS[p.status] }}>{p.status}</span>
            </div>
            <h3 className="font-heading font-bold text-ink">{p.name || "(untitled project)"}</h3>
            {p.category && <p className="text-xs text-ink-soft">{p.category}</p>}
            <p className="mt-1 line-clamp-2 text-sm text-ink-soft">{p.update || "No updates yet — click to open."}</p>
            <div className="mt-2 text-[11px] text-ink-soft/70">{p.tasks.filter((t) => t.done).length}/{p.tasks.length} tasks done</div>
          </button>
        ))}
      </div>

      {/* Detail subscreen */}
      {open && (
        <div className="fixed inset-0 z-50 grid place-items-start justify-center overflow-y-auto bg-black/40 p-4" onClick={() => setOpenId(null)}>
          <div className="my-8 w-full max-w-2xl rounded-2xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-start gap-2">
              <input value={open.name} placeholder="Project name…" onChange={(e) => patch(open.id, { name: e.target.value })} className="flex-1 bg-transparent font-heading text-xl font-bold text-ink outline-none" />
              <button onClick={() => setOpenId(null)} className="text-ink-soft hover:text-ink">✕</button>
            </div>

            <div className="mb-4 grid grid-cols-2 gap-3 text-sm">
              <label>
                <span className="text-ink-soft">Category</span>
                <div className="mt-1">
                  <CategorySelect value={open.category} categories={cats} onChange={(v) => patch(open.id, { category: v })} onAddCategory={addCat} />
                </div>
              </label>
              <label>
                <span className="text-ink-soft">Priority</span>
                <select value={open.priority} onChange={(e) => patch(open.id, { priority: e.target.value as Priority })} className="mt-1 w-full rounded-lg border border-gray-300 px-2 py-1 outline-none">
                  {PRIORITY_OPTIONS.map((o) => <option key={o}>{o}</option>)}
                </select>
              </label>
              <label>
                <span className="text-ink-soft">Status</span>
                <select value={open.status} onChange={(e) => patch(open.id, { status: e.target.value as Status })} className="mt-1 w-full rounded-lg border border-gray-300 px-2 py-1 outline-none">
                  {STATUS_OPTIONS.map((o) => <option key={o}>{o}</option>)}
                </select>
              </label>
              <label>
                <span className="text-ink-soft">Target date</span>
                <input type="date" value={open.target} onChange={(e) => patch(open.id, { target: e.target.value })} className="mt-1 w-full rounded-lg border border-gray-300 px-2 py-1 outline-none" />
              </label>
            </div>

            <label className="mb-4 block text-sm">
              <span className="text-ink-soft">Latest update</span>
              <textarea value={open.update} rows={2} placeholder="What's the most recent progress?" onChange={(e) => patch(open.id, { update: e.target.value })} className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 outline-none" />
            </label>
            <label className="mb-4 block text-sm">
              <span className="text-ink-soft">Where I'm up to / notes</span>
              <textarea value={open.notes} rows={4} placeholder="Your notes for this project…" onChange={(e) => patch(open.id, { notes: e.target.value })} className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 outline-none" />
            </label>

            <div className="mb-2 flex items-center justify-between">
              <h4 className="font-heading font-bold text-ink">Tasks</h4>
              <button onClick={() => patch(open.id, { tasks: [...open.tasks, { id: makeId(), text: "", done: false }] })} className="text-sm font-bold text-ink-soft hover:text-lime">+ Task</button>
            </div>
            <div className="space-y-1">
              {open.tasks.map((t) => (
                <div key={t.id} className="flex items-center gap-2">
                  <input type="checkbox" checked={t.done} onChange={(e) => patchTask(open.id, t.id, { done: e.target.checked })} />
                  <input value={t.text} placeholder="Task…" onChange={(e) => patchTask(open.id, t.id, { text: e.target.value })} className={`flex-1 bg-transparent text-sm outline-none ${t.done ? "text-ink-soft line-through" : "text-ink"}`} />
                  <button onClick={() => patch(open.id, { tasks: open.tasks.filter((x) => x.id !== t.id) })} className="text-ink-soft/50 hover:text-pink">✕</button>
                </div>
              ))}
            </div>

            <div className="mt-6 flex items-center justify-between">
              <button onClick={() => { setRows((rs) => rs.filter((r) => r.id !== open.id)); setOpenId(null); }} className="text-sm font-bold text-ink-soft hover:text-pink">Delete project</button>
              <button onClick={() => setOpenId(null)} className="pill" style={{ background: BRAND.lime.base }}>Done</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
