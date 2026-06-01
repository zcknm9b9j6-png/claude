import { useEffect, useState } from "react";
import { BRAND, type BrandColor } from "../brand";
import { formatLong, termStatus, type TermConfig } from "../lib/terms";
import { useToday } from "../lib/useToday";

interface Props {
  config: TermConfig;
  title: string;
  subtitle: string;
  color: BrandColor;
  onOpenSettings: () => void;
  onOpenBackup: () => void;
  onOpenSync: () => void;
  onJumpToTerm: () => void;
  onLock: () => void;
  syncStatus: "off" | "loading" | "synced" | "saving" | "error";
}

const SYNC_LABEL: Record<Props["syncStatus"], string> = {
  off: "☁ Cloud Sync",
  loading: "☁ Loading…",
  saving: "☁ Saving…",
  synced: "☁ Synced ✓",
  error: "☁ Sync error",
};

const QUOTES = [
  "Small daily improvements lead to stunning results.",
  "You don't have to be perfect to make a difference.",
  "Great educators plant seeds that grow forever.",
  "Progress, not perfection.",
  "The way to get started is to quit talking and begin doing.",
  "Every child you teach is a future you shape.",
  "Done is better than perfect — keep moving.",
  "Your calm is contagious. Lead with it.",
  "Big things are built one small task at a time.",
  "Believe you can and you're halfway there.",
  "What you do today can improve all your tomorrows.",
  "Strong roots make strong leaders.",
  "Be the reason someone feels welcomed today.",
  "Organisation is the foundation of calm.",
  "You are capable of amazing things.",
];

function greeting(d: Date): string {
  const h = d.getHours();
  if (h < 12) return "Good morning, Aimee";
  if (h < 17) return "Good afternoon, Aimee";
  if (h < 21) return "Good evening, Aimee";
  return "Working late, Aimee";
}

/**
 * Live local clock for the greeting. `useToday` is date-only (midnight), so it
 * can't tell morning from night — this ticks each minute to keep the greeting
 * matching the actual time of day.
 */
function useClock(): Date {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);
  return now;
}

function quoteOfTheDay(d: Date): string {
  const start = new Date(d.getFullYear(), 0, 0);
  const dayOfYear = Math.floor((d.getTime() - start.getTime()) / 86_400_000);
  return QUOTES[dayOfYear % QUOTES.length];
}

/** Logo with graceful fallback: logo.png → wordmark if it can't load. */
function Logo() {
  const [failed, setFailed] = useState(false);
  if (failed) {
    return (
      <span className="rounded-lg bg-white px-2 py-1 font-heading text-sm font-bold text-teal">
        FAIR PLAY OOSH
      </span>
    );
  }
  return (
    <img
      src="./logo.png"
      alt="Fair Play OOSH"
      onError={() => setFailed(true)}
      className="h-14 w-auto rounded-lg bg-white p-1 shadow-sm animate-logo-in"
    />
  );
}

export default function InfoHeader({
  config,
  title,
  subtitle,
  color,
  onOpenSettings,
  onOpenBackup,
  onOpenSync,
  onJumpToTerm,
  onLock,
  syncStatus,
}: Props) {
  const now = useToday();
  const clock = useClock();
  const status = termStatus(config, now);

  return (
    <header className="sticky top-0 z-20 shadow-sm">
      {/* Row 1: brand banner with greeting + actions */}
      <div className="flex items-center gap-3 px-5 py-2 text-white" style={{ background: BRAND.teal.base }}>
        <Logo />
        <div className="min-w-0 flex-1">
          <div className="truncate font-heading text-lg font-bold leading-tight">
            {greeting(clock)}
          </div>
          <div className="text-xs font-semibold text-white/90">
            {formatLong(now)}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <button
            onClick={onOpenSync}
            className="rounded-full bg-white px-3 py-1 text-xs font-bold text-teal hover:bg-white/90"
            style={syncStatus === "error" ? { color: BRAND.pink.base } : undefined}
          >
            {SYNC_LABEL[syncStatus]}
          </button>
          <button onClick={onOpenBackup} className="rounded-full bg-white/20 px-3 py-1 text-xs font-bold hover:bg-white/30">
            Backup
          </button>
          <button onClick={onOpenSettings} className="rounded-full bg-white/20 px-3 py-1 text-xs font-bold hover:bg-white/30">
            Term dates
          </button>
          <button onClick={onLock} className="rounded-full bg-white/20 px-3 py-1 text-xs font-bold hover:bg-white/30" title="Lock now">
            🔒
          </button>
        </div>
      </div>

      {/* Row 2: live Term / Week / Date banner + jump button */}
      <div className="flex flex-wrap items-center gap-2 bg-white px-5 py-2">
        <span className="rounded-lg px-3 py-1 text-sm font-bold text-white" style={{ background: BRAND.purple.base }}>
          {status.term ? status.term.label : "Outside term"}
        </span>
        <span className="rounded-lg px-3 py-1 text-sm font-bold text-white" style={{ background: BRAND.pink.base }}>
          {status.week ? `Week ${status.week}` : "—"}
        </span>
        <span className="rounded-lg px-3 py-1 text-sm font-bold text-white" style={{ background: BRAND.lime.base }}>
          {formatLong(now)}
        </span>
        <span className="flex-1" />
        {status.term && (
          <button
            onClick={onJumpToTerm}
            className="rounded-full px-3 py-1 text-xs font-bold text-white hover:opacity-90"
            style={{ background: BRAND.orange.base }}
          >
            Jump to {status.term.label} ↓
          </button>
        )}
      </div>

      {/* Row 3: quote of the day */}
      <div className="bg-white px-5 pb-1.5 text-center text-[13px] italic text-ink-soft">
        “{quoteOfTheDay(now)}”
      </div>

      {/* Row 4: active view title, coloured by tab */}
      <div className="flex items-baseline gap-3 px-5 py-2 text-white" style={{ background: BRAND[color].base }}>
        <h1 className="font-heading text-lg font-bold leading-none">{title}</h1>
        <span className="text-xs font-medium text-white/80">{subtitle}</span>
      </div>
    </header>
  );
}
