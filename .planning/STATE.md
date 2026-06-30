# Project State — MyFirstBaby

_Last updated: 2026-06-29_

## ▶ RESUME HERE
Cloud sync, accounts, the photo gallery, AND deployment are **done and verified**.
The app is LIVE: **https://thebluemuzzy.github.io/my-first-baby/**
(repo: https://github.com/TheBlueMuzzy/my-first-baby, public).
Redeploy any time with **`npm run deploy`** (builds + pushes `dist` to the `gh-pages` branch).

Follow-ups for Muzzy (Supabase dashboard, not code) — do these before real sign-ups:
1. **Rotate the `sbp_…` Supabase access token** — it was shared in chat earlier.
2. **Set Auth → URL Configuration → Site URL** to `https://thebluemuzzy.github.io/my-first-baby/`
   so email-confirmation links point at the live app (they'd otherwise go to localhost).
   ALTERNATIVELY, turn **Auth → Providers → Email → "Confirm email" OFF** for instant
   sign-in (fine for a 2-person private app). It's currently ON; the app handles both.

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

## Done — deploy (THIS SESSION)
- Public repo `TheBlueMuzzy/my-first-baby` created and pushed (git, `main` branch).
- Deploy via the `gh-pages` npm package: `npm run deploy` builds locally (reads the
  gitignored `.env.production` for the publishable Supabase values) and pushes `dist` to
  the `gh-pages` branch. GitHub Pages serves that branch. Verified live: HTTP 200, app
  boots, sign-in renders, 0 console errors.
- Chose gh-pages-package over GitHub Actions because the local `gh` token lacks the
  `workflow` scope (can't push `.github/workflows/`), and the publishable key only needs
  to exist in the built bundle (never in repo source).

## Live usage / real data (do NOT delete)
- Muzzy created his real account + household **"Away We Go!"** (join code **WEZPYS**,
  due 2027-02-18) on the live app on 2026-06-29. 1 member, seeded first-visit task.
  This is real data — never clear it during testing. Use throwaway accounts + clean them up.
- Onboarding was redesigned (2026-06-29) so both choices show at once with **join-by-code
  first and prominent** (the old hidden tab let a partner accidentally create a 2nd
  household). Deployed. Partner joins via: sign up → confirm email → sign in → enter code.
- Supabase Auth Site URL + Redirect URL set to the Pages URL (email links work). Access
  token kept active (per Muzzy) so Claude can keep managing the DB; it's not in the repo.

## Done — polish batch 1 (2026-06-30, deployed)
- **Interaction feel:** press/active feedback on all controls (scale "push"), visible
  focus rings, gentle screen fade-ins, clear disabled states, prefers-reduced-motion
  guard, no mobile tap-flash. (`src/index.css`)
- **Live photos:** Gallery subscribes to realtime `photos` changes per household and
  refreshes; `photos` added to the `supabase_realtime` publication. (`src/views/Gallery.tsx`)
- **App icon:** simple cream heart on solid sage (Muzzy's call). Full-bleed PNG set
  `public/icon-192.png` / `icon-512.png` / `apple-touch-icon.png` + updated `icon.svg`;
  manifest + index.html wired; fixed deprecated `apple-mobile-web-app-capable` warning.
  NOTE: phones cache home-screen icons hard — to see the new heart, remove the app from
  the home screen and re-add it.

## Done — add your own task/event (2026-06-30, deployed)
- `events` table extended (category/is_appointment/done/updated_at) + added to realtime.
- `storage.ts` caches + syncs events exactly like tasks (addEvent/updateEvent/deleteEvent,
  getEvents/getEvent, hydrate, realtime, push). `schedule.ts` merges events into
  `buildSchedule()` as DatedItems (`isEvent`/`event`) so they show across Today/Calendar/
  Schedule. New `EventModal` (quick add from Schedule "+ Add your own" and Calendar
  "+ Add" on a day) and `EventDetail` (/event/:id) editor; "yours" pill marks custom items.
- Verified UI renders + validates with 0 errors (in Muzzy's real session, no data written).
  The create/edit/delete+sync path mirrors the verified task-sync path. Final write
  round-trip left for Muzzy to confirm in real use (didn't want to write to his household).

## Testing notes (IMPORTANT for future sessions)
- The Playwright browser is signed in as Muzzy's REAL account **joebrogno@gmail.com**
  (household "Away We Go!", code WEZPYS). Do NOT add/edit/delete in this session — it's
  real data. For UI tests, sign out + use a throwaway account and clean it up, or verify
  read-only / cancel-without-saving.
- To make a confirmed throwaway auth user via SQL: insert into `auth.users` with
  `email_confirmed_at=now()` AND set the token columns (`confirmation_token`,
  `recovery_token`, `email_change`, `email_change_token_new`, `email_change_token_current`,
  `phone_change`, `phone_change_token`, `reauthentication_token`) to '' (NULL → GoTrue 500),
  password via `extensions.crypt(pw, extensions.gen_salt('bf'))`, plus an `auth.identities`
  row. Delete the user afterward.

## Done — long-press reschedule (2026-06-30, deployed)
- On the Calendar, press & hold an item in the day list → "moving" banner + lifted row +
  haptic; the grid switches to drop mode (dashed cells); tap any day to move it; Cancel to
  abort. Works for presets (sets custom-date override via setTaskState) and events (sets
  date via updateEvent). `src/views/CalendarView.tsx`. Pick-up verified via Playwright;
  the drop write mirrors the verified task/event paths (not exercised on Muzzy's live data).

## Done — account management (2026-06-30, deployed)
- `/account` screen (via "Manage account" on Today): shows signed-in email + shared code,
  **change password** (re-verifies current password by re-signing-in before updateUser),
  **change email** (updateUser → confirmation email), **sign out**. `src/views/Account.tsx`.
- Sign-in: **"Forgot password?"** → `resetPasswordForEmail(redirectTo = origin+pathname)`.
- **Recovery:** the `PASSWORD_RECOVERY` auth event shows a "set new password" screen in
  `AuthGate`. Account screen verified rendering (read-only, no submit on Muzzy's account).
- TESTING CAVEAT: the email round-trips (reset link, email-change confirm) need a real
  inbox — not verified here. Reset links only work for allowlisted redirect URLs (the Pages
  URL is allowlisted; localhost is not). Supabase's built-in email is rate-limited (~few/hour);
  fine for 2 people, but a custom SMTP would be needed at scale.

## Polish list — COMPLETE
All four of Muzzy's requested items + general UX polish are built & deployed:
interaction feel, live photos, heart icon, add-your-own task/event, long-press reschedule.

## Done — Schedule drag-to-reschedule (2026-06-30, deployed)
- Nav order swapped: Today · **Schedule · Calendar** · Gallery · Account.
- Schedule rewritten with **dnd-kit** (`@dnd-kit/core` + `/sortable` + `/utilities`):
  long-press (220ms) lifts a card into a tilted DragOverlay + haptic; the source becomes a
  dashed placeholder gap; sibling cards shift to open the drop gap; edge auto-scroll.
  On drop, the card is **rescheduled to the day it lands on** (`over` item's date →
  setTaskState customDate for presets / updateEvent date for events). Quick tap still opens
  the item; the check button still toggles. `src/views/Agenda.tsx` is now a flat dnd list
  (week headers + sortable rows) instead of nested `.weekgroup` sections.
- Verified: Schedule renders, tap-to-open still works, 0 errors. The drag gesture itself
  is best tested on a touch device (not exercised on Muzzy's live data).

## Possible future (not requested)
- Photo realtime is on; consider optimistic UI on photo upload (currently re-fetches).
- Rename household / leave household; multiple custom event reminders/notifications.
- The app has never been installed to a home screen yet (Muzzy waiting for ~98% done).

## Known small items
- Current week (6) shows no group in Schedule because the first items start at week 8 — harmless.
- App icon is still a placeholder SVG.
- Email confirmation is ON in Supabase (see RESUME HERE for the toggle decision).
- Pre-existing root screenshots (home.png, caljune.png, etc.) from v1 verification still
  in the repo — harmless, can be deleted before first commit if desired.

## Disclaimer
Reference only. OB / midwife / pediatrician instructions override everything in the app.
