import { BRAND, type BrandColor } from "../brand";

interface Props {
  title: string;
  subtitle: string;
  color: BrandColor;
  onOpenSettings: () => void;
  onOpenBackup: () => void;
}

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

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

function ordinal(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

function prettyDate(d: Date): string {
  return `${ordinal(d.getDate())} of ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

function greeting(d: Date): string {
  const h = d.getHours();
  if (h < 12) return "Good morning, Aimee";
  if (h < 17) return "Good afternoon, Aimee";
  return "Welcome back, Aimee";
}

function quoteOfTheDay(d: Date): string {
  const start = new Date(d.getFullYear(), 0, 0);
  const dayOfYear = Math.floor((d.getTime() - start.getTime()) / 86_400_000);
  return QUOTES[dayOfYear % QUOTES.length];
}

/** Logo with graceful fallback: logo.png → logo.svg → wordmark. */
function Logo() {
  return (
    <img
      src="logo.png"
      alt="Fair Play OOSH"
      className="h-12 w-auto rounded-lg bg-white/90 p-1 animate-logo-in"
    />
  );
}

/**
 * Sticky header: brand banner with greeting, today's date, an inspirational
 * quote of the day, and the active-view title band coloured by tab.
 */
export default function InfoHeader({
  title,
  subtitle,
  color,
  onOpenSettings,
  onOpenBackup,
}: Props) {
  const now = new Date();

  return (
    <header className="sticky top-0 z-20 shadow-sm">
      {/* Row 1: brand banner with greeting */}
      <div
        className="flex items-center gap-3 px-5 py-2 text-white"
        style={{ background: BRAND.teal.base }}
      >
        <Logo />
        <div className="min-w-0 flex-1">
          <div className="truncate text-base font-extrabold leading-tight">
            {greeting(now)} 👋
          </div>
          <div className="text-xs font-medium text-white/85">
            {prettyDate(now)} · Updating daily
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
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

      {/* Row 2: quote of the day */}
      <div className="bg-white px-5 py-1.5 text-center text-[13px] italic text-ink-soft">
        “{quoteOfTheDay(now)}”
      </div>

      {/* Row 3: active view title, coloured by tab */}
      <div
        className="flex items-baseline gap-3 px-5 py-2 text-white"
        style={{ background: BRAND[color].base }}
      >
        <h1 className="text-lg font-extrabold leading-none">{title}</h1>
        <span className="text-xs font-medium text-white/80">{subtitle}</span>
      </div>
    </header>
  );
}
