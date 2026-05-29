# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A single-page web app — the **Fair Play OOSH Task Tracker** — that recreates a
personal-task Excel workbook for an Out of School Hours Care provider (13
services, Newcastle & Hunter, NSW). It has five views (Weekly, Term, Yearly,
Project trackers + a custom Calendar) and is driven by NSW school-term dates.

Stack: **React 18 + TypeScript + Vite + Tailwind CSS 3**. No backend — all user
data persists to `localStorage`.

## Commands

```bash
npm install
npm run dev        # dev server with HMR
npm run build      # tsc -b && vite build  → dist/  (run this to verify changes type-check)
npm run preview    # serve the production build
npm run typecheck  # tsc --noEmit only
```

There is no test runner configured. The fastest correctness check is
`npm run build` (it type-checks the whole project). The term/date math in
`src/lib/terms.ts` is pure and can be exercised directly with
`node --experimental-strip-types` against a small script.

## Architecture

- **`src/lib/terms.ts`** is the heart of the app. It owns the NSW term config
  (`DEFAULT_CONFIG`) and all date math: `termStatus` (current term/week/day),
  `networkDays` (Excel NETWORKDAYS — business days inclusive), `weeksInTerm`,
  `termForDate`. These reproduce the original workbook's Config-sheet formulas;
  the header's Week/Day values must match the Excel (validated: 29 May 2026 →
  Term 2, Week 5, Day 24). Change date logic only here.
- **`src/lib/storage.ts`** — `usePersistentState(key, initial)` is the single
  persistence primitive (a `useState` that mirrors to `localStorage` under the
  `fpo-tracker:` prefix). Every tracker stores its data through this hook; the
  term config and active brand live here too. Swapping this hook's body for an
  API call is the seam for adding cloud sync later.
- **`src/App.tsx`** is the shell: owns the editable `TermConfig` and active tab,
  renders `InfoHeader` (the sticky Year/Term/Week/Day banner) + `Tabs`, and
  mounts one tracker at a time. The `TABS` array maps each view to its brand
  colour, title, and subtitle.
- **`src/trackers/*`** — one self-contained component per view. Each seeds its
  own default rows, reads/writes its own `usePersistentState` slice, and renders
  its own table/grid. They share `components/controls.tsx` (`DoneToggle`,
  `StatusSelect`) and the seed data in `data/seed.ts`.
- **`src/brand.ts` + `tailwind.config.js`** — the brand palette is defined in
  *both* (Tailwind classes for markup, hex `BRAND`/`INK` constants for inline
  styles and SVG). Keep them in sync. Tailwind's JIT cannot see interpolated
  class names, so dynamic colours are applied via inline `style` using `BRAND`.

## Conventions

- Five brand colours map to fixed roles: Weekly=teal, Term=purple, Yearly=orange,
  Project=lime, Calendar=pink. Term sections reuse these (see `data/seed.ts`).
- Seed data in `data/seed.ts` is transcribed from the real workbook; the Term
  tracker's defaults are authoritative — don't invent task lists elsewhere.
- Work on feature branches (e.g. `claude/<topic>`), not `main`.
- Dates are stored as `yyyy-mm-dd` strings and parsed with `parseISO` (local
  time, not UTC) to avoid off-by-one timezone drift — don't use `new Date(iso)`.
