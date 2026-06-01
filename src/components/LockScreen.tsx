import { useState } from "react";
import { BRAND } from "../brand";
import { checkPasscode, clearPasscode, hasPasscode, markUnlocked, setPasscode } from "../lib/lock";

/**
 * Front-door passcode gate. If no passcode is set yet, prompts to create one;
 * otherwise asks for it before revealing the app. Calls onUnlock when passed.
 */
export default function LockScreen({ onUnlock }: { onUnlock: () => void }) {
  const creating = !hasPasscode();
  const [code, setCode] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      if (creating) {
        if (code.length < 4) {
          setError("Use at least 4 characters.");
          return;
        }
        if (code !== confirm) {
          setError("The two passcodes don't match.");
          return;
        }
        await setPasscode(code);
        markUnlocked();
        onUnlock();
      } else {
        if (await checkPasscode(code)) {
          markUnlocked();
          onUnlock();
        } else {
          setError("Incorrect passcode. Try again.");
        }
      }
    } finally {
      setBusy(false);
    }
  };

  const forgot = () => {
    if (
      window.confirm(
        "Forgotten your passcode?\n\nThis clears the lock so you can set a new one. Your data is NOT deleted — it stays exactly as it is.",
      )
    ) {
      clearPasscode();
      setCode("");
      setConfirm("");
      setError("");
      // Re-render into "create" mode.
      window.location.reload();
    }
  };

  return (
    <div className="grid min-h-screen place-items-center bg-gradient-to-br from-teal-tint to-pink-tint p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
        <img src="./logo.png" alt="Fair Play OOSH" className="mx-auto mb-4 h-20 w-auto animate-logo-in" />
        <h1 className="text-center font-heading text-lg font-bold text-ink">
          {creating ? "Create a passcode" : "Welcome back, Aimee"}
        </h1>
        <p className="mb-4 mt-1 text-center text-sm text-ink-soft">
          {creating
            ? "Set a passcode to keep this tracker private on your device."
            : "Enter your passcode to unlock."}
        </p>

        <form onSubmit={submit} className="space-y-3">
          <input
            type="password"
            autoFocus
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder={creating ? "New passcode" : "Passcode"}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-center outline-none focus:border-teal"
          />
          {creating && (
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="Confirm passcode"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-center outline-none focus:border-teal"
            />
          )}
          {error && <p className="rounded-lg bg-pink-tint px-3 py-2 text-center text-sm text-pink">{error}</p>}
          <button
            type="submit"
            disabled={busy || !code}
            className="pill w-full disabled:opacity-50"
            style={{ background: BRAND.teal.base }}
          >
            {creating ? "Set passcode & enter" : "Unlock"}
          </button>
        </form>

        {!creating && (
          <button onClick={forgot} className="mt-4 w-full text-center text-xs font-bold text-ink-soft hover:text-pink">
            Forgotten your passcode?
          </button>
        )}

        <p className="mt-4 text-center text-[11px] text-ink-soft/70">
          This lock keeps casual visitors out on a shared device. For truly sensitive
          information, use a dedicated secure app.
        </p>
      </div>
    </div>
  );
}
