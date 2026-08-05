# Implementation Plan

The build is split into **13 steps**. Each one is self-contained, ends with a green build, and leaves the app
in a working state.

## How this works

- **You start each step.** Say _"start step 4"_ and only step 4 gets built. Nothing runs ahead of your command.
- **One step at a time.** If a step turns out to be bigger than it looks, it gets split rather than stretched.
- **Every step ends green** — see [Definition of done](#definition-of-done).
- **The plan is not frozen.** Anything discovered mid-step that belongs elsewhere goes to
  [Backlog](#backlog) instead of quietly widening the current step.

## Status at a glance

| #              | Step                    | Proposal phase | Status         |
| -------------- | ----------------------- | -------------- | -------------- |
| [0](#step-0)   | Project scaffold        | Phase 1        | ✅ Done        |
| [1](#step-1)   | Foundations             | Phase 1        | ✅ Done        |
| [2](#step-2)   | Internationalization    | Phase 1        | ⬜ Not started |
| [3](#step-3)   | Data model              | Phase 2        | ⬜ Not started |
| [4](#step-4)   | Authentication          | Phase 2        | ⬜ Not started |
| [5](#step-5)   | Dashboard shell & RBAC  | Phase 3        | ⬜ Not started |
| [6](#step-6)   | Admin — user management | Phase 3        | ⬜ Not started |
| [7](#step-7)   | Scheduling system       | Phase 4        | ⬜ Not started |
| [8](#step-8)   | Teacher — materials     | Phase 4        | ⬜ Not started |
| [9](#step-9)   | Student dashboard       | Phase 5        | ⬜ Not started |
| [10](#step-10) | Notices & announcements | Phase 5        | ⬜ Not started |
| [11](#step-11) | Polish & hardening      | Phase 6        | ⬜ Not started |
| [12](#step-12) | Testing & deployment    | Phase 6        | ⬜ Not started |

## Decisions

Settled up front, because they shape every step below.

| Area           | Choice                                                                                              | Follows                  |
| -------------- | --------------------------------------------------------------------------------------------------- | ------------------------ |
| **Styling**    | Inline Tailwind utilities with design tokens, `cn()` for conditionals                               | android-walls, katastarx |
| **Data layer** | zod schemas → services → DTO mappers → Result pattern → `actions.ts` server actions                 | aloowing                 |
| **Auth**       | NextAuth v5 (`next-auth@5.0.0-beta.32`), credentials provider over MongoDB                          | —                        |
| **i18n**       | next-intl from the start, `l10n('KEY')`, flat `SCOPE_COMPONENT_ELEMENT` keys, CSV → JSON generation | aloowing                 |

The styling choice is the one deliberate split from aloowing, which puts all styling in
`app/styles/*.page.css` with `@apply`. This project keeps utilities in the JSX.

## Definition of done

A step is finished only when all of these hold:

- [ ] `npm run format:write` applied, `npm run format` clean
- [ ] `npm run lint` green — import order, cspell, canonical Tailwind classes, Prettier
- [ ] `npm run build` succeeds, including the TypeScript pass
- [ ] The affected screens render with no console errors
- [ ] New user-facing strings are `l10n` keys, not literals (from step 2 onward)
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
  `MONGODB_URI` and `AUTH_SECRET` are optional until steps 3 and 4, and `LOG_LEVEL` / `APP_BASE_URL` have
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

### Step 2 — Internationalization

**Goal.** Every user-facing string comes from a dictionary before there are hundreds of them.

**Deliverables.**

```
l10n/l10n.csv             master translation source — yours to edit
l10n/en-US.json           generated, never hand-edited
l10n/request.config.ts    cookie-based locale resolution
l10n/format.config.ts     date, number and list formats
scripts/csv-to-json.mjs   the generator behind `npm run i18n:generate`
next.config.ts            wrapped in createNextIntlPlugin
constants/i18n.const.ts   locale list, default locale, cookie name
components/shared/language-selector.tsx   only if a second locale is added
```

**Notes.**

- Translation variable is always named `l10n`; keys are flat and ALL CAPS: `HOME_HERO_TITLE`,
  `ADMIN_USERS_TABLE_EMPTY`.
- Server components call `getTranslations()`; client components receive already-translated strings as props.
- The existing landing copy moves out of `constants/home.const.ts` into the CSV. Structural data
  (icons, accent classes, roadmap rows) stays in the constants file.
- Starts with `en-US` only; adding a locale later is a CSV column plus one line of config.

**Acceptance.** The landing page renders entirely from `l10n` keys, `npm run i18n:generate` reproduces the
JSON from the CSV, and no literal UI string remains in `components/`.

---

<a id="step-3"></a>

### Step 3 — Data model

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

- Every model is guarded with `mongoose.models.X ?? mongoose.model('X', schema)` so hot reload does not
  redefine it.
- Passwords are hashed in a `pre('save')` hook with `bcryptjs` — never in a route handler or action.
- DTOs never leak `passwordHash`, `_id` or `__v`; `userFromEntity()` is the only way a user reaches the UI.
- Adds `mongoose` (installed), `bcryptjs`, `zod` (from step 1).

**Acceptance.** The seed script creates an administrator against a real `MONGODB_URI`; each model round-trips
through its DTO mapper with correct types.

---

<a id="step-4"></a>

### Step 4 — Authentication

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
proxy.ts                   Next 16 middleware — protects /admin, /teacher, /student
lib/services/auth.service.ts
```

**Notes.**

- Next.js 16 names the middleware file `proxy.ts` and exports `proxy(request)` plus `config.matcher` — not
  `middleware.ts`.
- Sign-in rejects accounts with `isApproved: false` with a distinct message; approval is the admin's job in
  step 6.
- No public sign-up: the proposal has the administrator creating and approving accounts.
- Adds `next-auth@beta`, `react-hook-form`, `@hookform/resolvers`.

**Acceptance.** A seeded administrator signs in and lands on their dashboard; an unapproved account is
refused; hitting a protected route while signed out redirects to sign-in.

---

<a id="step-5"></a>

### Step 5 — Dashboard shell & RBAC

**Goal.** One shell, three role-scoped entrances, with access decided in one place.

**Deliverables.**

```
app/(dashboard)/layout.tsx           sidebar + topbar, server-rendered per role
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
- `typedRoutes` starts working for real here, since the routes now exist.

**Acceptance.** Each role sees only its own navigation; a teacher requesting `/admin` is redirected, not shown
a blank page; the shell is usable at 360px wide.

---

<a id="step-6"></a>

### Step 6 — Admin: user management

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

<a id="step-7"></a>

### Step 7 — Scheduling system

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

<a id="step-8"></a>

### Step 8 — Teacher: materials

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

<a id="step-9"></a>

### Step 9 — Student dashboard

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

<a id="step-10"></a>

### Step 10 — Notices & announcements

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

<a id="step-11"></a>

### Step 11 — Polish & hardening

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

<a id="step-12"></a>

### Step 12 — Testing & deployment

**Goal.** Ship it, repeatably.

**Scope.**

- Smoke tests over the critical paths: sign in, create user, create session with a conflict, upload,
  download, publish notice.
- Seed script for a demo department — administrator, two teachers, five students, a week of classes.
- Production env checklist; `MONGODB_URI` pointing at Atlas.
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
