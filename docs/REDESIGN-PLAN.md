# Redesign Plan

A UI/UX redesign layered on the finished build (see [IMPLEMENTATION-PLAN.md](IMPLEMENTATION-PLAN.md)).
The goal is **not** to make AcademicSync look more impressive — it is to make the academic workflow feel
obvious, and to retire the handful of visual patterns that read as "AI-generated." The app's architecture,
API contracts, auth, RBAC, database schemas and business rules do **not** change.

The work is split into **13 steps (R1–R13)**. Each is self-contained, ends with a green build, and leaves
the app in a working state.

## How this works

- **You start each step.** Say _"start R1"_ (or _"start step R1"_) and only that step gets built. Nothing runs
  ahead of your command.
- **System before screens.** R1–R2 retune the token + primitive layer so the institutional tone lands
  app-wide before any screen is touched. Later steps mostly consume that foundation.
- **Every step ends green** on `npm run format:write`, `npm run lint`, `npm run build`.
- **The plan is not frozen.** Anything discovered mid-step that belongs elsewhere goes to
  [Deferred](#deferred--needs-a-data-model-change) or a later step rather than widening the current one.

## Why this shape (Phase-1 audit finding)

A 12-surface audit found the codebase is **already restrained** — shadows only on floating elements, correct
role-based nav hiding, deep a11y, content-shaped skeletons, no rainbow widgets, no vanity charts, no
"Welcome back" hero. The "AI look" concentrates in six systemic places (fixed once, in R1–R2) plus four areas
of real work: unbuilt admin/teacher dashboards, shell polish, the landing page, and per-screen table/form
refinements. Strengths to **preserve, not redesign**: the per-language font swap, the WCAG-documented token
tuning, the DRY single-nav shell, the deliberate per-day agenda timetable, and the loading/empty/error layer.

## Decisions

- **Data scope — visual-only first.** Deliver the full visual/layout/interaction redesign on today's data
  model. Features that need a schema/API/service change are **deferred** as marked follow-ups (see below),
  not built inline.
- **Timetable — keep the per-day agenda, refine it.** The current agenda deliberately rejected a time-of-day
  grid (empty hour rows waste height; unreadable on phone). We keep it and add the missing polish. No time-grid.

## Working rules (carried from the build)

- **Inline Tailwind only.** Never extract a `className` into a named constant, even when repeated.
- **Helpers live in `lib/{domain}.utils.ts`** as pure functions; component files hold JSX + event handlers only.
- **No logic changes.** Auth (jose JWT), RBAC, Mongoose schemas, server actions, permissions and business
  rules are out of scope. Visual / layout / interaction / a11y only.
- **Bilingual, both columns together.** New strings go in `l10n/l10n.csv` (`KEY,"English","বাংলা"`), then
  `npm run i18n:generate`. The CSV is **CRLF** — after appending rows, normalize bare `\n`→`\r\n` (binary-safe)
  before generating, or `csv-parse` throws. Client components consume strings as label props, never a direct
  translator call. Bangla is written alongside English and **flagged for your review**.
- **A deliberate product choice to leave alone:** resend-confirmation and forgot-password intentionally reveal
  whether an email is registered. That is not a bug — do not "fix" it during the auth step.

## Status at a glance

| #           | Step                                   | Brief phase | Status         |
| ----------- | -------------------------------------- | ----------- | -------------- |
| [R1](#r1)   | Design tokens & type foundation        | 2, 39       | ✅ Done        |
| [R2a](#r2a) | Consolidate existing primitives        | 3, 21–24    | ✅ Done        |
| [R2b](#r2b) | Build missing primitives               | 3, 38       | ✅ Done        |
| [R3a](#r3a) | Desktop shell (sidebar, topbar, nav)   | 4, 5, 7–10  | ✅ Done        |
| [R3b](#r3b) | Mobile drawer + PageHeader             | 4, 10, 32   | ✅ Done        |
| [R4](#r4)   | Dashboards (admin / teacher / student) | 6, 11, 12   | ⬜ Not started |
| [R5](#r5)   | Routine / timetable                    | 7, 13, 14   | ⬜ Not started |
| [R6](#r6)   | Courses                                | 8, 15       | ⬜ Not started |
| [R7](#r7)   | Materials & upload                     | 8, 16, 17   | ⬜ Not started |
| [R8](#r8)   | Notices                                | 9, 18       | ⬜ Not started |
| [R9](#r9)   | Users & teacher directory              | 10, 19, 20  | ⬜ Not started |
| [R10](#r10) | Forms & dialogs consistency pass       | 11, 21–24   | ⬜ Not started |
| [R11](#r11) | Authentication screens                 | 12, 35      | ⬜ Not started |
| [R12](#r12) | Public landing page                    | 13, 34      | ⬜ Not started |
| [R13](#r13) | Responsive, a11y & interaction polish  | 14, 15, 16  | ⬜ Not started |

## Definition of done (every step)

- `npm run format:write`, `npm run lint`, `npm run build` all green.
- No `className` constants; no non-handler helpers left in component files.
- Any new user-facing string exists in both CSV columns and regenerates cleanly.
- Light **and** dark both checked; the surface still works at 1366px and 1440px and on a 375px phone.
- No new AI tell introduced (gradient text, glow blobs, oversized stats, pill-ified metadata, card-in-card).

---

## Steps

### R1 — Design tokens & type foundation

**Goal.** Retune the one place that propagates everywhere, so the app reads deep-navy institutional without
touching a single screen. Nothing should visibly break — this is pure foundation.

- **Primary → academic navy.** `--primary` `oklch(0.52 0.19 265)` → about `oklch(0.42 0.10 256)` (light) and
  `oklch(0.70 0.10 256)` (dark): lower lightness, ~half the chroma, hue nudged off violet toward true blue.
  `--ring`, `--sidebar-primary`, `--chart-1` follow. **Re-verify WCAG** for every primary use — button text
  (`primary-foreground` on `bg-primary`), links/active tints (primary as text on `background`/`card`), and the
  focus ring 3:1 — before committing the exact values.
- **Radius → tighter.** Base `--radius` `0.75rem` → `0.5rem`, so the derived scale lands on-brief: `md` 6px
  (inputs/buttons), `lg` 8px (cards), `xl` 12px (modals). Repoint `.surface-card` to `rounded-lg` (8px).
- **Headings → calm.** In the base layer, `h1`–`h6` `font-bold` (700) → `font-semibold` (600); cap `h1` at
  ~`text-3xl` and drop the `sm:5xl lg:6xl` giant steps (the landing hero opts into its own size in R12).
- **Add the missing token layer (brief §39)** with light+dark values wired through `@theme inline`: `--info`
  (+ `--info-foreground`), `--surface-muted`, `--border-strong`, `--primary-hover`, `--primary-muted`, a
  `--control-height`. Mute `--success` chroma slightly (~0.11); leave `--warning`/`--destructive` at their
  WCAG-documented values.
- **Retire AI-tell tokens.** Quarantine `.text-gradient-brand` (gradient text → solid navy) and add a small
  semantic type scale as `@apply` utilities beside the existing `.text-*` set (`.text-page-title` ~30/600,
  `.text-section-title` 18–20/600, `.text-card-title` 15–16/600). Add a
  `@media (prefers-reduced-motion: reduce)` block (neutralize `scroll-behavior`, pulse, spin, dialog zoom).
- **Fix `viewport.themeColor`** — replace the hardcoded indigo `#4f46e5` with light/dark values derived from
  the app background.

**Files.** `app/globals.css`, `app/[locale]/layout.tsx`. **Done when** every screen still renders correctly in
both themes with the new navy/radius/weight, and contrast is re-verified.

**Outcome (done).** Navy verified: light `--primary` resolves to `lab(32% .12 -34.7)` (deep blue, no violet
cast; was startup-indigo) and clears WCAG 8.3:1/8.5:1; radius scale lands 6/8/12px; `h1` is 600/30px; the
gradient highlight is solid navy. Two deviations from the bullets above, both because the "unused rainbow
accents" turned out to be **live on the landing** (`constants/home.const.ts` — the audit + first grep missed a
`.ts` file): the four `--accent-*` tokens are **kept** and their retirement moves to **R12** (landing rebuild);
and no `tabular-nums` helper was added since Tailwind v4 already ships `tabular-nums`/`slashed-zero` utilities
(applied inline on time cells in R4/R5). `--control-height` added as a reference-only var (controls stay h-10).

> **R2 was split** (per "split rather than stretch") into **R2a** — consolidate the existing primitives (they
> propagate to every screen and need visual verification) — and **R2b** — build the additive new primitives.

### R2a — Consolidate existing primitives ✅ Done

**Goal.** One clean control vocabulary across the primitives already in use.

- **Button → one hierarchy.** Fixed the canonical `default` hover (`[a]:hover:bg-primary/80` →
  `hover:bg-primary-hover`, so a real `<button>` lights up), removed the redundant `app*` family
  (`appSecondary/Ghost/Link` were dead; `appPrimary`×37 → `default`, `appOutline`×2 → `outline` across 34
  files), and switched the base to `transition-colors`.
- **Badge → muted status chips.** Added `success` / `warning` / `info` / `neutral` variants (tinted bg + colored
  text, like destructive) and tightened radius from full-pill to `rounded-md` (~6px).
- **Primitives radii/weights.** Dialog got a real `shadow-lg` (radius already 12px from R1) and `DialogTitle` →
  `font-semibold`; `SelectTrigger` defaults to `w-full`; the Select dropdown → `rounded-lg` (8px). Input/Textarea
  already landed at 6px via R1's base radius.
- **Toaster.** Wrapped sonner in a token-styled `Toaster` (in `components/shared`, so `ui` stays free of theme
  coupling): `richColors` dropped, surface painted from the popover tokens via sonner's `--normal-*` vars,
  status accents mapped to `--success/--destructive/--warning/--info`, theme threaded from the app theme.

**Outcome.** Verified in-browser: primary submit renders navy `lab(64.7 …)` with the working `hover:bg-primary-hover`;
badges are 6px chips with correct muted tints; selects are `w-full`; controls at 6px; no `app*` leftovers; page
fully styled in dark. Extra token fix: `--warning` (light) darkened `oklch(0.72 0.15 75)` → `oklch(0.55 0.13 70)`
because the existing storage-warning/notice-draft messages already used `text-warning` on a light tint and failed
4.5:1 — now 5.0:1 / 4.6:1. `format`/`lint`/`build` (77/77) green.

**Files.** `components/ui/{button,badge,dialog,select}.tsx`, `components/shared/toaster.tsx` (+ barrel),
`app/[locale]/(dashboard)/layout.tsx`, `app/globals.css`, and 34 `app*` call-site files.

### R2b — Build missing primitives ✅ Done

**Goal.** Add the components the later screens need, on the Base UI headless bases already in use. Additive —
no existing screen changes until a later step consumes them.

- **`DropdownMenu`** (Base UI `Menu`) — the big one; replaces the 2×2 row-action button grids in R6/R7/R9 and
  backs the R3 account menu.
- **`Tabs`** (Base UI `Tabs`), **`Avatar`** (initials fallback; R3 user block + R9), **`Breadcrumb`**
  (semantic `nav`/`ol`; R3 topbar), **`Tooltip`** (Base UI `Tooltip`), and an optional action slot on a shared
  **`EmptyState`**.

**Outcome.** All six built to match the Select/Dialog house patterns (data-slot, popover surface, 8px popup,
100ms fade/zoom, token colors) and exported from the `ui` barrel. Verified on a throwaway `/ui-preview` route
(since deleted): DropdownMenu opens with the right items, 8px radius, shadow and a red destructive row; Tabs
switch with a navy underline + foreground active tab and muted inactive; Avatar renders circular initials;
Breadcrumb renders the link + `aria-current` page; EmptyState renders icon/title/description/action. Two notes:
the Breadcrumb link carries no `data-slot` (Base UI `mergeProps` rejects arbitrary data attrs, same as Badge —
it uses `useRender` and the caller passes the locale `Link` via `render`); and the Tooltip's live hover wasn't
confirmable via synthetic events in the headless pane, but it compiles and mirrors the verified DropdownMenu
floating pattern. `format`/`lint`/`build` (77/77) green.

**Files.** new `components/ui/{avatar,breadcrumb,dropdown-menu,empty-state,tabs,tooltip}.tsx`,
`components/ui/index.ts`.

> **R3 was split** into **R3a** (desktop shell — nav restructure, breadcrumb, account menu) and **R3b** (mobile
> drawer + the `PageHeader` primitive), so the desktop shell lands and stays green before the mobile work.

### R3a — Desktop shell ✅ Done

**Goal.** Give the shell the location + identity + account affordances a dense ERP needs, on desktop.

- **Nav as data.** New `resolveNavModel(role, labels)` in `lib/utils/navigation.utils.ts` turns the flat nav
  into the sectioned model (Overview, then ACADEMIC / COMMUNICATION / DIRECTORY / ADMINISTRATION), deciding
  role visibility once so entries are hidden (never disabled) and empty sections drop. `DashboardNav` now renders
  from it — sectioned+stacked for the sidebar, flat+scrolling for the below-`lg` bar (`variant` prop).
- **Breadcrumb** (`DashboardBreadcrumb`) replaces the "Welcome, {name}" greeting: section › page, derived from the
  same model via `resolveBreadcrumbTrail`, so the crumb and the highlighted sidebar entry always agree.
- **Account menu** (`AccountMenu`) folds the naked sign-out button into an avatar+name dropdown (name/role header,
  Profile link, Sign out) built on the new `DropdownMenu`/`Avatar`. Sign out stays the server-action form — the
  menu item submits a hidden always-mounted form via `requestSubmit`.
- **Sidebar** — three bands: a logo header the height of the topbar (so they line up), the scrolling sectioned
  nav, and a bottom user block (avatar + name + role) linking to the profile.
- **Solid topbar** — dropped `bg-background/80 backdrop-blur-md` for a solid `bg-background` + 1px border.
- **Cleanup** — removed the now-orphaned `sign-out-button`/`sign-out-submit` and their barrel export; added
  `resolveInitials`. New l10n keys: the four section labels + `DASHBOARD_BREADCRUMB_LABEL` (Bengali alongside,
  flagged for review). `DASHBOARD_WELCOME`/`DASHBOARD_SIGNING_OUT` are now unused (left in the CSV).

**Outcome.** `format`/`lint`/`build` (77/77) green; l10n regenerated (660 keys). The pure logic was unit-verified
(deleted temp script): nav model correct for all four roles, breadcrumbs correct incl. sub-pages
(`/admin/users/new` → "ADMINISTRATION / Users"), initials correct incl. Bengali (`ইমতিয়াজ আকিব` → `ইআ`). The
`/admin` route redirects cleanly to sign-in with no runtime/hydration errors. **Not visually confirmed:** the
assembled shell sits behind `requireSession()` and can't be viewed without a login — the components are
compositions of the R2b-verified primitives + this verified logic. Known minor: `/profile` (the one page outside
the nav model) shows the "Overview" fallback crumb — to refine when the profile screen gets its header.

**Files.** `lib/utils/navigation.utils.ts` (+ barrel), `components/dashboard/{dashboard-nav,dashboard-sidebar,dashboard-topbar,account-menu,dashboard-breadcrumb}.tsx`
(+ barrel, − sign-out files), `app/[locale]/(dashboard)/layout.tsx`, `l10n/l10n.csv`.

### R3b — Mobile drawer + PageHeader ✅ Done

**Goal.** The responsive half of the shell, plus the page-header primitive screens adopt from R4 on.

- **`PageHeader` primitive** (`components/ui/page-header.tsx`): title (a plain `h1`, so it inherits the R1
  600-weight page-title scale) + optional 14px muted description + optional right-aligned actions slot. Exported
  from the `ui` barrel; screens adopt it from R4 on (no 32-file sweep here).
- **Mobile nav drawer** (`DashboardMobileNav`): a hamburger opening a left drawer built on Base UI `Dialog`,
  replacing the below-`lg` horizontal nav strip. Same three bands as the sidebar (logo, sectioned nav, user
  block) from the same `resolveNavModel`. Slides on a transform transition (not a keyframe class); closes when a
  link inside is tapped (event delegation, not a `setState`-in-effect), and that closed state carries onto the
  navigated-to page because the drawer lives in the persistent layout.
- **`/profile` breadcrumb** now names itself (via `profileLabel`) instead of the Overview fallback.

**Outcome.** `format`/`lint`/`build` (77/77) green; l10n regenerated (662 keys, +`DASHBOARD_MENU_OPEN/CLOSE`,
Bengali flagged). The topbar strip was removed; the hamburger sits left of the breadcrumb below `lg`. **Not
visually confirmed:** the drawer's live open/slide/close — the assembled shell is auth-gated, and an isolation
`/ui-preview` route couldn't be exercised because the preview pane went unresponsive this session (navigation +
JS eval timing out after earlier port/process churn). The drawer is built on the app's proven Base UI `Dialog`
primitive with standard parts + the R3a-verified nav model, and compiles clean.

**Files.** new `components/ui/page-header.tsx` (+ barrel), new `components/dashboard/dashboard-mobile-nav.tsx`,
`components/dashboard/{dashboard-topbar,dashboard-breadcrumb}.tsx`, `app/[locale]/(dashboard)/layout.tsx`,
`l10n/l10n.csv`.

**Post-R3 fixes (found under login).** (1) `DropdownMenuLabel` was `Menu.GroupLabel`, which throws
`MenuGroupContext is missing` unless inside a `Menu.Group` — now a plain `div`; and a `DropdownMenuLinkItem`
(`Menu.LinkItem`) was added because `Menu.Item` rendered as a link swallows navigation (the account-menu Profile
link). See [[base-ui-menu-gotchas]]. (2) The topbar overflowed on phones — the theme/language **pill groups**
(~116/140px, `shrink-0`) were rebuilt as **compact 36px icon-dropdowns** (shared, so landing/auth headers get
them too). Verified live on `/en/sign-in` (public, same components): both open with correct options (theme
Light/Dark/Match-my-device; language English/বাংলা with the active one checked) and the page has zero horizontal
overflow at 375px.

### R4 — Dashboards (admin / teacher / student)

**Goal.** Build the two stub dashboards and elevate the third. Biggest construction step; read-only data via
existing services only.

- **Admin** — an asymmetric layout: primary region with today's departmental schedule (read-only routine),
  schedule conflicts and pending user approvals; secondary column with recent notices and quick actions
  (add class / publish notice / create user). Drop the `max-w-2xl` cap.
- **Teacher** — "Teaching today / next" as the top answer (mirror the read-only routine card), the current/next
  class made unmistakable, then courses + recent material activity + notices.
- **Student** — make the next class prominent (single chronological column, current/next emphasized instead of
  an equal-box grid), add recent materials, keep notices + quick links.
- **Human touches** (brief §36): "Next class in Xm" / "now" on the current card, "Uploaded Xm ago" on recent
  materials, "N new" on the notices heading. Relative-time formatting via a pure `lib/` helper.

**Files.** `app/[locale]/(dashboard)/{admin,teacher,student}/page.tsx`, `components/dashboard/*`, new dashboard
widgets, read-only reuse of `ClassSessionService` / `CourseService` / `StudentService` / notice services,
`lib/*.utils.ts` for relative time, l10n keys. **Done when** the three dashboards genuinely differ and each
role's "what's next" is the first thing on screen.

### R5 — Routine / timetable

**Goal.** Refine the agenda (no time-grid) and make conflicts legible.

- **Field-anchored conflicts** — render each `ErrorDto` conflict message beside the Teacher/Course field it
  concerns (the DTO already carries `field`), not only as the top-of-form alert.
- **Existing double-books visible** on the read-only grid — a pure `lib/` overlap helper marks overlapping cards
  in a day column with a muted conflict treatment (color is never the only signal — add an icon/label).
- **Filters + view** — add a day filter (`dayOfWeek` is in the DTO) and a compact list/agenda view toggle beside
  the semester/teacher filters; replace fixed English `w-40`/`w-56` select widths with min+max so Bengali fits.
- **Flatten nesting** — drop the card-like tinted/ring day-column wrapper to a lighter grouping (header + list +
  a subtle "today" marker). Apply `tabular-nums` to time cells.
- _Deferred:_ room in the block, and "view conflicting class" specifics (need model/service changes).

**Files.** `components/schedule/*`, `lib/utils/schedule.utils.ts`, l10n keys.

### R6 — Courses

- Rebuild the first column as one **identity cell** (title dominant, code as mono/meta sub-label); demote
  semester/credits/teacher to secondary weight.
- **Muted status** — Active → muted success, Inactive → muted neutral (via the new Badge variants), replacing
  the solid-primary pill.
- **Lighten row actions** — the 2×2 outline-button grid → a single end-aligned `DropdownMenu` (kebab).
- Unify semester rendering through `resolveSemesterLabel`; tighten the create-form panel to `rounded-lg`.
- _Deferred:_ section + materials-count columns and the course **detail route + tabs** (fields don't exist).

**Files.** `components/admin/courses/*`, `app/[locale]/(dashboard)/teacher/courses/page.tsx`.

### R7 — Materials & upload

- **Repository toolbar** above the table: search (title/filename), course filter, file-type filter, sort
  (name/size/date) — all from existing `MaterialDto` fields, labels as props.
- **File-type icon + label** per row from `mimeType`/extension (pure `resolveMaterialType` helper), and a
  **Date** column from `createdAt`.
- **download + more** — keep Download visible, move Delete into a `DropdownMenu`.
- **Upload → dialog** (replace the always-mounted inline panel) with a **drag-drop** drop zone showing chosen
  filename + size + progress + success/validation.
- _Deferred:_ type toggle (PDF/Slides/Assignment) + description (not modeled).

**Files.** `components/materials/*`, `components/uploads/*`, `lib/utils/material.utils.ts`, l10n keys.
API routes under `app/api/materials/*` are **not** touched.

### R8 — Notices

- Recolor the audience badge so "Everyone" is calm (muted `info`/neutral), not a solid indigo fill.
- **Feed vs archive** — thread a `preview` flag from `DashboardNotices` (which knows `limit`) through
  `NoticeList` into `NoticeCard` so the home feed clamps the body (`line-clamp`) + hides the full image, while
  the archive shows full.
- Stop the session-audience badge clipping — render targeted sessions as wrapping text/chips.
- `leading-relaxed` body, page titles to 600. _Deferred:_ IMPORTANT/priority label (no field).

**Files.** `components/notices/*`, `components/dashboard/dashboard-notices.tsx`.

### R9 — Users & teacher directory

- **Teacher directory** grid-of-cards → academic **row list** (small avatar-initial, name, designation, compact
  course summary, mailto), keeping the `<ul>` + aria-label + count.
- **Users table** — add avatar-initial to the Name cell, split the overloaded name column into real
  Department/Batch + Joined (`createdAt`) columns, demote loginId/roll to meta.
- **Status → semantic** — active→success, pending→warning, inactive→neutral (new Badge variants).
- **Actions menu** — the 2×2 action grid → one `DropdownMenu` reusing the existing confirm dialogs.
- Fix course "pill-soup" (tighter chips + "+N more"); calm the profile card-in-card boxing toward dividers.

**Files.** `components/admin/users/*`, `components/student/teachers/*`, `components/profile/*`, `lib/` initials
helper.

### R10 — Forms & dialogs consistency pass

**Goal.** A short sweep so every form/dialog reads the same after R1–R9.

- Consistent required-mark + `FormMessage` treatment (controls already carry `aria-invalid`).
- Consistent control heights/radii, label-above, and confirm-dialog consequence copy across the app.
- Verify no form hard-codes an English width; Bengali strings fit.

**Files.** cross-cutting `components/**` forms and dialogs; likely a small shared `FormMessage`.

### R11 — Authentication screens

- Extract shared **`AuthCard`** (section › Container › card + header slot) and **`FormErrorAlert`**; rebuild the
  nine screens on them so the shell/alert stop being hand-rolled nine times.
- Standardize the in-card header (left-aligned title 600 + muted intro; optional back-link; no centered
  logo-on-top — the logo already lives in the auth layout).
- Use the semantic **success** token (not `text-primary`) for positive/terminal confirmations; fix the duplicate
  `<h1>` on reset-password; flatten nested dashed note boxes; card radius to `rounded-lg`.
- **Do not touch** the deliberate email-enumeration behavior.

**Files.** `components/auth/*`, `app/[locale]/(auth)/**`.

### R12 — Public landing page

- **Two-column hero** — left keeps eyebrow + headline + copy + Sign in / Explore (left-aligned, drop
  `items-center/text-center`); right gets a realistic cropped **today's-schedule product preview** built from
  the redesigned components. Kill the gradient-text highlight and the 576px glow blob; cap the headline at
  ~`text-3xl sm:text-4xl` / 600; replace the three vanity stat cards with a small inline meta line or nothing.
- **"Built around the academic day" timeline** (08:30 admin updates a room → 09:00 teachers see it → 09:05
  students get the routine → 14:30 material uploaded) replacing the dev-sprint roadmap.
- **Demote the tech stack** to a compact restrained row just above the footer.
- `.surface-card` already `rounded-lg` from R1; mute any remaining accent hues.

**Files.** `components/home/*`, `app/[locale]/(marketing)/page.tsx`, l10n keys for the timeline.

### R13 — Responsive, a11y & interaction polish

- **Tables → cards on mobile** — below `md`, render each row as a stacked label:value card; show the `<table>`
  at `md+` (users, courses, materials, upload-progress).
- **Touch targets ≥40px** on mobile — schedule card actions (`h-7`→`h-9`/min-h), mobile nav rows, table-row and
  topbar controls.
- Confirm `prefers-reduced-motion` (from R1) covers scroll/pulse/spin/dialog; single icon family + sizes
  (16/18/20) verified; swap the leftover hand-written dashboard-root skeleton for the shared `LoadingPage`.
- **Final §43 consistency review** — walk every screen against the brief's checklist (one obvious primary
  action per screen, quiet secondaries, dense tables, dashboards genuinely differ, Bengali breaks nothing,
  1366/1440/mobile, empties/errors actionable), fix stragglers.

**Files.** cross-cutting.

---

## Deferred — needs a data-model change (visual-only-first scope)

These brief features are **out of scope** for this pass because they require a Mongoose schema / DTO / service
change. Each is noted at its step; revisit as a separate initiative if wanted.

- **Room** in schedule blocks — `ClassSessionDto` has no room field (brief §13).
- **Course section + materials-count** columns and the **course detail page + tabs** — fields/route don't exist
  (brief §15).
- **Material type (PDF/Slides/Assignment) + description** — not modeled on `MaterialDto`/upload route (brief §17).
- **Notice IMPORTANT / priority / pin** label — no field on the notice model (brief §18).
- **"View conflicting class"** detail — `findConflicts` discards the conflicting session, so the link target
  isn't available to the UI (brief §14).
- **Semester selector / global search / notifications** in the topbar — need backing state/data/features (brief §9).
