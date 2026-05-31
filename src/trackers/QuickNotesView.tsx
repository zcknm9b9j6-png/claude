import { useState } from "react";
import { BRAND } from "../brand";
import { makeId, usePersistentState } from "../lib/storage";
import { CategorySelect, useCategories } from "../components/CategorySelect";

interface Note {
  id: string;
  title: string;
  body: string;
  category: string;
  updatedAt: number;
}

export default function QuickNotesView() {
  const [notes, setNotes] = usePersistentState<Note[]>("quick-notes", []);
  const [openId, setOpenId] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>("");
  const { cats, add: addCat } = useCategories("notes", ["Meetings", "Ideas", "To-do", "Personal"]);

  const sorted = [...notes]
    .filter((n) => !filter || n.category === filter)
    .sort((a, b) => b.updatedAt - a.updatedAt);
  const open = openId ? notes.find((n) => n.id === openId) ?? null : null;

  const create = () => {
    const n: Note = { id: makeId(), title: "", body: "", category: "", updatedAt: Date.now() };
    setNotes((ns) => [n, ...ns]);
    setOpenId(n.id);
  };
  const patch = (id: string, fields: Partial<Note>) =>
    setNotes((ns) => ns.map((n) => (n.id === id ? { ...n, ...fields, updatedAt: Date.now() } : n)));
  const remove = (id: string) => {
    setNotes((ns) => ns.filter((n) => n.id !== id));
    setOpenId(null);
  };

  return (
    <div className="mx-auto max-w-5xl p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-ink-soft">Jot anything down — it saves automatically. Review old notes any time.</p>
        <div className="flex items-center gap-2">
          <select value={filter} onChange={(e) => setFilter(e.target.value)} className="rounded-lg border border-gray-300 px-2 py-1 text-sm outline-none">
            <option value="">All categories</option>
            {cats.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <button onClick={create} className="pill" style={{ background: BRAND.orange.base }}>+ New note</button>
        </div>
      </div>

      {sorted.length === 0 && (
        <div className="rounded-xl border-2 border-dashed border-gray-200 bg-white p-10 text-center text-ink-soft">No notes yet. Tap "New note" to start.</div>
      )}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {sorted.map((n) => (
          <button key={n.id} onClick={() => setOpenId(n.id)} className="rounded-xl bg-white p-4 text-left shadow transition-shadow hover:shadow-md">
            <div className="flex items-center justify-between gap-2">
              <h3 className="truncate font-heading font-bold text-ink">{n.title || "(untitled note)"}</h3>
              {n.category && <span className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold text-white" style={{ background: BRAND.purple.base }}>{n.category}</span>}
            </div>
            <p className="mt-1 line-clamp-3 whitespace-pre-wrap text-sm text-ink-soft">{n.body || "Empty note"}</p>
            <p className="mt-2 text-[11px] text-ink-soft/70">{new Date(n.updatedAt).toLocaleString("en-AU")}</p>
          </button>
        ))}
      </div>

      {open && (
        <div className="fixed inset-0 z-50 flex flex-col bg-white">
          <div className="flex items-center gap-2 border-b px-4 py-3" style={{ background: BRAND.orange.tint }}>
            <button onClick={() => setOpenId(null)} className="rounded-full bg-white px-3 py-1 text-sm font-bold text-ink-soft hover:bg-gray-100">← Back</button>
            <input value={open.title} placeholder="Note title…" onChange={(e) => patch(open.id, { title: e.target.value })} className="flex-1 bg-transparent font-heading text-lg font-bold text-ink outline-none" />
            <button onClick={() => remove(open.id)} className="text-sm font-bold text-ink-soft hover:text-pink">Delete</button>
          </div>
          <div className="flex items-center gap-2 border-b px-4 py-2 text-sm">
            <span className="text-ink-soft">Category:</span>
            <CategorySelect value={open.category} categories={cats} onChange={(v) => patch(open.id, { category: v })} onAddCategory={addCat} />
            <span className="flex-1" />
            <span className="text-xs text-ink-soft/70">Saved automatically</span>
          </div>
          <textarea
            value={open.body}
            placeholder="Start typing…"
            autoFocus
            onChange={(e) => patch(open.id, { body: e.target.value })}
            className="flex-1 resize-none px-5 py-4 text-base outline-none"
          />
        </div>
      )}
    </div>
  );
}
