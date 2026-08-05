# Implementation Plan

The build is split into **14 steps**. Each one is self-contained, ends with a green build, and leaves the app
in a working state.

## How this works

- **You start each step.** Say _"start step 4"_ and only step 4 gets built. Nothing runs ahead of your command.
- **One step at a time.** If a step turns out to be bigger than it looks, it gets split rather than stretched.
- **Every step ends green** — see [Definition of done](#definition-of-done).
- **The plan is not frozen.** Anything discovered mid-step that belongs elsewhere goes to
  [Backlog](#backlog) instead of quietly widening the current step.

## Status at a glance

| #              | Step                           | Proposal phase | Status         |
| -------------- | ------------------------------ | -------------- | -------------- |
| [0](#step-0)   | Project scaffold               | Phase 1        | ✅ Done        |
| [1](#step-1)   | Foundations                    | Phase 1        | ✅ Done        |
| [2](#step-2)   | i18n — English + Bangla        | Phase 1        | ⬜ Not started |
| [3](#step-3)   | SEO, structured data, llms.txt | Phase 1        | ⬜ Not started |
| [4](#step-4)   | Data model                     | Phase 2        | ⬜ Not started |
| [5](#step-5)   | Authentication                 | Phase 2        | ⬜ Not started |
| [6](#step-6)   | Dashboard shell & RBAC         | Phase 3        | ⬜ Not started |
| [7](#step-7)   | Admin — user management        | Phase 3        | ⬜ Not started |
| [8](#step-8)   | Scheduling system              | Phase 4        | ⬜ Not started |
| [9](#step-9)   | Teacher — materials            | Phase 4        | ⬜ Not started |
| [10](#step-10) | Student dashboard              | Phase 5        | ⬜ Not started |
| [11](#step-11) | Notices & announcements        | Phase 5        | ⬜ Not started |
| [12](#step-12) | Polish & hardening             | Phase 6        | ⬜ Not started |
| [13](#step-13) | Testing & deployment           | Phase 6        | ⬜ Not started |

## Decisions

Settled up front, because they shape every step below.

| Area           | Choice                                                                                         | Follows                  |
| -------------- | ---------------------------------------------------------------------------------------------- | ------------------------ |
| **Styling**    | Inline Tailwind utilities with design tokens, `cn()` for conditionals                          | android-walls, katastarx |
| **Data layer** | zod schemas → services → DTO mappers → Result pattern → `actions.ts` server actions            | aloowing                 |
| **Auth**       | NextAuth v5 (`next-auth@5.0.0-beta.32`), credentials provider over MongoDB                     | —                        |
| **i18n**       | next-intl, English + Bangla, `l10n('KEY')`, flat `SCOPE_COMPONENT_ELEMENT` keys, CSV → JSON    | aloowing                 |
| **Locales**    | `en-US` default at `/`, `bn-BD` at `/bn` — `localePrefix: 'as-needed'`, Latin digits in Bangla | —                        |

Two deliberate splits from aloowing. It puts all styling in `app/styles/*.page.css` with `@apply` — this
project keeps utilities in the JSX. It also resolves locale from a cookie with no URL segment — this project
prefixes the URL, because two languages sharing one URL means search engines can only ever index one of them.

## Definition of done

A step is finished only when all of these hold:

- [ ] `npm run format:write` applied, `npm run format` clean
- [ ] `npm run lint` green — import order, cspell, canonical Tailwind classes, Prettier
- [ ] `npm run build` succeeds, including the TypeScript pass
- [ ] The affected screens render with no console errors
- [ ] New user-facing strings are `l10n` keys, not literals (from step 2 onward)
- [ ] New public routes are in the sitemap; new private routes are `noindex` (from step 3 onward)
- [ ] New files are wired into their barrel `index.ts`
- [ ] This document's status table is updated

---

## Steps

<a id="step-0"></a>

### Step 0 — Project scaffold ✅ Done

**Goal.** A running, lint-clean Next.js 16 app with the house toolchain and design system.

**Delivered.**

```
Toolchain    eslint.config.mjs · .prettierrc · cspell.config.json · tsconfig.json
             next.config.ts · postcss.config.mjs · components.json · ecosystem.config.js
             .vscode/ · .claude/launch.json · .env.example · .gitignore
Design       app/globals.css — light + dark oklch tokens, role accents, typography helpers
Shell        app/layout.tsx · page.tsx · not-found.tsx · global-error.tsx · robots.ts · icon.svg
Components   components/{home,layout,shared,ui} with barrels
Data         lib/mongodb.ts — globalThis-cached Mongoose connection
```

---

<a id="step-1"></a>

### Step 1 — Foundations ✅ Done

**Goal.** Put the shared plumbing in place before any feature needs it, so no step has to invent its own
error shape or read `process.env` directly.

**Deliverables.**

```
env/server.ts             @t3-oss/env-nextjs + zod, validated at build time
env/client.ts             NEXT_PUBLIC_* only
next.config.ts            import both env modules so a missing variable fails the build
lib/result/               single-result · list-result · list-result-info · empty-result
                          error-dto · message-dto · index
lib/api/responses/        with-ok · with-bad-request · with-unauthorized · with-forbidden · with-not-found
lib/error.utils.ts        error normalization
lib/zod.utils.ts          mapZodErrorsToErrorDto()
lib/logger.ts             pino, pretty in development
constants/                app-code.const.ts (error/message codes)
```

**Notes.**

- `SingleResult<T>` / `ListResult<T>` / `EmptyResult` all carry `{ success, result, errors, messages }`.
  Business failures return a failure result; only genuinely exceptional things throw.
- Adds `@t3-oss/env-nextjs`, `zod`, `pino`, `pino-pretty`.

**Acceptance.** ✅ Verified. `APP_BASE_URL=not-a-url npm run build` fails before the build starts, naming the
variable and the reason; the Result helpers are exported from `@/lib/result` and typed end to end;
`npm run lint`, `npm run format` and `npm run build` are all green.

**Deviations from the plan, and why.**

- Acceptance was proven with an **invalid** value rather than a missing one. Nothing is required yet —
  `MONGODB_URI` and `AUTH_SECRET` are optional until steps 4 and 5, and `LOG_LEVEL` / `APP_BASE_URL` have
  defaults — so a clean clone still runs with no `.env.local`. Validation still catches a malformed value.
- `env/client.ts` ships with an **empty** `client: {}`. The app has no `NEXT_PUBLIC_*` variable yet; the file
  exists so the first one gets declared and validated there instead of being read off `process.env`.
- `lib/logger.ts` exports pino directly, rather than porting aloowing's `createLoggerAdapter`. That adapter
  exists to preserve an older call signature in that codebase; here it would be indirection with nothing
  behind it. Call sites use pino's own API: `log.info({ userId }, 'message')`.
- `constants/codes.const.ts` + `codes-common.const.ts` replace the planned `app-code.const.ts`, matching
  aloowing's file naming and its layered registry.
- `lib/mongodb.ts` was updated to read `env.MONGODB_URI` instead of `process.env` directly.

---

<a id="step-2"></a>

### Step 2 — i18n: English + Bangla

**Goal.** Two languages from the first string, so nothing has to be retrofitted. English at `/`, Bangla at
`/bn`.

**Deliverables.**

```
l10n/l10n.csv               master translation source — columns: KEY, en-US, bn-BD
l10n/en-US.json             generated, never hand-edited
l10n/bn-BD.json             generated, never hand-edited
l10n/routing.ts             defineRouting — locales, defaultLocale 'en', localePrefix 'as-needed'
l10n/navigation.ts          createNavigation — Link, redirect, usePathname, useRouter, getPathname
l10n/request.config.ts      resolves the request locale, loads the dictionary
l10n/format.config.ts       per-locale date, time and number formats
scripts/csv-to-json.mjs     the generator behind `npm run i18n:generate`
next.config.ts              wrapped in createNextIntlPlugin
proxy.ts                    next-intl middleware — locale negotiation and redirects
app/[locale]/               layout.tsx · page.tsx · not-found.tsx move under the segment
app/globals.css             Bengali font + line-height under html[lang='bn']
constants/i18n.const.ts     locale list, default locale, cookie name
components/shared/language-selector.tsx   swaps locale while preserving the current path
components/layout/site-header.tsx         gains the selector
```

**Notes.**

- **Routing.** `localePrefix: 'as-needed'` — English stays at `/`, Bangla gets `/bn`. Distinct URLs are what
  make both languages indexable in step 3; the cookie only remembers a returning visitor's choice, the URL
  decides what renders.
- **`proxy.ts` is created here**, not in the auth step. next-intl's middleware handles locale negotiation, and
  step 5 composes the route guard into that same file — Next allows only one, and the locale has to resolve
  before a redirect target can be built.
- **Navigation.** Import `Link`, `redirect`, `usePathname` and `useRouter` from `@/l10n/navigation`, never from
  `next/link` or `next/navigation`. Only the wrappers know to keep the `/bn` prefix. `ROUTES` stays
  unprefixed — the wrapper adds the locale.
- **Fonts are the part that bites.** Inter and Poppins carry no Bengali glyphs, so Bangla would render as
  fallback boxes. Add `Noto_Sans_Bengali` (body) and `Anek_Bangla` (headings) from `next/font/google`, expose
  them as CSS variables, and remap `--font-sans` / `--font-heading` under `html[lang='bn']`. Bengali
  conjuncts clip at tight leading, so the same selector raises `line-height`.
- **Latin digits in Bangla.** `Intl` gives `bn-BD` Bengali numerals by default; `format.config.ts` pins
  `numberingSystem: 'latn'` so clock times and room numbers stay legible beside identifiers like `CSE-401`.
- Translation variable is always named `l10n`; keys are flat and ALL CAPS: `HOME_HERO_TITLE`,
  `ADMIN_USERS_TABLE_EMPTY`.
- Server components call `getTranslations()`; client components receive already-translated strings as props.
- The existing landing copy moves out of `constants/home.const.ts` into the CSV. Structural data (icons,
  accent classes) stays in the constants file.
- **The `bn-BD` column is yours to fill.** I will not invent Bangla copy — machine-translated academic
  terminology is exactly the kind of thing that reads wrong to the people using it. Keys ship with the
  English text in place, and the step ends with the list of keys still awaiting translation.
- `<html lang>` follows the route segment, so the font swap and screen-reader pronunciation key off the same
  value.

**Acceptance.** `/` renders English and `/bn` renders the same page with Bengali-capable type and no clipped
conjuncts; the language selector moves between them preserving the current path; `npm run i18n:generate`
reproduces both JSON files from the CSV; no literal UI string remains in `components/`.

---

<a id="step-3"></a>

### Step 3 — SEO, structured data and llms.txt

**Goal.** Make the public surface legible to search engines, social cards and LLM crawlers — and make sure
the private surface is never indexed.

**Deliverables.**

```
app/[locale]/layout.tsx     metadataBase from APP_BASE_URL, canonical, hreflang alternates
app/sitemap.ts              absolute URLs, both locales, alternates.languages per entry
app/robots.ts               extended — sitemap reference, Disallow on the dashboard segments
app/[locale]/opengraph-image.tsx   social card per locale via next/og ImageResponse
app/llms.txt/route.ts       short summary for LLM crawlers, served from constants
app/llms-full.txt/route.ts  the long form — every landing section as markdown
components/shared/json-ld.tsx   renders <script type="application/ld+json"> from a server component
lib/json-ld.utils.ts        builders — organization · website · softwareApplication · breadcrumb
constants/seo.const.ts      organization details, keywords, social profiles
types/json-ld.ts            the subset of schema.org shapes actually emitted
```

**Notes.**

- `metadataBase` is finally possible: `APP_BASE_URL` is validated in step 1, so canonical links, OG URLs and
  sitemap entries resolve as absolute instead of silently rendering relative.
- Metadata text comes from `getTranslations()`, which is why this sits after step 2. JSON-LD keeps its
  structural fields (`@type`, URLs, names) in English and takes translated text only for `description`.
- Three schemas on the landing page: `Organization` (the department), `WebSite`, and `SoftwareApplication`
  (the system itself). `BreadcrumbList` follows if inner public pages appear.
- JSON-LD is injected as a `<script type="application/ld+json">` with `dangerouslySetInnerHTML` from a server
  component — Next's documented approach, and it ships no client JavaScript.
- **Two languages, two indexable URLs.** Every public page emits `alternates.languages` for `en-US` and
  `bn-BD` plus an `x-default` pointing at the English URL, and each sitemap entry repeats the pair. This is
  the payoff for prefixing the URL in step 2.
- **The Bangla OG card needs its font embedded.** `next/og` renders with no Bengali glyphs unless a font is
  passed explicitly, so the Bangla card must ship a Noto Sans Bengali subset through `ImageResponse`'s
  `fonts` option, or it comes out as empty boxes on every social preview.
- `llms.txt` is served in English only, with a line noting the Bangla site exists. The convention is
  English-centric and a per-locale copy is drift waiting to happen for no crawler benefit.
- `llms.txt` follows the [llmstxt.org](https://llmstxt.org) convention: an H1, a blockquote summary, then
  linked sections. Both routes read the same constants the page renders, so they cannot drift from the UI.
- **The dashboards must never be indexed**, and two independent mechanisms cover it because either alone can
  fail: `Disallow` entries in `robots.ts` here, and `robots: { index: false, follow: false }` on the
  `(dashboard)` layout metadata. That layout does not exist yet — its half is listed in
  [step 6](#step-6) so it lands with the shell.
- No new dependencies; `next/og` ships with Next.

**Acceptance.** `/robots.txt`, `/sitemap.xml`, `/llms.txt`, `/llms-full.txt` and `/opengraph-image` all return
200 with absolute URLs built from `APP_BASE_URL`; the JSON-LD passes the schema.org validator with no errors;
view-source shows a canonical link and complete OpenGraph and Twitter tags.

---

<a id="step-4"></a>

### Step 4 — Data model

**Goal.** The schemas the whole application reads and writes, with validation and DTO mapping around them.

**Deliverables.**

```
models/user.model.ts        name · email · passwordHash · role · isApproved · department · profile
models/course.model.ts      code · title · semester · credits · assignedTeacher
models/class-session.model.ts  course · teacher · room · dayOfWeek · startTime · endTime · semester
models/material.model.ts    course · uploadedBy · title · fileName · mimeType · size · storageKey
models/notice.model.ts      title · body · audience · publishedBy · publishedAt
models/index.ts
types/user.dto.ts           UserDto + userFromEntity()
types/course.dto.ts · types/class-session.dto.ts · types/material.dto.ts · types/notice.dto.ts
lib/schemas/user-fields.schema.ts + user-create · user-update · user-approve
lib/schemas/course-create.schema.ts · class-session-create.schema.ts · notice-create.schema.ts
scripts/seed-admin.mjs      creates the first administrator
```

**Notes.**

- `MONGODB_URI` becomes required in `env/server.ts` here.
- Every model is guarded with `mongoose.models.X ?? mongoose.model('X', schema)` so hot reload does not
  redefine it.
- Passwords are hashed in a `pre('save')` hook with `bcryptjs` — never in a route handler or action.
- DTOs never leak `passwordHash`, `_id` or `__v`; `userFromEntity()` is the only way a user reaches the UI.
- Adds `mongoose` (installed), `bcryptjs`, `zod` (from step 1).

**Acceptance.** The seed script creates an administrator against a real `MONGODB_URI`; each model round-trips
through its DTO mapper with correct types.

---

<a id="step-5"></a>

### Step 5 — Authentication

**Goal.** Real sign-in, with the session carrying the role.

**Deliverables.**

```
auth.ts                    NextAuth v5 config — credentials provider, JWT session strategy
app/api/auth/[...nextauth]/route.ts
app/(auth)/sign-in/page.tsx
components/auth/sign-in.form.tsx        client component, react-hook-form + zod resolver
components/auth/actions.ts              signInAction, signOutAction
components/auth/index.ts
types/next-auth.d.ts       module augmentation putting `role` and `isApproved` on the session
proxy.ts                   extended — step 2's locale middleware plus the route guard
lib/services/auth.service.ts
```

**Notes.**

- `AUTH_SECRET` becomes required in `env/server.ts` here.
- Next.js 16 names the middleware file `proxy.ts` and exports `proxy(request)` plus `config.matcher` — not
  `middleware.ts`. It already exists from step 2; the guard composes into it, running after locale
  negotiation so the sign-in redirect lands on the right language.
- Sign-in rejects accounts with `isApproved: false` with a distinct message; approval is the admin's job in
  step 7.
- No public sign-up: the proposal has the administrator creating and approving accounts.
- Adds `next-auth@beta`, `react-hook-form`, `@hookform/resolvers`.

**Acceptance.** A seeded administrator signs in and lands on their dashboard; an unapproved account is
refused; hitting a protected route while signed out redirects to sign-in.

---

<a id="step-6"></a>

### Step 6 — Dashboard shell & RBAC

**Goal.** One shell, three role-scoped entrances, with access decided in one place.

**Deliverables.**

```
app/(dashboard)/layout.tsx           sidebar + topbar, server-rendered per role
                                     + robots: { index: false, follow: false } metadata
app/(dashboard)/admin/page.tsx
app/(dashboard)/teacher/page.tsx
app/(dashboard)/student/page.tsx
app/(dashboard)/loading.tsx · error.tsx · not-found.tsx
app/unauthorized/page.tsx
components/dashboard/                dashboard-sidebar · dashboard-topbar · dashboard-nav
                                     dashboard-user-menu · index.ts
lib/auth.guards.ts                   requireRole() / requireSession() for server components
constants/navigation.const.ts        per-role nav items
constants/routes.const.ts            extended with the real routes
```

**Notes.**

- `sidebar-*` design tokens are already defined in `globals.css` for exactly this.
- `requireRole('admin')` redirects rather than rendering an empty screen — no role check duplicated per page.
- Dashboard routes sit under the locale segment (`/admin` and `/bn/admin`). `constants/routes.const.ts` stays
  unprefixed; `@/l10n/navigation`'s `Link` adds the prefix.
- The `noindex` metadata is the second half of the crawler exclusion set up in [step 3](#step-3); the
  `Disallow` rules alone are a request, not an enforcement.
- `typedRoutes` starts working for real here, since the routes now exist.

**Acceptance.** Each role sees only its own navigation; a teacher requesting `/admin` is redirected, not shown
a blank page; the shell is usable at 360px wide; dashboard routes return `noindex` in their headers.

---

<a id="step-7"></a>

### Step 7 — Admin: user management

**Goal.** The administrator can run the department's accounts end to end.

**Deliverables.**

```
lib/services/user.service.ts
components/admin/users/  users-table · users-table-row · user-create.dialog · user-edit.dialog
                         user-approve.dialog · users-empty · actions.ts · index.ts
app/(dashboard)/admin/users/page.tsx
app/(dashboard)/admin/users/page-search-params.ts    role / status / query filters via nuqs
components/ui/           table · dialog · input · label · select · badge (shadcn base-nova)
```

**Notes.**

- Actions: `createUserAction`, `approveUserAction`, `updateUserAction`, `deactivateUserAction` — each
  validates with zod inside the action and returns a Result.
- Deactivate rather than delete, so schedules and materials keep a valid author.
- Adds `nuqs`, `sonner` for toasts.

**Acceptance.** Creating, approving, editing and deactivating an account all work and survive a refresh;
filters live in the URL; a validation failure surfaces field-level messages from the Result.

---

<a id="step-8"></a>

### Step 8 — Scheduling system

**Goal.** The feature the proposal is built around — a timetable that refuses to double-book.

**Deliverables.**

```
lib/services/class-session.service.ts   including conflict detection
lib/schedule.utils.ts                   time-range overlap, day grouping
components/schedule/  schedule-grid · schedule-grid-cell · schedule-week-view
                      schedule-filters · session-create.dialog · session-edit.dialog
                      session-conflict-notice · actions.ts · index.ts
app/(dashboard)/admin/schedule/page.tsx
app/(dashboard)/teacher/schedule/page.tsx    read-only view of own sessions
constants/schedule.const.ts             days, time slots, semesters
```

**Notes.**

- Conflict detection runs in the service on every create and update, and rejects three cases: same room
  overlapping in time, same teacher overlapping in time, same course scheduled twice in one slot.
- The conflict comes back as a `singleFailureWithErrors` the dialog renders inline — not a thrown error.
- Grid view is a CSS grid keyed by day × time slot; filters by semester and teacher.

**Acceptance.** A conflicting session is refused with a message naming the clash; the grid renders a full
week correctly and stays readable on a phone; filters narrow both views.

---

<a id="step-9"></a>

### Step 9 — Teacher: materials

**Goal.** Teachers publish course files; the repository stays organized by course code.

**Deliverables.**

```
lib/services/material.service.ts
lib/storage/                     local-disk driver behind a small interface
app/api/materials/upload/route.ts
app/api/materials/[id]/download/route.ts
components/materials/  material-upload.form · materials-list · material-row
                       material-delete.dialog · materials-empty · actions.ts · index.ts
app/(dashboard)/teacher/materials/page.tsx
app/(dashboard)/teacher/courses/page.tsx
constants/material.const.ts      allowed MIME types, size cap
```

**Notes.**

- Uploads land in `public/uploads/{courseCode}/` (already git-ignored). The driver interface means swapping
  in S3 or GridFS later touches one file.
- Server-side checks on MIME type and size — the client-side accept attribute is a convenience, not a control.
- Downloads go through a route handler that verifies the requester may see the course.

**Acceptance.** A teacher uploads a PDF to their own course and it appears immediately; upload to a course
they are not assigned to is refused; oversized and disallowed types are rejected with a clear message.

---

<a id="step-10"></a>

### Step 10 — Student dashboard

**Goal.** Everything a student needs on one screen, read-only.

**Deliverables.**

```
app/(dashboard)/student/schedule/page.tsx     the routine for their semester
app/(dashboard)/student/materials/page.tsx    grouped by course code
app/(dashboard)/student/teachers/page.tsx     directory
components/student/  student-routine-card · student-material-list · teacher-directory
                     teacher-profile-card · index.ts
lib/services/student.service.ts
```

**Notes.**

- Entirely server components — there is nothing here to mutate.
- The teacher directory shows only fields marked public on the profile.

**Acceptance.** A student sees their semester routine, downloads a material, and finds a teacher's contact
details; no write action is reachable from any student screen or endpoint.

---

<a id="step-11"></a>

### Step 11 — Notices & announcements

**Goal.** Department-wide communication that actually lands on the right dashboards.

**Deliverables.**

```
lib/services/notice.service.ts
components/notices/  notice-create.dialog · notice-list · notice-card · notice-badge
                     notices-empty · actions.ts · index.ts
app/(dashboard)/admin/notices/page.tsx
components/dashboard/dashboard-notices.tsx     feed on every role's home
```

**Notes.**

- Audience is `all` | `teachers` | `students`, filtered server-side by the viewer's role.
- Unread state is deliberately out of scope — it needs per-user read receipts, which is a schema change.
  Logged in [Backlog](#backlog).

**Acceptance.** An administrator publishes a notice targeted at students and it appears on student
dashboards only.

---

<a id="step-12"></a>

### Step 12 — Polish & hardening

**Goal.** Turn a working app into one that behaves under real use.

**Scope.**

- Loading, empty and error states for every list and dialog — `loading.tsx` per route segment.
- Responsive audit at 360, 768, 1024, 1440; no horizontal overflow anywhere.
- Accessibility pass: focus order, labels on every control, contrast against the tokens, keyboard paths
  through the dialogs.
- Rate limiting on the sign-in and upload endpoints.
- Security review of every server action: authenticated, authorized, validated, and returning a Result.
- Dark mode wired to a real toggle (`next-themes`) — the palette already exists.

**Acceptance.** A slow-network pass shows a skeleton on every route; the a11y and responsive checks are clean;
no action is reachable without both an authentication and an authorization check.

---

<a id="step-13"></a>

### Step 13 — Testing & deployment

**Goal.** Ship it, repeatably.

**Scope.**

- Smoke tests over the critical paths: sign in, create user, create session with a conflict, upload,
  download, publish notice.
- Seed script for a demo department — administrator, two teachers, five students, a week of classes.
- Production env checklist; `MONGODB_URI` pointing at Atlas, `APP_BASE_URL` at the real domain so every
  canonical, OG and sitemap URL resolves.
- `npm run build:linux` + `ecosystem.config.js` (PM2, port 3101) on the target server.
- README deployment section verified against an actual deploy.

**Acceptance.** A clean clone reaches a running production build with only `.env.local` supplied; every smoke
test passes against it.

---

## Backlog

Real, out of scope for now, and here so they are not lost:

| Item                              | Why it is parked                                              |
| --------------------------------- | ------------------------------------------------------------- |
| Per-user unread state for notices | Needs read receipts — a schema change with no feature ask yet |
| Password reset by email           | Requires SMTP credentials the project does not have           |
| Attendance tracking               | Not in the proposal scope                                     |
| Multi-department support          | Proposal is explicit: one department first                    |
| Storybook for the UI package      | Worth it if the component count grows past ~25                |
| E2E tests (Playwright)            | Smoke tests first; full E2E once the flows settle             |
