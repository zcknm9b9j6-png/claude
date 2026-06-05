import { useState } from "react";
import { BRAND, INK } from "../brand";
import { makeId, usePersistentState } from "../lib/storage";
import { formatLong, parseISO } from "../lib/terms";

// ---------------------------------------------------------------------------
// IDF Claims — a per-service workflow for Inclusion Development Fund claims.
//
// Flow:  Service → 3 Master templates (one per care type) → pull a Master into a
// weekly Draft → fill attendance + staff → Confirm (Awaiting documentation) →
// Report made (Completed, searchable by the week-ending month).
//
// All state persists through usePersistentState, like every other tracker.
// ---------------------------------------------------------------------------

const SERVICES = [
  "Anna Bay", "Belmont", "Barnsley", "Blackalls Park", "Booragul", "Branxton",
  "Edgeworth", "Garden Suburb", "Greta", "Redhead", "Tanilba Bay", "Toronto", "Woodberry",
];

type CareType = "Before School Care" | "After School Care" | "Vacation Care";
const CARE_TYPES: CareType[] = ["Before School Care", "After School Care", "Vacation Care"];
const CARE_SHORT: Record<CareType, string> = {
  "Before School Care": "BSC",
  "After School Care": "ASC",
  "Vacation Care": "VC",
};
const CARE_COLOR: Record<CareType, keyof typeof BRAND> = {
  "Before School Care": "teal",
  "After School Care": "purple",
  "Vacation Care": "orange",
};

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri"] as const;

interface MChild { id: string; name: string; maxDays: string }
interface Master {
  careType: CareType;
  caseId: string;
  caseStart: string;
  caseEnd: string;
  kuName: string;
  kuEmail: string;
  maxHours: string;
  children: MChild[];
}
type MasterStore = Record<string, Partial<Record<CareType, Master>>>;

interface CChild { id: string; name: string; maxDays: string; daysAttended: string; absentClaimable: string }
type Status = "draft" | "awaiting" | "completed";
interface Claim {
  id: string;
  service: string;
  careType: CareType;
  caseId: string;
  caseStart: string;
  caseEnd: string;
  kuName: string;
  kuEmail: string;
  maxHours: string;
  weekStart: string;
  weekEnd: string;
  children: CChild[];
  staff: Record<string, string>;
  status: Status;
  createdAt: number;
  updatedAt: number;
}

function emptyMaster(careType: CareType): Master {
  return { careType, caseId: "", caseStart: "", caseEnd: "", kuName: "", kuEmail: "", maxHours: "", children: [] };
}
function fmt(iso: string): string {
  return iso ? formatLong(parseISO(iso)) : "—";
}
/** Which required fields are still missing before a draft can be confirmed. */
function missingFields(c: Claim): string[] {
  const m: string[] = [];
  if (!c.weekStart) m.push("week start date");
  if (!c.weekEnd) m.push("week ending date");
  if (c.children.length === 0) m.push("at least one child");
  else if (c.children.some((ch) => !ch.daysAttended.trim())) m.push("days attended for every child");
  return m;
}

const inputCls = "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-gray-400";

type Nav =
  | { s: "services" }
  | { s: "home"; service: string }
  | { s: "masters"; service: string }
  | { s: "claim"; id: string }
  | { s: "review"; id: string };

export default function IDFClaimsView() {
  const [masters, setMasters] = usePersistentState<MasterStore>("idf-masters", {});
  const [claims, setClaims] = usePersistentState<Claim[]>("idf-claims", []);
  const [nav, setNav] = useState<Nav>({ s: "services" });

  const accent = BRAND.teal.base;

  // ---- master helpers ----
  const getMaster = (service: string, ct: CareType): Master => masters[service]?.[ct] ?? emptyMaster(ct);
  const updateMaster = (service: string, ct: CareType, fields: Partial<Master>) =>
    setMasters((m) => {
      const svc = { ...(m[service] ?? {}) };
      svc[ct] = { ...(svc[ct] ?? emptyMaster(ct)), ...fields };
      return { ...m, [service]: svc };
    });

  // ---- claim helpers ----
  const claimById = (id: string) => claims.find((c) => c.id === id) ?? null;
  const updateClaim = (id: string, fields: Partial<Claim>) =>
    setClaims((cs) => cs.map((c) => (c.id === id ? { ...c, ...fields, updatedAt: Date.now() } : c)));
  const updateClaimChild = (id: string, childId: string, fields: Partial<CChild>) =>
    setClaims((cs) => cs.map((c) => (c.id === id ? { ...c, updatedAt: Date.now(), children: c.children.map((ch) => (ch.id === childId ? { ...ch, ...fields } : ch)) } : c)));
  const deleteClaim = (id: string) => setClaims((cs) => cs.filter((c) => c.id !== id));

  const startDraft = (service: string, ct: CareType) => {
    const m = getMaster(service, ct);
    const claim: Claim = {
      id: makeId(), service, careType: ct,
      caseId: m.caseId, caseStart: m.caseStart, caseEnd: m.caseEnd,
      kuName: m.kuName, kuEmail: m.kuEmail, maxHours: m.maxHours,
      weekStart: "", weekEnd: "",
      children: m.children.map((ch) => ({ id: makeId(), name: ch.name, maxDays: ch.maxDays, daysAttended: "", absentClaimable: "" })),
      staff: Object.fromEntries(DAYS.map((d) => [d, ""])),
      status: "draft", createdAt: Date.now(), updatedAt: Date.now(),
    };
    setClaims((cs) => [claim, ...cs]);
    setNav({ s: "claim", id: claim.id });
  };

  // =========================================================================
  // SERVICES LANDING
  // =========================================================================
  if (nav.s === "services") {
    return (
      <div className="mx-auto max-w-5xl p-4">
        <div className="mb-4">
          <h2 className="font-heading text-xl font-bold text-ink">IDF Claims</h2>
          <p className="text-sm text-ink-soft">Pick a service to set up its master templates and work through weekly claims. Everything saves automatically.</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {SERVICES.map((service) => {
            const mine = claims.filter((c) => c.service === service);
            const d = mine.filter((c) => c.status === "draft").length;
            const a = mine.filter((c) => c.status === "awaiting").length;
            const done = mine.filter((c) => c.status === "completed").length;
            const setUp = CARE_TYPES.filter((ct) => (masters[service]?.[ct]?.children?.length ?? 0) > 0).length;
            return (
              <button key={service} onClick={() => setNav({ s: "home", service })} className="rounded-xl bg-white p-4 text-left shadow transition-shadow hover:shadow-md">
                <div className="h-1.5 -mt-4 -mx-4 mb-3 rounded-t-xl" style={{ background: accent }} />
                <h3 className="font-heading text-lg font-bold text-ink">{service}</h3>
                <p className="mt-0.5 text-xs text-ink-soft">{setUp}/3 master templates set up</p>
                <div className="mt-2 flex flex-wrap gap-1.5 text-[11px] font-bold">
                  <span className="rounded-full px-2 py-0.5 text-white" style={{ background: BRAND.orange.base }}>{d} draft{d === 1 ? "" : "s"}</span>
                  <span className="rounded-full px-2 py-0.5 text-white" style={{ background: BRAND.purple.base }}>{a} awaiting</span>
                  <span className="rounded-full px-2 py-0.5 text-white" style={{ background: BRAND.lime.base }}>{done} completed</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // =========================================================================
  // SERVICE HOME
  // =========================================================================
  if (nav.s === "home") {
    const service = nav.service;
    const mine = claims.filter((c) => c.service === service);
    const drafts = mine.filter((c) => c.status === "draft");
    const awaiting = mine.filter((c) => c.status === "awaiting");
    const completed = mine.filter((c) => c.status === "completed");
    return (
      <div className="mx-auto max-w-5xl space-y-5 p-4">
        <div className="flex items-center gap-3">
          <button onClick={() => setNav({ s: "services" })} className="rounded-full bg-white px-3 py-1 text-sm font-bold text-ink-soft shadow-sm hover:bg-gray-50">← Services</button>
          <h2 className="font-heading text-2xl font-extrabold" style={{ color: INK }}>{service}</h2>
        </div>

        {/* Start a new claim + edit masters */}
        <div className="rounded-xl bg-white p-4 shadow">
          <div className="mb-2 flex items-center justify-between gap-2">
            <h3 className="font-heading font-bold text-ink">Start a weekly claim</h3>
            <button onClick={() => setNav({ s: "masters", service })} className="rounded-full border border-gray-300 px-3 py-1 text-xs font-bold text-ink-soft hover:bg-gray-50">✎ Edit master templates</button>
          </div>
          <p className="mb-3 text-sm text-ink-soft">Pull from a master template to begin a new draft for the week.</p>
          <div className="grid gap-2 sm:grid-cols-3">
            {CARE_TYPES.map((ct) => {
              const ready = (masters[service]?.[ct]?.children?.length ?? 0) > 0;
              return (
                <button key={ct} onClick={() => startDraft(service, ct)} className="rounded-xl px-3 py-3 text-left text-white shadow-sm transition hover:opacity-90" style={{ background: BRAND[CARE_COLOR[ct]].base }}>
                  <span className="block text-xs font-bold opacity-90">{CARE_SHORT[ct]}</span>
                  <span className="block font-bold leading-tight">New {ct}</span>
                  {!ready && <span className="mt-1 block text-[11px] opacity-90">⚠ master not set up yet</span>}
                </button>
              );
            })}
          </div>
        </div>

        <ClaimSection title="Drafts" hint="Started but not yet confirmed." color={BRAND.orange.base} claims={drafts} onOpen={(id) => setNav({ s: "claim", id })} />
        <ClaimSection title="Awaiting documentation" hint="Confirmed — ready for you to write up the IDF form." color={BRAND.purple.base} claims={awaiting} onOpen={(id) => setNav({ s: "review", id })} />
        <CompletedSection claims={completed} onOpen={(id) => setNav({ s: "review", id })} />
      </div>
    );
  }

  // =========================================================================
  // MASTER TEMPLATES EDITOR
  // =========================================================================
  if (nav.s === "masters") {
    return <MastersEditor service={nav.service} getMaster={getMaster} updateMaster={updateMaster} onBack={() => setNav({ s: "home", service: nav.service })} />;
  }

  // =========================================================================
  // CLAIM EDITOR (draft)
  // =========================================================================
  if (nav.s === "claim") {
    const claim = claimById(nav.id);
    if (!claim) return <NotFound onBack={() => setNav({ s: "services" })} />;
    return (
      <ClaimEditor
        claim={claim}
        onBack={() => setNav({ s: "home", service: claim.service })}
        onChange={(f) => updateClaim(claim.id, f)}
        onChildChange={(cid, f) => updateClaimChild(claim.id, cid, f)}
        onDelete={() => { deleteClaim(claim.id); setNav({ s: "home", service: claim.service }); }}
        onConfirm={() => { updateClaim(claim.id, { status: "awaiting" }); setNav({ s: "home", service: claim.service }); }}
      />
    );
  }

  // =========================================================================
  // REVIEW (awaiting / completed)
  // =========================================================================
  if (nav.s === "review") {
    const claim = claimById(nav.id);
    if (!claim) return <NotFound onBack={() => setNav({ s: "services" })} />;
    return (
      <ClaimReview
        claim={claim}
        onBack={() => setNav({ s: "home", service: claim.service })}
        onReopen={() => { updateClaim(claim.id, { status: "draft" }); setNav({ s: "claim", id: claim.id }); }}
        onComplete={() => { updateClaim(claim.id, { status: "completed" }); setNav({ s: "home", service: claim.service }); }}
        onBackToAwaiting={() => updateClaim(claim.id, { status: "awaiting" })}
      />
    );
  }

  return null;
}

// ---------------------------------------------------------------------------
// Service-home list sections
// ---------------------------------------------------------------------------
function claimLabel(c: Claim) {
  return c.weekEnd ? `Week ending ${fmt(c.weekEnd)}` : "No week date yet";
}

function ClaimSection({ title, hint, color, claims, onOpen }: { title: string; hint: string; color: string; claims: Claim[]; onOpen: (id: string) => void }) {
  return (
    <div>
      <h3 className="font-heading font-bold text-ink">{title} <span className="text-sm font-normal text-ink-soft">({claims.length})</span></h3>
      <p className="mb-2 text-xs text-ink-soft">{hint}</p>
      {claims.length === 0 ? (
        <p className="rounded-lg border-2 border-dashed border-gray-200 bg-white p-4 text-center text-sm text-ink-soft">Nothing here.</p>
      ) : (
        <div className="space-y-2">
          {claims.map((c) => (
            <button key={c.id} onClick={() => onOpen(c.id)} className="flex w-full items-center gap-3 rounded-lg bg-white p-3 text-left shadow-sm hover:shadow">
              <span className="h-9 w-1.5 rounded-full" style={{ background: color }} />
              <div className="flex-1">
                <div className="font-bold text-ink">{CARE_SHORT[c.careType]} · {claimLabel(c)}</div>
                <div className="text-xs text-ink-soft">{c.careType}{c.caseId && ` · Case ${c.caseId}`}</div>
              </div>
              <span className="text-ink-soft">›</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function CompletedSection({ claims, onOpen }: { claims: Claim[]; onOpen: (id: string) => void }) {
  const [month, setMonth] = useState("");
  const filtered = claims.filter((c) => !month || c.weekEnd.slice(0, 7) === month).sort((a, b) => b.weekEnd.localeCompare(a.weekEnd));
  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="font-heading font-bold text-ink">Completed forms <span className="text-sm font-normal text-ink-soft">({claims.length})</span></h3>
        <label className="flex items-center gap-1 text-xs text-ink-soft">Search by month:
          <input type="month" value={month} onChange={(e) => setMonth(e.target.value)} className="rounded-lg border border-gray-300 px-2 py-1 text-sm outline-none" />
          {month && <button onClick={() => setMonth("")} className="font-bold text-pink">clear</button>}
        </label>
      </div>
      <p className="mb-2 text-xs text-ink-soft">Reports made & submitted. Searchable by the week-ending month.</p>
      {filtered.length === 0 ? (
        <p className="rounded-lg border-2 border-dashed border-gray-200 bg-white p-4 text-center text-sm text-ink-soft">{month ? "No completed forms for that month." : "No completed forms yet."}</p>
      ) : (
        <div className="space-y-2">
          {filtered.map((c) => (
            <button key={c.id} onClick={() => onOpen(c.id)} className="flex w-full items-center gap-3 rounded-lg bg-white p-3 text-left shadow-sm hover:shadow">
              <span className="h-9 w-1.5 rounded-full" style={{ background: BRAND.lime.base }} />
              <div className="flex-1">
                <div className="font-bold text-ink">{CARE_SHORT[c.careType]} · {claimLabel(c)}</div>
                <div className="text-xs text-ink-soft">{c.careType}{c.caseId && ` · Case ${c.caseId}`}</div>
              </div>
              <span className="rounded-full px-2 py-0.5 text-[10px] font-bold text-white" style={{ background: BRAND.lime.base }}>✓ done</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Master templates editor
// ---------------------------------------------------------------------------
function MastersEditor({ service, getMaster, updateMaster, onBack }: {
  service: string;
  getMaster: (service: string, ct: CareType) => Master;
  updateMaster: (service: string, ct: CareType, fields: Partial<Master>) => void;
  onBack: () => void;
}) {
  const [ct, setCt] = useState<CareType>("Before School Care");
  const m = getMaster(service, ct);

  const setChildren = (children: MChild[]) => updateMaster(service, ct, { children });
  const addChild = () => setChildren([...m.children, { id: makeId(), name: "", maxDays: "" }]);
  const editChild = (id: string, f: Partial<MChild>) => setChildren(m.children.map((c) => (c.id === id ? { ...c, ...f } : c)));
  const removeChild = (id: string) => setChildren(m.children.filter((c) => c.id !== id));

  return (
    <div className="mx-auto max-w-3xl space-y-4 p-4">
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="rounded-full bg-white px-3 py-1 text-sm font-bold text-ink-soft shadow-sm hover:bg-gray-50">← {service}</button>
        <h2 className="font-heading text-xl font-bold text-ink">Master templates</h2>
      </div>
      <p className="text-sm text-ink-soft">Set up the standing case details for each care type. You draw from these every week — edit any time and future drafts use the new values.</p>

      <div className="flex gap-2">
        {CARE_TYPES.map((c) => (
          <button key={c} onClick={() => setCt(c)} className="rounded-full px-3 py-1.5 text-sm font-bold" style={ct === c ? { background: BRAND[CARE_COLOR[c]].base, color: "#fff" } : { background: BRAND[CARE_COLOR[c]].tint, color: BRAND[CARE_COLOR[c]].shade }}>{CARE_SHORT[c]}</button>
        ))}
      </div>

      <div className="rounded-xl bg-white p-4 shadow">
        <p className="mb-3 text-xs font-bold uppercase tracking-wide" style={{ color: BRAND[CARE_COLOR[ct]].shade }}>{service} · {ct}</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-xs font-semibold text-ink-soft">Case ID
            <input value={m.caseId} onChange={(e) => updateMaster(service, ct, { caseId: e.target.value })} className={`mt-1 ${inputCls}`} placeholder="e.g. 4-KQ82VOY" />
          </label>
          <label className="text-xs font-semibold text-ink-soft">Max hours claimable
            <input value={m.maxHours} onChange={(e) => updateMaster(service, ct, { maxHours: e.target.value })} className={`mt-1 ${inputCls}`} placeholder="e.g. 2hr/day" />
          </label>
          <label className="text-xs font-semibold text-ink-soft">Case start date
            <input type="date" value={m.caseStart} onChange={(e) => updateMaster(service, ct, { caseStart: e.target.value })} className={`mt-1 ${inputCls}`} />
          </label>
          <label className="text-xs font-semibold text-ink-soft">Case end date
            <input type="date" value={m.caseEnd} onChange={(e) => updateMaster(service, ct, { caseEnd: e.target.value })} className={`mt-1 ${inputCls}`} />
          </label>
          <label className="text-xs font-semibold text-ink-soft">KU provider name
            <input value={m.kuName} onChange={(e) => updateMaster(service, ct, { kuName: e.target.value })} className={`mt-1 ${inputCls}`} />
          </label>
          <label className="text-xs font-semibold text-ink-soft">KU provider email
            <input type="email" value={m.kuEmail} onChange={(e) => updateMaster(service, ct, { kuEmail: e.target.value })} className={`mt-1 ${inputCls}`} />
          </label>
        </div>

        <div className="mt-4">
          <div className="mb-2 flex items-center justify-between">
            <h4 className="font-bold text-ink">Children on the case</h4>
            <button onClick={addChild} className="pill" style={{ background: BRAND[CARE_COLOR[ct]].base }}>+ Add child</button>
          </div>
          {m.children.length === 0 && <p className="rounded-lg border-2 border-dashed border-gray-200 p-3 text-center text-sm text-ink-soft">No children yet — add the children active on this case.</p>}
          <div className="space-y-2">
            {m.children.map((c) => (
              <div key={c.id} className="flex items-center gap-2">
                <input value={c.name} onChange={(e) => editChild(c.id, { name: e.target.value })} className={`flex-1 ${inputCls}`} placeholder="Child name" />
                <input value={c.maxDays} onChange={(e) => editChild(c.id, { maxDays: e.target.value })} className={`w-32 ${inputCls}`} placeholder="Max days" />
                <button onClick={() => removeChild(c.id)} className="px-2 text-ink-soft hover:text-pink" aria-label="Remove">✕</button>
              </div>
            ))}
          </div>
        </div>
      </div>
      <p className="text-center text-xs text-ink-soft/70">Saved automatically</p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Claim editor (draft)
// ---------------------------------------------------------------------------
function ReadRow({ label, value }: { label: string; value: string }) {
  return <div><span className="text-[11px] font-bold uppercase tracking-wide text-ink-soft">{label}</span><div className="text-sm text-ink">{value || "—"}</div></div>;
}

function ClaimEditor({ claim, onBack, onChange, onChildChange, onDelete, onConfirm }: {
  claim: Claim;
  onBack: () => void;
  onChange: (f: Partial<Claim>) => void;
  onChildChange: (childId: string, f: Partial<CChild>) => void;
  onDelete: () => void;
  onConfirm: () => void;
}) {
  const [warn, setWarn] = useState<string[] | null>(null);
  const color = BRAND[CARE_COLOR[claim.careType]].base;

  const tryConfirm = () => {
    const missing = missingFields(claim);
    if (missing.length) { setWarn(missing); return; }
    onConfirm();
  };

  return (
    <div className="mx-auto max-w-3xl space-y-4 p-4">
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="rounded-full bg-white px-3 py-1 text-sm font-bold text-ink-soft shadow-sm hover:bg-gray-50">← {claim.service}</button>
        <h2 className="font-heading text-xl font-bold text-ink">{claim.service}</h2>
        <span className="rounded-full px-2 py-0.5 text-xs font-bold text-white" style={{ background: color }}>{claim.careType}</span>
      </div>

      {/* Prefilled case info */}
      <div className="rounded-xl p-4" style={{ background: BRAND[CARE_COLOR[claim.careType]].tint }}>
        <p className="mb-2 text-xs font-bold uppercase tracking-wide" style={{ color: BRAND[CARE_COLOR[claim.careType]].shade }}>From master template</p>
        <div className="grid gap-3 sm:grid-cols-3">
          <ReadRow label="Case ID" value={claim.caseId} />
          <ReadRow label="Case dates" value={`${fmt(claim.caseStart)} → ${fmt(claim.caseEnd)}`} />
          <ReadRow label="Max hours" value={claim.maxHours} />
          <ReadRow label="KU provider" value={claim.kuName} />
          <ReadRow label="KU email" value={claim.kuEmail} />
        </div>
      </div>

      {/* Week dates */}
      <div className="rounded-xl bg-white p-4 shadow">
        <h3 className="mb-2 font-bold text-ink">This week</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-xs font-semibold text-ink-soft">Week start date
            <input type="date" value={claim.weekStart} onChange={(e) => onChange({ weekStart: e.target.value })} className={`mt-1 ${inputCls}`} />
          </label>
          <label className="text-xs font-semibold text-ink-soft">Week ending date
            <input type="date" value={claim.weekEnd} onChange={(e) => onChange({ weekEnd: e.target.value })} className={`mt-1 ${inputCls}`} />
          </label>
        </div>
      </div>

      {/* Attendance */}
      <div className="rounded-xl bg-white p-4 shadow">
        <h3 className="mb-2 font-bold text-ink">Children & attendance</h3>
        {claim.children.length === 0 && <p className="rounded-lg border-2 border-dashed border-gray-200 p-3 text-center text-sm text-ink-soft">This master template has no children. Add them in the master template, then start a new draft.</p>}
        <div className="space-y-3">
          {claim.children.map((c) => (
            <div key={c.id} className="rounded-lg border border-gray-100 p-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-ink">{c.name || "(unnamed child)"}</span>
                <span className="text-xs text-ink-soft">Max days claimable: <strong>{c.maxDays || "—"}</strong></span>
              </div>
              <div className="mt-2 grid gap-3 sm:grid-cols-2">
                <label className="text-xs font-semibold text-ink-soft">Days actually attended
                  <input value={c.daysAttended} onChange={(e) => onChildChange(c.id, { daysAttended: e.target.value })} className={`mt-1 ${inputCls}`} placeholder="e.g. Mon, Tue, Wed" />
                </label>
                <label className="text-xs font-semibold text-ink-soft">Absent days (claim non-contact funding)
                  <input value={c.absentClaimable} onChange={(e) => onChildChange(c.id, { absentClaimable: e.target.value })} className={`mt-1 ${inputCls}`} placeholder="e.g. Thu (sick)" />
                </label>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Staff identification */}
      <div className="rounded-xl bg-white p-4 shadow">
        <h3 className="mb-2 font-bold text-ink">Staff identification (Mon–Fri)</h3>
        <div className="grid gap-2 sm:grid-cols-5">
          {DAYS.map((d) => (
            <label key={d} className="text-xs font-semibold text-ink-soft">{d}
              <input value={claim.staff[d] ?? ""} onChange={(e) => onChange({ staff: { ...claim.staff, [d]: e.target.value } })} className={`mt-1 ${inputCls}`} placeholder="Staff name" />
            </label>
          ))}
        </div>
      </div>

      {warn && (
        <div className="rounded-lg bg-pink-tint p-3 text-sm" style={{ color: BRAND.pink.shade }}>
          <strong>Still needed before confirming:</strong> {warn.join(", ")}. It stays in Drafts until then.
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-2">
        <button onClick={onDelete} className="text-sm font-bold text-ink-soft hover:text-pink">Delete draft</button>
        <div className="flex items-center gap-2">
          <button onClick={onBack} className="rounded-full px-4 py-2 text-sm font-bold text-ink-soft hover:bg-gray-100">Save & close</button>
          <button onClick={tryConfirm} className="pill" style={{ background: BRAND.purple.base }}>Confirm → awaiting documentation</button>
        </div>
      </div>
      <p className="text-center text-xs text-ink-soft/70">Everything saves automatically as you type</p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Claim review (awaiting / completed) — the all-in-one summary
// ---------------------------------------------------------------------------
function ClaimReview({ claim, onBack, onReopen, onComplete, onBackToAwaiting }: {
  claim: Claim;
  onBack: () => void;
  onReopen: () => void;
  onComplete: () => void;
  onBackToAwaiting: () => void;
}) {
  const color = BRAND[CARE_COLOR[claim.careType]].base;
  const done = claim.status === "completed";
  return (
    <div className="mx-auto max-w-3xl space-y-4 p-4">
      <div className="flex flex-wrap items-center gap-3">
        <button onClick={onBack} className="rounded-full bg-white px-3 py-1 text-sm font-bold text-ink-soft shadow-sm hover:bg-gray-50">← {claim.service}</button>
        <h2 className="font-heading text-xl font-bold text-ink">{claim.service} · {CARE_SHORT[claim.careType]}</h2>
        <span className="rounded-full px-2 py-0.5 text-xs font-bold text-white" style={{ background: done ? BRAND.lime.base : BRAND.purple.base }}>{done ? "Completed" : "Awaiting documentation"}</span>
      </div>

      <div className="rounded-xl bg-white p-5 shadow" style={{ borderTop: `4px solid ${color}` }}>
        <h3 className="font-heading text-lg font-extrabold" style={{ color: INK }}>{claim.service}</h3>
        <p className="text-sm text-ink-soft">{claim.careType} · Week ending {fmt(claim.weekEnd)} ({fmt(claim.weekStart)} → {fmt(claim.weekEnd)})</p>

        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          <ReadRow label="Case ID" value={claim.caseId} />
          <ReadRow label="Case dates" value={`${fmt(claim.caseStart)} → ${fmt(claim.caseEnd)}`} />
          <ReadRow label="Max hours" value={claim.maxHours} />
          <ReadRow label="KU provider" value={claim.kuName} />
          <ReadRow label="KU email" value={claim.kuEmail} />
        </div>

        <h4 className="mt-4 mb-1 font-bold text-ink">Children & attendance</h4>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="text-left text-xs uppercase text-ink-soft">
              <th className="py-1 pr-3">Child</th><th className="py-1 pr-3">Max days</th><th className="py-1 pr-3">Attended</th><th className="py-1">Absent (claimable)</th>
            </tr></thead>
            <tbody>
              {claim.children.map((c) => (
                <tr key={c.id} className="border-t border-gray-100">
                  <td className="py-1.5 pr-3 font-semibold text-ink">{c.name || "—"}</td>
                  <td className="py-1.5 pr-3">{c.maxDays || "—"}</td>
                  <td className="py-1.5 pr-3">{c.daysAttended || "—"}</td>
                  <td className="py-1.5">{c.absentClaimable || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <h4 className="mt-4 mb-1 font-bold text-ink">Staff identification</h4>
        <div className="grid grid-cols-5 gap-2 text-sm">
          {DAYS.map((d) => (
            <div key={d} className="rounded-lg bg-gray-50 p-2 text-center">
              <div className="text-[11px] font-bold uppercase text-ink-soft">{d}</div>
              <div className="text-ink">{claim.staff[d] || "—"}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        {done ? (
          <button onClick={onBackToAwaiting} className="text-sm font-bold text-ink-soft hover:text-purple">↩ Move back to awaiting</button>
        ) : (
          <button onClick={onReopen} className="text-sm font-bold text-ink-soft hover:text-orange">✎ Reopen as draft to edit</button>
        )}
        {!done && (
          <button onClick={onComplete} className="pill" style={{ background: BRAND.lime.base }}>✓ Report has been made — mark complete</button>
        )}
      </div>
    </div>
  );
}

function NotFound({ onBack }: { onBack: () => void }) {
  return (
    <div className="mx-auto max-w-3xl p-8 text-center">
      <p className="text-ink-soft">That form couldn't be found.</p>
      <button onClick={onBack} className="mt-3 pill" style={{ background: BRAND.teal.base }}>← Back to services</button>
    </div>
  );
}
