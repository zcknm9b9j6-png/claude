import { useEffect, useState } from "react";

/**
 * Returns today's date and re-renders the component when the calendar day
 * changes — so the term / week / day rolls over at midnight without needing a
 * manual page refresh. Checks every minute (cheap) and updates only on change.
 */
export function useToday(): Date {
  const [day, setDay] = useState(() => new Date().toDateString());
  useEffect(() => {
    const id = setInterval(() => {
      const now = new Date().toDateString();
      setDay((prev) => (prev === now ? prev : now));
    }, 60_000);
    return () => clearInterval(id);
  }, []);
  // `day` is in the dep-free closure; returning a fresh Date keeps callers simple.
  return new Date(day);
}
