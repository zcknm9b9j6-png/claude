import { useState } from "react";
import { BRAND } from "../brand";
import { applyToLocal, getSyncCode, pullCloud, pushCloud, setSyncCode } from "../lib/cloudSync";

interface Props {
  onClose: () => void;
}

type Status = "idle" | "working" | "error";

/**
 * Cloud Sync — the cross-device flow. Pick a private sync code once per device.
 * "Load" pulls this code's data from the cloud into this device; "Save" pushes
 * this device's data up. After connecting, the app auto-saves to the cloud.
 */
export default function CloudSyncModal({ onClose }: Props) {
  const [code, setCode] = useState(getSyncCode());
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState<string>("");

  const clean = code.trim().toLowerCase();

  const connectAndLoad = async () => {
    if (!clean) return;
    setStatus("working");
    setMessage("Looking up your cloud data…");
    try {
      const cloud = await pullCloud(clean);
      setSyncCode(clean);
      if (cloud && Object.keys(cloud).length) {
        applyToLocal(cloud);
        setMessage("Loaded your data from the cloud. Reloading…");
        setTimeout(() => window.location.reload(), 800);
      } else {
        // No cloud copy yet — push what's on this device to start the record.
        await pushCloud(clean);
        setStatus("idle");
        setMessage("Connected! This device is now syncing. Your edits save to the cloud automatically.");
      }
    } catch (e) {
      setStatus("error");
      setMessage(e instanceof Error ? e.message : "Something went wrong.");
    }
  };

  const saveNow = async () => {
    if (!clean) return;
    setStatus("working");
    setMessage("Saving to the cloud…");
    try {
      setSyncCode(clean);
      await pushCloud(clean);
      setStatus("idle");
      setMessage("Saved to the cloud ✓");
    } catch (e) {
      setStatus("error");
      setMessage(e instanceof Error ? e.message : "Something went wrong.");
    }
  };

  const disconnect = () => {
    setSyncCode("");
    setCode("");
    setMessage("Disconnected. This device no longer syncs (your data stays here).");
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4" onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <h2 className="font-heading text-lg font-bold" style={{ color: BRAND.teal.shade }}>
          Cloud Sync — see your data on any device
        </h2>
        <p className="mb-4 mt-1 text-sm text-ink-soft">
          Pick a private <strong>sync code</strong> (like a password). Use the same code on your
          laptop and phone and they'll share the same data. Choose something only you know.
        </p>

        <label className="block text-sm font-bold text-ink">
          Your sync code
          <input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="e.g. aimee-fairplay-2026"
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 font-normal outline-none focus:border-teal"
          />
        </label>

        <div className="mt-4 flex flex-col gap-2">
          <button
            onClick={connectAndLoad}
            disabled={!clean || status === "working"}
            className="pill disabled:opacity-50"
            style={{ background: BRAND.teal.base }}
          >
            Connect &amp; load this code's data
          </button>
          <button
            onClick={saveNow}
            disabled={!clean || status === "working"}
            className="pill disabled:opacity-50"
            style={{ background: BRAND.purple.base }}
          >
            Save this device's data to the cloud
          </button>
        </div>

        {message && (
          <p className={`mt-3 rounded-lg px-3 py-2 text-sm ${status === "error" ? "bg-pink-tint text-pink" : "bg-teal-tint text-ink-soft"}`}>
            {message}
          </p>
        )}

        <div className="mt-4 rounded-lg bg-orange-tint px-3 py-2 text-xs text-ink-soft">
          ⚠️ Anyone who knows your sync code can see this data. Keep it private, and avoid storing
          your most critical master passwords here.
        </div>

        <div className="mt-5 flex items-center justify-between">
          {getSyncCode() ? (
            <button onClick={disconnect} className="text-sm font-bold text-ink-soft hover:text-pink">
              Disconnect this device
            </button>
          ) : (
            <span />
          )}
          <button onClick={onClose} className="rounded-full px-4 py-1.5 text-sm font-bold text-ink-soft hover:bg-gray-100">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
