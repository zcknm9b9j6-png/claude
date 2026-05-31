import { useState } from "react";
import { BRAND, type BrandColor } from "../brand";
import { makeId, usePersistentState } from "../lib/storage";
import { autoEventsForDate } from "../lib/holidays";
import { parseISO, termForDate, toISO, type TermConfig } from "../lib/terms";

interface CalEvent {
  id: string;
  date: string; // ISO yyyy-mm-dd
  time: string;
  title: string;
  description: string;
  link: string;
  image: string; // data URL or ""
  color: BrandColor;
  archived: boolean;
}

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const PALETTE: BrandColor[] = ["teal", "purple", "blue", "lime", "pink"];
const TERM_COLOR: Record<number, BrandColor> = { 1: "teal", 2: "purple", 3: "blue", 4: "pink" };

function mondayIndex(date: Date): number {
  return (date.getDay() + 6) % 7;
}

// Older saved events may lack new fields — fill defaults.
function normalize(e: Partial<CalEvent>): CalEvent {
  return {
    id: e.id ?? makeId(),
    date: e.date ?? "",
    time: e.time ?? "",
    title: e.title ?? "",
    description: e.description ?? "",
    link: e.link ?? "",
    image: e.image ?? "",
    color: e.color ?? "teal",
    archived: e.archived ?? false,
  };
}

export default function CalendarView({ config }: { config: TermConfig }) {
  const today = new Date();
  const [rawEvents, setEvents] = usePersistentState<CalEvent[]>("calendar", []);
  const [view, setView] = useState({ year: today.getFullYear(), month: today.getMonth() });
  const [editing, setEditing] = useState<CalEvent | null>(null);
  const [showArchived, setShowArchived] = useState(false);

  const events = rawEvents.map(normalize);

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
  const jumpToTerm = (startIso: string) => {
    const d = parseISO(startIso);
    setView({ year: d.getFullYear(), month: d.getMonth() });
  };

  const newEvent = (iso: string): CalEvent =>
    normalize({ date: iso, color: "teal" });

  const save = (ev: CalEvent) => {
    setEvents((es) => (es.some((e) => e.id === ev.id) ? es.map((e) => (e.id === ev.id ? ev : e)) : [...es, ev]));
    setEditing(null);
  };
  const del = (id: string) => {
    setEvents((es) => es.filter((e) => e.id !== id));
    setEditing(null);
  };

  const monthList = events
    .filter((e) => {
      const d = parseISO(e.date);
      return d.getFullYear() === view.year && d.getMonth() === view.month && e.archived === showArchived;
    })
    .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));

  return (
    <div className="mx-auto max-w-6xl space-y-4 p-4">
      {/* Term selector */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm text-ink-soft">Jump to term:</span>
        {config.terms.map((t) => (
          <button
            key={t.id}
            onClick={() => jumpToTerm(t.start)}
            className="rounded-full px-3 py-1 text-xs font-bold text-white"
            style={{ background: BRAND[TERM_COLOR[t.id]].base }}
          >
            {t.label}
          </button>
        ))}
        <button
          onClick={() => setView({ year: today.getFullYear(), month: today.getMonth() })}
          className="rounded-full border border-gray-300 px-3 py-1 text-xs font-bold text-ink-soft hover:bg-gray-50"
        >
          Today
        </button>
      </div>

      {/* Month grid */}
      <div className="rounded-xl bg-white p-4 shadow">
        <div className="mb-3 flex items-center justify-between">
          <button onClick={() => move(-1)} className="rounded-full px-3 py-1 text-lg font-bold text-ink-soft hover:bg-gray-100">‹</button>
          <h2 className="text-lg font-extrabold" style={{ color: BRAND.pink.base }}>
            {MONTHS[view.month]} {view.year}
          </h2>
          <button onClick={() => move(1)} className="rounded-full px-3 py-1 text-lg font-bold text-ink-soft hover:bg-gray-100">›</button>
        </div>

        <div className="grid grid-cols-7 gap-1">
          {WEEKDAYS.map((d) => (
            <div key={d} className="pb-1 text-center text-[11px] font-bold text-ink-soft">{d}</div>
          ))}
          {cells.map((date, i) => {
            if (!date) return <div key={i} />;
            const iso = toISO(date);
            const term = termForDate(config, date);
            const isToday = iso === toISO(today);
            const dayEvents = events.filter((e) => e.date === iso && !e.archived);
            const autoDay = autoEventsForDate(config, iso);
            return (
              <button
                key={i}
                onClick={() => setEditing(newEvent(iso))}
                className="flex min-h-[78px] flex-col rounded-lg border p-1 text-left transition-shadow hover:shadow"
                style={{ background: term ? BRAND[TERM_COLOR[term.id]].tint : "#fafafa", borderColor: "transparent" }}
              >
                <span
                  className="text-xs font-bold"
                  style={{
                    color: isToday ? "#fff" : "#1C1533",
                    background: isToday ? BRAND.pink.base : "transparent",
                    borderRadius: 9999, width: 20, height: 20, display: "grid", placeItems: "center",
                  }}
                >
                  {date.getDate()}
                </span>
                <div className="mt-0.5 flex flex-col gap-0.5">
                  {autoDay.map((e, j) => (
                    <span
                      key={`a${j}`}
                      className="truncate rounded px-1 text-[10px] font-semibold text-white"
                      style={{ background: e.kind === "holiday" ? BRAND.pink.shade : BRAND.blue.base }}
                    >
                      {e.title}
                    </span>
                  ))}
                  {dayEvents.slice(0, 3).map((e) => (
                    <span
                      key={e.id}
                      onClick={(ev) => { ev.stopPropagation(); setEditing(e); }}
                      className="truncate rounded px-1 text-[10px] font-semibold text-white"
                      style={{ background: BRAND[e.color].base }}
                    >
                      {e.time && `${e.time} `}{e.title || "(untitled)"}
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
              <span className="inline-block h-3 w-3 rounded" style={{ background: BRAND[TERM_COLOR[t.id]].tint }} />
              {t.label}
            </span>
          ))}
          <span className="inline-flex items-center gap-1">
            <span className="inline-block h-3 w-3 rounded" style={{ background: BRAND.pink.shade }} />
            NSW holiday
          </span>
        </div>
      </div>

      {/* Month event list + archive toggle */}
      <div className="flex items-center justify-between">
        <h3 className="font-extrabold text-ink">
          {showArchived ? "Archived events" : "Events this month"}
        </h3>
        <button onClick={() => setShowArchived((s) => !s)} className="text-sm font-bold text-ink-soft hover:text-pink">
          {showArchived ? "← Back to active" : "View archived"}
        </button>
      </div>
      <div className="space-y-2">
        {monthList.length === 0 && (
          <p className="text-sm text-ink-soft">
            {showArchived ? "No archived events." : "No events yet — tap a day to add one."}
          </p>
        )}
        {monthList.map((e) => (
          <button
            key={e.id}
            onClick={() => setEditing(e)}
            className="flex w-full items-center gap-3 rounded-lg bg-white p-3 text-left shadow-sm hover:shadow"
          >
            <span className="h-8 w-1.5 rounded-full" style={{ background: BRAND[e.color].base }} />
            <div className="text-sm font-bold text-ink-soft">
              {e.date.slice(8)}/{e.date.slice(5, 7)}
            </div>
            <div className="flex-1">
              <div className="font-bold text-ink">{e.title || "(untitled)"}</div>
              {e.time && <div className="text-xs text-ink-soft">{e.time}</div>}
            </div>
            {e.image && <img src={e.image} alt="" className="h-8 w-8 rounded object-cover" />}
          </button>
        ))}
      </div>

      {editing && (
        <EventEditor ev={editing} onSave={save} onDelete={del} onClose={() => setEditing(null)} />
      )}
    </div>
  );
}

function EventEditor({
  ev,
  onSave,
  onDelete,
  onClose,
}: {
  ev: CalEvent;
  onSave: (e: CalEvent) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
}) {
  const [draft, setDraft] = useState<CalEvent>(ev);
  const set = (p: Partial<CalEvent>) => setDraft((d) => ({ ...d, ...p }));

  const onImage = (file?: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => set({ image: String(reader.result) });
    reader.readAsDataURL(file);
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-start justify-center overflow-y-auto bg-black/40 p-4" onClick={onClose}>
      <div className="my-8 w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <h3 className="mb-4 text-lg font-extrabold" style={{ color: BRAND.pink.base }}>Event</h3>
        <div className="space-y-3 text-sm">
          <input
            value={draft.title}
            placeholder="Title"
            onChange={(e) => set({ title: e.target.value })}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-pink"
          />
          <div className="grid grid-cols-2 gap-3">
            <input type="date" value={draft.date} onChange={(e) => set({ date: e.target.value })} className="rounded-lg border border-gray-300 px-3 py-2 outline-none" />
            <input type="time" value={draft.time} onChange={(e) => set({ time: e.target.value })} className="rounded-lg border border-gray-300 px-3 py-2 outline-none" />
          </div>
          <textarea
            value={draft.description}
            placeholder="Description / notes"
            rows={3}
            onChange={(e) => set({ description: e.target.value })}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none"
          />
          <input
            value={draft.link}
            placeholder="Link (https://…)"
            onChange={(e) => set({ link: e.target.value })}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none"
          />
          {draft.link && (
            <a href={draft.link} target="_blank" rel="noreferrer" className="block font-bold text-teal">Open link ↗</a>
          )}
          <div>
            <input type="file" accept="image/*" onChange={(e) => onImage(e.target.files?.[0])} className="text-xs" />
            {draft.image && (
              <div className="mt-2">
                <img src={draft.image} alt="" className="max-h-40 rounded-lg" />
                <button onClick={() => set({ image: "" })} className="mt-1 block text-xs font-bold text-ink-soft hover:text-pink">Remove image</button>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-ink-soft">Colour:</span>
            {PALETTE.map((c) => (
              <button
                key={c}
                onClick={() => set({ color: c })}
                className="h-6 w-6 rounded-full"
                style={{ background: BRAND[c].base, outline: draft.color === c ? `2px solid ${BRAND[c].shade}` : "none", outlineOffset: 2 }}
                aria-label={c}
              />
            ))}
          </div>
          <label className="flex items-center gap-2 text-ink-soft">
            <input type="checkbox" checked={draft.archived} onChange={(e) => set({ archived: e.target.checked })} />
            Archived
          </label>
        </div>

        <div className="mt-6 flex items-center justify-between">
          <button onClick={() => onDelete(draft.id)} className="text-sm font-bold text-ink-soft hover:text-pink">Delete</button>
          <div className="flex gap-2">
            <button onClick={onClose} className="rounded-full px-4 py-1.5 text-sm font-bold text-ink-soft hover:bg-gray-100">Cancel</button>
            <button onClick={() => onSave(draft)} className="pill" style={{ background: BRAND.pink.base }}>Save</button>
          </div>
        </div>
      </div>
    </div>
  );
}
