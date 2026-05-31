import { usePersistentState } from "../lib/storage";

/**
 * A dropdown of user-defined categories with an inline "+ New category" option.
 * Categories for a given `storeKey` are shared and persist, so the same list
 * shows up everywhere it's used (Projects, Resources, Notes).
 */
export function useCategories(storeKey: string, initial: string[] = []) {
  const [cats, setCats] = usePersistentState<string[]>(`categories-${storeKey}`, initial);
  const add = (name: string) => {
    const clean = name.trim();
    if (clean && !cats.includes(clean)) setCats((c) => [...c, clean]);
    return clean;
  };
  return { cats, add };
}

export function CategorySelect({
  value,
  categories,
  onChange,
  onAddCategory,
  placeholder = "Category",
}: {
  value: string;
  categories: string[];
  onChange: (v: string) => void;
  onAddCategory: (name: string) => string;
  placeholder?: string;
}) {
  return (
    <select
      value={value}
      onChange={(e) => {
        if (e.target.value === "__new__") {
          const name = window.prompt("New category name:");
          if (name) onChange(onAddCategory(name));
        } else {
          onChange(e.target.value);
        }
      }}
      className="rounded-lg border border-gray-300 px-2 py-1 text-sm outline-none"
    >
      <option value="">{placeholder}</option>
      {categories.map((c) => (
        <option key={c} value={c}>{c}</option>
      ))}
      <option value="__new__">+ New category…</option>
    </select>
  );
}
