import { BRAND, type BrandColor } from "../brand";

export interface TabDef {
  key: string;
  label: string;
  color: BrandColor;
}

interface Props {
  tabs: TabDef[];
  active: string;
  onChange: (key: string) => void;
}

export default function Tabs({ tabs, active, onChange }: Props) {
  return (
    <nav className="scroll-x z-10 flex gap-1 bg-white px-3 pt-2 shadow-sm">
      {tabs.map((t) => {
        const isActive = t.key === active;
        return (
          <button
            key={t.key}
            onClick={() => onChange(t.key)}
            className="whitespace-nowrap rounded-t-lg px-4 py-2 text-sm font-bold transition-colors"
            style={{
              background: isActive ? BRAND[t.color].base : "transparent",
              color: isActive ? "#fff" : "#4A4560",
              borderBottom: isActive
                ? `3px solid ${BRAND[t.color].shade}`
                : "3px solid transparent",
            }}
          >
            {t.label}
          </button>
        );
      })}
    </nav>
  );
}
