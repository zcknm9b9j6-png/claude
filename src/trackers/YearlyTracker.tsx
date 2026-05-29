import { Fragment } from "react";
import { BRAND } from "../brand";
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
type Data = Record<string, Task[]>;

const STATUS_OPTIONS: Status[] = ["—", "In Progress", "Done"];
const STATUS_COLORS: Record<string, string> = {
  Done: BRAND.lime.base,
  "In Progress": "#F0A814", // amber
  "—": "transparent",
};

function seed(): Data {
  const d: Data = {};
  for (const s of YEARLY_SECTIONS) {
    d[s.name] = (YEARLY_TASKS[s.name] ?? []).map((name) => ({
      id: makeId(),
      name,
      status: "—" as Status,
      dateCompleted: "",
      responsible: "",
      notes: "",
    }));
  }
  return d;
}

export default function YearlyTracker() {
  const [data, setData] = usePersistentState<Data>("yearly", seed);

  const update = (section: string, fn: (tasks: Task[]) => Task[]) =>
    setData((d) => ({ ...d, [section]: fn(d[section] ?? []) }));

  const patch = (section: string, id: string, fields: Partial<Task>) =>
    update(section, (tasks) =>
      tasks.map((t) => (t.id === id ? { ...t, ...fields } : t)),
    );

  const all = Object.values(data).flat();
  const done = all.filter((t) => t.status === "Done").length;
  const inProgress = all.filter((t) => t.status === "In Progress").length;

  return (
    <div className="mx-auto max-w-6xl p-4">
      <p className="mb-3 text-sm text-ink-soft">
        Annual once-a-year tasks. {done} done · {inProgress} in progress ·{" "}
        {all.length} total.
      </p>
      <div className="scroll-x overflow-hidden rounded-xl bg-white shadow">
        <table className="w-full min-w-[820px] border-collapse text-sm">
          <thead>
            <tr className="text-white" style={{ background: BRAND.orange.base }}>
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
            {YEARLY_SECTIONS.map((section) => {
              const tasks = data[section.name] ?? [];
              return (
                <Fragment key={section.name}>
                  <tr>
                    <td
                      colSpan={7}
                      className="px-3 py-1.5 text-xs font-extrabold uppercase tracking-wide text-white"
                      style={{ background: BRAND[section.color].base }}
                    >
                      {section.name}
                    </td>
                  </tr>
                  {tasks.map((task, i) => (
                    <tr key={task.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="px-2 py-1 text-center text-xs text-ink-soft">{i + 1}</td>
                      <td className="px-1 py-1">
                        <input
                          className="cell-input"
                          value={task.name}
                          placeholder="New task…"
                          onChange={(e) => patch(section.name, task.id, { name: e.target.value })}
                        />
                      </td>
                      <td className="px-1 py-1">
                        <StatusSelect
                          value={task.status}
                          options={STATUS_OPTIONS}
                          colors={STATUS_COLORS}
                          onChange={(v) => patch(section.name, task.id, { status: v as Status })}
                        />
                      </td>
                      <td className="px-1 py-1">
                        <input
                          type="date"
                          className="cell-input"
                          value={task.dateCompleted}
                          onChange={(e) =>
                            patch(section.name, task.id, { dateCompleted: e.target.value })
                          }
                        />
                      </td>
                      <td className="px-1 py-1">
                        <input
                          className="cell-input"
                          value={task.responsible}
                          placeholder="Who?"
                          onChange={(e) =>
                            patch(section.name, task.id, { responsible: e.target.value })
                          }
                        />
                      </td>
                      <td className="px-1 py-1">
                        <input
                          className="cell-input"
                          value={task.notes}
                          placeholder="Notes…"
                          onChange={(e) => patch(section.name, task.id, { notes: e.target.value })}
                        />
                      </td>
                      <td className="px-1 text-center">
                        <button
                          onClick={() =>
                            update(section.name, (ts) => ts.filter((t) => t.id !== task.id))
                          }
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
                        onClick={() =>
                          update(section.name, (ts) => [
                            ...ts,
                            {
                              id: makeId(),
                              name: "",
                              status: "—",
                              dateCompleted: "",
                              responsible: "",
                              notes: "",
                            },
                          ])
                        }
                        className="text-xs font-bold text-ink-soft hover:text-orange"
                      >
                        + Add task
                      </button>
                    </td>
                  </tr>
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
