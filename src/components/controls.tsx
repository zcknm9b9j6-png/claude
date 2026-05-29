import { BRAND } from "../brand";

/** A Done / — toggle cell. Click cycles between the two states. */
export function DoneToggle({
  done,
  onToggle,
  title,
}: {
  done: boolean;
  onToggle: () => void;
  title?: string;
}) {
  return (
    <button
      title={title}
      onClick={onToggle}
      className="grid h-7 w-full place-items-center rounded text-xs font-bold transition-colors"
      style={{
        background: done ? BRAND.lime.base : "transparent",
        color: done ? "#fff" : "#9a96a8",
        border: done ? "none" : "1px dashed #d6d4de",
      }}
    >
      {done ? "Done" : "—"}
    </button>
  );
}

/**
 * A coloured status dropdown. `colors` maps each option to a background colour;
 * the selected value paints the control so status reads at a glance.
 */
export function StatusSelect({
  value,
  options,
  colors,
  onChange,
}: {
  value: string;
  options: string[];
  colors: Record<string, string>;
  onChange: (value: string) => void;
}) {
  const bg = colors[value] ?? "transparent";
  const light = bg === "transparent";
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full cursor-pointer rounded border-none px-2 py-1 text-xs font-bold outline-none"
      style={{ background: bg, color: light ? "#9a96a8" : "#fff" }}
    >
      {options.map((o) => (
        <option key={o} value={o} style={{ background: "#fff", color: "#1C1533" }}>
          {o}
        </option>
      ))}
    </select>
  );
}
