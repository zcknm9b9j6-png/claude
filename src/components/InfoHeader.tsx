import { useState } from "react";
import { BRAND, type BrandColor } from "../brand";
import {
  formatLong,
  type TermConfig,
  termStatus,
} from "../lib/terms";

interface Props {
  config: TermConfig;
  title: string;
  subtitle: string;
  color: BrandColor;
  onOpenSettings: () => void;
  onOpenBackup: () => void;
}

/**
 * Brand logo. Tries an uploaded raster `logo.png` first (drop one in /public to
 * override), falls back to the hand-built vector `logo.svg`, then to a text
 * wordmark if neither asset is present.
 */
const LOGO_SOURCES = ["logo.png", "logo.svg"];

function Logo() {
  const [idx, setIdx] = useState(0);
  if (idx >= LOGO_SOURCES.length) {
    return (
      <span className="rounded bg-white/20 px-1.5 py-0.5 text-xs font-extrabold">
        FAIR PLAY OOSH
      </span>
    );
  }
  return (
    <img
      src={LOGO_SOURCES[idx]}
      alt="Fair Play OOSH"
      onError={() => setIdx((i) => i + 1)}
      className="h-9 w-auto rounded bg-white/90 p-0.5"
    />
  );
}

/**
 * The sticky info header that sits above every tracker — mirrors rows 1–6 of
 * each Excel sheet: brand banner, sheet title, and the four auto-updating
 * YEAR / CURRENT TERM / WEEK OF TERM / DAY OF TERM boxes.
 */
export default function InfoHeader({
  config,
  title,
  subtitle,
  color,
  onOpenSettings,
  onOpenBackup,
}: Props) {
  const status = termStatus(config);
  const today = new Date();

  const boxes = [
    { label: "Year", value: String(config.year) },
    { label: "Current Term", value: status.term ? status.term.label : "Outside term" },
    { label: "Week of Term", value: status.week ? String(status.week) : "—" },
    { label: "Day of Term", value: status.day ? String(status.day) : "—" },
  ];

  return (
    <header className="sticky top-0 z-20 shadow-sm">
      {/* Row 1: brand banner */}
      <div
        className="flex items-center justify-between px-5 py-2 text-white"
        style={{ background: BRAND.teal.base }}
      >
        <div className="flex items-center gap-2 font-extrabold tracking-tight">
          <Logo />
          <span className="hidden text-sm font-semibold sm:inline">
            Out of School Hours Care · Newcastle &amp; Hunter
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onOpenBackup}
            className="rounded-full bg-white/20 px-3 py-1 text-xs font-bold hover:bg-white/30"
          >
            Backup
          </button>
          <button
            onClick={onOpenSettings}
            className="rounded-full bg-white/20 px-3 py-1 text-xs font-bold hover:bg-white/30"
          >
            Term dates
          </button>
        </div>
      </div>

      {/* Row 2: sheet title, coloured by active tab */}
      <div
        className="flex items-baseline gap-3 px-5 py-2 text-white"
        style={{ background: BRAND[color].base }}
      >
        <h1 className="text-lg font-extrabold leading-none">{title}</h1>
        <span className="text-xs font-medium text-white/80">{subtitle}</span>
      </div>

      {/* Rows 4–5: the four auto-updating info boxes */}
      <div className="grid grid-cols-2 gap-px bg-gray-200 sm:grid-cols-4">
        {boxes.map((b, i) => (
          <div
            key={b.label}
            className="bg-white px-4 py-2"
            style={{ borderTop: `3px solid ${Object.values(BRAND)[i].base}` }}
          >
            <div className="text-[10px] font-bold uppercase tracking-wide text-ink-soft">
              {b.label}
            </div>
            <div className="text-base font-extrabold text-ink">{b.value}</div>
          </div>
        ))}
      </div>

      <div className="bg-white px-5 py-1 text-right text-[11px] text-ink-soft">
        Today · {formatLong(today)}
      </div>
    </header>
  );
}
