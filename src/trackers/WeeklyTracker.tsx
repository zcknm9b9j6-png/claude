import { useEffect, useRef } from "react";
import { BRAND, type BrandColor } from "../brand";
import { DoneToggle } from "../components/controls";
import { makeId, usePersistentState } from "../lib/storage";
import {
  formatShort,
  type Term,
  type TermConfig,
  type TermId,
  termStatus,
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
  3: "pink",
  4: "orange",
};

function emptyRows(n: number): Task[] {
  return Array.from({ length: n }, () => ({ id: makeId(), name: "", done: {} }));
}
function seed(): Data {
  return { 1: emptyRows(15), 2: emptyRows(15), 3: emptyRows(15), 4: emptyRows(15) };
}

export default function WeeklyTracker({ config, jumpSignal }: { config: TermConfig; jumpSignal?: number }) {
  const [data, setData] = usePersistentState<Data>("weekly", seed);
  const maxWeeks = Math.max(...config.terms.map(weeksInTerm));
  const status = termStatus(config);
  const currentRef = useRef<HTMLDivElement>(null);

  const scrollToCurrent = () =>
    currentRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });

  // Scroll when the header's "Jump to current term" button fires.
  useEffect(() => {
    if (jumpSignal) scrollToCurrent();
  }, [jumpSignal]);

  const update = (term: TermId, fn: (tasks: Task[]) => Task[]) =>
    setData((d) => ({ ...d, [term]: fn(d[term] ?? []) }));

  return (
    <div className="mx-auto max-w-6xl p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="text-sm text-ink-soft">
          Recurring weekly tasks per term. Tick a week when it's done.
        </p>
        {status.term && (
          <button onClick={scrollToCurrent} className="pill shrink-0" style={{ background: BRAND.orange.base }}>
            Jump to {status.term.label} ↓
          </button>
        )}
      </div>

      <div className="space-y-6">
        {config.terms.map((term) => {
          const isCurrent = status.term?.id === term.id;
          return (
            <div key={term.id} ref={isCurrent ? currentRef : undefined}>
              <TermBlock
                term={term}
                color={TERM_COLORS[term.id]}
                maxWeeks={maxWeeks}
                currentWeek={isCurrent ? status.week : null}
                tasks={data[term.id] ?? []}
                onToggle={(id, wk) =>
                  update(term.id, (tasks) =>
                    tasks.map((t) => (t.id === id ? { ...t, done: { ...t.done, [wk]: !t.done[wk] } } : t)),
                  )
                }
                onRename={(id, name) =>
                  update(term.id, (tasks) => tasks.map((t) => (t.id === id ? { ...t, name } : t)))
                }
                onAdd={() => update(term.id, (tasks) => [...tasks, { id: makeId(), name: "", done: {} }])}
                onRemove={(id) => update(term.id, (tasks) => tasks.filter((t) => t.id !== id))}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

interface BlockProps {
  term: Term;
  color: BrandColor;
  maxWeeks: number;
  currentWeek: number | null;
  tasks: Task[];
  onToggle: (id: string, week: number) => void;
  onRename: (id: string, name: string) => void;
  onAdd: () => void;
  onRemove: (id: string) => void;
}

function TermBlock({ term, color, maxWeeks, currentWeek, tasks, onToggle, onRename, onAdd, onRemove }: BlockProps) {
  const termWeeks = weeksInTerm(term);
  const weeks = Array.from({ length: maxWeeks }, (_, i) => i + 1);
  const totals = weeks.map((wk) => (wk > termWeeks ? null : tasks.reduce((n, t) => n + (t.done[wk] ? 1 : 0), 0)));

  return (
    <div className="scroll-x overflow-hidden rounded-xl bg-white shadow">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="text-white" style={{ background: BRAND[color].base }}>
            <th className="sticky left-0 z-10 min-w-[220px] px-3 py-2 text-left font-bold" style={{ background: BRAND[color].base }}>
              {term.label}{currentWeek ? " — current" : ""}
            </th>
            {weeks.map((wk) => {
              const out = wk > termWeeks;
              const isNow = wk === currentWeek;
              return (
                <th key={wk} className="min-w-[56px] px-1 py-1 text-center text-[11px] font-bold"
                    style={{ opacity: out ? 0.35 : 1, background: isNow ? BRAND[color].shade : undefined, outline: isNow ? "2px solid #fff" : undefined }}>
                  <div>Wk {wk}{isNow ? " •" : ""}</div>
                  {!out && <div className="font-normal opacity-90">{formatShort(weekStartDate(term, wk)).replace(/^\w+,?\s?/, "")}</div>}
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
                  <input className="cell-input" value={task.name} placeholder="New task…" onChange={(e) => onRename(task.id, e.target.value)} />
                  <button onClick={() => onRemove(task.id)} className="px-1 text-ink-soft/40 hover:text-pink" title="Delete row">✕</button>
                </div>
              </td>
              {weeks.map((wk) => {
                const out = wk > termWeeks;
                return (
                  <td key={wk} className="px-1 py-1" style={{ background: out ? "#f3f3f5" : wk === currentWeek ? BRAND[color].tint : undefined }}>
                    {!out && <DoneToggle done={!!task.done[wk]} onToggle={() => onToggle(task.id, wk)} />}
                  </td>
                );
              })}
            </tr>
          ))}
          <tr>
            <td className="sticky left-0 z-10 bg-white px-3 py-1">
              <button onClick={onAdd} className="text-xs font-bold" style={{ color: BRAND[color].shade }}>+ Add task</button>
            </td>
            <td colSpan={maxWeeks} />
          </tr>
        </tbody>
        <tfoot>
          <tr style={{ background: BRAND[color].tint }}>
            <td className="sticky left-0 z-10 px-3 py-1.5 text-right text-xs font-bold" style={{ background: BRAND[color].tint }}>Done this week</td>
            {totals.map((n, i) => (
              <td key={i} className="px-1 py-1.5 text-center text-xs font-bold" style={{ color: BRAND[color].shade }}>{n ?? ""}</td>
            ))}
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
