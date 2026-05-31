import { useState } from "react";
import { BRAND } from "../brand";
import { makeId, usePersistentState } from "../lib/storage";

interface Note {
  id: string;
  title: string;
  body: string;
  updatedAt: number;
}

export default function QuickNotesView() {
  const [notes, setNotes] = usePersistentState<Note[]>("quick-notes", []);
  const [openId, setOpenId] = useState<string | null>(null);

  const sorted = [...notes].sort((a, b) => b.updatedAt - a.updatedAt);
  const open = openId ? notes.find((n) => n.id === openId) ?? null : null;

  const create = () => {
    const n: Note = { id: makeId(), title: "", body: "", updatedAt: Date.now() };
    setNotes((ns) => [n, ...ns]);
    setOpenId(n.id);
  };
  const patch = (id: string, fields: Partial<Note>) =>
    setNotes((ns) =>
      ns.map((n) => (n.id === id ? { ...n, ...fields, updatedAt: Date.now() } : n)),
    );
  const remove = (id: string) => {
    setNotes((ns) => ns.filter((n) => n.id !== id));
    setOpenId(null);
  };

  return (
    <div className="mx-auto max-w-5xl p-4">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm text-ink-soft">
          Jot anything down in a meeting — it saves automatically. Review old notes any time.
        </p>
        <button onClick={create} className="pill" style={{ background: BRAND.pink.base }}>
          + New note
        </button>
      </div>

      {sorted.length === 0 && (
        <div className="rounded-xl border-2 border-dashed border-gray-200 bg-white p-10 text-center text-ink-soft">
          No notes yet. Tap “New note” to start.
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {sorted.map((n) => (
          <button
            key={n.id}
            onClick={() => setOpenId(n.id)}
            className="rounded-xl bg-white p-4 text-left shadow transition-shadow hover:shadow-md"
          >
            <h3 className="truncate font-extrabold text-ink">{n.title || "(untitled note)"}</h3>
            <p className="mt-1 line-clamp-3 whitespace-pre-wrap text-sm text-ink-soft">
              {n.body || "Empty note"}
            </p>
            <p className="mt-2 text-[11px] text-ink-soft/70">
              {new Date(n.updatedAt).toLocaleString("en-AU")}
            </p>
          </button>
        ))}
      </div>

      {open && (
        <div
          className="fixed inset-0 z-50 grid place-items-start justify-center overflow-y-auto bg-black/40 p-4"
          onClick={() => setOpenId(null)}
        >
          <div
            className="my-8 w-full max-w-2xl rounded-2xl bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-3 flex items-center gap-2">
              <input
                value={open.title}
                placeholder="Note title…"
                onChange={(e) => patch(open.id, { title: e.target.value })}
                className="flex-1 bg-transparent text-lg font-extrabold text-ink outline-none"
              />
              <button onClick={() => setOpenId(null)} className="text-ink-soft hover:text-ink">
                ✕
              </button>
            </div>
            <textarea
              value={open.body}
              placeholder="Start typing…"
              rows={14}
              onChange={(e) => patch(open.id, { body: e.target.value })}
              className="w-full resize-none rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-pink"
            />
            <div className="mt-4 flex items-center justify-between">
              <button
                onClick={() => remove(open.id)}
                className="text-sm font-bold text-ink-soft hover:text-pink"
              >
                Delete note
              </button>
              <span className="text-xs text-ink-soft/70">Saved automatically</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
