# MyFirstBaby 🌱

A calm, private pregnancy & first-year companion. A calendar, a week-by-week checklist,
editable notes, and (soon) a shared photo gallery — installable as an app on both our phones.

## Run it locally
```bash
npm install
npm run dev
```
Then open http://localhost:5173. To test on a phone on the same Wi-Fi: `npm run dev -- --host`.

## How it's organized
- `src/` — the app (Today / Calendar / Schedule / Gallery + task detail).
- `src/data/timeline.ts` — the milestone backbone, distilled from `/pregnancy-guide`.
- `pregnancy-guide/` — the reference content (trimesters, go-bag, labor, postpartum,
  parents' prep & admin). See its own README for the full map.
- `.planning/STATE.md` — current status and what's next.

## The idea
Guidance is shown as **week windows** ("anatomy scan usually weeks 18–22"), kept separate
from **your real, movable appointments**. Reschedule, skip, or annotate anything — the plan
bends with reality instead of nagging.

## Data & privacy
Runs on-device today (localStorage). Shared sync + photos via Supabase are being wired in.
Keys live in a gitignored `.env`. The app is for the two of us.

> **Reference only.** Our OB, midwife, and pediatrician override anything in here.
