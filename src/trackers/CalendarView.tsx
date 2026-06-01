import { useState } from "react";
import { BRAND, type BrandColor, COLOR_CHOICES } from "../brand";
import { makeId, usePersistentState } from "../lib/storage";
import { autoEventsForDate } from "../lib/holidays";
import { formatLong, parseISO, termForDate, toISO, type TermConfig } from "../lib/terms";

type Repeat = "none" | "weekly" | "fortnightly" | "monthly";

interface CalEvent {
  id: string;
  start: string; // ISO yyyy-mm-dd
  end: string; // ISO yyyy-mm-dd ("" → single day = start)
  time: string;
  title: string;
  description: string;
  link: string;
  fileName: string;
  fileData: string; // data URL or ""
  color: BrandColor;
  archived: boolean;
  repeat: Repeat; // "none" → one-off (the default for all existing events)
  repeatUntil: string; // ISO date the repeat stops on ("" → no end)
}

const REPEAT_OPTIONS: { value: Repeat; label: string }[] = [
  { value: "none", label: "Does not repeat" },
  { value: "weekly", label: "Every week" },
  { value: "fortnightly", label: "Every fortnight" },
  { value: "monthly", label: "Every month" },
];
const REPEAT_LABEL: Record<Repeat, string> = {
  none: "",
  weekly: "Weekly",
  fortnightly: "Fortnightly",
  monthly: "Monthly",
};

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const TERM_COLOR: Record<number, BrandColor> = { 1: "teal", 2: "purple", 3: "pink", 4: "orange" };

function mondayIndex(date: Date): number {
  return (date.getDay() + 6) % 7;
}
function normalize(e: Partial<CalEvent>): CalEvent {
  return {
    id: e.id ?? makeId(),
    start: e.start ?? (e as { date?: string }).date ?? "",
    end: e.end ?? "",
    time: e.time ?? "",
    title: e.title ?? "",
    description: e.description ?? "",
    link: e.link ?? "",
    fileName: e.fileName ?? "",
    fileData: e.fileData ?? "",
    color: e.color ?? "teal",
    archived: e.archived ?? false,
    repeat: e.repeat ?? "none",
    repeatUntil: e.repeatUntil ?? "",
  };
}

// ---- Date helpers for recurrence (all on yyyy-mm-dd strings) ----
const MS_DAY = 86_400_000;
function daysBetween(a: string, b: string): number {
  return Math.round((parseISO(b).getTime() - parseISO(a).getTime()) / MS_DAY);
}
function addDaysIso(iso: string, n: number): string {
  const d = parseISO(iso);
  d.setDate(d.getDate() + n);
  return toISO(d);
}
function addMonthsIso(iso: string, n: number): string {
  const d = parseISO(iso);
  d.setMonth(d.getMonth() + n);
  return toISO(d);
}

/**
 * Start dates of every occurrence of an event whose span overlaps [from, to].
 * A one-off event ("none") yields at most its own start; recurring events are
 * expanded by their interval up to `repeatUntil` (or the range end).
 */
function occurrenceStarts(e: CalEvent, from: string, to: string): string[] {
  const span = Math.max(0, daysBetween(e.start, e.end || e.start));
  const cap = e.repeatUntil;
  const overlaps = (occStart: string) =>
    addDaysIso(occStart, span) >= from && occStart <= to && (!cap || occStart <= cap);

  if (e.repeat === "none") return overlaps(e.start) ? [e.start] : [];

  const out: string[] = [];
  if (e.repeat === "monthly") {
    let cur = e.start;
    for (let i = 0; i < 600 && cur <= to && (!cap || cur <= cap); i++) {
      if (overlaps(cur)) out.push(cur);
      cur = addMonthsIso(cur, 1);
    }
    return out;
  }
  const step = e.repeat === "weekly" ? 7 : 14;
  // Fast-forward to the first occurrence that could still overlap `from`.
  const gap = daysBetween(e.start, addDaysIso(from, -span));
  let cur = gap > 0 ? addDaysIso(e.start, Math.floor(gap / step) * step) : e.start;
  for (let i = 0; i < 1000 && cur <= to && (!cap || cur <= cap); i++) {
    if (overlaps(cur)) out.push(cur);
    cur = addDaysIso(cur, step);
  }
  return out;
}

/** Does an event (or any of its recurrences) cover a given ISO day? */
function covers(e: CalEvent, iso: string): boolean {
  return occurrenceStarts(e, iso, iso).length > 0;
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

  const save = (ev: CalEvent) => {
    setEvents((es) => (es.some((e) => e.id === ev.id) ? es.map((e) => (e.id === ev.id ? ev : e)) : [...es, ev]));
    setEditing(null);
  };
  const del = (id: string) => {
    setEvents((es) => es.filter((e) => e.id !== id));
    setEditing(null);
  };

  // "Next two weeks" rolling list from today. Recurring events are expanded so
  // each occurrence in the window shows as its own row.
  const todayIso = toISO(today);
  const in14 = toISO(new Date(today.getFullYear(), today.getMonth(), today.getDate() + 14));
  const upcoming: { e: CalEvent; start: string }[] = showArchived
    ? events.filter((e) => e.archived).map((e) => ({ e, start: e.start }))
    : events
        .filter((e) => !e.archived)
        .flatMap((e) => occurrenceStarts(e, todayIso, in14).map((start) => ({ e, start })))
        .sort((a, b) => (a.start + a.e.time).localeCompare(b.start + b.e.time));

  return (
    <div className="mx-auto max-w-6xl space-y-4 p-4">
      {/* Term selector */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm text-ink-soft">Jump to term:</span>
        {config.terms.map((t) => (
          <button key={t.id} onClick={() => jumpToTerm(t.start)} className="rounded-full px-3 py-1 text-xs font-bold text-white" style={{ background: BRAND[TERM_COLOR[t.id]].base }}>
            {t.label}
          </button>
        ))}
        <button onClick={() => setView({ year: today.getFullYear(), month: today.getMonth() })} className="rounded-full border border-gray-300 px-3 py-1 text-xs font-bold text-ink-soft hover:bg-gray-50">Today</button>
      </div>

      {/* Month grid */}
      <div className="rounded-xl bg-white p-4 shadow">
        <div className="mb-3 flex items-center justify-between">
          <button onClick={() => move(-1)} className="rounded-full px-3 py-1 text-lg font-bold text-ink-soft hover:bg-gray-100">‹</button>
          <h2 className="font-heading text-lg font-bold" style={{ color: BRAND.pink.base }}>{MONTHS[view.month]} {view.year}</h2>
          <button onClick={() => move(1)} className="rounded-full px-3 py-1 text-lg font-bold text-ink-soft hover:bg-gray-100">›</button>
        </div>

        <div className="grid grid-cols-7 gap-1">
          {WEEKDAYS.map((d) => <div key={d} className="pb-1 text-center text-[11px] font-bold text-ink-soft">{d}</div>)}
          {cells.map((date, i) => {
            if (!date) return <div key={i} />;
            const iso = toISO(date);
            const term = termForDate(config, date);
            const isToday = iso === toISO(today);
            const dayEvents = events.filter((e) => covers(e, iso) && !e.archived);
            const autoDay = autoEventsForDate(config, iso);
            return (
              <button key={i} onClick={() => setEditing(normalize({ start: iso, color: "teal" }))} className="flex min-h-[96px] flex-col rounded-lg border p-1.5 text-left transition-shadow hover:shadow sm:min-h-[116px]" style={{ background: term ? BRAND[TERM_COLOR[term.id]].tint : "#fafafa", borderColor: "transparent" }}>
                <span className="text-sm font-bold" style={{ color: isToday ? "#fff" : "#1C1533", background: isToday ? BRAND.pink.base : "transparent", borderRadius: 9999, width: 24, height: 24, display: "grid", placeItems: "center" }}>{date.getDate()}</span>
                <div className="mt-1 flex flex-col gap-1">
                  {autoDay.map((e, j) => (
                    <span key={`a${j}`} className="truncate rounded px-1.5 py-0.5 text-[11px] font-semibold leading-tight text-white sm:text-xs" style={{ background: e.kind === "holiday" ? BRAND.pink.shade : BRAND.purple.base }}>{e.title}</span>
                  ))}
                  {dayEvents.slice(0, 4).map((e) => (
                    <span key={e.id} onClick={(ev) => { ev.stopPropagation(); setEditing(e); }} className="truncate rounded px-1.5 py-0.5 text-[11px] font-semibold leading-tight text-white sm:text-xs" style={{ background: BRAND[e.color].base }}>{e.repeat !== "none" && "↻ "}{e.time && `${e.time} `}{e.title || "(untitled)"}</span>
                  ))}
                  {dayEvents.length > 4 && <span className="text-[11px] font-semibold text-ink-soft">+{dayEvents.length - 4} more</span>}
                </div>
              </button>
            );
          })}
        </div>

        <div className="mt-3 flex flex-wrap gap-3 text-[11px] text-ink-soft">
          {config.terms.map((t) => (
            <span key={t.id} className="inline-flex items-center gap-1"><span className="inline-block h-3 w-3 rounded" style={{ background: BRAND[TERM_COLOR[t.id]].tint }} />{t.label}</span>
          ))}
          <span className="inline-flex items-center gap-1"><span className="inline-block h-3 w-3 rounded" style={{ background: BRAND.pink.shade }} />NSW holiday</span>
        </div>
      </div>

      {/* Next two weeks + archive toggle */}
      <div className="flex items-center justify-between">
        <h3 className="font-heading font-bold text-ink">{showArchived ? "Archived events" : "Next two weeks"}</h3>
        <button onClick={() => setShowArchived((s) => !s)} className="text-sm font-bold text-ink-soft hover:text-pink">{showArchived ? "← Back to upcoming" : "View archived"}</button>
      </div>
      <div className="space-y-2">
        {upcoming.length === 0 && <p className="text-sm text-ink-soft">{showArchived ? "No archived events." : "Nothing in the next two weeks — tap a day to add an event."}</p>}
        {upcoming.map(({ e, start }) => {
          const sd = parseISO(start);
          const span = daysBetween(e.start, e.end || e.start);
          const range = span > 0 ? `${formatLong(sd)} → ${formatLong(parseISO(addDaysIso(start, span)))}` : formatLong(sd);
          return (
            <button key={`${e.id}-${start}`} onClick={() => setEditing(e)} className="flex w-full items-center gap-3 rounded-lg bg-white p-3 text-left shadow-sm hover:shadow">
              <span className="h-10 w-1.5 rounded-full" style={{ background: BRAND[e.color].base }} />
              <div className="flex-1">
                <div className="font-bold text-ink">{e.title || "(untitled)"}</div>
                <div className="text-xs text-ink-soft">{range}{e.time && ` · ${e.time}`}</div>
                <div className="mt-0.5 flex flex-wrap gap-x-3 text-xs font-bold">
                  {e.repeat !== "none" && <span className="text-pink">↻ {REPEAT_LABEL[e.repeat]}</span>}
                  {e.link && <span className="text-teal">🔗 link attached</span>}
                  {e.fileName && <span className="text-purple">📎 {e.fileName}</span>}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {editing && <EventEditor ev={editing} onSave={save} onDelete={del} onClose={() => setEditing(null)} />}
    </div>
  );
}

function EventEditor({ ev, onSave, onDelete, onClose }: { ev: CalEvent; onSave: (e: CalEvent) => void; onDelete: (id: string) => void; onClose: () => void }) {
  const [draft, setDraft] = useState<CalEvent>(ev);
  const set = (p: Partial<CalEvent>) => setDraft((d) => ({ ...d, ...p }));

  const onFile = (file?: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => set({ fileName: file.name, fileData: String(reader.result) });
    reader.readAsDataURL(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-white" onClick={onClose}>
      <div className="flex h-full flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="border-b px-4 py-3" style={{ background: BRAND.pink.tint }}>
          <h3 className="font-heading text-lg font-bold" style={{ color: BRAND.pink.base }}>Event</h3>
        </div>
        <div className="flex-1 space-y-3 overflow-y-auto p-4 text-sm sm:p-6">
          <input value={draft.title} placeholder="Title" onChange={(e) => set({ title: e.target.value })} className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-pink" />
          <div className="grid grid-cols-2 gap-3">
            <label className="text-xs text-ink-soft">Start date
              <input type="date" value={draft.start} onChange={(e) => set({ start: e.target.value })} className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none" />
            </label>
            <label className="text-xs text-ink-soft">End date (optional)
              <input type="date" value={draft.end} min={draft.start} onChange={(e) => set({ end: e.target.value })} className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none" />
            </label>
          </div>
          <label className="block text-xs text-ink-soft">Time (optional)
            <input type="time" value={draft.time} onChange={(e) => set({ time: e.target.value })} className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none" />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="text-xs text-ink-soft">Repeat
              <select value={draft.repeat} onChange={(e) => set({ repeat: e.target.value as Repeat })} className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none">
                {REPEAT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </label>
            {draft.repeat !== "none" && (
              <label className="text-xs text-ink-soft">Repeat until (optional)
                <input type="date" value={draft.repeatUntil} min={draft.start} onChange={(e) => set({ repeatUntil: e.target.value })} className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none" />
              </label>
            )}
          </div>
          {draft.repeat !== "none" && (
            <p className="rounded-lg bg-pink-tint px-3 py-2 text-xs text-ink-soft">
              Repeats {REPEAT_LABEL[draft.repeat].toLowerCase()} from {draft.start ? formatLong(parseISO(draft.start)) : "the start date"}
              {draft.repeatUntil ? ` until ${formatLong(parseISO(draft.repeatUntil))}` : ", with no end date"}. Editing or deleting changes the whole series.
            </p>
          )}
          <textarea value={draft.description} placeholder="Description / notes" rows={3} onChange={(e) => set({ description: e.target.value })} className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none" />
          <input value={draft.link} placeholder="Link (https://…)" onChange={(e) => set({ link: e.target.value })} className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none" />
          {draft.link && <a href={draft.link} target="_blank" rel="noreferrer" className="block font-bold text-teal">Open link ↗</a>}
          <div>
            <label className="cursor-pointer rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-bold text-ink-soft hover:bg-gray-50">
              {draft.fileName ? "Replace file" : "Attach file"}
              <input type="file" className="hidden" onChange={(e) => { onFile(e.target.files?.[0]); e.target.value = ""; }} />
            </label>
            {draft.fileName && (
              <div className="mt-2 flex items-center gap-2">
                <a href={draft.fileData} download={draft.fileName} className="text-xs font-bold text-purple">📎 {draft.fileName}</a>
                <button onClick={() => set({ fileName: "", fileData: "" })} className="text-xs font-bold text-ink-soft hover:text-pink">Remove</button>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-ink-soft">Colour:</span>
            {COLOR_CHOICES.map((c) => (
              <button key={c} onClick={() => set({ color: c })} className="h-6 w-6 rounded-full" style={{ background: BRAND[c].base, outline: draft.color === c ? `2px solid ${BRAND[c].shade}` : "none", outlineOffset: 2 }} aria-label={c} />
            ))}
          </div>
          <label className="flex items-center gap-2 text-ink-soft">
            <input type="checkbox" checked={draft.archived} onChange={(e) => set({ archived: e.target.checked })} />
            Archived
          </label>
        </div>

        <div className="flex items-center justify-between border-t px-4 py-3">
          <button onClick={() => onDelete(draft.id)} className="text-sm font-bold text-ink-soft hover:text-pink">Delete</button>
          <div className="flex gap-2">
            <button onClick={onClose} className="rounded-full px-4 py-1.5 text-sm font-bold text-ink-soft hover:bg-gray-100">Cancel</button>
            <button onClick={() => onSave(draft)} disabled={!draft.start} className="pill disabled:opacity-50" style={{ background: BRAND.pink.base }}>Save</button>
          </div>
        </div>
      </div>
    </div>
  );
}
