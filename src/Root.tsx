import { useState } from "react";
import App from "./App";
import AccessScreen from "./components/AccessScreen";
import { getSyncCode } from "./lib/cloudSync";

/**
 * Gates the app behind the single access screen. We consider the user "in" only
 * after they enter their code this session — so it always asks on a fresh open,
 * but the same code works on every device and loads their cloud data.
 */
export default function Root() {
  const [unlocked, setUnlocked] = useState(false);
  if (!unlocked) return <AccessScreen onUnlock={() => setUnlocked(true)} />;
  // Ensure a code is present (defensive) before showing the app.
  if (!getSyncCode()) return <AccessScreen onUnlock={() => setUnlocked(true)} />;
  return <App />;
}
