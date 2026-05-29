import { useState } from "react";
import { BRAND } from "../brand";
import { DEFAULT_CONFIG, type TermConfig } from "../lib/terms";

interface Props {
  config: TermConfig;
  onSave: (config: TermConfig) => void;
  onClose: () => void;
}

/** Edit the NSW term dates that drive every auto-updating field in the app. */
export default function SettingsModal({ config, onSave, onClose }: Props) {
  const [draft, setDraft] = useState<TermConfig>(config);

  const setTerm = (id: number, field: "start" | "end", value: string) =>
    setDraft((d) => ({
      ...d,
      terms: d.terms.map((t) => (t.id === id ? { ...t, [field]: value } : t)),
    }));

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-extrabold" style={{ color: BRAND.purple.base }}>
          School term dates
        </h2>
        <p className="mb-4 text-sm text-ink-soft">
          These drive the Year / Current Term / Week / Day boxes and the calendar
          term bands. Set them each year from the NSW school calendar.
        </p>

        <label className="mb-3 block text-sm font-bold">
          Year
          <input
            type="number"
            value={draft.year}
            onChange={(e) => setDraft((d) => ({ ...d, year: Number(e.target.value) }))}
            className="mt-1 w-32 rounded-lg border border-gray-300 px-3 py-1.5 font-normal"
          />
        </label>

        <div className="space-y-2">
          {draft.terms.map((t) => (
            <div key={t.id} className="flex items-center gap-2 text-sm">
              <span className="w-16 font-bold">{t.label}</span>
              <input
                type="date"
                value={t.start}
                onChange={(e) => setTerm(t.id, "start", e.target.value)}
                className="rounded-lg border border-gray-300 px-2 py-1"
              />
              <span className="text-ink-soft">to</span>
              <input
                type="date"
                value={t.end}
                onChange={(e) => setTerm(t.id, "end", e.target.value)}
                className="rounded-lg border border-gray-300 px-2 py-1"
              />
            </div>
          ))}
        </div>

        <div className="mt-6 flex items-center justify-between">
          <button
            onClick={() => setDraft(DEFAULT_CONFIG)}
            className="text-sm font-bold text-ink-soft hover:text-ink"
          >
            Reset to NSW 2026
          </button>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="rounded-full px-4 py-1.5 text-sm font-bold text-ink-soft hover:bg-gray-100"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                onSave(draft);
                onClose();
              }}
              className="pill"
              style={{ background: BRAND.purple.base }}
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
