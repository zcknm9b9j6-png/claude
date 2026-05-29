import { useState } from "react";
import BackupModal from "./components/BackupModal";
import InfoHeader from "./components/InfoHeader";
import SettingsModal from "./components/SettingsModal";
import Tabs, { type TabDef } from "./components/Tabs";
import { usePersistentState } from "./lib/storage";
import { DEFAULT_CONFIG, type TermConfig } from "./lib/terms";
import CalendarView from "./trackers/CalendarView";
import ProjectTracker from "./trackers/ProjectTracker";
import TermTracker from "./trackers/TermTracker";
import WeeklyTracker from "./trackers/WeeklyTracker";
import YearlyTracker from "./trackers/YearlyTracker";

const TABS: (TabDef & { title: string; subtitle: string })[] = [
  { key: "weekly", label: "Weekly", color: "teal", title: "Weekly Tracker", subtitle: "Recurring tasks per week" },
  { key: "term", label: "Term", color: "purple", title: "Term Tracker", subtitle: "Recurring tasks each term" },
  { key: "yearly", label: "Yearly", color: "orange", title: "Yearly Tracker", subtitle: "Annual tasks" },
  { key: "project", label: "Projects", color: "lime", title: "Project Tracker", subtitle: "One-off initiatives" },
  { key: "calendar", label: "Calendar", color: "pink", title: "Custom Calendar", subtitle: "Events & reminders" },
];

export default function App() {
  const [config, setConfig] = usePersistentState<TermConfig>("config", DEFAULT_CONFIG);
  const [active, setActive] = useState("weekly");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [backupOpen, setBackupOpen] = useState(false);

  const tab = TABS.find((t) => t.key === active) ?? TABS[0];

  return (
    <div className="min-h-full">
      <InfoHeader
        config={config}
        title={tab.title}
        subtitle={tab.subtitle}
        color={tab.color}
        onOpenSettings={() => setSettingsOpen(true)}
        onOpenBackup={() => setBackupOpen(true)}
      />
      <Tabs tabs={TABS} active={active} onChange={setActive} />

      <main className="pb-16">
        {active === "weekly" && <WeeklyTracker config={config} />}
        {active === "term" && <TermTracker config={config} />}
        {active === "yearly" && <YearlyTracker />}
        {active === "project" && <ProjectTracker />}
        {active === "calendar" && <CalendarView config={config} />}
      </main>

      <footer className="px-5 py-3 text-center text-xs text-ink-soft">
        Fair Play OOSH · Newcastle &amp; Hunter · fairplayoosh.com.au — data saved in
        this browser. Use <strong>Backup</strong> to move it between devices.
      </footer>

      {settingsOpen && (
        <SettingsModal
          config={config}
          onSave={setConfig}
          onClose={() => setSettingsOpen(false)}
        />
      )}

      {backupOpen && <BackupModal onClose={() => setBackupOpen(false)} />}
    </div>
  );
}
