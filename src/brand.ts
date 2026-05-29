// Brand colour tokens, kept in one place so components can reference them by
// name. Hex values mirror tailwind.config.js for use in inline styles / SVG.
export type BrandColor = "teal" | "purple" | "orange" | "lime" | "pink";

export interface ColorTriple {
  base: string;
  tint: string;
  shade: string;
}

export const BRAND: Record<BrandColor, ColorTriple> = {
  teal: { base: "#14B4C8", tint: "#E9F9FB", shade: "#1EA3B6" },
  purple: { base: "#8C148C", tint: "#F4E9F4", shade: "#7A2178" },
  orange: { base: "#F06414", tint: "#FDECE2", shade: "#D8531A" },
  lime: { base: "#A0C828", tint: "#F1F7E1", shade: "#87AE29" },
  pink: { base: "#DC008C", tint: "#FDE6F3", shade: "#C80077" },
};

export const INK = "#1C1533";

// Tailwind class helpers keyed by brand colour, so components can switch theme
// without string interpolation (which Tailwind's JIT can't see).
export const BG: Record<BrandColor, string> = {
  teal: "bg-teal",
  purple: "bg-purple",
  orange: "bg-orange",
  lime: "bg-lime",
  pink: "bg-pink",
};

export const TEXT: Record<BrandColor, string> = {
  teal: "text-teal",
  purple: "text-purple",
  orange: "text-orange",
  lime: "text-lime",
  pink: "text-pink",
};

export const TINT_BG: Record<BrandColor, string> = {
  teal: "bg-teal-tint",
  purple: "bg-purple-tint",
  orange: "bg-orange-tint",
  lime: "bg-lime-tint",
  pink: "bg-pink-tint",
};
