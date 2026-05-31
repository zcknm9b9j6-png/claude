import { useState, type ReactNode } from "react";
import { BRAND, type BrandColor } from "../brand";
import { makeId, usePersistentState } from "../lib/storage";
import { CategorySelect, useCategories } from "../components/CategorySelect";

interface Password { id: string; label: string; username: string; password: string; url: string }
interface Link { id: string; title: string; url: string }
interface StoredFile { id: string; name: string; category: string; fileName: string; dataUrl: string }

type SectionKey = "passwords" | "links" | "files";

export default function ResourcesView() {
  // Which section is expanded. Only one open at a time → no endless scrolling.
  const [openSection, setOpenSection] = usePersistentState<SectionKey>("resources-open", "passwords");

  return (
    <div className="mx-auto max-w-4xl space-y-3 p-4">
      <Accordion title="🔑 Passwords" color="purple" isOpen={openSection === "passwords"} onToggle={() => setOpenSection("passwords")}>
        <Passwords />
      </Accordion>
      <Accordion title="🔗 Important links" color="teal" isOpen={openSection === "links"} onToggle={() => setOpenSection("links")}>
        <Links />
      </Accordion>
      <Accordion title="📄 Templates & files" color="orange" isOpen={openSection === "files"} onToggle={() => setOpenSection("files")}>
        <Files />
      </Accordion>
    </div>
  );
}

function Accordion({ title, color, isOpen, onToggle, children }: { title: string; color: BrandColor; isOpen: boolean; onToggle: () => void; children: ReactNode }) {
  return (
    <section className="overflow-hidden rounded-xl bg-white shadow">
      <button onClick={onToggle} className="flex w-full items-center justify-between px-4 py-3 text-left text-white" style={{ background: BRAND[color].base }}>
        <h2 className="font-heading font-bold">{title}</h2>
        <span className="text-lg">{isOpen ? "▾" : "▸"}</span>
      </button>
      {isOpen && <div className="animate-fade-in p-4">{children}</div>}
    </section>
  );
}

function Passwords() {
  const [items, setItems] = usePersistentState<Password[]>("resources-passwords", []);
  const [show, setShow] = useState<Record<string, boolean>>({});
  const add = () => setItems((xs) => [...xs, { id: makeId(), label: "", username: "", password: "", url: "" }]);
  const patch = (id: string, p: Partial<Password>) => setItems((xs) => xs.map((x) => (x.id === id ? { ...x, ...p } : x)));

  return (
    <>
      <div className="mb-3"><AddBtn onClick={add} label="+ Add login" /></div>
      {items.length === 0 && <Empty text="No saved logins yet." />}
      <div className="space-y-3">
        {items.map((p) => (
          <div key={p.id} className="rounded-lg border border-gray-200 p-3">
            <div className="mb-2 flex items-center gap-2">
              <input value={p.label} placeholder="What is this for?" onChange={(e) => patch(p.id, { label: e.target.value })} className="flex-1 bg-transparent font-bold text-ink outline-none" />
              <DelBtn onClick={() => setItems((xs) => xs.filter((x) => x.id !== p.id))} />
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <input value={p.username} placeholder="Username / email" onChange={(e) => patch(p.id, { username: e.target.value })} className="rounded border border-gray-300 px-2 py-1 text-sm outline-none" />
              <div className="flex items-center gap-1">
                <input type={show[p.id] ? "text" : "password"} value={p.password} placeholder="Password" onChange={(e) => patch(p.id, { password: e.target.value })} className="flex-1 rounded border border-gray-300 px-2 py-1 text-sm outline-none" />
                <button onClick={() => setShow((s) => ({ ...s, [p.id]: !s[p.id] }))} className="rounded border border-gray-300 px-2 py-1 text-xs text-ink-soft">{show[p.id] ? "Hide" : "Show"}</button>
              </div>
              <input value={p.url} placeholder="Website (https://…)" onChange={(e) => patch(p.id, { url: e.target.value })} className="rounded border border-gray-300 px-2 py-1 text-sm outline-none sm:col-span-2" />
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

function Links() {
  const [items, setItems] = usePersistentState<Link[]>("resources-links", []);
  const add = () => setItems((xs) => [...xs, { id: makeId(), title: "", url: "" }]);
  const patch = (id: string, p: Partial<Link>) => setItems((xs) => xs.map((x) => (x.id === id ? { ...x, ...p } : x)));

  return (
    <>
      <div className="mb-3"><AddBtn onClick={add} label="+ Add link" /></div>
      {items.length === 0 && <Empty text="No links saved yet." />}
      <div className="space-y-2">
        {items.map((l) => (
          <div key={l.id} className="flex items-center gap-2">
            <input value={l.title} placeholder="Title" onChange={(e) => patch(l.id, { title: e.target.value })} className="w-40 rounded border border-gray-300 px-2 py-1 text-sm outline-none" />
            <input value={l.url} placeholder="https://…" onChange={(e) => patch(l.id, { url: e.target.value })} className="flex-1 rounded border border-gray-300 px-2 py-1 text-sm outline-none" />
            {l.url && <a href={l.url} target="_blank" rel="noreferrer" className="text-sm font-bold text-teal">Open ↗</a>}
            <DelBtn onClick={() => setItems((xs) => xs.filter((x) => x.id !== l.id))} />
          </div>
        ))}
      </div>
    </>
  );
}

function Files() {
  const [items, setItems] = usePersistentState<StoredFile[]>("resources-files", []);
  const { cats, add: addCat } = useCategories("resources", ["Forms", "Policies", "Newsletters", "Rosters"]);
  const patch = (id: string, p: Partial<StoredFile>) => setItems((xs) => xs.map((x) => (x.id === id ? { ...x, ...p } : x)));

  const onUpload = (file?: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setItems((xs) => [...xs, { id: makeId(), name: file.name, category: "", fileName: file.name, dataUrl: String(reader.result) }]);
    reader.readAsDataURL(file);
  };

  return (
    <>
      <label className="mb-3 inline-block cursor-pointer rounded-full px-3 py-1.5 text-sm font-bold text-white" style={{ background: BRAND.orange.base }}>
        + Upload file
        <input type="file" className="hidden" onChange={(e) => { onUpload(e.target.files?.[0]); e.target.value = ""; }} />
      </label>
      {items.length === 0 && <Empty text="No files saved yet." />}
      <div className="space-y-2">
        {items.map((f) => (
          <div key={f.id} className="rounded-lg border border-gray-200 p-3">
            <div className="mb-2 flex items-center gap-2">
              <input value={f.name} placeholder="Name this file…" onChange={(e) => patch(f.id, { name: e.target.value })} className="flex-1 bg-transparent font-bold text-ink outline-none" />
              <DelBtn onClick={() => setItems((xs) => xs.filter((x) => x.id !== f.id))} />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <CategorySelect value={f.category} categories={cats} onChange={(v) => patch(f.id, { category: v })} onAddCategory={addCat} />
              <a href={f.dataUrl} download={f.fileName} className="text-sm font-bold text-orange">Download ({f.fileName})</a>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

function AddBtn({ onClick, label }: { onClick: () => void; label: string }) {
  return <button onClick={onClick} className="rounded-full border border-gray-300 px-3 py-1 text-sm font-bold text-ink-soft hover:bg-gray-50">{label}</button>;
}
function DelBtn({ onClick }: { onClick: () => void }) {
  return <button onClick={onClick} className="text-ink-soft/50 hover:text-pink" title="Delete">✕</button>;
}
function Empty({ text }: { text: string }) {
  return <p className="text-sm text-ink-soft">{text}</p>;
}
