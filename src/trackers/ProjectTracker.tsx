import { BRAND } from "../brand";
import { StatusSelect } from "../components/controls";
import { makeId, usePersistentState } from "../lib/storage";

type Status = "Not Started" | "Active" | "On Hold" | "Complete" | "Overdue";
type Priority = "High" | "Medium" | "Low";

interface Project {
  id: string;
  name: string;
  category: string;
  status: Status;
  priority: Priority;
  started: string;
  target: string;
  update: string;
}

const STATUS_OPTIONS: Status[] = ["Not Started", "Active", "On Hold", "Complete", "Overdue"];
const STATUS_COLORS: Record<string, string> = {
  Active: BRAND.teal.base,
  "On Hold": "#F0A814",
  Complete: BRAND.lime.base,
  "Not Started": "#9a96a8",
  Overdue: BRAND.pink.base,
};

const PRIORITY_OPTIONS: Priority[] = ["High", "Medium", "Low"];
const PRIORITY_COLORS: Record<string, string> = {
  High: BRAND.pink.base,
  Medium: BRAND.orange.base,
  Low: BRAND.teal.base,
};

function blankRow(): Project {
  return {
    id: makeId(),
    name: "",
    category: "",
    status: "Not Started",
    priority: "Medium",
    started: "",
    target: "",
    update: "",
  };
}

function seed(): Project[] {
  return Array.from({ length: 8 }, blankRow);
}

export default function ProjectTracker() {
  const [rows, setRows] = usePersistentState<Project[]>("projects", seed);

  const patch = (id: string, fields: Partial<Project>) =>
    setRows((rs) => rs.map((r) => (r.id === id ? { ...r, ...fields } : r)));

  const active = rows.filter((r) => r.status === "Active").length;
  const complete = rows.filter((r) => r.status === "Complete").length;

  return (
    <div className="mx-auto max-w-6xl p-4">
      <p className="mb-3 text-sm text-ink-soft">
        One-off projects and initiatives. {active} active · {complete} complete.
      </p>
      <div className="scroll-x overflow-hidden rounded-xl bg-white shadow">
        <table className="w-full min-w-[900px] border-collapse text-sm">
          <thead>
            <tr className="text-white" style={{ background: BRAND.lime.base }}>
              <th className="w-10 px-2 py-2 text-left font-bold">#</th>
              <th className="px-3 py-2 text-left font-bold">Project name</th>
              <th className="w-36 px-2 py-2 text-left font-bold">Category</th>
              <th className="w-32 px-2 py-2 text-left font-bold">Status</th>
              <th className="w-28 px-2 py-2 text-left font-bold">Priority</th>
              <th className="w-32 px-2 py-2 text-left font-bold">Started</th>
              <th className="w-32 px-2 py-2 text-left font-bold">Target</th>
              <th className="px-2 py-2 text-left font-bold">Latest update / actions</th>
              <th className="w-10" />
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={r.id} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="px-2 py-1 text-center text-xs text-ink-soft">{i + 1}</td>
                <td className="px-1 py-1">
                  <input
                    className="cell-input"
                    value={r.name}
                    placeholder="New project…"
                    onChange={(e) => patch(r.id, { name: e.target.value })}
                  />
                </td>
                <td className="px-1 py-1">
                  <input
                    className="cell-input"
                    value={r.category}
                    placeholder="Category"
                    onChange={(e) => patch(r.id, { category: e.target.value })}
                  />
                </td>
                <td className="px-1 py-1">
                  <StatusSelect
                    value={r.status}
                    options={STATUS_OPTIONS}
                    colors={STATUS_COLORS}
                    onChange={(v) => patch(r.id, { status: v as Status })}
                  />
                </td>
                <td className="px-1 py-1">
                  <StatusSelect
                    value={r.priority}
                    options={PRIORITY_OPTIONS}
                    colors={PRIORITY_COLORS}
                    onChange={(v) => patch(r.id, { priority: v as Priority })}
                  />
                </td>
                <td className="px-1 py-1">
                  <input
                    type="date"
                    className="cell-input"
                    value={r.started}
                    onChange={(e) => patch(r.id, { started: e.target.value })}
                  />
                </td>
                <td className="px-1 py-1">
                  <input
                    type="date"
                    className="cell-input"
                    value={r.target}
                    onChange={(e) => patch(r.id, { target: e.target.value })}
                  />
                </td>
                <td className="px-1 py-1">
                  <input
                    className="cell-input"
                    value={r.update}
                    placeholder="Latest update…"
                    onChange={(e) => patch(r.id, { update: e.target.value })}
                  />
                </td>
                <td className="px-1 text-center">
                  <button
                    onClick={() => setRows((rs) => rs.filter((x) => x.id !== r.id))}
                    className="text-ink-soft/50 hover:text-pink"
                    title="Delete row"
                  >
                    ✕
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <button
        onClick={() => setRows((rs) => [...rs, blankRow()])}
        className="mt-3 pill"
        style={{ background: BRAND.lime.base }}
      >
        + Add project
      </button>
    </div>
  );
}
