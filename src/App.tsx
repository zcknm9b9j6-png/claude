import { useEffect, useState } from "react";
import BackupModal from "./components/BackupModal";
import CloudSyncModal from "./components/CloudSyncModal";
import InfoHeader from "./components/InfoHeader";
import SettingsModal from "./components/SettingsModal";
import Tabs, { type TabDef } from "./components/Tabs";
import { usePersistentState } from "./lib/storage";
import { applyToLocal, getSyncCode, pullCloud, pushCloud } from "./lib/cloudSync";
import { DEFAULT_CONFIG, type TermConfig } from "./lib/terms";
import CalendarView from "./trackers/CalendarView";
import ProjectTracker from "./trackers/ProjectTracker";
import TermTracker from "./trackers/TermTracker";
import WeeklyTracker from "./trackers/WeeklyTracker";
import YearlyTracker from "./trackers/YearlyTracker";
import ResourcesView from "./trackers/ResourcesView";
import QuickNotesView from "./trackers/QuickNotesView";
import MarketingView from "./trackers/MarketingView";

const TABS: (TabDef & { title: string; subtitle: string })[] = [
  { key: "weekly", label: "Weekly", color: "teal", title: "Weekly Tracker", subtitle: "Recurring tasks per week" },
  { key: "term", label: "Term", color: "purple", title: "Term Tracker", subtitle: "Recurring tasks each term" },
  { key: "yearly", label: "Yearly", color: "pink", title: "Yearly Tracker", subtitle: "Annual tasks" },
  { key: "project", label: "Projects", color: "lime", title: "Project Tracker", subtitle: "One-off initiatives" },
  { key: "calendar", label: "Calendar", color: "pink", title: "Custom Calendar", subtitle: "Events & reminders" },
  { key: "resources", label: "Resources", color: "teal", title: "Resources", subtitle: "Passwords, links & templates" },
  { key: "notes", label: "Quick Notes", color: "orange", title: "Quick Notes", subtitle: "Jot & review notes" },
  { key: "marketing", label: "Marketing & Design", color: "pink", title: "Marketing & Design", subtitle: "Brand reference & marketing ideas" },
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

  // On open: if a sync code is set, pull the latest cloud copy and apply it.
  useEffect(() => {
    const code = getSyncCode();
    if (!code) return;
    let cancelled = false;
    setSyncStatus("loading");
    pullCloud(code)
      .then((cloud) => {
        if (cancelled) return;
        if (cloud && Object.keys(cloud).length) {
          applyToLocal(cloud);
          setDataVersion((v) => v + 1); // force views to re-read storage
        }
        setSyncStatus("synced");
      })
      .catch(() => !cancelled && setSyncStatus("error"));
    return () => {
      cancelled = true;
    };
  }, []);

  // Auto-push to the cloud (debounced) whenever data changes and a sync code is set.
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const onChange = () => {
      if (!getSyncCode()) return;
      setSyncStatus("saving");
      clearTimeout(timer);
      timer = setTimeout(() => {
        pushCloud(getSyncCode())
          .then(() => setSyncStatus("synced"))
          .catch(() => setSyncStatus("error"));
      }, 1200);
    };
    window.addEventListener("fpo-data-changed", onChange);
    return () => {
      window.removeEventListener("fpo-data-changed", onChange);
      clearTimeout(timer);
    };
  }, []);

  // Re-pull when the tab regains focus, so the other device's edits show up.
  useEffect(() => {
    const onFocus = () => {
      const code = getSyncCode();
      if (!code) return;
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
      </main>

      {settingsOpen && (
        <SettingsModal config={config} onSave={setConfig} onClose={() => setSettingsOpen(false)} />
      )}
      {backupOpen && <BackupModal onClose={() => setBackupOpen(false)} />}
      {syncOpen && <CloudSyncModal onClose={() => setSyncOpen(false)} />}
    </div>
  );
}
