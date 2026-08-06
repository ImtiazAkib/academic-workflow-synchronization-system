# Implementation Plan

The build is split into **14 steps**. Each one is self-contained, ends with a green build, and leaves the app
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

**Acceptance.** ⚠️ Neither the screen nor the service is independently verified on this branch. `CourseService`
was exercised against the real database while the scheduling data layer was being built — creating courses and
refusing to deactivate one that still has classes — but those checks live with step 8 and left with it when the
branches were split. Lint, format and build are green, and both routes register:

```
├ ƒ /[locale]/admin/courses
├ ƒ /[locale]/admin/courses/new
```

Bangla shipped with the English this round rather than being backfilled — 59 keys, 260 in total, and the
generator reports no fallbacks.

**Not verified: the screen itself.** The filter round-trip, the edit dialog, the toasts and the duplicate-code
message have not rendered once — the page is behind the admin guard and the assistant driving the browser does
not sign in. `CourseService.update` and its duplicate-code check are covered by types and the build alone.
A `verify:courses` script alongside `verify:users` would close this; it has not been written.

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
- **The timetable reads in Bangladesh time.** `startTime` / `endTime` are stored as bare `HH:mm` strings, not
  `Date`s, so they carry no zone at all — 09:30 is 09:30 wherever the server runs, and rendering them needs no
  conversion. The zone matters for everything _derived_: which column is "today", whether a class is on now,
  and any `createdAt` shown. Those must be computed in `DEFAULT_TIMEZONE` (`Asia/Dhaka`, already wired into
  `l10n/request.config.ts`) rather than from the server's clock or the browser's — a Vercel instance runs UTC,
  so `new Date().getDay()` would highlight the wrong day for six hours of every Bangladeshi evening.

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

| Item                              | Why it is parked                                                                                                                                                                        |
| --------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Per-user unread state for notices | Needs read receipts — a schema change with no feature ask yet                                                                                                                           |
| Password reset by email           | Requires SMTP credentials the project does not have                                                                                                                                     |
| Attendance tracking               | Not in the proposal scope                                                                                                                                                               |
| Multi-department support          | Proposal is explicit: one department first                                                                                                                                              |
| Revoking a live session           | The JWT is self-contained — deleting or deactivating a user does not end their current session, only their next sign-in. Needs a token version on the user record, or a revocation list |
| Bangla OpenGraph card             | `next/og` needs a bundled Noto Sans Bengali subset (~300KB)                                                                                                                             |
| Storybook for the UI package      | Worth it if the component count grows past ~25                                                                                                                                          |
| E2E tests (Playwright)            | Smoke tests first; full E2E once the flows settle                                                                                                                                       |
