import { useState } from "react";
import { BRAND } from "../brand";
import { applyToLocal, pullCloud, setSyncCode } from "../lib/cloudSync";

/**
 * Single access screen. One fixed access code unlocks the app; anything else is
 * rejected. The correct code also doubles as the cloud key, so on unlock the
 * matching data loads — same as before. The password is checked as a one-way
 * SHA-256 hash so the plain code never appears in the source.
 */
// SHA-256 of the access code. Compared against the hash of what's typed.
const ACCESS_HASH =
  "03fd3555a62337f972fa8aeead8919beef049462f52ce36c0239197d94ce1684";

async function sha256Hex(text: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export default function AccessScreen({ onUnlock }: { onUnlock: () => void }) {
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const raw = code.trim();
    if (raw.length < 4) {
      setError("Use at least 4 characters.");
      return;
    }
    setBusy(true);
    setError("");
    // Gate on the one fixed access code (checked as a one-way hash). Wrong code
    // is rejected here, before any unlock or cloud access.
    if ((await sha256Hex(raw)) !== ACCESS_HASH) {
      setError("Incorrect access code.");
      setBusy(false);
      return;
    }
    // Keep the original cloud key derivation so the same data loads as before.
    const clean = raw.toLowerCase();
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
      </div>
    </div>
  );
}
