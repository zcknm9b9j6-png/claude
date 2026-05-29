import { useState } from "react";
import { BRAND, type BrandColor } from "../brand";
import { makeId, usePersistentState } from "../lib/storage";
import {
  formatLong,
  parseISO,
  termForDate,
  termStatus,
  toISO,
  type TermConfig,
} from "../lib/terms";

interface CalEvent {
  id: string;
  date: string; // ISO
  title: string;
  color: BrandColor;
}

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const PALETTE: BrandColor[] = ["teal", "purple", "orange", "lime", "pink"];

// Each term gets a brand colour for its calendar band, matching the tab colours.
const TERM_COLOR: Record<number, BrandColor> = { 1: "teal", 2: "purple", 3: "orange", 4: "pink" };

/** Monday-based column index (0 = Monday … 6 = Sunday). */
function mondayIndex(date: Date): number {
  return (date.getDay() + 6) % 7;
}

export default function CalendarView({ config }: { config: TermConfig }) {
  const today = new Date();
  const [events, setEvents] = usePersistentState<CalEvent[]>("calendar", []);
  const [view, setView] = useState({ year: today.getFullYear(), month: today.getMonth() });
  const [selected, setSelected] = useState<string>(toISO(today));
  const [draft, setDraft] = useState({ title: "", color: "teal" as BrandColor });

  const first = new Date(view.year, view.month, 1);
  const daysInMonth = new Date(view.year, view.month + 1, 0).getDate();
  const lead = mondayIndex(first);
  const cells: (Date | null)[] = [
    ...Array.from({ length: lead }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => new Date(view.year, view.month, i + 1)),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  const move = (delta: number) => {
    const d = new Date(view.year, view.month + delta, 1);
    setView({ year: d.getFullYear(), month: d.getMonth() });
  };

  const eventsOn = (iso: string) => events.filter((e) => e.date === iso);

  const addEvent = () => {
    if (!draft.title.trim()) return;
    setEvents((es) => [
      ...es,
      { id: makeId(), date: selected, title: draft.title.trim(), color: draft.color },
    ]);
    setDraft({ title: "", color: draft.color });
  };

  const selectedDate = parseISO(selected);
  const selTerm = termForDate(config, selectedDate);
  const selStatus = termStatus(config, selectedDate);

  return (
    <div className="mx-auto grid max-w-6xl gap-4 p-4 lg:grid-cols-[1fr_320px]">
      {/* Calendar grid */}
      <div className="rounded-xl bg-white p-4 shadow">
        <div className="mb-3 flex items-center justify-between">
          <button
            onClick={() => move(-1)}
            className="rounded-full px-3 py-1 text-lg font-bold text-ink-soft hover:bg-gray-100"
          >
            ‹
          </button>
          <h2 className="text-lg font-extrabold" style={{ color: BRAND.pink.base }}>
            {MONTHS[view.month]} {view.year}
          </h2>
          <button
            onClick={() => move(1)}
            className="rounded-full px-3 py-1 text-lg font-bold text-ink-soft hover:bg-gray-100"
          >
            ›
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1">
          {WEEKDAYS.map((d) => (
            <div key={d} className="pb-1 text-center text-[11px] font-bold text-ink-soft">
              {d}
            </div>
          ))}
          {cells.map((date, i) => {
            if (!date) return <div key={i} />;
            const iso = toISO(date);
            const term = termForDate(config, date);
            const isToday = iso === toISO(today);
            const isSelected = iso === selected;
            const dayEvents = eventsOn(iso);
            return (
              <button
                key={i}
                onClick={() => setSelected(iso)}
                className="flex min-h-[64px] flex-col rounded-lg border p-1 text-left transition-shadow hover:shadow"
                style={{
                  background: term ? BRAND[TERM_COLOR[term.id]].tint : "#fafafa",
                  borderColor: isSelected ? BRAND.pink.base : "transparent",
                  borderWidth: isSelected ? 2 : 1,
                }}
              >
                <span
                  className="text-xs font-bold"
                  style={{
                    color: isToday ? "#fff" : "#1C1533",
                    background: isToday ? BRAND.pink.base : "transparent",
                    borderRadius: 9999,
                    width: 20,
                    height: 20,
                    display: "grid",
                    placeItems: "center",
                  }}
                >
                  {date.getDate()}
                </span>
                <div className="mt-0.5 flex flex-col gap-0.5">
                  {dayEvents.slice(0, 3).map((e) => (
                    <span
                      key={e.id}
                      className="truncate rounded px-1 text-[10px] font-semibold text-white"
                      style={{ background: BRAND[e.color].base }}
                    >
                      {e.title}
                    </span>
                  ))}
                  {dayEvents.length > 3 && (
                    <span className="text-[10px] text-ink-soft">+{dayEvents.length - 3} more</span>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        <div className="mt-3 flex flex-wrap gap-3 text-[11px] text-ink-soft">
          {config.terms.map((t) => (
            <span key={t.id} className="inline-flex items-center gap-1">
              <span
                className="inline-block h-3 w-3 rounded"
                style={{ background: BRAND[TERM_COLOR[t.id]].tint }}
              />
              {t.label}
            </span>
          ))}
        </div>
      </div>

      {/* Selected day panel */}
      <aside className="rounded-xl bg-white p-4 shadow">
        <h3 className="font-extrabold text-ink">{formatLong(selectedDate)}</h3>
        <p className="mb-3 text-xs text-ink-soft">
          {selTerm
            ? `${selTerm.label} · Week ${selStatus.week} · Day ${selStatus.day}`
            : "Outside school term"}
        </p>

        <div className="space-y-1">
          {eventsOn(selected).length === 0 && (
            <p className="text-sm text-ink-soft">No events yet.</p>
          )}
          {eventsOn(selected).map((e) => (
            <div
              key={e.id}
              className="flex items-center justify-between rounded-lg px-2 py-1 text-sm text-white"
              style={{ background: BRAND[e.color].base }}
            >
              <span className="truncate">{e.title}</span>
              <button
                onClick={() => setEvents((es) => es.filter((x) => x.id !== e.id))}
                className="ml-2 text-white/80 hover:text-white"
              >
                ✕
              </button>
            </div>
          ))}
        </div>

        <div className="mt-4 border-t border-gray-100 pt-3">
          <input
            value={draft.title}
            onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
            onKeyDown={(e) => e.key === "Enter" && addEvent()}
            placeholder="Add an event / reminder…"
            className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm outline-none focus:border-pink"
          />
          <div className="mt-2 flex items-center justify-between">
            <div className="flex gap-1">
              {PALETTE.map((c) => (
                <button
                  key={c}
                  onClick={() => setDraft((d) => ({ ...d, color: c }))}
                  className="h-6 w-6 rounded-full"
                  style={{
                    background: BRAND[c].base,
                    outline: draft.color === c ? `2px solid ${BRAND[c].shade}` : "none",
                    outlineOffset: 2,
                  }}
                  aria-label={c}
                />
              ))}
            </div>
            <button onClick={addEvent} className="pill" style={{ background: BRAND.pink.base }}>
              Add
            </button>
          </div>
        </div>
      </aside>
    </div>
  );
}
