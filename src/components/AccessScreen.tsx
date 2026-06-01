import { useState } from "react";
import { BRAND } from "../brand";
import { applyToLocal, pullCloud, setSyncCode } from "../lib/cloudSync";

/**
 * Single access screen. The access code IS the password AND the cloud key:
 * type it on any device to unlock and load that code's data. Nothing is stored
 * per-device, so the same code works everywhere.
 */
export default function AccessScreen({ onUnlock }: { onUnlock: () => void }) {
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = code.trim().toLowerCase();
    if (clean.length < 4) {
      setError("Use at least 4 characters.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      // Remember the code as the cloud sync key for this session/device.
      setSyncCode(clean);
      // Pull this code's cloud data (if any) so it shows up immediately.
      const cloud = await pullCloud(clean);
      if (cloud && Object.keys(cloud).length) applyToLocal(cloud);
      onUnlock();
    } catch {
      // Couldn't reach the cloud — still let them in with whatever's local,
      // rather than locking them out. Auto-sync will retry later.
      onUnlock();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="grid min-h-screen place-items-center bg-gradient-to-br from-teal-tint to-pink-tint p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
        <img src="./logo.png" alt="Fair Play OOSH" className="mx-auto mb-4 h-20 w-auto animate-logo-in" />
        <h1 className="text-center font-heading text-lg font-bold text-ink">Welcome, Aimee</h1>
        <p className="mb-4 mt-1 text-center text-sm text-ink-soft">
          Enter your access code to open your tracker. Use the <strong>same code</strong> on
          every device and your data follows you.
        </p>

        <form onSubmit={submit} className="space-y-3">
          <input
            type="password"
            autoFocus
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Your access code"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-center outline-none focus:border-teal"
          />
          {error && <p className="rounded-lg bg-pink-tint px-3 py-2 text-center text-sm text-pink">{error}</p>}
          <button
            type="submit"
            disabled={busy || !code}
            className="pill w-full disabled:opacity-50"
            style={{ background: BRAND.teal.base }}
          >
            {busy ? "Opening…" : "Unlock"}
          </button>
        </form>

        <p className="mt-4 text-center text-[11px] text-ink-soft/70">
          First time? Pick any code you'll remember — that becomes your private key.
          Keep it secret. For truly sensitive information, use a dedicated secure app.
        </p>
      </div>
    </div>
  );
}
