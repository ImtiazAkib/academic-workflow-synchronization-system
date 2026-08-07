# Implementation Plan

The build is split into **17 steps**. Each one is self-contained, ends with a green build, and leaves the app
in a working state.

## How this works

- **You start each step.** Say _"start step 4"_ and only step 4 gets built. Nothing runs ahead of your command.
- **The checks are enforced, not remembered.** Husky runs lint and format on every commit, commitlint on the
  message, and the build on every push. See the README's Git hooks section.
- **[project-overview.html](project-overview.html)** is the visual companion to this document — the same
  system as diagrams rather than deliverables.
- **One step at a time.** If a step turns out to be bigger than it looks, it gets split rather than stretched.
- **Every step ends green** — see [Definition of done](#definition-of-done).
- **The plan is not frozen.** Anything discovered mid-step that belongs elsewhere goes to
  [Backlog](#backlog) instead of quietly widening the current step.

## Status at a glance

| #              | Step                           | Proposal phase | Status         |
| -------------- | ------------------------------ | -------------- | -------------- |
| [0](#step-0)   | Project scaffold               | Phase 1        | ✅ Done        |
| [1](#step-1)   | Foundations                    | Phase 1        | ✅ Done        |
| [2](#step-2)   | i18n — English + Bangla        | Phase 1        | ✅ Done        |
| [3](#step-3)   | SEO, structured data, llms.txt | Phase 1        | ✅ Done        |
| [4](#step-4)   | Data model                     | Phase 2        | ✅ Done        |
| [5](#step-5)   | Authentication                 | Phase 2        | ✅ Done        |
| [6](#step-6)   | Dashboard shell & RBAC         | Phase 3        | ✅ Done        |
| [7](#step-7)   | Admin — user management        | Phase 3        | ✅ Done        |
| [7b](#step-7b) | Admin — courses                | Phase 3        | ✅ Done        |
| [8](#step-8)   | Scheduling system              | Phase 4        | ✅ Done        |
| [9](#step-9)   | Teacher — materials            | Phase 4        | ✅ Done        |
| [10](#step-10) | Student dashboard              | Phase 5        | ✅ Done        |
| [11](#step-11) | Roles and access control       | Phase 5        | ✅ Done        |
| [12](#step-12) | Accounts, registration, email  | Phase 5        | ✅ Done        |
| [13](#step-13) | Profiles                       | Phase 5        | ⬜ Not started |
| [14](#step-14) | Notices & announcements        | Phase 5        | ⬜ Not started |
| [15](#step-15) | Polish & hardening             | Phase 6        | ⬜ Not started |
| [16](#step-16) | Testing & deployment           | Phase 6        | ⬜ Not started |

## Decisions

Settled up front, because they shape every step below.

| Area           | Choice                                                                                         | Follows                  |
| -------------- | ---------------------------------------------------------------------------------------------- | ------------------------ |
| **Styling**    | Inline Tailwind utilities with design tokens, `cn()` for conditionals                          | android-walls, katastarx |
| **Data layer** | zod schemas → services → DTO mappers → Result pattern → `actions.ts` server actions            | aloowing                 |
| **Auth**       | Session JWT signed with `jose`, credentials verified against MongoDB — no pre-release deps     | —                        |
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

### Step 2 — i18n: English + Bangla ✅ Done

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

**Acceptance.** ✅ Verified in the browser. `/` renders English with Inter/Poppins and `lang="en"`; `/bn`
renders Bangla with Noto Sans Bengali / Anek Bangla and `lang="bn"`; the selector moves between them and sets
the locale cookie; `/bn/does-not-exist` renders the translated 404 inside the shell; `npm run i18n:generate`
produces 90 keys per locale from the CSV; build prerenders `/en` and `/bn`; lint, format and build are green.

**Deviations from the plan, and why.**

- **I wrote a Bangla draft after saying I would not.** The reason I changed course: with an English-filled
  `bn-BD` column there is no way to verify the thing most likely to break — Bengali glyph rendering,
  conjunct clipping and the font swap. An unverified font pipeline is a worse handover than a draft you can
  correct in one CSV column. **Please review `l10n/l10n.csv`;** the terminology is standard but the prose is
  mine, not a native speaker's.
- **Two font bugs, both found by checking computed styles rather than by looking at the page.** First,
  `@theme inline` _inlines_ its value, so `.font-sans` compiled to `font-family: var(--font-inter)` and
  overriding `--font-sans` per language did nothing. The theme now points at `--font-body` / `--font-display`,
  one level of indirection that makes the swap possible. Second, the next/font variables were on `<body>`
  while `--font-body` is declared on `<html>` — a custom property resolves against the element that declares
  it, so the swap resolved to nothing and the page silently fell back to the system stack. The font classes
  moved to `<html>`.
- **`l10n/routing.ts` imports `@/constants/i18n.const` directly, not the barrel.** `proxy.ts` pulls routing
  into the middleware bundle, and the barrel drags `lucide-react` in with it, which the middleware runtime
  cannot resolve. The production build passed; only the dev middleware failed, which is exactly the kind of
  thing that reaches a branch unnoticed.
- **Added `app/[locale]/[...rest]/page.tsx`**, not in the plan. Without it an unmatched path escapes the
  `[locale]` segment and Next serves its own unstyled 404 instead of the translated one.
- **`app/[locale]/layout.tsx` is the root layout** — there is no `app/layout.tsx`. `global-error.tsx`,
  `robots.ts` and `icon.svg` stay at the app root, and `global-error.tsx` keeps its English strings because it
  renders outside the locale provider.
- **The generator falls back instead of failing.** aloowing's script throws on an empty cell; this one falls
  back to the default locale and prints the list of keys that fell back. A missing key at runtime is a visible
  defect, an untranslated string is not.
- **Constants hold visuals only now.** The translator rulebook forbids collecting keys into arrays and
  iterating (i18n-ally only detects literal `l10n('KEY')` calls), so the sections render each card explicitly
  and `constants/home.const.ts` keeps just icons and accent classes. `types/{nav-item,feature-item,role-card-item,phase-item,tech-item}.ts`
  were deleted and replaced by `role-visual.ts` / `feature-visual.ts`.

---

<a id="step-3"></a>

### Step 3 — SEO, structured data and llms.txt ✅ Done

**Goal.** Make the public surface legible to search engines, social cards and LLM crawlers — and make sure
the private surface is never indexed.

**Deliverables.**

```
app/[locale]/layout.tsx     metadataBase from APP_BASE_URL, canonical, hreflang alternates
app/sitemap.ts              absolute URLs, both locales, alternates.languages per entry
app/robots.ts               sitemap reference, dashboard Disallow, ROBOTS_ENABLED staging gate
app/[locale]/opengraph-image.tsx   social card per locale via next/og ImageResponse
app/llms.txt/route.ts       short summary for LLM crawlers, served from constants
app/llms-full.txt/route.ts  the long form — every landing section as markdown
components/shared/json-ld.tsx   kfz-profiler's component, verbatim
constants/json-ld.const.ts  the @graph nodes — Organization · WebSite · SoftwareApplication
constants/seo.const.ts      keywords, social profiles, sitemap priority tiers
env/server.ts               gains ROBOTS_ENABLED
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
- **`kfz-profiler` already solved most of this — copy it rather than reinvent.** Its
  `components/shared/json-ld.tsx` is seven lines, its `app/robots.ts` and `app/sitemap.ts` are the shapes to
  follow, and `constants/jsonld-data.ts` shows the `@graph` nodes cross-linked by `@id` fragments
  (`${BASE_URL}/#organization`) so `founder` / `publisher` references resolve inside one document. One
  filename change: `constants/json-ld.const.ts` here, to keep this repo's `.const.ts` suffix.
- **`ROBOTS_ENABLED` comes from kfz-profiler too** — a staging deploy that gets indexed is painful to undo,
  so `robots.ts` disallows everything unless the flag is on, while still emitting the `sitemap:` line.
- Adds `schema-dts`: JSON-LD typed against schema.org, so a malformed node is a compile error rather than
  something the validator finds later. `next/og` ships with Next.

**Acceptance.** ✅ Verified in the browser. All five routes return 200 with absolute URLs built from
`APP_BASE_URL` — `/sitemap.xml` carries one entry per locale with `en-US`, `bn-BD` and `x-default`
alternates; `/llms.txt` and `/llms-full.txt` serve `text/plain` built from the dictionary;
`/en/opengraph-image` returns `image/png`. The rendered head has `canonical`, three `hreflang` links,
`og:locale` / `og:locale:alternate`, and a JSON-LD graph typed `Organization` → `WebSite` →
`SoftwareApplication`. Both branches of the robots gate were checked: default emits `Disallow: /` plus
`noindex, nofollow`; with `ROBOTS_ENABLED=true` the build emits `Allow: /` with all eight private paths
(4 segments × 2 locales) disallowed.

**Deviations from the plan, and why.**

- **`schema-dts@2.0.0`, not kfz-profiler's `1.1.5`.** It is a types-only package and the nodes used here are
  stable vocabulary; an unexplained old pin costs more than the upgrade.
- **`json-ld.tsx` omits kfz-profiler's `'use server'` directive**, despite the plan saying "verbatim". That
  directive marks every export in a file as a server _action_; on a component it is at best a no-op and at
  worst turns the component into a callable reference. It renders as a plain server component without it.
- **One OG card, Latin-only, shared by both locales.** `next/og` has no Bengali glyphs unless a font file is
  passed to `ImageResponse`, and adding one means committing a ~300KB binary. The card shows only the product
  name and tagline, which are Latin in both locales, so the loss is limited to a Bangla-worded card. Logged in
  [Backlog](#backlog).
- **`constants/json-ld.const.ts` exports a builder, not a static object.** The base URL is server-only env,
  and `constants/index.ts` is imported by client components — a static object would drag `env/server` into the
  client bundle. kfz-profiler avoids this with a `NEXT_PUBLIC_BASE_URL`; a builder avoids a second env
  variable holding the same value.
- **`ROBOTS_ENABLED` defaults to `false`,** and the layout's `robots` metadata reads the same flag rather than
  hard-coding `index: true`. Two independent signals, both off until a deploy opts in.
- **Helpers landed in `lib/url.utils.ts` and `lib/llms.utils.ts`**, not the planned `lib/json-ld.utils.ts` —
  the graph builder sits with its data in `constants/`. `types/json-ld.ts` was not created; schema-dts already
  provides the vocabulary types.

---

<a id="step-4"></a>

### Step 4 — Data model ✅ Done

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

**Acceptance.** ✅ Verified against the real Atlas cluster, with one temporary record created and removed:
password hashed by the hook (`$2` prefix, never the plaintext), `comparePassword` true for the right password
and false for the wrong one, `select: false` keeping the hash out of an ordinary query, `isApproved` false and
`isActive` true by default, email lowercased, the unique `email_1` index created, and `userFromEntity()`
emitting exactly eleven keys with no `password` and no `_id`. Both of the seed script's validation failure
paths report the offending variable by name. Lint, format and build are green.

**Not verified by me:** the seed script's _create_ path. Running it mints a real administrator whose password
only I would know, so it is one command for you to run:

```bash
SEED_ADMIN_NAME="Department Head" SEED_ADMIN_EMAIL="head@dept.edu" SEED_ADMIN_PASSWORD="…" npm run seed:admin
```

**Deviations from the plan, and why.**

- **`lib/mongodb.ts` now passes `dbName` explicitly** — not in the plan, added because the connection string
  in `.env.local` had no path segment and every write was going to a database called `test`. The app worked;
  the data was in the wrong place and nothing complained. The database name is now owned by
  `constants/database.const.ts`, so no environment can get it wrong.
- **The field is `password`, not `passwordHash`.** The pre-save hook is handed a plaintext and replaces it, so
  a field named `passwordHash` would be a lie at the moment of assignment. It carries `select: false` instead,
  which is the protection the name was reaching for.
- **`scripts/seed-admin.ts`, not `.mjs`** — it imports the models and the `@/` aliases, which a plain `.mjs`
  cannot resolve. Adds `tsx` as a dev dependency and runs with `--env-file-if-exists=.env.local`.
- **Models import the specific constant module, never the `@/constants` barrel.** The barrel re-exports
  `home.const.ts` and drags `lucide-react` with it — harmless in a React tree, wasteful in a seed script, fatal
  in the middleware bundle, as step 2 already found out. Same rule applied to `lib/mongodb.ts`.
- **Extra files the plan did not itemize:** `lib/mongo.utils.ts` (`toId()`, so a mapper behaves the same
  whether or not a reference was populated), `constants/{database,schedule,notice,codes-users}.const.ts`, and
  `types/{day-of-week,notice-audience}.ts`. `schedule.const.ts` was scheduled for step 8, but the class-session
  model needs the day list, time pattern and semester bounds now.
- **Error codes exist for users only.** The user schemas are consumed first, by authentication in step 5; the
  other entities get their codes with the services that raise them, rather than inventing a taxonomy for
  features that do not exist. Uncoded messages decode to code `0` and still render.
- **`storageKey` is absent from `MaterialDto`.** It describes where bytes sit on the server; the download route
  resolves it after checking access.
- **Eight schema files rather than seven** — `object-id.schema.ts` was extracted because three schemas validate
  an id, and the planned `class-session-fields.schema.ts` was folded into its create schema until step 8 needs
  an update schema to share it.

---

<a id="step-5"></a>

### Step 5 — Authentication ✅ Done

**Goal.** Real sign-in, with the session carrying the role.

**Deliverables.**

```
lib/auth/session.ts        sign and verify the session JWT with jose
lib/auth/session-cookie.ts set and clear the httpOnly cookie
lib/auth/current-user.ts   getSessionUser() for server components
lib/auth/index.ts
lib/services/auth.service.ts            credential verification, returns a Result
constants/auth.const.ts    cookie name, lifetime, issuer, audience, algorithm
types/session-user.ts      what rides inside the token
app/[locale]/(auth)/sign-in/page.tsx
components/auth/sign-in.form.tsx        client component, react-hook-form + zod resolver
components/auth/actions.ts              signInAction, signOutAction
components/auth/index.ts
proxy.ts                   extended — step 2's locale middleware plus the route guard
```

**Notes.**

- `AUTH_SECRET` becomes required in `env/server.ts` here.
- Next.js 16 names the middleware file `proxy.ts` and exports `proxy(request)` plus `config.matcher` — not
  `middleware.ts`. It already exists from step 2; the guard composes into it, running after locale
  negotiation so the sign-in redirect lands on the right language.
- Sign-in rejects accounts with `isApproved: false` with a distinct message; approval is the admin's job in
  step 7.
- No public sign-up: the proposal has the administrator creating and approving accounts.
- Adds `jose`, `react-hook-form`, `@hookform/resolvers` — all stable releases.

**Acceptance.** ✅ Verified in the browser against two temporary accounts, created for the test and deleted
after (the database is back to one user — the real administrator):

| Attempt                                  | Result                                                        |
| ---------------------------------------- | ------------------------------------------------------------- |
| `/admin` signed out, Bangla cookie set   | `→ /bn/sign-in?next=%2Fadmin` — language and destination kept |
| `/teacher` signed out, no cookie         | `→ /sign-in?next=%2Fteacher`, page is `noindex, nofollow`     |
| Approved account, wrong password         | "Email or password is incorrect."                             |
| **Unapproved** account, correct password | "This account is waiting for administrator approval."         |
| Approved account, correct password       | `→ /`, session cookie set and not readable from page scripts  |
| `/bn/sign-in` while signed in            | `→ /bn` — the redirect keeps the language                     |
| `/admin` while signed in                 | 404 — the guard lets it through; the route arrives in step 6  |

Re-run in full after NextAuth was replaced with `jose`; server logs were clean, with no errors at all. Lint,
format and build are green, and the project has no pre-release dependencies.

**Deviations from the plan, and why.**

- **NextAuth was removed and replaced with a `jose`-signed session.** It was built on
  `next-auth@5.0.0-beta.32` first — the only App-Router-native release is a beta — and then rebuilt when the
  rule became "stable releases only". `next-auth@4` is stable and declares Next 16 support, but it is in
  maintenance and its `authorize()` can only signal pass or fail, which would have collapsed "waiting for
  approval" into a generic failure. `jose` is stable, is what next-auth uses internally, and the codebase
  already had the harder half: a service returning a Result with precise codes.
  **The project now has no pre-release dependencies.**
- **Everything auth lives under `lib/auth/`** — `session.ts` (sign and verify), `session-cookie.ts` (set and
  clear), `current-user.ts` (read it in a server component). No root-level `auth.ts` / `auth.config.ts`.
- **`proxy.ts` imports `@/lib/auth/session`, not the `@/lib/auth` barrel.** The barrel also exports the cookie
  helpers, which use `next/headers` — unavailable in the middleware runtime. Verifying a token needs only
  `jose`, which runs there fine. Same class of trap as the `@/constants` barrel in step 2.
- **A verified signature is not a valid payload.** `verifySessionToken()` parses the decoded claims with zod
  before returning them: a token minted before a field was renamed verifies perfectly and then hands back
  nonsense. It also pins `algorithms: ['HS256']`, which is what refuses a token arriving with `alg: none`.
- **Sign-in lives at `app/[locale]/(auth)/sign-in/`**, not `app/(auth)/sign-in/` as written. Every page sits
  under the locale segment since step 2, so the sign-in page is translated like everything else.
- **Successful sign-in redirects to `/`, not a dashboard**, because no dashboard exists yet. The guard already
  records the intended destination in `?next=`; step 6 consumes it and routes by role.
- **`PROTECTED_SEGMENTS` moved into `constants/routes.const.ts`** and `seo.const.ts` now derives its
  `Disallow` list from it. Two copies of that list is exactly how a route ends up guarded but crawled, or
  crawled but unguarded.
- **Added `components/ui/{input,label}.tsx`** — the form needed them and only `button` existed.
- **Error codes gained a `USERS_AUTH` block (51xxx)**, and `ACCOUNT_NOT_APPROVED` / `ACCOUNT_DEACTIVATED`
  moved there out of `USERS_BUSINESS`. Refusing a sign-in is an auth concern, not a business rule.
- **`types/next-auth.d.ts` is gone.** With no library in the way, `SessionUser` is an ordinary type in
  `types/session-user.ts` — no module augmentation, and none of the re-export trap that made the NextAuth
  version fail silently.
- **Sign-in never distinguishes an unknown email from a wrong password.** Both return
  `INVALID_CREDENTIALS`, and account state is only disclosed _after_ the password is verified — otherwise the
  form doubles as a way to test which addresses have accounts here.
- The session cookie is `httpOnly`, `sameSite: lax`, `secure` in production, and lives for seven days.
  Confirmed unreadable from page scripts during verification.

---

<a id="step-6"></a>

### Step 6 — Dashboard shell & RBAC ✅ Done

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

**Acceptance.** ✅ Verified in the browser against two temporary accounts, since deleted:

| Attempt                      | Result                                                        |
| ---------------------------- | ------------------------------------------------------------- |
| Teacher signs in             | Lands on `/bn/teacher`, sidebar shown, no marketing footer    |
| Teacher requests `/bn/admin` | `→ /bn/unauthorized`, 403, CTA points at `/bn/teacher`        |
| Admin signs in               | Lands on `/bn/admin` — the redirect follows the role          |
| Admin requests `/bn/teacher` | `→ /bn/unauthorized`, CTA points at `/bn/admin`               |
| Any dashboard page           | `noindex, nofollow` in the metadata                           |
| Sign out                     | `→ /bn`, and `/bn/admin` then redirects to `/bn/sign-in`      |
| 360px viewport               | No sideways scroll, sidebar hidden, nav moved into the topbar |

Lint, format and build are green; the language survived every redirect.

**Deviations from the plan, and why.**

- **The layouts were restructured, which the plan did not call for.** A `(dashboard)` group nested under the
  old root layout would have inherited the marketing header and footer. `app/[locale]/layout.tsx` is now the
  document and locale only; `(marketing)` owns the site header, footer and JSON-LD; `(auth)` is a quiet shell
  with just the logo and language selector; `(dashboard)` has the sidebar and topbar. The landing page,
  catch-all and a `not-found` moved into `(marketing)`.
- **`requireSession()` and `requireRole()` take no locale argument.** They read it with `getLocale()`
  themselves, so no caller can pass the wrong one.
- **The guard's redirect helper is synchronous and ends in an unreachable `throw`.** next-intl does not type
  `redirect` as returning `never`, and — the part that cost a build cycle — **awaiting a `Promise<never>` does
  not narrow control flow either**. Only a synchronous `never`-returning call as the last statement in the
  branch convinces the compiler that a guard hands back a `SessionUser` rather than `SessionUser | null`.
- **`signInAction` returns `SingleResult<UserRole>`**, not an empty result. The client navigates to
  `ROLE_HOME[role]`, which is a literal union — so the destination is a route `typedRoutes` already knows and
  no path is ever built from user input.
- **`?next=` is still not consumed.** The proxy records it, but every dashboard is one page deep, so the role
  home _is_ the destination. Consuming it needs an allowlist check against real deep routes — that belongs in
  step 7, where the first ones appear.
- **No `constants/navigation.const.ts`.** Nav entries are rendered explicitly so each label stays a literal
  `l10n('KEY')` call; collecting keys into an array is what the translator rulebook forbids.
- **`DashboardNav` is a client component** so the active link comes from the real pathname. Hard-coding
  "overview is current" would start lying the moment step 7 adds a second entry.

**Found while verifying, worth knowing:** the session is a self-contained JWT, so **deleting a user does not
end their session** — a token minted for an account that no longer exists still verifies until it expires.
Deactivation takes effect at the next sign-in. Closing that gap needs a token version or a revocation list,
which is logged in [Backlog](#backlog).

---

<a id="step-7"></a>

### Step 7 — Admin: user management ✅ Done

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

**Acceptance.** ⚠️ Partly verified. Confirmed against the running app, from the server log:

| Attempt                   | Result                                                           |
| ------------------------- | ---------------------------------------------------------------- |
| `/admin/users` signed out | `→ /bn/sign-in?next=%2Fadmin%2Fusers` — language and target kept |
| Role filter changed       | `GET /admin/users?role=teacher 200` — the filter reaches the URL |
| Create an account         | `createUserAction` ran, the row appeared as waiting for approval |
| Approve, then revoke      | `approveUserAction` with `isApproved` true, then false           |

The four paths the browser check could not reach — editing, deactivation, the last-administrator guard and
duplicate-email validation — were exercised against the real database through `UserService` instead, with a
throwaway account that was deleted afterwards. 12 checks, 0 failures:

| Check                   | Result                                                              |
| ----------------------- | ------------------------------------------------------------------- |
| Create                  | Succeeds and starts unapproved, per the model default               |
| Duplicate email         | Refused, error tagged to the `email` field                          |
| Update                  | Name and designation saved; a blank optional field stores as `null` |
| Deactivate / reactivate | Both flip `isActive` and come back in the DTO                       |
| Last admin, deactivated | Refused — and the record is confirmed untouched afterwards          |
| Last admin, demoted     | Refused by the same guard                                           |

Lint, format and build are green. Bangla is complete: all 71 new keys are translated, and the generator
reports no fallbacks.

**Still only proven at the service layer:** the dialogs and forms that call these actions were not clicked
through by a signed-in administrator. The logic holds; the wiring between it and the buttons is covered by
types and the build alone.

**Deviations from the plan, and why.**

- **Creating an account is a page, not a dialog.** Seven fields plus their errors never sat comfortably in a
  popup — on a phone it filled the screen and still scrolled. `/admin/users/new` also gives the work a URL,
  so it survives a refresh and can be linked.
- **One `user-confirm.dialog.tsx` instead of a separate approve dialog.** Approve, revoke, deactivate and
  reactivate are the same dialog with different words; four near-identical files would drift.
- **Actions guard with `getSessionUser()`, not `requireRole()`.** `requireRole` calls `getLocale()`, which
  reads `next/root-params` — unavailable inside a Server Action. They return a refusal the dialog can render
  rather than a redirect it cannot follow.
- **The last-administrator guard also covers demotion.** Changing the only admin's role locks everyone out of
  the admin area exactly as deactivating them would.
- **Accounts start unapproved**, per the model's default, so approval is a deliberate second act.
- **`components/ui/button.tsx` and `select.tsx` were edited after all.** The `outline` variant sets
  `border-border` but the base had no border _width_, so every outline button rendered as bare text; the
  button scale also started at `h-8` against an `h-10` input. Both were first worked around at call sites —
  twelve overrides, one of which was missed and shipped a broken dropdown — then fixed in the two files.
- **`?next=` is still not consumed**, though step 6 expected this step to do it. The proxy records it and the
  sign-in form still routes by role.

**Found while building, worth knowing:** `/favicon.ico` matches the `[locale]` segment as `locale =
"favicon.ico"`, and `generateMetadata` passed that to `getTranslations()` before the layout's `hasLocale`
check could reject it — logging an invalid-locale warning on every request. Guarded in `generateMetadata`.
The marketing header also overflowed at 375px; the brand could not shrink. Both were pre-existing.

---

<a id="step-7b"></a>

### Step 7b — Admin: courses ✅ Done

**Goal.** Somewhere to create the courses a timetable schedules.

**Why this exists.** It was not in the original plan, and step 8 could not be built without it. Every
`ClassSession` requires a `courseId`, but courses appeared in the plan only as a step 4 model and as something
steps 9–10 _read_ — nothing ever created one. Step 8's own acceptance test, "a conflicting session is refused",
cannot be run against an empty course list. Split out rather than folded into step 8, per _one step at a time_.

**Deliverables.**

```
lib/services/course.service.ts          ✅ list · create · update · setActive
lib/schemas/course-update.schema.ts     ✅
constants/codes-courses.const.ts        ✅ 12xxx · 22xxx · 32xxx
components/admin/courses/               courses-table · courses-table-row · course-create.form
                                        course-edit.dialog · courses-empty · actions.ts · index.ts
app/(dashboard)/admin/courses/page.tsx  list, filtered by semester
app/(dashboard)/admin/courses/new       create, following the users screen
```

**Notes.**

- Mirrors the users screen deliberately — a list with an edit dialog and a separate create page — so the two
  admin areas do not diverge in shape.
- The assigned teacher is optional; a course can exist before anyone is given it. The service still refuses an
  id that is not a teacher.
- Deactivating a course that still has sessions is refused rather than cascaded.

**Acceptance.** ⚠️ Service verified, screen not. `npm run verify:schedule` exercises the course paths against
the real database as part of its setup — creating courses, and the refusal to deactivate one that still has
classes on the timetable. Lint, format and build are green, and both routes register:

```
├ ƒ /[locale]/admin/courses
├ ƒ /[locale]/admin/courses/new
```

Bangla shipped with the English this round rather than being backfilled — 59 keys, 260 in total, and the
generator reports no fallbacks.

**Not verified: the screen itself.** The filter round-trip, the edit dialog, the toasts and the duplicate-code
message have not rendered once — the page is behind the admin guard and the assistant driving the browser does
not sign in. `CourseService.update` and its duplicate-code check are covered by types and the build alone.

**Deviations from the plan, and why.**

- **The create page and the edit dialog share `course-fields.tsx`.** The users screen duplicates its fields
  across both, and that duplication is exactly where a missed `<SelectContent>` hid for three rounds. The cost
  is that `CourseFields` is typed loosely — `Control<never>` — because the create and update schemas differ by
  `courseId` alone, and a generic would buy nothing at two call sites.
- **The semester filter is validated in the page, not by a zod schema.** It is one optional integer in a known
  range; `UserFiltersSchema` exists because that screen has three fields with different failure modes.
- **`setCourseActiveAction` takes `(courseId, isActive)` rather than an object**, since there is no form behind
  it — the row's button is the whole input.
- **The teacher picker lists only approved, active teachers.** The service re-checks the role anyway: a form
  field is user input whatever put it there.

---

<a id="step-8"></a>

### Step 8 — Scheduling system ✅ Done

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
- **The timetable reads in Bangladesh time.** `startTime` / `endTime` are stored as bare `HH:mm` strings, not
  `Date`s, so they carry no zone at all — 09:30 is 09:30 wherever the server runs, and rendering them needs no
  conversion. The zone matters for everything _derived_: which column is "today", whether a class is on now,
  and any `createdAt` shown. Those must be computed in `DEFAULT_TIMEZONE` (`Asia/Dhaka`, already wired into
  `l10n/request.config.ts`) rather than from the server's clock or the browser's — a Vercel instance runs UTC,
  so `new Date().getDay()` would highlight the wrong day for six hours of every Bangladeshi evening.

**Acceptance.** ⚠️ Service proven, screens not. `npm run verify:schedule` exercises conflict detection against
the real database — 15 checks, 0 failures, with throwaway teachers, courses and sessions deleted afterwards:

| Check                            | Result                                                      |
| -------------------------------- | ----------------------------------------------------------- |
| Same room, overlapping           | Refused, error tagged to `room`                             |
| Same teacher, overlapping        | Refused, tagged to `teacherId`                              |
| Same course, overlapping         | Refused, tagged to `courseId`                               |
| All three clashing at once       | **Three errors returned together**, not the first one found |
| Back-to-back in one room         | Allowed — the overlap test is half-open                     |
| Another day / another semester   | Allowed                                                     |
| Editing a session in place       | Allowed — it does not clash with itself                     |
| Moving onto an occupied slot     | Refused                                                     |
| Course with classes, deactivated | Refused                                                     |

Lint, format and build are green; all three routes register. 62 keys shipped with Bangla alongside the
English — 322 in total, no fallbacks.

**Not verified: every screen.** The week grid, the conflict notice, the filters, the create page, the edit
dialog and the teacher view have not rendered once — they sit behind the admin and teacher guards, and the
assistant driving the browser does not sign in. The rule underneath them is proven; the wiring between it and
the buttons is covered by types and the build alone.

**Deviations from the plan, and why.**

- **A prerequisite step was split out first.** Every session needs a `courseId`, and nothing in the plan ever
  created a course — this step's own acceptance could not be run against an empty course list. See
  [step 7b](#step-7b).
- **The week view is day columns, not a day × time-slot grid.** A fixed hour scale spends most of its height
  on empty rows and is unreadable on a phone; each day lists its classes in order instead, which carries the
  same information and stacks cleanly below `lg`. A literal time grid is a real change, not a tweak.
- **`resolveDepartmentToday()` decides which column is today**, using `Intl.DateTimeFormat` in
  `Asia/Dhaka` on the server. Not `getDay()`: a Vercel instance runs UTC, so after 6pm in Dhaka the runtime
  clock still reports yesterday and would highlight the wrong column every evening. The class times need no
  such care — they are bare `HH:mm` and carry no zone at all.
- **The teacher page renders `ScheduleWeekView` directly**, not `ScheduleScreen`. With no filters, dialogs or
  state, the orchestrator would only hand it machinery it never uses. Its teacher id comes from the session
  rather than the URL, so one teacher cannot read another's week by editing a query string.
- **`lib/utils/schedule-labels.utils.ts` builds the label bundle once** for both screens, so a class card
  cannot drift between the administrator's view and the teacher's.
- **The create page and edit dialog share `session-fields.tsx`**, the same way the courses screen does.
- **Sessions are deleted, not deactivated.** Unlike an account, a slot that was never taught leaves nothing
  behind that needs a valid author.
- **`lib/schedule.utils.ts` landed at `lib/utils/schedule.utils.ts`**, following the `{domain}.utils.ts`
  convention the repo settled on after the plan was written.

---

<a id="step-9"></a>

### Step 9 — Teacher: materials ✅ Done

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

**Acceptance.** ✅ Verified in the browser by the developer — upload, download and delete all work from
`/teacher/materials`. The service beneath is covered by `npm run verify:materials`, 14 checks against the real
database with everything it creates deleted afterwards:

| Check                              | Result                                                     |
| ---------------------------------- | ---------------------------------------------------------- |
| Empty file, disallowed type, > cap | All three refused by the schema                            |
| HTML named `.pdf`, typed `pdf`     | **Refused on its opening bytes**                           |
| Upload → read back                 | 2048 bytes and the MIME type survive the GridFS round-trip |
| Upload to another teacher's course | Refused                                                    |
| Delete another teacher's file      | Refused                                                    |
| Download with no session           | Refused                                                    |
| Owner deletes                      | Succeeds, and the file is gone afterwards                  |

Lint, format and build are green. 41 keys shipped with Bangla alongside the English — 369 in total, no
fallbacks.

**Deviations from the plan, and why.**

- **Files live in GridFS, not `public/uploads/{courseCode}/`.** The planned path works on the PM2 box and
  fails silently on Vercel: the filesystem there is read-only apart from `/tmp`, which is wiped between
  invocations — the upload would succeed and the download 404 minutes later. GridFS needs no bucket, no
  credentials and no second service, and behaves the same on both deployments. It sits behind
  `lib/storage/`'s three-method interface, so the swap the plan anticipated is still one file.
- **Uploading is a route handler; deleting is a Server Action.** An action serializes its arguments, which is
  the wrong shape for 25 MB. `FormData` streams; an id does not need to.
- **Type validation reads the file's magic number**, which the plan did not call for. MIME type and extension
  are both client-supplied and trivially faked — the opening bytes are not. `text/plain` passes deliberately:
  it has no dependable signature, and the size cap and extension list already bound it.
- **Downloads are served `attachment` + `nosniff` + `sandbox`.** An uploaded file is attacker-controlled
  content served from the app's own origin; rendered inline, a crafted document would execute with access to
  the session cookie. The filename is escaped before it enters the header, since the uploader chose it.
- **`npm run verify:materials` was added**, alongside the user and schedule suites.

**Known limit, worth writing down:** files are type-checked, not scanned. A PDF carrying embedded JavaScript,
a macro document, or a zip bomb all pass every check here. The response headers mean such a file cannot
execute in this origin — which is the risk that mattered — but real content inspection needs a scanner, and
that is a service decision rather than a function. Logged in [Backlog](#backlog).

---

<a id="step-10"></a>

### Step 10 — Student dashboard ✅ Done

**Goal.** Everything a student needs on one screen, read-only.

**Deliverables.**

```
app/(dashboard)/student/schedule/page.tsx     the routine for their semester
app/(dashboard)/student/materials/page.tsx    grouped by course code
app/(dashboard)/student/teachers/page.tsx     directory
app/(dashboard)/student/page.tsx              today's classes, then the three screens
components/student/  student-routine · student-routine-card · student-material-list
                     teacher-directory · teacher-profile-card · student-empty
                     student.types.ts · index.ts
lib/services/student.service.ts
types/teacher-directory.dto.ts                the projection a student may read
components/admin/users/user-semester.field.tsx
```

**Notes.**

- Entirely server components — there is nothing here to mutate.
- The teacher directory shows only fields marked public on the profile.

**Acceptance.** ⚠️ Service proven, screens not. `npm run verify:student` runs 37 checks against the real
database, 0 failures, with throwaway teachers, students, courses, sessions and materials deleted afterwards:

| Check                                    | Result                                                            |
| ---------------------------------------- | ----------------------------------------------------------------- |
| Routine for semester 7                   | Only semester 7; another year is not visible                      |
| A cancelled class                        | **Still listed** — off for the week, not removed                  |
| Courses in the semester                  | Another semester and a deactivated course both excluded           |
| Materials in the semester                | Another semester's file excluded                                  |
| File on a deactivated course             | **Excluded** — the course list and the file list agree            |
| A semester with no courses               | Returns nothing, not every material in the database               |
| `storageKey` in a student-visible DTO    | Never present                                                     |
| Directory: pending / deactivated teacher | Both excluded; students excluded                                  |
| Directory entry                          | Carries email, designation, courses                               |
| Directory entry: `phone`, `isApproved`   | **Absent** — the decision lives in the mapper                     |
| Semester `''` / `'3'` / `'9'` / `'3.5'`  | Undefined / 3 / refused / refused                                 |
| Parsing a semester twice                 | **Idempotent** — the action can re-validate the form's own output |
| Semester submitted for a teacher         | Dropped                                                           |
| Student promoted to teacher              | **Semester cleared from the record**, not just from view          |
| Designation emptied on the form          | Cleared from the record                                           |

The three earlier suites still pass unchanged — users 12, schedule 14, materials 14. Lint, format and build
are green; all four student routes register. 32 keys shipped with Bangla alongside the English — 401 in
total, no fallbacks.

**Not verified: every screen.** The routine, the material list, the directory and the overview have not
rendered once — they sit behind the student guard, and the assistant driving the browser does not sign in.
The same limit as steps 7 and 8. **The Bangla column is machine-written and wants your eye**, particularly
`STUDENT_LINKS_TITLE` and `STUDENT_NO_SEMESTER_DESCRIPTION`.

**Deviations from the plan, and why.**

- **A `semester` was added to the user record**, which the plan never called for. It had to be: the step asks
  for "the routine for their semester" and nothing on a student said which one. It is optional 1–8, set by an
  administrator, and it ripples into the user schemas, `UserDto`, `UserService` and both admin account
  screens. The alternative — a semester picker on the student's own page — would have turned "their routine"
  into "a routine", and let the answer reset on every visit.
- **The semester field appears only when the role is `student`.** The first role-conditional field in the app:
  designation and student ID are shown to everyone. A designation on a student is merely unused, but a
  semester on a teacher is a claim about the model that is not true. `UserService.semesterFor()` drops it for
  the other two roles regardless, so the form agrees with the rule rather than enforcing it.
- **`UserService.update()` now writes `$set` and `$unset` rather than a plain object.** Mongoose drops
  `undefined` keys from an update instead of clearing the field — verified directly against the cluster: the
  old code left a designation and a semester on the record after the form emptied them. Promoting a student to
  a teacher would have kept their year, invisible on every screen and still in the database. **This was a
  pre-existing bug reaching back to step 7**; it is fixed here because a semester that survives a role change
  is this step's problem, and the fix is the same one line for every optional field.
- **No `codes-students.const.ts`.** The service raises no refusal of its own — every method is a read, and the
  only way one fails is the collection it reads failing, which the owning feature already has a code for. A
  sixth block would mean two codes for "listing materials failed".
- **`types/teacher-directory.dto.ts` is a second, narrower projection of the user record**, rather than
  passing `UserDto` to the directory. It carries name, email, designation and courses — no phone, no account
  state. Same defence `MaterialDto` uses to keep `storageKey` off the client: a column added to the user
  record later is invisible until somebody deliberately publishes it.
- **The semester is read from the database on every student page, never from the session token.** The token is
  self-contained and only refreshed at sign-in, so a semester inside it would keep showing last year's routine
  until the student signed out — the same staleness the backlog already records for deactivation.
- **`StudentService.resolveSemester()` throws where every other method returns a Result.** No semester set and
  a read that failed are both "no number", and folding them together would answer a database blip with "ask an
  administrator to set your semester" — sending a student off to chase their department over an outage. Null
  means the field is genuinely empty; a failure reaches the dashboard error boundary, which offers a retry.
- **`components/student/` has no `actions.ts`,** unlike every other feature folder. The absence is the
  guarantee: no `'use client'`, no `useTransition`, no toast, and `StudentMaterialList` has no action props
  that a later flag could switch on.
- **Dedicated read-only components rather than reusing `ScheduleWeekView` and `MaterialsList`.** Both take
  permission flags and callbacks; rendering them here would mean handing a server component functions that
  exist only never to be called. `groupSessionsByDay`, `resolveSemesterLabel`, `resolveDepartmentToday` and
  `formatFileSize` are shared as they stand.
- **Materials are scoped to the courses in the student's own semester,** not the whole department's
  repository. "Everything a student needs" is a handful of courses; four hundred files grouped by course code
  is a wall. Every course in the semester keeps its section even with nothing published, so the page answers
  "has anything been uploaded for CSE-401 yet".
- **The directory is not scoped to the student's semester.** A student asks about the teacher who runs a lab
  or will supervise a project next year — five names would make it useless for the question it exists for.
- **The student overview became a real screen** rather than staying "under construction" like the
  administrator's and teacher's. It shows today's classes and links to the three screens, which is the step's
  own goal sentence. Step 14 adds the notices feed on top.
- **The courses lookup on the routine page is unfiltered.** A class session carries its own semester, and
  nothing stops an administrator scheduling a course into a year other than the one the course is registered
  under; narrowing the lookup would leave those cards showing a raw id instead of a code.
- **`npm run verify:student` was added**, alongside the users, schedule and materials suites.

**One bug this step wrote and then caught.** `userFields.semester` was first written as `z.string()` with a
transform to a number — the only field in the app whose parsed output has a different type from its input.
That is fine once, and wrong twice: `zodResolver` transforms the value in the browser, and then the Server
Action re-validates whatever the form hands it, because an action is a public endpoint and cannot trust its
caller. The second parse received a number where a string was required and refused it, so **no student could
be given a semester at all** — and silently, because a native zod type error carries no encoded code and
surfaced as the generic message with no field highlighted. The build could not see it (`values: unknown`), and
the first version of the verify suite could not either, because it parsed once and asserted the output. The
field now accepts a number as well as a string, and the suite asserts the round trip.

**Known limit, worth writing down:** a student retaking a course from an earlier semester sees neither its
classes nor its files — both follow the single number on their account. Fixing it properly needs per-student
enrolment, which is a new collection rather than a new field. Logged in [Backlog](#backlog).

---

<a id="step-11"></a>

### Step 11 — Roles and access control ✅ Done

**Goal.** One permanent super administrator above a bounded set of administrators, and an account nobody can
turn on themselves.

**Why here, before notices.** This changes the role enum, and step 14 filters every notice by role. Written in
the other order, the audience rules would be built against a role set that is about to change and then
revisited. It also removes the sharpest edge in the app today: an administrator can currently deactivate
themselves, and the only thing standing between the department and a locked-out installation is the
`LAST_ADMIN_CANNOT_BE_REMOVED` guard.

**Deliverables.**

```
constants/roles.const.ts                     SUPER_ADMIN added to USER_ROLES and the labels
types/user-role.ts · types/user-filters.ts   the widened union
models/user.model.ts                         partial unique index pinning super-admin to one row
lib/auth/guards.ts                           requireAdminArea() — admits admin and super administrator
lib/services/user.service.ts                 the ceiling, the self-action guard, the immutable account
constants/codes-users.const.ts               31001 ceiling · 31003 super administrator
                                             51004 an admin account is the super administrator's
                                             31002 nobody acts on their own access
lib/utils/role.utils.ts                      the fourth literal l10n branch
scripts/seed-super-admin.ts                  the one account no screen can create
scripts/seed-admin.ts                        retired — the super administrator creates the first admin
```

**Notes.**

- **The super administrator is enforced by the database, not only by the service.** A partial unique index —
  `{ role: 1 }` unique, `partialFilterExpression: { role: 'super-admin' }` — makes a second one impossible
  even from a script or a shell. A service check alone is a rule the next caller can forget.
- **It cannot be created, edited, demoted, deactivated, revoked or deleted by anyone, including itself.**
  Every mutating path in `UserService` refuses when the target carries that role, and the role select on the
  create and edit screens never offers it. Seeded once by `npm run seed:super-admin`.
- **The ceiling is three _active_ administrators, and the super administrator is not one of them** — settled:
  three plus one, four accounts with administrative reach in total. The count is over the `admin` role only,
  so the super administrator can always create a third administrator no matter how the arithmetic is read.
  Checked on create and on promotion. A deactivated administrator frees its seat — the alternative is a
  department that cannot replace someone who left, because accounts are deactivated rather than deleted and
  the seat would never come back.
- **An administrator account is the super administrator's alone.** Stated as one rule rather than a list of
  verbs — _every_ operation that puts an account into the `admin` role, takes it out, or changes its access
  belongs to the super administrator: create, promote, demote, approve, revoke, activate, deactivate. An
  administrator may create, edit and approve **teacher and student accounts only**.
- **That rule is enforced in the service, not in the role select.** The forms offer an administrator only
  teacher and student, and offer the super administrator administrator as well — but the form is the
  convenience. `UserService` refuses an `admin` operation from a requester who is not the super administrator,
  so a hand-built action call is refused too.
- **It also closes the self-deactivation hole from the other side.** An administrator's own account is an
  administrator account, so the rule above already forbids them switching themselves off. The explicit
  "nobody acts on their own access" guard stays anyway: it is the rule that keeps holding when the role rules
  next change, and it costs one comparison. It needs the signed-in user threaded into `setActive`,
  `setApproval` and `update`, which take only their input today.
- **`LAST_ADMIN_CANNOT_BE_REMOVED` can be retired.** It exists to prevent a department locking itself out of
  the admin area. With a permanent super administrator who owns the entire administrator lifecycle, and with
  administrators unable to deactivate each other or themselves, the guard has no reachable path left. Retire
  it rather than leave a rule nothing can trigger.
- **`scripts/seed-admin.ts` is retired with it.** The seeded account becomes the super administrator, and the
  first administrator is created through the UI — one fewer script, and one fewer way to mint an account
  outside the rules. An existing installation keeps the administrators it already has; the super administrator
  is seeded alongside them, and the ceiling is measured against what is there.

**Acceptance.**

| Check                                                 | Expected                                     |
| ----------------------------------------------------- | -------------------------------------------- |
| Administrator creates an administrator                | Refused — the super administrator's alone    |
| Administrator promotes a teacher to administrator     | Refused — the same rule, a different verb    |
| Administrator edits or deactivates another admin      | Refused                                      |
| Administrator deactivates or revokes themselves       | Refused, naming the reason                   |
| Administrator creates a teacher or a student          | Allowed, unchanged                           |
| Super administrator creates a fourth active admin     | Refused, and the ceiling is named            |
| Deactivating one, then creating another               | Allowed — the seat came back                 |
| Any edit, demotion or deactivation of the super admin | Refused, from every role including itself    |
| A second super administrator, inserted directly       | **Rejected by the unique index**             |
| An `admin` operation from a hand-built action call    | Refused by the service, not only by the form |

**Result.** ⚠️ Rules proven, screens not. `npm run verify:users` was rewritten around them — 28 checks against
the real database, 0 failures, every row it writes prefixed `user-verify` and deleted afterwards:

| Check                                               | Result                                        |
| --------------------------------------------------- | --------------------------------------------- |
| Administrator creates a teacher, edits, deactivates | Allowed, unchanged                            |
| Administrator creates an administrator              | Refused                                       |
| Administrator promotes a teacher into the role      | Refused, **and the teacher was not promoted** |
| Administrator edits or deactivates another admin    | Both refused                                  |
| Super administrator fills the remaining seats       | Allowed up to three active                    |
| A fourth active administrator                       | Refused, tagged to `role`                     |
| Deactivate one, create another                      | Allowed — the seat came back                  |
| Reactivate the deactivated one afterwards           | **Refused** — that would be a fourth          |
| Deactivate / revoke / demote yourself               | All three refused                             |
| Rename yourself                                     | Refused — see the note below                  |
| Create a super administrator, or promote into it    | Refused, from every role                      |
| Edit, demote or deactivate the super administrator  | Refused, and the row is genuinely untouched   |
| A second super administrator written directly       | **Refused by the unique index**               |

The other three suites still pass unchanged — student 37, schedule 14, materials 14. Lint, format and build
green. 6 keys shipped with Bangla alongside the English, 1 retired — 406 in total, no fallbacks.

**Not verified: every screen.** The role select, the hidden action buttons and the refusal messages have not
rendered — they sit behind the admin guard, and the assistant driving the browser does not sign in. **The
Bangla is machine-written and wants your eye.**

**Deviations from the plan, and why.**

- **`ADMIN_AREA_ROLES` and `ADMIN_LIMIT` live in `constants/roles.const.ts`**, not spread through the service.
  The guard, the action gate and the ceiling all read the same two constants, so "who may be here" and "how
  many" have one home rather than three.
- **One gate rather than a rule per verb.** `refuseDisallowedRoleChange(target, nextRole, requester)` answers
  create, edit, promote, demote, approve, revoke, activate and deactivate. A create passes `null` for the
  target; a state change passes the target's own role on both sides, because nothing is moving. Eight verbs
  cannot disagree with each other if they ask one question.
- **The self-rule is split in two, and had to be.** `refuseDisallowedRoleChange` refuses a self _role_ change
  only; approval and activation carry no role to compare, so their unconditional self-check sits in
  `applyStateChange` instead.
- **Its rename carve-out is unreachable, and the first version of the suite hid that.** The rule permits
  renaming yourself — it is about role and access, not every field — but nobody who can reach this screen can
  use it: an administrator's own row _is_ an administrator row, so "administrators are the super
  administrator's alone" answers first, and the super administrator's row is immutable. The suite originally
  asserted the rename succeeded, and passed only because it used a requester that cannot exist — a session
  claiming `admin` carrying a teacher's id. It now asserts the refusal that really happens. The carve-out
  stays because it is the correct rule and becomes reachable the moment anything else calls `update()`;
  [step 13](#step-13)'s `/profile` is where an account edits itself.
- **Reactivating counts against the ceiling.** Not in the plan, and necessary: three active administrators is
  the rule, and switching a fourth back on is still a fourth. Without it the limit was one `setActive` away
  from being decorative.
- **The action gate moved into `lib/auth/admin-area.gate.ts`, and that was a bug fix, not tidying.** Three
  action files each carried their own `refuseNonAdministrator()` testing `role === 'admin'`. Widening the
  pages to `requireAdminArea()` while updating only one of the three left the super administrator able to
  open the course and schedule screens with every write refused — a screen the account is authorized to see
  and cannot use. Caught by review, reproduced by minting a real session token and calling the actions. Three
  copies of an authorization rule is three chances to update two.
- **The action gate returns the caller instead of merely approving them.** `gateAdminArea<T>()` is a
  discriminated union — `{ allowed: true, requester }` or `{ allowed: false, refusal }` — so an action that
  forgets to check cannot reach the requester; the type will not let it. The gate answers "may you be in this
  area", and `UserService` answers "may you do this to that account".
- **The screens got a `viewer`, not a pile of booleans.** `{ userId, isSuperAdmin }` decides which roles a
  select lists and which buttons a row carries. It is a courtesy, not a control — the service refuses the same
  operations whatever the browser sends, so a button in the wrong place would be a cosmetic bug rather than a
  hole. The edit dialog still lists `admin` when the row already holds it, so the select can show what the
  account _is_ even to a viewer who could not set it.
- **`LAST_ADMIN_CANNOT_BE_REMOVED` is gone, and its code number is left unused.** A stale code in an old log
  should decode to nothing rather than to somebody else's message, so 31000 was retired rather than recycled.
- **`scripts/seed-admin.ts` is deleted, replaced by `seed-super-admin.ts`.** The new script refuses politely
  when a super administrator already exists, and the partial unique index refuses regardless — two people
  running it at once would both pass a check but only one would pass the index.
- **`npm run verify:users` mints a throwaway super administrator when the database has none.** The
  immutability and unique-index checks are the point of this step; skipping them on a fresh database was the
  worse trade. It is deleted with everything else.

**Known limit: the ceiling is a check, not a constraint.** `isAdminCeilingReached()` counts, and the write is
a separate round trip, so two overlapping requests can both see two seats and both take one. The single super
administrator got a partial unique index precisely because a service check is forgettable — and an index
cannot express "at most three", so the ceiling did not get the same backing. In practice the only actor is
one super administrator working a form, so the race needs two browser tabs and precise timing, and its worst
outcome is a fourth administrator who can be deactivated. Closing it properly needs a transaction or a
counter document. Logged in [Backlog](#backlog).

**Known limit, and it is the sharp one.** Deactivating an administrator does not end their current session —
the token is self-contained and only re-read at sign-in, so a switched-off administrator keeps working until
it expires. That was a footnote while it only affected teachers and students. It is now the point of the
feature: the super administrator's job is to stop an administrator, and today that stop is delayed. Already in
[Backlog](#backlog) as a token version on the user record; [step 12](#step-12) is the natural place to bring
it forward, since it is already rewriting how sign-in resolves an account.

---

<a id="step-12"></a>

### Step 12 — Accounts: identity, registration and email verification ✅ Done

**Goal.** People create their own accounts, prove the address they own, and are then issued the identifier they
sign in with — delivered to the address they just proved.

**This is the largest step in the plan**, and it is one step because its three halves cannot be separated: the
new identity fields decide what registration collects, registration is what needs an address verified, and
verification is what issues the identifier. Splitting it would ship a login that nobody has credentials for.

**The identity model, which is the part that changes everything.**

| Role                | Signs in with            | Issued                         | Delivered by              |
| ------------------- | ------------------------ | ------------------------------ | ------------------------- |
| Student             | **Generated student ID** | When email verification passes | Email                     |
| Teacher             | **Generated staff ID**   | When email verification passes | Email                     |
| Admin / super admin | **Email**                | On creation                    | The person who created it |

Email stops being the way in and becomes the way _back_ in: the channel the identifier arrives on, the thing
verification proves you own, and the route to a forgotten password.

**Recommendation: one field, not two.** "Student ID" and "Teacher ID" are what they are called on screen, but
storing them as two columns buys nothing and costs a second unique index, a second generator and a branch at
every lookup. One `loginId`, unique across every account, with the role written into its prefix — `S-2026-0042`,
`T-2026-0007` — gives one index, one generator and one resolution path, while the UI still labels it "Student
ID" or "Teacher ID" per role. The rest of this step assumes that; say so if you want them separate.

**Deliverables.**

```
models/user.model.ts        roll · registrationNo · session · department · loginId
                            emailVerified · emailVerificationToken · emailVerificationExpiresAt
                            unique index on loginId · unique index on roll among students
types/user.dto.ts           the widened DTO, still naming every field explicitly
lib/schemas/registration-student.schema.ts · registration-teacher.schema.ts
lib/schemas/sign-in.schema.ts                 identifier, not email
lib/services/auth.service.ts                  resolveByIdentifier() · register() · verifyEmail()
lib/utils/login-id.utils.ts                   generates the prefixed, sequential identifier
lib/mail/                                     transport behind a small interface, like lib/storage/
                                              two templates: verify-address · your-login-id
                                              plus a development driver that writes both to the log
env/server.ts                                 the mail provider's credentials become required
app/[locale]/(auth)/register/page.tsx         a role chooser, then the matching form
app/[locale]/(auth)/register/student · teacher
app/[locale]/(auth)/registration-received/page.tsx   "check your inbox" — no identifier yet
app/[locale]/(auth)/verify-email/page.tsx     issues the identifier, shows it, and emails it
components/auth/  register-student.form · register-teacher.form · login-id-notice · actions.ts
constants/codes-users.const.ts                the new refusals
scripts/verify-accounts.ts                    the suite for all of it
```

**What registration collects.**

- **Student** — name, email, roll, registration number, session, semester, department, password.
- **Teacher** — name, email, department, password.

Neither of them chooses an identifier. Both are issued one.

**Notes.**

- **The identifier is issued when verification passes, not when the form is submitted.** It arrives by email,
  in the same message that confirms the address — which is the only place it can safely be delivered, since
  the address is the one thing about the applicant that has just been proven. Generating it at verification
  also means an application that is never confirmed never burns an identifier.
- **It is generated on the server, and only _displayed_ by the front end.** Worth being explicit, because
  "generated in the front end" is how it was described: an identifier minted in the browser is
  attacker-controlled — the applicant could submit one that already exists — and uniqueness cannot be checked
  from there anyway. The server generates it inside the same operation that flips `emailVerified`, so the
  uniqueness check and the write cannot race. The landing page then shows it large with a copy button, and the
  email carries the durable copy for the day they close that tab.
- **Prefix by role**: `S-2026-0042`, `T-2026-0007`. One sign-in field serving both means they share a
  namespace, and the prefix makes a collision impossible rather than unlikely. It also makes a mistyped ID
  fail fast rather than resolve to a stranger.
- **The roll number is data, not a login.** Collected at registration and unique among students, because the
  department identifies people by it — but the student signs in with the issued ID. That keeps the login
  identifier something the application controls, rather than something an applicant types.
- **One sign-in field, labelled for all three roles.** `resolveByIdentifier()` tries the login ID, then
  email. The alternative — a role picker beside the password — asks the visitor to classify themselves before
  the app has any reason to care.
- **Two gates, and they must say different things.** An account is usable only when `emailVerified` **and**
  `isApproved`. "Check your inbox" and "waiting for the department to approve you" are different problems with
  different remedies, so they get different messages. The existing `ACCOUNT_NOT_APPROVED` refusal is joined by
  an `EMAIL_NOT_VERIFIED` one.
- **Verification comes before approval, and that ordering is deliberate.** An administrator should not spend
  attention on an application whose address has not been proven; unverified registrations stay out of the
  pending queue until the link is clicked.
- **The verification token is a hashed, expiring, single-use secret.** Stored as a hash, not the value, for
  the same reason a password is — a leaked database read should not hand out account takeovers. It expires,
  and it is cleared on use.
- **`studentId` is renamed to `roll`.** The existing field is free text set by an administrator, and the name
  is now actively misleading: a student's "student ID" is the identifier the application issues them. Two
  fields called almost the same thing, with only one of them load-bearing, is how the wrong one gets read.
  Existing rows need the rename applied.
- **The two emails are the whole delivery mechanism, so they need to say the right thing.** The first carries
  the confirmation link and nothing else. The second carries the identifier, states plainly that it — not the
  email address — is what they sign in with, and warns that the department still has to approve the account
  before it will let them in. Without that last line the identifier arrives and the first sign-in is refused,
  which reads as the ID being wrong.
- **`department` is a text field, not an entity.** The proposal is explicit that this is one department, and
  nothing scopes data by it — see [Backlog](#backlog). It is collected because the form should ask, and it
  will be the seam if multi-department ever lands.
- **The semester is now chosen by the applicant**, reversing the assumption written into the previous draft of
  this step. It is unverified until an administrator approves, and the approval screen is where they correct
  it — which is the same moment they are already checking who the person is.
- **Registration is the first unauthenticated write in the application.** The role is fixed by which form was
  posted and is never read from the request body, so there is no `role` field for a hand-built request to set
  to `admin`. Rate limiting is step 15's; an open sign-up endpoint with no throttle is a real gap until then,
  and worth pulling forward if it is quick.
- **Either an administrator or the super administrator approves**, for teachers and students. Funnelling every
  new account through one super administrator would make them the bottleneck the three administrators exist to
  avoid.
- **The landing page needs a way in.** The marketing header offers only sign-in today, and the three role
  cards describe roles nobody can take.

**New external dependency, and it is a real one.** Email verification needs a provider. The project has none —
it is why password reset sits in [Backlog](#backlog). This step has to choose one (SMTP through nodemailer, or
an HTTP API such as Resend), add its credentials to `env/server.ts`, and put it behind a small interface the
way `lib/storage/` is, with a development driver that writes the verification link to the log so the flow can
be walked without sending anything.

**Acceptance.**

| Check                                               | Expected                                                              |
| --------------------------------------------------- | --------------------------------------------------------------------- |
| Registers, then signs in before verifying           | Refused — "check your inbox", not "wrong password"                    |
| An account that has registered but not verified     | **Holds no identifier at all** — none was issued                      |
| Verification link clicked                           | Identifier issued, shown on the page, and emailed                     |
| The verification email                              | Names the identifier as the login, and says approval is still pending |
| Verifies, signs in before approval                  | Refused — and it says approval, not verification                      |
| Approved, signs in with the issued ID + password    | Reaches their area                                                    |
| Signs in with email + password as a student         | Refused — the issued ID is the identifier                             |
| Two people verify at the same moment                | Two different identifiers — the check cannot race                     |
| A student ID and a staff ID colliding               | Impossible by construction — the prefix separates them                |
| Duplicate roll, duplicate email                     | Refused by a unique index, not only by a service check                |
| A verification link used twice, or after it expires | Refused, and no second identifier is issued                           |
| A `role` field posted to the registration action    | Ignored — the form decides the role, not the body                     |
| An unverified registration                          | Absent from the administrator's pending queue                         |

**Result.** ⚠️ Rules proven, screens not. `npm run verify:accounts` runs 42 checks against the real database,
0 failures, every row it writes prefixed `account-verify` and deleted afterwards. It covers registration,
what registration refuses, both verification failures, the identifier being issued, and sign-in through every
gate. The four earlier suites still pass unchanged — users 28, student 37, schedule 14, materials 14. Lint,
format and build are green; all six new routes register. 54 keys shipped with Bangla alongside the English —
460 in total, no fallbacks.

**Verified in the browser — the first step where that was possible.** These routes need no session, so
unlike the admin and student screens they could actually be driven: `/register` renders its chooser, the
student form renders all nine fields and all eight semesters, submitting it created an account and landed on
"check your inbox", the verification link confirmed the address and issued `S-2026-0001`, and signing in with
that ID was refused with "waiting for administrator approval". No console errors on any of them. The
throwaway account was deleted afterwards.

Driving it also caught two lines of copy that registration had made false — the sign-in page still said
"there is no public sign-up", directly above the Register link this step added.

**The Bangla is machine-written and wants your eye.**

**Deviations from the plan, and why.**

- **SMTP through nodemailer, not an HTTP API.** It works with an ordinary mail account and an app password,
  with no sending domain to verify, which is the difference between a working deploy today and one waiting on
  DNS. Swapping to Resend is a new file and one line in `lib/mail/index.ts`.
- **nodemailer is pinned to 9.0.4.** `npm install nodemailer` resolves to 7.x, which carries a high-severity
  SMTP command-injection advisory; `npm audit` now reports zero vulnerabilities.
- **The mail transport is optional, and that is a feature.** With no `SMTP_HOST`, every message goes to the
  log instead — so a clean clone can register, confirm and be issued an identifier with no credentials at
  all. A deploy that forgets them gets a warning per unsent message rather than a failed build, because
  making it fatal would mean no local development without a mail server.
- **The email address stops signing a student in, and that needed its own refusal.** The first version merely
  preferred the identifier — an account that held one could still sign in by email, which would have made the
  identifier decorative and contradicted the message delivering it. Now an account holding an identifier is
  refused by email with code 51006, telling them what to use instead. Refused _after_ the password check, so
  the answer only ever reaches somebody who already proved the account is theirs.
- **An administrator creating an account issues an identifier too, and marks it verified.** Not in the plan,
  and necessary: an unverified account cannot sign in, and the pending queue hides unverified rows, so the
  first version would have created teachers nobody could use and nobody would see waiting. The administrator
  vouching for the person is the verification. One shared `issueLoginId()` serves both paths.
- **The pending queue hides unverified registrations**, so an administrator does not spend attention on
  somebody who may never confirm. They remain visible under all.
- **`studentId` was renamed to `roll` across fifteen files.** With a real issued student ID now existing,
  two fields called almost the same thing is how the wrong one gets read.

**A migration was needed, and finding that out was the closest thing to a near miss in this step.**
`emailVerified` became a sign-in gate, and a Mongoose `default` only applies to rows it creates — so every
account written before step 12 had no such field, an absent field is falsy, and **every existing account was
locked out, the administrator included.** A deploy without the migration would have locked the department out
of its own installation. Two more silent breaks came with it: students and teachers predating the change hold
no `loginId` and nothing else would ever give them one, and rows still carrying `studentId` were invisible to
every screen now reading `roll`.

`npm run migrate:accounts` fixes all three and is idempotent. Run against the real database it marked three
accounts verified and issued `T-2026-0001` and `S-2026-0001`; a second run reported nothing to do. **Anyone
issued an identifier by it has to be told what it is** — they sign in with that, not their email.

**What the department still has to supply.**

1. **Mail credentials.** The code and the interface are done; what is missing is a host, a user and a
   password in `.env.local`. `.env.example` names three free options that need no paid plan and no domain of
   your own — a Gmail app password is the shortest path. Until they are set, every message goes to the
   server log, which is enough to walk the whole flow locally.
2. **A read of the Bangla.** 76 keys were added across this step, all machine-written.

**Deliberately left as they are.**

- **A roll number, a registration number and a session are bounded, not patterned.** Departments write them
  differently, and a format nobody agreed on would reject legitimate applicants at the one moment they
  cannot ask anybody for help. An administrator corrects them at approval — which is now possible, because
  the edit dialog carries all three.
- **Registration itself has no rate limit.** The resend does, at the database rather than in memory, so it
  behaves the same on one server or ten. Throttling the registration endpoint belongs with the rest of the
  hardening in [step 15](#step-15); email uniqueness already bounds what repeating it achieves.
- **Address is collected by nothing yet.** The field exists on the model for [step 13](#step-13), which owns
  the profile a person edits themselves.

---

<a id="step-13"></a>

### Step 13 — Profiles

**Goal.** An account somebody owns, with the fields that are actually theirs to correct.

**Deliverables.**

```
app/[locale]/(dashboard)/profile/page.tsx    one route, role-aware content
components/profile/  profile-summary · profile-edit.form · actions.ts · profile.types.ts · index.ts
lib/schemas/profile-update.schema.ts
lib/services/user.service.ts                 updateOwnProfile()
constants/routes.const.ts                    PROFILE, and /profile added to PROTECTED_SEGMENTS
```

**Notes.**

- **Editable: name, email, address, phone.** Nothing else. The login ID, roll, registration number, session,
  semester, department, role and approval are issued by the application or set by the department — a profile
  that could change them would be a privilege escalation with a friendly form around it.
- **The login ID belongs on this page, prominently.** It arrives once by email and is the only thing that
  opens the account; the profile is where somebody goes when they cannot find that message. Read-only, with a
  copy button.
- **Changing an email re-opens verification, and must.** The address is the password-recovery channel, so an
  unverified change is an account takeover waiting for a stolen session: change the email, request a reset,
  own the account. The new address is stored as pending, the verification mail goes to it, and the old address
  stays the recovery channel until the new one is proven.
- **One `/profile` route rather than one per role.** A student's profile and a teacher's differ by which
  read-only fields they show; two screens would be two copies of the same form drifting apart. `/profile` has
  to be added to `PROTECTED_SEGMENTS` — it sits outside `/admin`, `/teacher` and `/student`, so the guard does
  not cover it by accident.
- **Read-only, and worth showing:** the identifier they sign in with, their department and session, their
  semester, the courses a teacher is assigned, and whether the account is approved.

**Acceptance.** A student corrects their address and phone; a teacher sees their login ID and assigned
courses; an email change sends a fresh verification and does not take effect until the link is clicked; a
profile update naming `role`, `roll` or `isApproved` changes nothing, because those fields are not in the
schema.

**Follow-on, now cheap.** Password reset by email has been in [Backlog](#backlog) only because there was no
mail transport. Once step 12 builds one, reset is a token, two screens and a service method — worth its own
small step rather than folding it into this one.

---

<a id="step-14"></a>

### Step 14 — Notices & announcements

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

<a id="step-15"></a>

### Step 15 — Polish & hardening

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

<a id="step-16"></a>

### Step 16 — Testing & deployment

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

| Item                                    | Why it is parked                                                                                                                                                                                                    |
| --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Per-user unread state for notices       | Needs read receipts — a schema change with no feature ask yet                                                                                                                                                       |
| Per-student enrolment                   | A student carries one semester, so a retaken course from an earlier year shows neither its classes nor its files. Real enrolment is a new collection, not a new field                                               |
| Sign-in drops the `next` param          | `proxy.ts` builds `/sign-in?next=<path>`, but the form always lands on `ROLE_HOME[role]` and nothing reads it back. From step 5, and it costs every deep link into a guarded route, not just the student ones       |
| Nav highlight on `/admin/users/new`     | The Users link tests `pathname ===` where Courses tests `startsWith`, so the create page highlights nothing. From step 7, cosmetic, and step 15's polish pass owns it                                               |
| `<dl>` without `<dt>` on schedule cards | `schedule-grid-cell.tsx` has the same unlabelled `<dd>` pair step 10 fixed on its own card. Step 15's accessibility pass owns the sweep                                                                             |
| Password reset by email                 | Unblocked by [step 12](#step-12), which builds the mail transport it was waiting for. A token, two screens and a service method — its own small step once accounts land                                             |
| Administrator ceiling is check-then-act | `isAdminCeilingReached()` counts and the write is a separate round trip, so two concurrent requests can both take the last seat. Needs a transaction or a counter document; an index cannot express "at most three" |
| Attendance tracking                     | Not in the proposal scope                                                                                                                                                                                           |
| Multi-department support                | Proposal is explicit: one department first. [Step 12](#step-12) collects a department as free text on the account, which is the seam if this ever lands — nothing scopes data by it                                 |
| Revoking a live session                 | The JWT is self-contained — deleting or deactivating a user does not end their current session, only their next sign-in. Needs a token version on the user record, or a revocation list                             |
| Bangla OpenGraph card                   | `next/og` needs a bundled Noto Sans Bengali subset (~300KB)                                                                                                                                                         |
| Storybook for the UI package            | Worth it if the component count grows past ~25                                                                                                                                                                      |
| E2E tests (Playwright)                  | Smoke tests first; full E2E once the flows settle                                                                                                                                                                   |
