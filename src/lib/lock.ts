// Simple front-door passcode lock. Stored OUTSIDE the synced PREFIX so it stays
// on this device only and never travels to the cloud. The passcode is hashed
// (SHA-256) — the plain text is never saved.
//
// NOTE: this is a convenience lock to stop casual access on a shared device. It
// is not strong security for a public static site; don't rely on it for truly
// sensitive secrets.

const HASH_KEY = "fpo-lock-hash";
const UNLOCKED_KEY = "fpo-unlocked"; // sessionStorage flag, cleared when tab closes

export function hasPasscode(): boolean {
  return Boolean(localStorage.getItem(HASH_KEY));
}

export function isUnlocked(): boolean {
  return sessionStorage.getItem(UNLOCKED_KEY) === "1";
}

export function markUnlocked(): void {
  sessionStorage.setItem(UNLOCKED_KEY, "1");
}

export function lockNow(): void {
  sessionStorage.removeItem(UNLOCKED_KEY);
}

async function hash(text: string): Promise<string> {
  const data = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function setPasscode(code: string): Promise<void> {
  localStorage.setItem(HASH_KEY, await hash(code));
}

export async function checkPasscode(code: string): Promise<boolean> {
  const stored = localStorage.getItem(HASH_KEY);
  if (!stored) return false;
  return (await hash(code)) === stored;
}

/** Clears the passcode (the "forgot passcode" escape). Data is untouched. */
export function clearPasscode(): void {
  localStorage.removeItem(HASH_KEY);
  sessionStorage.removeItem(UNLOCKED_KEY);
}
