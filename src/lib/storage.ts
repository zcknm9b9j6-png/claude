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
