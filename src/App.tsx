import { useEffect, useRef, useState } from "react";
import BackupModal from "./components/BackupModal";
import CloudSyncModal from "./components/CloudSyncModal";
import InfoHeader from "./components/InfoHeader";
import SettingsModal from "./components/SettingsModal";
import Tabs, { type TabDef } from "./components/Tabs";
import { usePersistentState } from "./lib/storage";
import { applyToLocal, getSyncCode, isDirty, markClean, markDirty, pullCloud, pushCloud } from "./lib/cloudSync";
import { DEFAULT_CONFIG, type TermConfig } from "./lib/terms";
import CalendarView from "./trackers/CalendarView";
import ProjectTracker from "./trackers/ProjectTracker";
import TermTracker from "./trackers/TermTracker";
import WeeklyTracker from "./trackers/WeeklyTracker";
import YearlyTracker from "./trackers/YearlyTracker";
import ResourcesView from "./trackers/ResourcesView";
import QuickNotesView from "./trackers/QuickNotesView";
import MarketingView from "./trackers/MarketingView";
import IDFClaimsView from "./trackers/IDFClaimsView";

const TABS: (TabDef & { title: string; subtitle: string })[] = [
  { key: "weekly", label: "Weekly", color: "teal", title: "Weekly Tracker", subtitle: "Recurring tasks per week" },
  { key: "term", label: "Term", color: "purple", title: "Term Tracker", subtitle: "Recurring tasks each term" },
  { key: "yearly", label: "Yearly", color: "pink", title: "Yearly Tracker", subtitle: "Annual tasks" },
  { key: "project", label: "Projects", color: "lime", title: "Project Tracker", subtitle: "One-off initiatives" },
  { key: "calendar", label: "Calendar", color: "pink", title: "Custom Calendar", subtitle: "Events & reminders" },
  { key: "resources", label: "Resources", color: "teal", title: "Resources", subtitle: "Passwords, links & templates" },
  { key: "notes", label: "Quick Notes", color: "orange", title: "Quick Notes", subtitle: "Jot & review notes" },
  { key: "marketing", label: "Marketing & Design", color: "pink", title: "Marketing & Design", subtitle: "Brand reference & marketing ideas" },
  { key: "idf", label: "IDF Claims", color: "teal", title: "IDF Claims", subtitle: "Inclusion Development Fund claim forms" },
];

export default function App() {
  const [config, setConfig] = usePersistentState<TermConfig>("config", DEFAULT_CONFIG);
  const [active, setActive] = usePersistentState<string>("active-tab", "weekly");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [backupOpen, setBackupOpen] = useState(false);
  const [syncOpen, setSyncOpen] = useState(false);
  const [jumpSignal, setJumpSignal] = useState(0);
  const [syncStatus, setSyncStatus] = useState<"off" | "loading" | "synced" | "saving" | "error">(
    getSyncCode() ? "loading" : "off",
  );
  // Bumped after a cloud load so every view re-reads its freshly-updated storage.
  const [dataVersion, setDataVersion] = useState(0);
  // True once the initial sync has settled — until then we ignore the change
  // events that fire as each view first writes its state to localStorage.
  const hydrated = useRef(false);

  // On open: reconcile with the cloud. If this device has local edits that never
  // reached the cloud (dirty), push them UP rather than overwriting them with a
  // stale copy; otherwise pull the latest cloud copy down.
  useEffect(() => {
    const code = getSyncCode();
    if (!code) {
      hydrated.current = true;
      return;
    }
    let cancelled = false;
    setSyncStatus("loading");
    (async () => {
      try {
        if (isDirty()) {
          await pushCloud(code); // flush unsynced local edits, don't clobber them
          markClean();
        } else {
          const cloud = await pullCloud(code);
          if (!cancelled && cloud && Object.keys(cloud).length) {
            applyToLocal(cloud);
            setDataVersion((v) => v + 1); // force views to re-read storage
          }
        }
        if (!cancelled) setSyncStatus("synced");
      } catch {
        if (!cancelled) setSyncStatus("error");
      } finally {
        hydrated.current = true;
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Auto-push to the cloud (debounced) whenever data changes and a sync code is set.
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const onChange = () => {
      if (!getSyncCode() || !hydrated.current) return;
      markDirty(); // there are now local edits not yet confirmed in the cloud
      setSyncStatus("saving");
      clearTimeout(timer);
      timer = setTimeout(() => {
        pushCloud(getSyncCode())
          .then(() => { markClean(); setSyncStatus("synced"); })
          .catch(() => setSyncStatus("error"));
      }, 1200);
    };
    window.addEventListener("fpo-data-changed", onChange);
    return () => {
      window.removeEventListener("fpo-data-changed", onChange);
      clearTimeout(timer);
    };
  }, []);

  // When the tab regains focus: if we have unsynced local edits, push them up
  // (never overwrite them). Only when local is clean do we pull the other
  // device's changes down. This stops a re-pull from wiping in-progress work.
  useEffect(() => {
    const onFocus = () => {
      const code = getSyncCode();
      if (!code) return;
      if (isDirty()) {
        setSyncStatus("saving");
        pushCloud(code)
          .then(() => { markClean(); setSyncStatus("synced"); })
          .catch(() => setSyncStatus("error"));
        return;
      }
      pullCloud(code)
        .then((cloud) => {
          if (cloud && Object.keys(cloud).length) {
            applyToLocal(cloud);
            setDataVersion((v) => v + 1);
            setSyncStatus("synced");
          }
        })
        .catch(() => setSyncStatus("error"));
    };
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, []);

  const tab = TABS.find((t) => t.key === active) ?? TABS[0];

  const jumpToCurrentTerm = () => {
    setActive("weekly");
    // bump a signal the Weekly view watches, so it scrolls after it mounts
    setJumpSignal((n) => n + 1);
  };

  return (
    <div className="min-h-full">
      <InfoHeader
        config={config}
        title={tab.title}
        subtitle={tab.subtitle}
        color={tab.color}
        onOpenSettings={() => setSettingsOpen(true)}
        onOpenBackup={() => setBackupOpen(true)}
        onOpenSync={() => setSyncOpen(true)}
        onJumpToTerm={jumpToCurrentTerm}
        onLock={() => { window.location.reload(); }}
        syncStatus={syncStatus}
      />
      <Tabs tabs={TABS} active={active} onChange={setActive} />

      <main key={`${active}-${dataVersion}`} className="animate-fade-in pb-16">
        {active === "weekly" && <WeeklyTracker config={config} jumpSignal={jumpSignal} />}
        {active === "term" && <TermTracker config={config} />}
        {active === "yearly" && <YearlyTracker />}
        {active === "project" && <ProjectTracker />}
        {active === "calendar" && <CalendarView config={config} />}
        {active === "resources" && <ResourcesView />}
        {active === "notes" && <QuickNotesView />}
        {active === "marketing" && <MarketingView />}
        {active === "idf" && <IDFClaimsView />}
      </main>

      {settingsOpen && (
        <SettingsModal config={config} onSave={setConfig} onClose={() => setSettingsOpen(false)} />
      )}
      {backupOpen && <BackupModal onClose={() => setBackupOpen(false)} />}
      {syncOpen && <CloudSyncModal onClose={() => setSyncOpen(false)} />}
    </div>
  );
}
