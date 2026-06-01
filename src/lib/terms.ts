// NSW school-term logic. Mirrors the Excel Config sheet:
//   TERM = which term TODAY falls in (or "Outside term")
//   WEEK = INT((TODAY - termStart) / 7) + 1
//   DAY  = NETWORKDAYS(termStart, TODAY)   (business days, inclusive)

export type TermId = 1 | 2 | 3 | 4;

export interface Term {
  id: TermId;
  label: string; // e.g. "Term 1"
  start: string; // ISO yyyy-mm-dd
  end: string; // ISO yyyy-mm-dd
}

export interface TermConfig {
  year: number;
  terms: Term[];
}

// NSW 2026 term dates (the default Config sheet values).
export const DEFAULT_CONFIG: TermConfig = {
  year: 2026,
  terms: [
    { id: 1, label: "Term 1", start: "2026-01-28", end: "2026-04-09" },
    { id: 2, label: "Term 2", start: "2026-04-28", end: "2026-07-03" },
    { id: 3, label: "Term 3", start: "2026-07-20", end: "2026-09-25" },
    { id: 4, label: "Term 4", start: "2026-10-12", end: "2026-12-18" },
  ],
};

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/** Parse an ISO date string as a local (not UTC) date to avoid timezone drift. */
export function parseISO(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function toISO(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Whole days between two dates (a - b), ignoring time-of-day. */
function dayDiff(a: Date, b: Date): number {
  const ams = new Date(a.getFullYear(), a.getMonth(), a.getDate()).getTime();
  const bms = new Date(b.getFullYear(), b.getMonth(), b.getDate()).getTime();
  return Math.round((ams - bms) / MS_PER_DAY);
}

/** Excel-style NETWORKDAYS: weekdays between start and end, inclusive. */
export function networkDays(start: Date, end: Date): number {
  if (dayDiff(end, start) < 0) return 0;
  let count = 0;
  const cur = new Date(start.getFullYear(), start.getMonth(), start.getDate());
  const last = new Date(end.getFullYear(), end.getMonth(), end.getDate());
  while (cur <= last) {
    const dow = cur.getDay();
    if (dow !== 0 && dow !== 6) count++;
    cur.setDate(cur.getDate() + 1);
  }
  return count;
}

/** Number of week columns a term spans (1-based, inclusive of partial final week). */
export function weeksInTerm(term: Term): number {
  const span = dayDiff(parseISO(term.end), mondayOf(parseISO(term.start)));
  return Math.floor(span / 7) + 1;
}

/** Monday that starts a given 1-based school week within a term. */
export function weekStartDate(term: Term, week: number): Date {
  const firstMonday = mondayOf(parseISO(term.start));
  firstMonday.setDate(firstMonday.getDate() + (week - 1) * 7);
  return firstMonday;
}

export interface TermStatus {
  term: Term | null; // null when outside any term
  week: number | null; // 1-based week of term
  day: number | null; // business day of term
}

/** Compute the current term / week / day for a given date (defaults to today). */
export function termStatus(config: TermConfig, today = new Date()): TermStatus {
  const t0 = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  for (const term of config.terms) {
    const start = parseISO(term.start);
    const end = parseISO(term.end);
    if (t0 >= start && t0 <= end) {
      // School weeks roll over on Monday, so count whole weeks between the
      // Monday of the term-start week and the Monday of today's week.
      const weeksBetween = Math.floor(dayDiff(mondayOf(t0), mondayOf(start)) / 7);
      return {
        term,
        week: weeksBetween + 1,
        day: networkDays(start, t0),
      };
    }
  }
  return { term: null, week: null, day: null };
}

/** The Monday (local midnight) of the week containing `d`. */
function mondayOf(d: Date): Date {
  const m = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const offset = (m.getDay() + 6) % 7; // 0 = Monday … 6 = Sunday
  m.setDate(m.getDate() - offset);
  return m;
}

/** Which term (if any) a given date falls inside — used by the calendar overlay. */
export function termForDate(config: TermConfig, date: Date): Term | null {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  return (
    config.terms.find((t) => d >= parseISO(t.start) && d <= parseISO(t.end)) ??
    null
  );
}

const SHORT = { weekday: "short", day: "numeric", month: "short" } as const;
const LONG = { day: "numeric", month: "short", year: "numeric" } as const;

export function formatShort(date: Date): string {
  return date.toLocaleDateString("en-AU", SHORT);
}

export function formatLong(date: Date): string {
  return date.toLocaleDateString("en-AU", LONG);
}
