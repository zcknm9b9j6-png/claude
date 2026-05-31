import { Fragment } from "react";
import { BRAND, type BrandColor } from "../brand";
import { StatusSelect } from "../components/controls";
import { YEARLY_SECTIONS, YEARLY_TASKS } from "../data/seed";
import { makeId, usePersistentState } from "../lib/storage";

type Status = "—" | "In Progress" | "Done";

interface Task {
  id: string;
  name: string;
  status: Status;
  dateCompleted: string;
  responsible: string;
  notes: string;
}
interface Section {
  id: string;
  name: string;
  color: BrandColor;
  tasks: Task[];
}

const STATUS_OPTIONS: Status[] = ["—", "In Progress", "Done"];
const STATUS_COLORS: Record<string, string> = {
  Done: BRAND.lime.base,
  "In Progress": "#F0A814",
  "—": "transparent",
};
const COLOR_CHOICES: BrandColor[] = ["teal", "purple", "blue", "pink", "lime", "orange"];

function newTask(): Task {
  return { id: makeId(), name: "", status: "—", dateCompleted: "", responsible: "", notes: "" };
}

function seed(): Section[] {
  return YEARLY_SECTIONS.map((s) => ({
    id: makeId(),
    name: s.name,
    color: s.color,
    tasks: (YEARLY_TASKS[s.name] ?? []).map((name) => ({ ...newTask(), name })),
  }));
}

export default function YearlyTracker() {
  const [sections, setSections] = usePersistentState<Section[]>("yearly-sections", seed);

  const patchSection = (id: string, fn: (s: Section) => Section) =>
    setSections((ss) => ss.map((s) => (s.id === id ? fn(s) : s)));
  const renameSection = (id: string, name: string) => patchSection(id, (s) => ({ ...s, name }));
  const addSection = () =>
    setSections((ss) => [...ss, { id: makeId(), name: "New section", color: "blue", tasks: [] }]);
  const removeSection = (id: string) => setSections((ss) => ss.filter((s) => s.id !== id));

  const addTask = (sid: string) =>
    patchSection(sid, (s) => ({ ...s, tasks: [...s.tasks, newTask()] }));
  const patchTask = (sid: string, tid: string, fields: Partial<Task>) =>
    patchSection(sid, (s) => ({ ...s, tasks: s.tasks.map((t) => (t.id === tid ? { ...t, ...fields } : t)) }));
  const removeTask = (sid: string, tid: string) =>
    patchSection(sid, (s) => ({ ...s, tasks: s.tasks.filter((t) => t.id !== tid) }));

  const all = sections.flatMap((s) => s.tasks);
  const done = all.filter((t) => t.status === "Done").length;
  const inProgress = all.filter((t) => t.status === "In Progress").length;

  return (
    <div className="mx-auto max-w-6xl p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="text-sm text-ink-soft">
          Annual once-a-year tasks. {done} done · {inProgress} in progress · {all.length} total.
          Click a heading to rename it.
        </p>
        <button onClick={addSection} className="pill shrink-0" style={{ background: BRAND.blue.base }}>
          + Add section
        </button>
      </div>
      <div className="scroll-x overflow-hidden rounded-xl bg-white shadow">
        <table className="w-full min-w-[820px] border-collapse text-sm">
          <thead>
            <tr className="text-white" style={{ background: BRAND.blue.base }}>
              <th className="w-10 px-2 py-2 text-left font-bold">#</th>
              <th className="px-3 py-2 text-left font-bold">Task</th>
              <th className="w-32 px-2 py-2 text-left font-bold">Done</th>
              <th className="w-36 px-2 py-2 text-left font-bold">Date completed</th>
              <th className="w-40 px-2 py-2 text-left font-bold">Responsible</th>
              <th className="px-2 py-2 text-left font-bold">Notes</th>
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
                        className="flex-1 bg-transparent text-xs font-extrabold uppercase tracking-wide text-white outline-none placeholder:text-white/60"
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
                      <button
                        onClick={() => removeSection(section.id)}
                        className="text-white/80 hover:text-white"
                        title="Delete section"
                      >
                        ✕
                      </button>
                    </div>
                  </td>
                </tr>
                {section.tasks.map((task, i) => (
                  <tr key={task.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="px-2 py-1 text-center text-xs text-ink-soft">{i + 1}</td>
                    <td className="px-1 py-1">
                      <input
                        className="cell-input"
                        value={task.name}
                        placeholder="New task…"
                        onChange={(e) => patchTask(section.id, task.id, { name: e.target.value })}
                      />
                    </td>
                    <td className="px-1 py-1">
                      <StatusSelect
                        value={task.status}
                        options={STATUS_OPTIONS}
                        colors={STATUS_COLORS}
                        onChange={(v) => patchTask(section.id, task.id, { status: v as Status })}
                      />
                    </td>
                    <td className="px-1 py-1">
                      <input
                        type="date"
                        className="cell-input"
                        value={task.dateCompleted}
                        onChange={(e) => patchTask(section.id, task.id, { dateCompleted: e.target.value })}
                      />
                    </td>
                    <td className="px-1 py-1">
                      <input
                        className="cell-input"
                        value={task.responsible}
                        placeholder="Who?"
                        onChange={(e) => patchTask(section.id, task.id, { responsible: e.target.value })}
                      />
                    </td>
                    <td className="px-1 py-1">
                      <input
                        className="cell-input"
                        value={task.notes}
                        placeholder="Notes…"
                        onChange={(e) => patchTask(section.id, task.id, { notes: e.target.value })}
                      />
                    </td>
                    <td className="px-1 text-center">
                      <button
                        onClick={() => removeTask(section.id, task.id)}
                        className="text-ink-soft/50 hover:text-pink"
                        title="Delete row"
                      >
                        ✕
                      </button>
                    </td>
                  </tr>
                ))}
                <tr>
                  <td />
                  <td colSpan={6} className="px-1 py-1">
                    <button
                      onClick={() => addTask(section.id)}
                      className="text-xs font-bold text-ink-soft hover:text-blue"
                    >
                      + Add task
                    </button>
                  </td>
                </tr>
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
