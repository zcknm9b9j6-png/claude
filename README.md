# Fair Play OOSH · Task Tracker

A personal work task-tracker web app for **Fair Play OOSH** (Out of School Hours
Care, 13 services across Newcastle & the Hunter, NSW). It's a web version of the
`FairPlayOOSH_Task_Tracker` Excel workbook, with the same NSW-school-term logic
and brand, plus a custom calendar.

## Features

- **Weekly Tracker** — recurring tasks per week, all four terms stacked, weeks
  outside a term greyed out, per-week "done" totals.
- **Term Tracker** — recurring tasks with one tick per term (T1–T4), grouped into
  six sections, with completion totals.
- **Yearly Tracker** — annual tasks with Done / In Progress status, date
  completed, responsible and notes.
- **Project Tracker** — one-off projects with auto colour-coded status and
  priority.
- **Custom Calendar** — month view with NSW term bands overlaid; add your own
  colour-coded events and reminders on any day.
- A sticky header on every view showing **Year / Current Term / Week of Term /
  Day of Term**, computed live from the NSW term dates (editable via *Term
  dates*).

All data is saved in your browser (localStorage) — no login, no server, no cost.

## Getting started

```bash
npm install
npm run dev      # start the local dev server
npm run build    # type-check and build for production (outputs to dist/)
npm run preview  # serve the production build locally
```

## Brand

Teal `#14B4C8` · Purple `#8C148C` · Lime `#A0C828` · Orange `#F06414` · Hot Pink
`#DC008C`. Each colour has a 10% tint and a darker shade (hover), defined in
`tailwind.config.js` and `src/brand.ts`.
