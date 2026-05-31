import type { TermConfig } from "./terms";

// NSW public holidays 2026 (primary-relevant). Update each year as needed.
export const NSW_HOLIDAYS_2026: { iso: string; name: string }[] = [
  { iso: "2026-01-01", name: "New Year's Day" },
  { iso: "2026-01-26", name: "Australia Day" },
  { iso: "2026-04-03", name: "Good Friday" },
  { iso: "2026-04-04", name: "Easter Saturday" },
  { iso: "2026-04-05", name: "Easter Sunday" },
  { iso: "2026-04-06", name: "Easter Monday" },
  { iso: "2026-04-25", name: "Anzac Day" },
  { iso: "2026-06-08", name: "King's Birthday" },
  { iso: "2026-08-03", name: "Bank Holiday" },
  { iso: "2026-10-05", name: "Labour Day" },
  { iso: "2026-12-25", name: "Christmas Day" },
  { iso: "2026-12-26", name: "Boxing Day" },
];

export interface AutoEvent {
  iso: string;
  title: string;
  kind: "term" | "holiday";
}

/** Read-only calendar markers built from the term config + NSW holidays. */
export function autoEventsForDate(config: TermConfig, iso: string): AutoEvent[] {
  const out: AutoEvent[] = [];
  for (const t of config.terms) {
    if (t.start === iso) out.push({ iso, title: `${t.label} starts`, kind: "term" });
    if (t.end === iso) out.push({ iso, title: `${t.label} ends`, kind: "term" });
  }
  for (const h of NSW_HOLIDAYS_2026) {
    if (h.iso === iso) out.push({ iso, title: h.name, kind: "holiday" });
  }
  return out;
}
