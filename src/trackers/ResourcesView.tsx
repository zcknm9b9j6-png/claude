import { useState, type ReactNode } from "react";
import { BRAND } from "../brand";
import { makeId, usePersistentState } from "../lib/storage";

interface Password { id: string; label: string; username: string; password: string; url: string }
interface Link { id: string; title: string; url: string }
interface StoredFile { id: string; name: string; dataUrl: string }

export default function ResourcesView() {
  return (
    <div className="mx-auto max-w-4xl space-y-5 p-4">
      <p className="rounded-lg bg-orange-tint px-3 py-2 text-xs text-ink-soft">
        🔒 Everything here is stored only in this browser. Handy for quick access — but for
        critical master passwords, also keep a dedicated password manager.
      </p>
      <Passwords />
      <Links />
      <Files />
    </div>
  );
}

function Card({ title, color, action, children }: {
  title: string;
  color: keyof typeof BRAND;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-xl bg-white shadow">
      <div
        className="flex items-center justify-between px-4 py-2 text-white"
        style={{ background: BRAND[color].base }}
      >
        <h2 className="font-extrabold">{title}</h2>
        {action}
      </div>
      <div className="p-4">{children}</div>
    </section>
  );
}

function Passwords() {
  const [items, setItems] = usePersistentState<Password[]>("resources-passwords", []);
  const [show, setShow] = useState<Record<string, boolean>>({});
  const add = () =>
    setItems((xs) => [...xs, { id: makeId(), label: "", username: "", password: "", url: "" }]);
  const patch = (id: string, p: Partial<Password>) =>
    setItems((xs) => xs.map((x) => (x.id === id ? { ...x, ...p } : x)));

  return (
    <Card title="🔑 Passwords" color="purple" action={<AddBtn onClick={add} />}>
      {items.length === 0 && <Empty text="No saved logins yet." />}
      <div className="space-y-3">
        {items.map((p) => (
          <div key={p.id} className="rounded-lg border border-gray-200 p-3">
            <div className="mb-2 flex items-center gap-2">
              <input
                value={p.label}
                placeholder="What is this for?"
                onChange={(e) => patch(p.id, { label: e.target.value })}
                className="flex-1 bg-transparent font-bold text-ink outline-none"
              />
              <DelBtn onClick={() => setItems((xs) => xs.filter((x) => x.id !== p.id))} />
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <input
                value={p.username}
                placeholder="Username / email"
                onChange={(e) => patch(p.id, { username: e.target.value })}
                className="rounded border border-gray-300 px-2 py-1 text-sm outline-none"
              />
              <div className="flex items-center gap-1">
                <input
                  type={show[p.id] ? "text" : "password"}
                  value={p.password}
                  placeholder="Password"
                  onChange={(e) => patch(p.id, { password: e.target.value })}
                  className="flex-1 rounded border border-gray-300 px-2 py-1 text-sm outline-none"
                />
                <button
                  onClick={() => setShow((s) => ({ ...s, [p.id]: !s[p.id] }))}
                  className="rounded border border-gray-300 px-2 py-1 text-xs text-ink-soft"
                >
                  {show[p.id] ? "Hide" : "Show"}
                </button>
              </div>
              <input
                value={p.url}
                placeholder="Website (https://…)"
                onChange={(e) => patch(p.id, { url: e.target.value })}
                className="rounded border border-gray-300 px-2 py-1 text-sm outline-none sm:col-span-2"
              />
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

function Links() {
  const [items, setItems] = usePersistentState<Link[]>("resources-links", []);
  const add = () => setItems((xs) => [...xs, { id: makeId(), title: "", url: "" }]);
  const patch = (id: string, p: Partial<Link>) =>
    setItems((xs) => xs.map((x) => (x.id === id ? { ...x, ...p } : x)));

  return (
    <Card title="🔗 Important links" color="teal" action={<AddBtn onClick={add} />}>
      {items.length === 0 && <Empty text="No links saved yet." />}
      <div className="space-y-2">
        {items.map((l) => (
          <div key={l.id} className="flex items-center gap-2">
            <input
              value={l.title}
              placeholder="Title"
              onChange={(e) => patch(l.id, { title: e.target.value })}
              className="w-40 rounded border border-gray-300 px-2 py-1 text-sm outline-none"
            />
            <input
              value={l.url}
              placeholder="https://…"
              onChange={(e) => patch(l.id, { url: e.target.value })}
              className="flex-1 rounded border border-gray-300 px-2 py-1 text-sm outline-none"
            />
            {l.url && (
              <a href={l.url} target="_blank" rel="noreferrer" className="text-sm font-bold text-teal">
                Open ↗
              </a>
            )}
            <DelBtn onClick={() => setItems((xs) => xs.filter((x) => x.id !== l.id))} />
          </div>
        ))}
      </div>
    </Card>
  );
}

function Files() {
  const [items, setItems] = usePersistentState<StoredFile[]>("resources-files", []);
  const onUpload = (file?: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () =>
      setItems((xs) => [...xs, { id: makeId(), name: file.name, dataUrl: String(reader.result) }]);
    reader.readAsDataURL(file);
  };

  return (
    <Card
      title="📄 Templates & files"
      color="blue"
      action={
        <label className="cursor-pointer rounded-full bg-white/20 px-3 py-1 text-xs font-bold hover:bg-white/30">
          + Upload
          <input
            type="file"
            className="hidden"
            onChange={(e) => {
              onUpload(e.target.files?.[0]);
              e.target.value = "";
            }}
          />
        </label>
      }
    >
      <p className="mb-2 text-xs text-ink-soft">
        Save Word docs, PDFs or templates here to grab them on any return visit (smaller files work best).
      </p>
      {items.length === 0 && <Empty text="No files saved yet." />}
      <div className="space-y-2">
        {items.map((f) => (
          <div key={f.id} className="flex items-center gap-2 rounded-lg border border-gray-200 p-2">
            <span className="flex-1 truncate text-sm text-ink">{f.name}</span>
            <a href={f.dataUrl} download={f.name} className="text-sm font-bold text-blue">
              Download
            </a>
            <DelBtn onClick={() => setItems((xs) => xs.filter((x) => x.id !== f.id))} />
          </div>
        ))}
      </div>
    </Card>
  );
}

function AddBtn({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="rounded-full bg-white/20 px-3 py-1 text-xs font-bold hover:bg-white/30"
    >
      + Add
    </button>
  );
}
function DelBtn({ onClick }: { onClick: () => void }) {
  return (
    <button onClick={onClick} className="text-ink-soft/50 hover:text-pink" title="Delete">
      ✕
    </button>
  );
}
function Empty({ text }: { text: string }) {
  return <p className="text-sm text-ink-soft">{text}</p>;
}
