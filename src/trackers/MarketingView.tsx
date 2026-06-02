import { useState } from "react";
import { BRAND, COLOR_CHOICES, INK, type BrandColor } from "../brand";
import { makeId, usePersistentState } from "../lib/storage";
import { CategorySelect, useCategories } from "../components/CategorySelect";

// ---------------------------------------------------------------------------
// Brand reference — transcribed verbatim from the Fair Play OOSH brand guide.
// This block is read-only on purpose: it's the single source of truth staff can
// copy colours and type from. Hex codes are exactly as supplied in the guide.
// ---------------------------------------------------------------------------
const BRAND_SPEC: { name: string; tint: string; base: string; shade: string }[] = [
  { name: "Cyan", tint: "#E9F9FB", base: "#25C0D5", shade: "#1EA3B6" },
  { name: "Magenta", tint: "#F4E9F4", base: "#92278F", shade: "#7A2178" },
  { name: "Orange", tint: "#FDECE2", base: "#F26522", shade: "#D8531A" },
  { name: "Green", tint: "#F1F7E1", base: "#A2CD3A", shade: "#87AE29" },
  { name: "Pink", tint: "#FDE6F3", base: "#EC008C", shade: "#C80077" },
];

const VALUES: { n: number; title: string; desc: string; color: BrandColor }[] = [
  { n: 1, title: "Considerate", desc: "Be there for others.", color: "purple" },
  { n: 2, title: "Passionate", desc: "Bring drive, energy & determination.", color: "orange" },
  { n: 3, title: "Courageous", desc: "Challenge ourselves.", color: "lime" },
];

const TYPE_SCALE = [
  { tag: "Display", sample: "Play", size: "text-4xl" },
  { tag: "H1", sample: "Explore, Play, Learn", size: "text-3xl" },
  { tag: "H2", sample: "Vacation Care", size: "text-2xl" },
  { tag: "H3", sample: "Before & After School Care", size: "text-lg sm:text-xl" },
];

const LOCATIONS = [
  "Anna Bay", "Belmont", "Edgeworth", "Greta", "Redhead",
  "Toronto", "Booragul", "Tanilba Bay", "Branxton", "Woodberry",
];

const STRIPE = ["#25C0D5", "#F26522", "#A2CD3A", "#EC008C", "#92278F"];

/** A hex swatch + code that copies to the clipboard when tapped. */
function HexChip({ label, hex }: { label: string; hex: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard
      ?.writeText(hex)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 1200);
      })
      .catch(() => {});
  };
  return (
    <button onClick={copy} title="Click to copy" className="flex w-full items-center gap-2 rounded-md border border-gray-200 px-2 py-1.5 text-left transition-colors hover:bg-gray-50">
      <span className="h-5 w-5 shrink-0 rounded" style={{ background: hex, boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.06)" }} />
      <span className="flex flex-col leading-tight">
        <span className="text-[10px] font-bold uppercase tracking-wide text-ink-soft">{label}</span>
        <span className="font-mono text-xs font-semibold text-ink">{copied ? "Copied!" : hex}</span>
      </span>
    </button>
  );
}

// ---------------------------------------------------------------------------
// Marketing ideas board — the editable part. Persists like every other tracker.
// ---------------------------------------------------------------------------
type Status = "Idea" | "Planned" | "In progress" | "Done";
const STATUSES: Status[] = ["Idea", "Planned", "In progress", "Done"];
const STATUS_COLOR: Record<Status, BrandColor> = {
  Idea: "teal",
  Planned: "orange",
  "In progress": "purple",
  Done: "lime",
};

interface Idea {
  id: string;
  title: string;
  body: string;
  category: string;
  status: Status;
  color: BrandColor;
  updatedAt: number;
}

export default function MarketingView() {
  const [ideas, setIdeas] = usePersistentState<Idea[]>("marketing-ideas", []);
  const [openId, setOpenId] = useState<string | null>(null);
  const [cat, setCat] = useState("");
  const [stat, setStat] = useState<"" | Status>("");
  const { cats, add: addCat } = useCategories("marketing", [
    "Social media", "Events", "Flyers & print", "Enrolment", "Community", "Newsletter",
  ]);

  const filtered = [...ideas]
    .filter((i) => !cat || i.category === cat)
    .filter((i) => !stat || i.status === stat)
    .sort((a, b) => b.updatedAt - a.updatedAt);
  const open = openId ? ideas.find((i) => i.id === openId) ?? null : null;

  const create = () => {
    const i: Idea = { id: makeId(), title: "", body: "", category: "", status: "Idea", color: "purple", updatedAt: Date.now() };
    setIdeas((xs) => [i, ...xs]);
    setOpenId(i.id);
  };
  const patch = (id: string, fields: Partial<Idea>) =>
    setIdeas((xs) => xs.map((i) => (i.id === id ? { ...i, ...fields, updatedAt: Date.now() } : i)));
  const remove = (id: string) => {
    setIdeas((xs) => xs.filter((i) => i.id !== id));
    setOpenId(null);
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-4">
      {/* ---------------- Brand reference ---------------- */}
      <section className="overflow-hidden rounded-2xl bg-white shadow">
        <div className="flex h-2">
          {STRIPE.map((c) => <div key={c} className="flex-1" style={{ background: c }} />)}
        </div>

        <div className="space-y-7 p-5 sm:p-6">
          <header>
            <p className="text-xs font-bold uppercase tracking-widest" style={{ color: BRAND.pink.base }}>Brand reference</p>
            <h2 className="font-heading text-2xl font-extrabold sm:text-3xl" style={{ color: INK }}>Fair Play OOSH — Brand Design</h2>
            <p className="text-sm text-ink-soft">Out of School Hours Care · Vacation Care</p>
          </header>

          {/* Colour palette */}
          <div>
            <h3 className="mb-1 font-heading text-lg font-bold text-ink">Brand colours</h3>
            <p className="mb-3 text-sm text-ink-soft">Tap any hex code to copy it to your clipboard.</p>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {BRAND_SPEC.map((c) => (
                <div key={c.name} className="overflow-hidden rounded-xl border border-gray-100 shadow-sm">
                  <div className="grid h-20 place-items-center text-lg font-extrabold text-white" style={{ background: c.base }}>{c.name}</div>
                  <div className="space-y-1.5 p-2">
                    <HexChip label="Base" hex={c.base} />
                    <HexChip label="10% Tint" hex={c.tint} />
                    <HexChip label="Shade (hover)" hex={c.shade} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Typography */}
          <div>
            <h3 className="mb-1 font-heading text-lg font-bold text-ink">Typography</h3>
            <p className="mb-3 text-sm text-ink-soft">Typeface: <span className="font-bold text-ink">Aptos</span></p>
            <div className="divide-y divide-gray-100 rounded-xl border border-gray-100">
              {TYPE_SCALE.map((t) => (
                <div key={t.tag} className="flex items-baseline gap-4 px-4 py-3">
                  <span className="w-16 shrink-0 text-[11px] font-bold uppercase tracking-wide text-ink-soft">{t.tag}</span>
                  <span className={`font-heading font-extrabold ${t.size}`} style={{ color: INK }}>{t.sample}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Brand values */}
          <div>
            <h3 className="mb-3 font-heading text-lg font-bold text-ink">Brand values</h3>
            <div className="grid gap-3 sm:grid-cols-3">
              {VALUES.map((v) => (
                <div key={v.n} className="rounded-xl border border-gray-100 p-4 shadow-sm">
                  <span className="grid h-7 w-7 place-items-center rounded-full text-sm font-bold text-white" style={{ background: BRAND[v.color].base }}>{v.n}</span>
                  <h4 className="mt-2 font-heading font-bold text-ink">{v.title}</h4>
                  <p className="text-sm text-ink-soft">{v.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Locations */}
          <div>
            <h3 className="mb-3 font-heading text-lg font-bold text-ink">Our locations</h3>
            <div className="flex flex-wrap gap-2">
              {LOCATIONS.map((l, i) => {
                const c = BRAND_SPEC[i % BRAND_SPEC.length];
                return (
                  <span key={l} className="rounded-full px-3 py-1 text-xs font-bold" style={{ background: c.tint, color: c.shade }}>{l}</span>
                );
              })}
            </div>
          </div>
        </div>

        {/* Brand footer band */}
        <div className="px-6 py-5 text-white" style={{ background: BRAND.purple.base }}>
          <p className="font-heading text-lg font-extrabold">Fair Play OOSH</p>
          <p className="mb-3 text-sm text-white/80">Out of School Hours Care · Vacation Care</p>
          <div className="grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
            <div><span className="text-xs font-bold uppercase tracking-wide text-white/70">Email</span><br />support@fairplayoosh.com.au</div>
            <div><span className="text-xs font-bold uppercase tracking-wide text-white/70">Phone</span><br />(02) 4954 0000</div>
            <div><span className="text-xs font-bold uppercase tracking-wide text-white/70">Website</span><br />fairplayoosh.com.au</div>
            <div><span className="text-xs font-bold uppercase tracking-wide text-white/70">Locations</span><br />13 sites · Newcastle / Hunter</div>
          </div>
        </div>
      </section>

      {/* ---------------- Marketing ideas ---------------- */}
      <section>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="font-heading text-lg font-bold text-ink">Marketing ideas</h3>
            <p className="text-sm text-ink-soft">Organise campaigns, posts and promos — everything saves automatically.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <select value={cat} onChange={(e) => setCat(e.target.value)} className="rounded-lg border border-gray-300 px-2 py-1 text-sm outline-none">
              <option value="">All categories</option>
              {cats.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <select value={stat} onChange={(e) => setStat(e.target.value as "" | Status)} className="rounded-lg border border-gray-300 px-2 py-1 text-sm outline-none">
              <option value="">All statuses</option>
              {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <button onClick={create} className="pill" style={{ background: BRAND.purple.base }}>+ New idea</button>
          </div>
        </div>

        {filtered.length === 0 && (
          <div className="rounded-xl border-2 border-dashed border-gray-200 bg-white p-10 text-center text-ink-soft">
            {ideas.length === 0 ? "No marketing ideas yet. Tap “New idea” to start planning." : "No ideas match these filters."}
          </div>
        )}

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((i) => (
            <button key={i.id} onClick={() => setOpenId(i.id)} className="overflow-hidden rounded-xl bg-white text-left shadow transition-shadow hover:shadow-md">
              <div className="h-1.5" style={{ background: BRAND[i.color].base }} />
              <div className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <h4 className="font-heading font-bold text-ink">{i.title || "(untitled idea)"}</h4>
                  <span className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold text-white" style={{ background: BRAND[STATUS_COLOR[i.status]].base }}>{i.status}</span>
                </div>
                {i.category && <p className="mt-1 text-[11px] font-bold uppercase tracking-wide text-ink-soft">{i.category}</p>}
                <p className="mt-1 line-clamp-3 whitespace-pre-wrap text-sm text-ink-soft">{i.body || "No details yet"}</p>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* ---------------- Idea editor ---------------- */}
      {open && (
        <div className="fixed inset-0 z-50 flex flex-col bg-white">
          <div className="flex items-center gap-2 border-b px-4 py-3" style={{ background: BRAND[open.color].tint }}>
            <button onClick={() => setOpenId(null)} className="rounded-full bg-white px-3 py-1 text-sm font-bold text-ink-soft hover:bg-gray-100">← Back</button>
            <input value={open.title} placeholder="Idea title…" onChange={(e) => patch(open.id, { title: e.target.value })} className="flex-1 bg-transparent font-heading text-lg font-bold text-ink outline-none" />
            <button onClick={() => remove(open.id)} className="text-sm font-bold text-ink-soft hover:text-pink">Delete</button>
          </div>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b px-4 py-2 text-sm">
            <span className="flex items-center gap-1"><span className="text-ink-soft">Category:</span>
              <CategorySelect value={open.category} categories={cats} onChange={(v) => patch(open.id, { category: v })} onAddCategory={addCat} />
            </span>
            <span className="flex items-center gap-1"><span className="text-ink-soft">Status:</span>
              <select value={open.status} onChange={(e) => patch(open.id, { status: e.target.value as Status })} className="rounded-lg border border-gray-300 px-2 py-1 text-sm outline-none">
                {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </span>
            <span className="flex items-center gap-1.5"><span className="text-ink-soft">Colour:</span>
              {COLOR_CHOICES.map((c) => (
                <button key={c} onClick={() => patch(open.id, { color: c })} className="h-5 w-5 rounded-full" style={{ background: BRAND[c].base, boxShadow: open.color === c ? `0 0 0 2px #fff, 0 0 0 4px ${BRAND[c].base}` : "inset 0 0 0 1px rgba(0,0,0,0.1)" }} aria-label={c} />
              ))}
            </span>
            <span className="flex-1" />
            <span className="text-xs text-ink-soft/70">Saved automatically</span>
          </div>

          <textarea value={open.body} placeholder="Describe the idea — audience, channel, timing, who's doing it…" autoFocus onChange={(e) => patch(open.id, { body: e.target.value })} className="flex-1 resize-none px-5 py-4 text-base outline-none" />
        </div>
      )}
    </div>
  );
}
