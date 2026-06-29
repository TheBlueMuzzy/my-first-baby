# Project State — MyFirstBaby

_Last updated: 2026-06-29_

## ▶ RESUME HERE
Cloud sync, accounts, and the photo gallery are **built and verified end-to-end**.
The only thing left is **deploying to GitHub Pages**, which needs Muzzy's input
(repo name + GitHub account). Everything else works locally right now.

Two small follow-ups for Muzzy (not code):
1. **Rotate the `sbp_…` Supabase access token** — it was shared in chat earlier.
2. (Optional) In Supabase → Authentication → Providers → Email, decide whether to keep
   **"Confirm email" ON** (more secure; each person clicks a link in their inbox before
   first sign-in) or turn it **OFF** (instant sign-in, fine for a 2-person private app).
   It's currently ON. The app handles both — if ON, it shows a "check your email" message.

## What this is
A pregnancy & first-year companion web app (PWA) for Muzzy + partner. Installable on
his Pixel 6 and her iPhone 16. Clean, calm, mobile-first. Content backbone lives in
`/pregnancy-guide` (reference markdown).

## Key facts
- **Working due date: ~Feb 18, 2027.** Editable in-app on Today; every milestone
  recalculates from it. Now also synced to the cloud (shared between both phones).
- **First prenatal appointment: Mon, July 13, 2026** — seeded into each new household.
- Supabase project: `ifqokpthvvjkuxxcbmei` (US East).

## Stack
React 18 + TypeScript + Vite 5 · react-router-dom (HashRouter) · date-fns ·
vite-plugin-pwa · @supabase/supabase-js. Run: `npm install` then `npm run dev`.

## Done — v1 foundation (on-device)
- Date math + week-by-week baby size, ~40-item milestone timeline.
- Today / Calendar / Schedule / Task-detail screens. Forgiving plan (windows vs. real
  movable dates), mark done / skip / reschedule / notes.

## Done — v2 cloud sync + accounts + gallery (THIS SESSION, all verified)
**Database (Supabase, via MCP migrations):**
- Tables: `households` (name, unique `join_code`, `due_date`, created_by), `household_members`,
  `tasks` (mirrors the on-device `TaskState` shape), `events`, `photos`. All under
  Row-Level Security — only household members can read/write their rows.
- `is_household_member()` SECURITY DEFINER helper (avoids RLS recursion).
- RPCs `create_household()` / `join_household()` (so a non-member can join by code under RLS),
  `gen_join_code()` (6 chars, no ambiguous letters). EXECUTE locked to `authenticated`.
- Private `photos` storage bucket; files stored under `<household_id>/<uuid>`, RLS by the
  first path segment. `tasks` + `households` added to the `supabase_realtime` publication.
- Security advisors checked — only the expected "authenticated can call our RPCs" warnings remain.

**App:**
- `src/lib/storage.ts` is now the sync engine: localStorage stays the instant, offline,
  synchronous source the screens read; every change also pushes to Supabase, and the
  partner's changes flow back via realtime. Due date syncs on the household row.
- `src/auth/AuthGate.tsx`: sign in / sign up (email), then create-a-household OR
  join-by-code, then the app. Plain-English auth errors. Account card on Today shows the
  join code to share + a sign-out button.
- `src/lib/photos.ts` + `src/views/Gallery.tsx`: upload (multi-file), tag
  (Ultrasounds/Bump/Us/Baby/Documents), date, caption; grid grouped by month; tap to
  view/edit/delete. Private bucket → short-lived signed URLs.

**Verified via Playwright @390px (0 console errors):** sign up → confirm → sign in →
create household → join code shown → task toggle pushes to cloud → due date persists →
reload re-hydrates from cloud → photo upload (file → storage + DB row) → edit caption/tag
→ delete (removes storage file too). Test data was cleaned up afterward — DB is empty and
ready for Muzzy's real account.

## Next
1. **Deploy to GitHub Pages.** `.github/workflows/deploy.yml` is ready (builds on push to
   main, needs repo secrets `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY`). Production
   build is clean (`npm run build` → 127 KB gzip). Needs: git init, a GitHub repo, push,
   then Settings → Pages → Source = GitHub Actions. **Waiting on Muzzy** for repo name/visibility.
2. Polish: real maskable PNG app icons; drag-to-reschedule on the calendar; custom
   "add your own task/event" (the `events` table is ready for this).

## Known small items
- Current week (6) shows no group in Schedule because the first items start at week 8 — harmless.
- App icon is still a placeholder SVG.
- Email confirmation is ON in Supabase (see RESUME HERE for the toggle decision).
- Pre-existing root screenshots (home.png, caljune.png, etc.) from v1 verification still
  in the repo — harmless, can be deleted before first commit if desired.

## Disclaimer
Reference only. OB / midwife / pediatrician instructions override everything in the app.
