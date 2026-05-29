import { useRef, useState } from "react";
import { BRAND } from "../brand";
import { downloadBackup, importBackup } from "../lib/storage";

interface Props {
  onClose: () => void;
}

/**
 * Backup & restore — the cross-device "sync" flow. Export writes a .json file
 * you can store anywhere (email, iCloud, USB). Import reads one back in and
 * reloads so every tracker picks up the restored data.
 */
export default function BackupModal({ onClose }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    try {
      const parsed = JSON.parse(await file.text());
      importBackup(parsed);
      window.location.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not read that file.");
    } finally {
      e.target.value = "";
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-extrabold" style={{ color: BRAND.teal.shade }}>
          Backup &amp; move between devices
        </h2>
        <p className="mb-4 text-sm text-ink-soft">
          Your data is saved in this browser. To move it to your phone or another
          computer, export a backup file here, then import it on the other device.
        </p>

        <div className="space-y-3">
          <button
            onClick={downloadBackup}
            className="flex w-full items-center justify-between rounded-xl px-4 py-3 text-left text-white"
            style={{ background: BRAND.teal.base }}
          >
            <span>
              <span className="block font-bold">Export backup</span>
              <span className="text-xs text-white/80">Download all your data as a file</span>
            </span>
            <span className="text-xl">↓</span>
          </button>

          {!confirming ? (
            <button
              onClick={() => setConfirming(true)}
              className="flex w-full items-center justify-between rounded-xl border-2 px-4 py-3 text-left"
              style={{ borderColor: BRAND.purple.base, color: BRAND.purple.base }}
            >
              <span>
                <span className="block font-bold">Import backup</span>
                <span className="text-xs opacity-70">Restore from a backup file</span>
              </span>
              <span className="text-xl">↑</span>
            </button>
          ) : (
            <div className="rounded-xl border-2 p-3" style={{ borderColor: BRAND.purple.base }}>
              <p className="mb-2 text-sm font-bold text-ink">
                Importing replaces the data currently in this browser. Continue?
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => fileRef.current?.click()}
                  className="pill"
                  style={{ background: BRAND.purple.base }}
                >
                  Choose file
                </button>
                <button
                  onClick={() => setConfirming(false)}
                  className="rounded-full px-4 py-1.5 text-sm font-bold text-ink-soft hover:bg-gray-100"
                >
                  Cancel
                </button>
              </div>
              <input
                ref={fileRef}
                type="file"
                accept="application/json,.json"
                className="hidden"
                onChange={onFile}
              />
            </div>
          )}

          {error && <p className="text-sm font-semibold text-pink">{error}</p>}
        </div>

        <div className="mt-6 text-right">
          <button
            onClick={onClose}
            className="rounded-full px-4 py-1.5 text-sm font-bold text-ink-soft hover:bg-gray-100"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
