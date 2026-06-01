import { useState } from "react";
import App from "./App";
import AccessScreen from "./components/AccessScreen";
import Splash from "./Splash";
import { getSyncCode } from "./lib/cloudSync";

/**
 * Gates the app behind the single access screen. We consider the user "in" only
 * after they enter their code this session — so it always asks on a fresh open,
 * but the same code works on every device and loads their cloud data.
 */
export default function Root() {
  const [splashDone, setSplashDone] = useState(false);
  const [unlocked, setUnlocked] = useState(false);

  const unlockedView =
    unlocked && getSyncCode() ? (
      <App />
    ) : (
      <AccessScreen onUnlock={() => setUnlocked(true)} />
    );

  return (
    <>
      {!splashDone && <Splash onDone={() => setSplashDone(true)} />}
      {unlockedView}
    </>
  );
}
