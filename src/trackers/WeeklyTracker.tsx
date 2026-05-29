import { BRAND, type BrandColor } from "../brand";
import { DoneToggle } from "../components/controls";
import { makeId, usePersistentState } from "../lib/storage";
import {
  formatShort,
  type Term,
  type TermConfig,
  type TermId,
  weeksInTerm,
  weekStartDate,
} from "../lib/terms";

interface Task {
  id: string;
  name: string;
  done: Record<number, boolean>;
}
type Data = Record<TermId, Task[]>;

const TERM_COLORS: Record<TermId, BrandColor> = {
  1: "teal",
  2: "purple",
  3: "orange",
  4: "pink",
};

function emptyRows(n: number): Task[] {
  return Array.from({ length: n }, () => ({ id: makeId(), name: "", done: {} }));
}

function seed(): Data {
  return { 1: emptyRows(15), 2: emptyRows(15), 3: emptyRows(15), 4: emptyRows(15) };
}

export default function WeeklyTracker({ config }: { config: TermConfig }) {
  const [data, setData] = usePersistentState<Data>("weekly", seed);
  const maxWeeks = Math.max(...config.terms.map(weeksInTerm));

  const update = (term: TermId, fn: (tasks: Task[]) => Task[]) =>
    setData((d) => ({ ...d, [term]: fn(d[term] ?? []) }));

  return (
    <div className="mx-auto max-w-6xl p-4">
      <p className="mb-3 text-sm text-ink-soft">
        Recurring weekly tasks per term. Tick a week when it's done — weeks
        outside a term are greyed out.
      </p>
      <div className="space-y-6">
        {config.terms.map((term) => (
          <TermBlock
            key={term.id}
            term={term}
            color={TERM_COLORS[term.id]}
            maxWeeks={maxWeeks}
            tasks={data[term.id] ?? []}
            onToggle={(id, wk) =>
              update(term.id, (tasks) =>
                tasks.map((t) =>
                  t.id === id ? { ...t, done: { ...t.done, [wk]: !t.done[wk] } } : t,
                ),
              )
            }
            onRename={(id, name) =>
              update(term.id, (tasks) =>
                tasks.map((t) => (t.id === id ? { ...t, name } : t)),
              )
            }
            onAdd={() =>
              update(term.id, (tasks) => [
                ...tasks,
                { id: makeId(), name: "", done: {} },
              ])
            }
            onRemove={(id) =>
              update(term.id, (tasks) => tasks.filter((t) => t.id !== id))
            }
          />
        ))}
      </div>
    </div>
  );
}

interface BlockProps {
  term: Term;
  color: BrandColor;
  maxWeeks: number;
  tasks: Task[];
  onToggle: (id: string, week: number) => void;
  onRename: (id: string, name: string) => void;
  onAdd: () => void;
  onRemove: (id: string) => void;
}

function TermBlock({
  term,
  color,
  maxWeeks,
  tasks,
  onToggle,
  onRename,
  onAdd,
  onRemove,
}: BlockProps) {
  const termWeeks = weeksInTerm(term);
  const weeks = Array.from({ length: maxWeeks }, (_, i) => i + 1);

  const totals = weeks.map((wk) =>
    wk > termWeeks ? null : tasks.reduce((n, t) => n + (t.done[wk] ? 1 : 0), 0),
  );

  return (
    <div className="scroll-x overflow-hidden rounded-xl bg-white shadow">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="text-white" style={{ background: BRAND[color].base }}>
            <th className="sticky left-0 z-10 min-w-[220px] px-3 py-2 text-left font-extrabold"
                style={{ background: BRAND[color].base }}>
              {term.label}
            </th>
            {weeks.map((wk) => {
              const out = wk > termWeeks;
              return (
                <th
                  key={wk}
                  className="min-w-[56px] px-1 py-1 text-center text-[11px] font-bold"
                  style={{ opacity: out ? 0.35 : 1 }}
                >
                  <div>Wk {wk}</div>
                  {!out && (
                    <div className="font-normal opacity-90">
                      {formatShort(weekStartDate(term, wk)).replace(/^\w+,?\s?/, "")}
                    </div>
                  )}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {tasks.map((task) => (
            <tr key={task.id} className="border-b border-gray-100 hover:bg-gray-50">
              <td className="sticky left-0 z-10 bg-white px-1 py-1">
                <div className="flex items-center">
                  <input
                    className="cell-input"
                    value={task.name}
                    placeholder="New task…"
                    onChange={(e) => onRename(task.id, e.target.value)}
                  />
                  <button
                    onClick={() => onRemove(task.id)}
                    className="px-1 text-ink-soft/40 hover:text-pink"
                    title="Delete row"
                  >
                    ✕
                  </button>
                </div>
              </td>
              {weeks.map((wk) => {
                const out = wk > termWeeks;
                return (
                  <td
                    key={wk}
                    className="px-1 py-1"
                    style={{ background: out ? "#f3f3f5" : undefined }}
                  >
                    {!out && (
                      <DoneToggle
                        done={!!task.done[wk]}
                        onToggle={() => onToggle(task.id, wk)}
                      />
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
          <tr>
            <td className="sticky left-0 z-10 bg-white px-3 py-1">
              <button
                onClick={onAdd}
                className="text-xs font-bold text-ink-soft hover:text-ink"
                style={{ color: BRAND[color].shade }}
              >
                + Add task
              </button>
            </td>
            <td colSpan={maxWeeks} />
          </tr>
        </tbody>
        <tfoot>
          <tr style={{ background: BRAND[color].tint }}>
            <td className="sticky left-0 z-10 px-3 py-1.5 text-right text-xs font-bold"
                style={{ background: BRAND[color].tint }}>
              Done this week
            </td>
            {totals.map((n, i) => (
              <td
                key={i}
                className="px-1 py-1.5 text-center text-xs font-extrabold"
                style={{ color: BRAND[color].shade }}
              >
                {n ?? ""}
              </td>
            ))}
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
