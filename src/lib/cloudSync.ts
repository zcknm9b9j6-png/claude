import { SUPABASE_KEY, SUPABASE_URL } from "./config";
import { exportBackup } from "./storage";

const PREFIX = "fpo-tracker:";
const REST = `${SUPABASE_URL}/rest/v1/app_state`;
const HEADERS = {
  apikey: SUPABASE_KEY,
  Authorization: `Bearer ${SUPABASE_KEY}`,
  "Content-Type": "application/json",
};

// Where the chosen sync code lives. Kept OUTSIDE the synced PREFIX so it never
// travels with the data itself.
const CODE_KEY = "fpo-sync-code";

export function getSyncCode(): string {
  return localStorage.getItem(CODE_KEY) ?? "";
}
export function setSyncCode(code: string): void {
  if (code) localStorage.setItem(CODE_KEY, code);
  else localStorage.removeItem(CODE_KEY);
}

/** Pull the cloud copy for a code. Returns the data object, or null if none. */
export async function pullCloud(code: string): Promise<Record<string, unknown> | null> {
  const res = await fetch(`${REST}?sync_code=eq.${encodeURIComponent(code)}&select=data`, {
    headers: HEADERS,
  });
  if (!res.ok) throw new Error(`Cloud read failed (${res.status})`);
  const rows = (await res.json()) as { data: Record<string, unknown> }[];
  return rows.length ? rows[0].data ?? {} : null;
}

/** Push the current local data up to the cloud under a code (insert or update). */
export async function pushCloud(code: string): Promise<void> {
  const body = [{ sync_code: code, data: exportBackup().data, updated_at: new Date().toISOString() }];
  const res = await fetch(REST, {
    method: "POST",
    headers: { ...HEADERS, Prefer: "resolution=merge-duplicates,return=minimal" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Cloud save failed (${res.status})`);
}

/** Write a cloud data object into localStorage (overwrites local keys). */
export function applyToLocal(data: Record<string, unknown>): void {
  for (const [k, v] of Object.entries(data)) {
    localStorage.setItem(PREFIX + k, JSON.stringify(v));
  }
}

// Every persisted write dispatches this event so the sync engine can react.
export const CHANGE_EVENT = "fpo-data-changed";
