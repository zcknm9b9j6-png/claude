import { useCallback, useEffect, useState } from "react";

const PREFIX = "fpo-tracker:";

/**
 * State that automatically persists to localStorage under a namespaced key.
 * Behaves like useState but survives reloads — the whole app is "personal" and
 * needs no backend. Swapping this for a fetch/save against an API later would
 * make the data sync across devices.
 */
export function usePersistentState<T>(
  key: string,
  initial: T | (() => T),
): [T, (value: T | ((prev: T) => T)) => void] {
  const fullKey = PREFIX + key;

  const [state, setState] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(fullKey);
      if (raw !== null) return JSON.parse(raw) as T;
    } catch {
      /* corrupt or unavailable storage — fall back to the initial value */
    }
    return typeof initial === "function" ? (initial as () => T)() : initial;
  });

  useEffect(() => {
    try {
      localStorage.setItem(fullKey, JSON.stringify(state));
    } catch {
      /* storage full or blocked — keep working in-memory */
    }
  }, [fullKey, state]);

  const set = useCallback(
    (value: T | ((prev: T) => T)) => setState(value),
    [],
  );

  return [state, set];
}

/** Stable, collision-resistant id for new rows. */
export function makeId(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

// ---------------------------------------------------------------------------
// Backup / restore — the "sync" mechanism. Because all state lives in
// localStorage under PREFIX, a backup is just a snapshot of those keys. Export
// on one device, import on another (or after clearing your browser).
// ---------------------------------------------------------------------------

const BACKUP_APP = "fairplay-oosh-task-tracker";

export interface BackupFile {
  app: typeof BACKUP_APP;
  version: 1;
  exportedAt: string;
  data: Record<string, unknown>;
}

/** Gather every persisted key into a single portable object. */
export function exportBackup(): BackupFile {
  const data: Record<string, unknown> = {};
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key || !key.startsWith(PREFIX)) continue;
    try {
      data[key.slice(PREFIX.length)] = JSON.parse(localStorage.getItem(key) ?? "null");
    } catch {
      /* skip unparseable entries */
    }
  }
  return {
    app: BACKUP_APP,
    version: 1,
    exportedAt: new Date().toISOString(),
    data,
  };
}

/** Write a backup file's contents back into localStorage. Throws if invalid. */
export function importBackup(file: unknown): void {
  const f = file as Partial<BackupFile>;
  if (!f || f.app !== BACKUP_APP || typeof f.data !== "object" || f.data === null) {
    throw new Error("This doesn't look like a Fair Play OOSH backup file.");
  }
  for (const [k, v] of Object.entries(f.data)) {
    localStorage.setItem(PREFIX + k, JSON.stringify(v));
  }
}

/** Trigger a download of the current data as a dated .json backup file. */
export function downloadBackup(): void {
  const blob = new Blob([JSON.stringify(exportBackup(), null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `fairplay-oosh-backup-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}
