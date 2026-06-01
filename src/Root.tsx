import { useState } from "react";
import App from "./App";
import LockScreen from "./components/LockScreen";
import { isUnlocked } from "./lib/lock";

/** Gates the app behind the passcode lock screen. */
export default function Root() {
  const [unlocked, setUnlocked] = useState(isUnlocked());
  if (!unlocked) return <LockScreen onUnlock={() => setUnlocked(true)} />;
  return <App />;
}
