import { BRAND } from "../brand";
import { DoneToggle } from "../components/controls";
import { TERM_SECTIONS, TERM_TASKS } from "../data/seed";
import { makeId, usePersistentState } from "../lib/storage";
import type { TermConfig, TermId } from "../lib/terms";

interface Task {
  id: string;
  name: string;
  done: Partial<Record<TermId, boolean>>;
}
type Data = Record<string, Task[]>;

const TERM_IDS: TermId[] = [1, 2, 3, 4];

function seed(): Data {
  const d: Data = {};
  for (const s of TERM_SECTIONS) {
    d[s.name] = (TERM_TASKS[s.name] ?? []).map((name) => ({
      id: makeId(),
      name,
      done: {},
    }));
  }
  return d;
}

export default function TermTracker({ config }: { config: TermConfig }) {
  const [data, setData] = usePersistentState<Data>("term", seed);

  const update = (section: string, fn: (tasks: Task[]) => Task[]) =>
    setData((d) => ({ ...d, [section]: fn(d[section] ?? []) }));

  const toggle = (section: string, id: string, term: TermId) =>
    update(section, (tasks) =>
      tasks.map((t) =>
        t.id === id ? { ...t, done: { ...t.done, [term]: !t.done[term] } } : t,
      ),
    );

  const rename = (section: string, id: string, name: string) =>
    update(section, (tasks) => tasks.map((t) => (t.id === id ? { ...t, name } : t)));

  const add = (section: string) =>
    update(section, (tasks) => [...tasks, { id: makeId(), name: "", done: {} }]);

  const remove = (section: string, id: string) =>
    update(section, (tasks) => tasks.filter((t) => t.id !== id));

  const totals = TERM_IDS.map((term) =>
    Object.values(data)
      .flat()
      .reduce((n, t) => n + (t.done[term] ? 1 : 0), 0),
  );
  const totalRows = Object.values(data).flat().length;

  return (
    <div className="mx-auto max-w-5xl p-4">
      <p className="mb-3 text-sm text-ink-soft">
        One tick per term for recurring work. Tick each term column as you
        complete it.
      </p>
      <div className="scroll-x overflow-hidden rounded-xl bg-white shadow">
        <table className="w-full min-w-[640px] border-collapse text-sm">
          <thead>
            <tr className="text-white" style={{ background: BRAND.purple.base }}>
              <th className="w-12 px-2 py-2 text-left font-bold">#</th>
              <th className="px-3 py-2 text-left font-bold">Task</th>
              {config.terms.map((t) => (
                <th key={t.id} className="w-20 px-2 py-2 text-center font-bold">
                  T{t.id}
                </th>
              ))}
              <th className="w-10" />
            </tr>
          </thead>
          <tbody>
            {TERM_SECTIONS.map((section, si) => {
              const tasks = data[section.name] ?? [];
              return (
                <SectionGroup key={section.name + si} name={section.name} color={section.color}>
                  {tasks.map((task, i) => (
                    <tr key={task.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="px-2 py-1 text-center text-xs text-ink-soft">{i + 1}</td>
                      <td className="px-1 py-1">
                        <input
                          className="cell-input"
                          value={task.name}
                          placeholder="New task…"
                          onChange={(e) => rename(section.name, task.id, e.target.value)}
                        />
                      </td>
                      {TERM_IDS.map((term) => (
                        <td key={term} className="px-2 py-1">
                          <DoneToggle
                            done={!!task.done[term]}
                            onToggle={() => toggle(section.name, task.id, term)}
                          />
                        </td>
                      ))}
                      <td className="px-1 text-center">
                        <button
                          onClick={() => remove(section.name, task.id)}
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
                        onClick={() => add(section.name)}
                        className="text-xs font-bold text-ink-soft hover:text-purple"
                      >
                        + Add task
                      </button>
                    </td>
                  </tr>
                </SectionGroup>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="text-white" style={{ background: BRAND.purple.shade }}>
              <td colSpan={2} className="px-3 py-2 text-right font-bold">
                Tasks complete ({totalRows} total)
              </td>
              {totals.map((n, i) => (
                <td key={i} className="px-2 py-2 text-center font-extrabold">
                  {n}
                </td>
              ))}
              <td />
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}

function SectionGroup({
  name,
  color,
  children,
}: {
  name: string;
  color: keyof typeof BRAND;
  children: React.ReactNode;
}) {
  return (
    <>
      <tr>
        <td
          colSpan={7}
          className="px-3 py-1.5 text-xs font-extrabold uppercase tracking-wide text-white"
          style={{ background: BRAND[color].base }}
        >
          {name}
        </td>
      </tr>
      {children}
    </>
  );
}
