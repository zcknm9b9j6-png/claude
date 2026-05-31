import { Fragment } from "react";
import { BRAND, type BrandColor, COLOR_CHOICES } from "../brand";
import { DoneToggle } from "../components/controls";
import { TERM_SECTIONS, TERM_TASKS } from "../data/seed";
import { makeId, usePersistentState } from "../lib/storage";
import type { TermConfig, TermId } from "../lib/terms";

interface Task {
  id: string;
  name: string;
  done: Partial<Record<TermId, boolean>>;
}
interface Section {
  id: string;
  name: string;
  color: BrandColor;
  tasks: Task[];
}

const TERM_IDS: TermId[] = [1, 2, 3, 4];

function seed(): Section[] {
  return TERM_SECTIONS.map((s) => ({
    id: makeId(),
    name: s.name,
    color: s.color,
    tasks: (TERM_TASKS[s.name] ?? []).map((name) => ({ id: makeId(), name, done: {} })),
  }));
}

export default function TermTracker({ config }: { config: TermConfig }) {
  const [sections, setSections] = usePersistentState<Section[]>("term-sections", seed);

  const patchSection = (id: string, fn: (s: Section) => Section) =>
    setSections((ss) => ss.map((s) => (s.id === id ? fn(s) : s)));
  const renameSection = (id: string, name: string) => patchSection(id, (s) => ({ ...s, name }));
  const addSection = () =>
    setSections((ss) => [...ss, { id: makeId(), name: "New section", color: "teal", tasks: [] }]);
  const removeSection = (id: string) => setSections((ss) => ss.filter((s) => s.id !== id));

  const addTask = (sid: string) =>
    patchSection(sid, (s) => ({ ...s, tasks: [...s.tasks, { id: makeId(), name: "", done: {} }] }));
  const renameTask = (sid: string, tid: string, name: string) =>
    patchSection(sid, (s) => ({ ...s, tasks: s.tasks.map((t) => (t.id === tid ? { ...t, name } : t)) }));
  const toggle = (sid: string, tid: string, term: TermId) =>
    patchSection(sid, (s) => ({
      ...s,
      tasks: s.tasks.map((t) => (t.id === tid ? { ...t, done: { ...t.done, [term]: !t.done[term] } } : t)),
    }));
  const removeTask = (sid: string, tid: string) =>
    patchSection(sid, (s) => ({ ...s, tasks: s.tasks.filter((t) => t.id !== tid) }));

  const allTasks = sections.flatMap((s) => s.tasks);
  const totals = TERM_IDS.map((term) => allTasks.reduce((n, t) => n + (t.done[term] ? 1 : 0), 0));

  return (
    <div className="mx-auto max-w-5xl p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="text-sm text-ink-soft">
          One tick per term for recurring work. Click any heading or task to rename it.
        </p>
        <button onClick={addSection} className="pill shrink-0" style={{ background: BRAND.purple.base }}>
          + Add section
        </button>
      </div>
      <div className="scroll-x overflow-hidden rounded-xl bg-white shadow">
        <table className="w-full min-w-[640px] border-collapse text-sm">
          <thead>
            <tr className="text-white" style={{ background: BRAND.purple.base }}>
              <th className="w-12 px-2 py-2 text-left font-bold">#</th>
              <th className="px-3 py-2 text-left font-bold">Task</th>
              {config.terms.map((t) => (
                <th key={t.id} className="w-20 px-2 py-2 text-center font-bold">T{t.id}</th>
              ))}
              <th className="w-10" />
            </tr>
          </thead>
          <tbody>
            {sections.map((section) => (
              <Fragment key={section.id}>
                <tr>
                  <td colSpan={7} className="px-3 py-1.5 text-white" style={{ background: BRAND[section.color].base }}>
                    <div className="flex items-center gap-2">
                      <input
                        value={section.name}
                        onChange={(e) => renameSection(section.id, e.target.value)}
                        className="flex-1 bg-transparent font-heading text-sm font-bold uppercase tracking-wide text-white outline-none placeholder:text-white/60"
                        placeholder="Section name…"
                      />
                      <select
                        value={section.color}
                        onChange={(e) => patchSection(section.id, (s) => ({ ...s, color: e.target.value as BrandColor }))}
                        className="rounded bg-white/20 px-1 py-0.5 text-[10px] font-bold text-white outline-none"
                        title="Section colour"
                      >
                        {COLOR_CHOICES.map((c) => (
                          <option key={c} value={c} className="text-ink">{c}</option>
                        ))}
                      </select>
                      <button onClick={() => removeSection(section.id)} className="text-white/80 hover:text-white" title="Delete section">✕</button>
                    </div>
                  </td>
                </tr>
                {section.tasks.map((task, i) => (
                  <tr key={task.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="px-2 py-1 text-center text-xs text-ink-soft">{i + 1}</td>
                    <td className="px-1 py-1">
                      <input className="cell-input" value={task.name} placeholder="New task…" onChange={(e) => renameTask(section.id, task.id, e.target.value)} />
                    </td>
                    {TERM_IDS.map((term) => (
                      <td key={term} className="px-2 py-1">
                        <DoneToggle done={!!task.done[term]} onToggle={() => toggle(section.id, task.id, term)} />
                      </td>
                    ))}
                    <td className="px-1 text-center">
                      <button onClick={() => removeTask(section.id, task.id)} className="text-ink-soft/50 hover:text-pink" title="Delete row">✕</button>
                    </td>
                  </tr>
                ))}
                <tr>
                  <td />
                  <td colSpan={6} className="px-1 py-1">
                    <button onClick={() => addTask(section.id)} className="text-xs font-bold text-ink-soft hover:text-purple">+ Add task</button>
                  </td>
                </tr>
              </Fragment>
            ))}
          </tbody>
          <tfoot>
            <tr className="text-white" style={{ background: BRAND.purple.shade }}>
              <td colSpan={2} className="px-3 py-2 text-right font-bold">Tasks complete ({allTasks.length} total)</td>
              {totals.map((n, i) => (
                <td key={i} className="px-2 py-2 text-center font-bold">{n}</td>
              ))}
              <td />
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
