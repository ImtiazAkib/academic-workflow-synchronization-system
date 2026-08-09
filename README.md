# Academic Workflow Synchronization System

A departmental ERP for academic work — class scheduling, course materials, notices and user management in one
platform, with role-based dashboards for **administrators**, **teachers** and **students**.

Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS v4 · MongoDB

> **Current state: steps 0–14 of 17 complete.** Toolchain, design system, validated environment, result/error
> layer, English/Bangla localization, the SEO surface, the data model, credential sign-in, the role-scoped
> dashboard shell, user and course management, the conflict-checked timetable, the course-materials
> repository, the read-only student dashboard, the super administrator, self-registration with email
> verification, the profile somebody edits themselves and audience-targeted notices are in place. Polish and
> hardening are next — see [docs/IMPLEMENTATION-PLAN.md](docs/IMPLEMENTATION-PLAN.md).

---

## Contents

1. [Overview](#overview)
2. [Roles](#roles)
3. [Tech stack](#tech-stack)
4. [Getting started](#getting-started)
5. [Environment](#environment)
6. [Scripts](#scripts)
7. [Project structure](#project-structure)
8. [Conventions](#conventions)
9. [Design system](#design-system)
10. [Internationalization](#internationalization)
11. [SEO and structured data](#seo-and-structured-data)
12. [Data layer](#data-layer)
13. [Authentication](#authentication)
14. [Roadmap](#roadmap)
15. [Toolchain notes](#toolchain-notes)
16. [Deployment](#deployment)

---

## Overview

Departmental coordination is usually spread across tools that were never meant to carry it. Schedules live in
spreadsheets, course materials arrive by email and flash drive, and notices reach whoever happens to see them.
Three problems follow: information nobody can find in one place, room and time conflicts that surface too
late, and generic tools that fit no role properly.

This system replaces all three with one platform, scoped deliberately to **a single department** so the
functionality stays focused before any thought of scaling.

| Objective             | How it is met                                                    |
| --------------------- | ---------------------------------------------------------------- |
| **Centralization**    | Scheduling, notices and materials under one roof                 |
| **Role-based access** | Every route and action gated by role — admin, teacher, student   |
| **Efficiency**        | Routines render automatically; materials update instantly        |
| **User experience**   | Server-rendered, responsive dashboards on a single design system |

## Roles

| Capability                         | Admin | Teacher | Student |
| ---------------------------------- | :---: | :-----: | :-----: |
| Create and approve accounts        |  ✅   |    —    |    —    |
| Set class times, rooms, teachers   |  ✅   |    —    |    —    |
| Publish department announcements   |  ✅   |    —    |    —    |
| View own class schedule            |  ✅   |   ✅    |   ✅    |
| Upload and delete course materials |  ✅   |   ✅    |    —    |
| Download course materials          |  ✅   |   ✅    |   ✅    |
| View teacher profiles              |  ✅   |   ✅    |   ✅    |

## Tech stack

| Layer      | Choice                           | Why                                                              |
| ---------- | -------------------------------- | ---------------------------------------------------------------- |
| Framework  | Next.js 16 (App Router)          | Server rendering and the API layer in one codebase               |
| UI         | React 19 + Tailwind CSS v4       | Design tokens, responsive by default                             |
| Primitives | shadcn (`base-nova`) on Base UI  | Accessible components that match the token system                |
| Language   | TypeScript (strict)              | No `any`, no unchecked casts                                     |
| Database   | MongoDB + Mongoose               | Document-shaped data: profiles, courses, nested structures       |
| Auth       | `jose` session JWT (from step 5) | Signed httpOnly cookie carrying the role — no library in between |
| i18n       | next-intl (from step 2)          | English and Bangla, `l10n('KEY')` from a CSV-driven dictionary   |

## Getting started

**Prerequisites:** Node.js 20+, npm, and a MongoDB you can reach — a local `mongod` or a free Atlas cluster.
The build validates `MONGODB_URI` before it starts, so set up [the environment](#environment) first.

```bash
npm install
```

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment

```bash
cp .env.example .env.local
```

| Variable         | Required                  | Notes                                                                 |
| ---------------- | ------------------------- | --------------------------------------------------------------------- |
| `LOG_LEVEL`      | No, defaults `info`       | `fatal` · `error` · `warn` · `info` · `debug` · `trace`               |
| `APP_BASE_URL`   | No, defaults to localhost | Absolute origin — canonical, `hreflang`, sitemap and OG URLs use it   |
| `ROBOTS_ENABLED` | No, defaults `false`      | Set `true` on production only; anything else stays out of the index   |
| `MONGODB_URI`    | **Yes**                   | Local or Atlas. The database name is set in code, not read from this  |
| `AUTH_SECRET`    | **Yes**                   | At least 32 random characters — see [Authentication](#authentication) |

Every variable is declared in [env/server.ts](env/server.ts) and validated with zod. That module is imported
by [next.config.ts](next.config.ts), so an invalid value **fails the build** rather than surfacing on some
request later:

```
❌ Invalid environment variables: [ { path: [ 'APP_BASE_URL' ], message: 'Invalid URL' } ]
```

Read variables through `env`, never `process.env` — that is what keeps the validation honest.

```ts
import { env } from '@/env/server';
```

`MONGODB_URI` and `AUTH_SECRET` must both be supplied; the rest have safe defaults.

## Scripts

| Script                     | Description                                                        |
| -------------------------- | ------------------------------------------------------------------ |
| `npm run dev`              | Start the dev server                                               |
| `npm run build`            | Production build (`output: 'standalone'`)                          |
| `npm run start`            | Serve the production build                                         |
| `npm run lint`             | ESLint — import order, cspell, canonical classes, Prettier         |
| `npm run lint:fix`         | ESLint with `--fix`                                                |
| `npm run format`           | Prettier check                                                     |
| `npm run format:write`     | Prettier write                                                     |
| `npm run i18n:generate`    | Regenerate the locale dictionaries from `l10n/l10n.csv`            |
| `npm run seed:super-admin` | Create the super administrator (see below)                         |
| `npm run migrate:accounts` | Backfill accounts created before step 12 with the identity fields  |
| `npm run verify:users`     | Exercise UserService against the database, then clean up           |
| `npm run verify:schedule`  | Exercise conflict detection the same way                           |
| `npm run verify:materials` | Exercise upload, download, delete and the access rules             |
| `npm run verify:student`   | Exercise semester scoping and what the directory publishes         |
| `npm run verify:accounts`  | Exercise registration, verification and sign-in by identifier      |
| `npm run verify:profile`   | Exercise self-editing and the address change that waits for a link |
| `npm run verify:notices`   | Exercise audience targeting — what each role is and is not sent    |

## Project structure

```
app/
  [locale]/       layout.tsx — the document and locale, no page chrome
    (marketing)/  Landing page, catch-all, 404 — site header and footer
    (auth)/       Sign-in, register, verify-email, verify-email-change — logo and language selector only
    (dashboard)/  admin · teacher · student — sidebar, topbar, loading, error
                  admin/users · admin/users/new — account management
                  admin/courses · admin/courses/new — course management
                  admin/schedule · admin/schedule/new — the timetable
                  admin/notices · admin/notices/new — department announcements
                  teacher/schedule — the teacher's own week
                  teacher/materials · teacher/courses — the file repository
                  student/schedule · student/materials · student/teachers — read-only
                  profile — one route, every role, outside the role areas
  api/materials/  upload · [id]/download — route handlers, not Server Actions
    unauthorized/ 403 for a signed-in visitor in the wrong area
  llms.txt/ · llms-full.txt/   Route handlers for LLM crawlers
  globals.css · global-error.tsx · robots.ts · sitemap.ts · icon.svg
l10n/             l10n.csv (source of truth), generated dictionaries, routing, navigation
proxy.ts          Locale negotiation, then the route guard (Next 16's middleware file)
components/
  admin/courses/  Courses table, semester filter, shared fields, create form, dialogs
  schedule/       Week view, filters, conflict notice, create form, edit and delete dialogs
  admin/users/    Users table, filters, create form, edit and confirm dialogs, actions
  auth/           Sign-in, both registration forms, both confirmation screens, their actions
  dashboard/      Sidebar, topbar, nav, sign-out button, the notices feed
  notices/        Notice card, badge, list, empty state, publish form, actions
  profile/        Login-ID card, the department record, the four editable fields, actions
  student/        Routine, material list by course code, teacher directory — no actions.ts
  home/           Landing sections — hero, roles, features, stack, roadmap
  layout/         SiteHeader, SiteFooter
  shared/         Container, AppLogo, JsonLd, LanguageSelector, NotFoundContent
  ui/             shadcn (base-nova) primitives
constants/        Copy, structural data and the error-code registry
env/              Zod-validated server and client environment
models/           Mongoose models — user, course, class-session, material, notice
lib/
  api/            Route-handler response helpers — withOk, withBadRequest, withForbidden…
  auth/           session · session-cookie · current-user · guards
  result/         SingleResult · ListResult · EmptyResult and their factories
  schemas/        Zod schemas, {entity}-{action}.schema.ts
  services/       One class per entity — auth · user · course · class-session · notice
                  login-id.issuer · token.hash — the shared non-class helpers
  utils/          Every helper, barrelled — `@/lib/utils` resolves here
                  class-name (cn) · auth · error · llms · mongo · role · url · zod
  logger.ts       pino — JSON in production, pretty in development
  mongodb.ts      globalThis-cached Mongoose connection
types/            One type per file, re-exported from types/index.ts
docs/             IMPLEMENTATION-PLAN.md · project-overview.html
.husky/           pre-commit, commit-msg and pre-push guards
```

**[docs/project-overview.html](docs/project-overview.html)** is a standalone visual walkthrough — request
lifecycle, the i18n pipeline, how a write travels through the layers, the data model, and build progress.
Open it in a browser; it has no dependencies.

Growing into this as the steps land:

```
lib/services/     One class per entity — auth.service.ts is the first
```

Every folder exposes a barrel `index.ts`, and components import through it (`@/components/home`,
`@/constants`, `@/types`).

The one exception: components inside a `'use client'` graph import their siblings by **relative path**. Going
through the folder barrel there creates an import cycle across the client boundary, which resolves to
`undefined` at render time.

## Conventions

This project follows the house style shared with `android-walls-landing`, `aloowing` and
`katastarx-frontend`. The rules that are not enforced by ESLint matter most, because that is where code
drifts.

**Imports** — groups separated by a blank line, alphabetized: `react`/`next` first, then external packages,
then `@/*` aliases, then relative, and `import type` **always last**. `npm run lint:fix` sorts this for you.

**Components** — `function` declarations, never arrow consts. Named exports only, except App Router
`page.tsx` / `layout.tsx`, which must default-export. Server Components are the default; `'use client'` only
for controlled inputs, browser APIs or event-heavy state. Client components receive already-translated
strings as props.

**Types** — `type` aliases, never `interface`. Props types are named `<Component>Props`. No `any`, no
unchecked casts; use a DTO mapper instead of asserting a database row into a shape.

**Styling** — design tokens only, never a raw hex or `oklch()` in a component. Merge classes with `cn()` and
keep the caller's `className` last so overrides win. Conditional classes go through `cn()`, never a template
literal. **Write classes directly on the element** — no `const NAV_LINK_CLASS = '…'` pulled out above the
component, even when the same set repeats across siblings. Repetition is easier to read and to edit than a
name that has to be resolved.

**Helpers** — a function that is not a component and not an event handler belongs in
`lib/utils/{domain}.utils.ts`, not beside the component that happened to need it first. Components and pages
hold JSX and the handlers wired to it; everything else is a util with a name and a home. Import through the
barrel: `import { cn, buildLocaleUrl } from '@/lib/utils'`.

Anything in that barrel must be safe in a client bundle, so utils that reference mongoose or
`next-intl/server` import them with `import type`. The middleware is stricter and imports
`@/lib/utils/url.utils` directly rather than the barrel.

**Naming** — files `kebab-case`; `{entity}-{action}.schema.ts`, `{entity}.const.ts`, `{entity}.enum.ts`,
`{entity}.dto.ts`, `*.form.tsx`, `*.dialog.tsx`. Enums are `{Entity}{Concept}Enum`. Module constants are
`SCREAMING_SNAKE_CASE`. Route-local components live in `_components/`.

**Business logic** — never in a component. Validation lives in zod schemas, logic in services, transformation
in DTO mappers. Components render what they are given.

**Server actions** — the file is always `actions.ts`, the function always ends in `Action`. It validates its
input with zod inside the action, calls a service, and returns a Result. Expected failures come back as a
failure result; they are not thrown.

**Language** — the app ships in **English and Bangla**. English is the default and lives at `/`; Bangla is at
`/bn`. Every user-facing string is an `l10n('KEY')` lookup, never a literal — keys are flat and ALL CAPS,
scoped as `SCOPE_COMPONENT_ELEMENT`. `l10n/l10n.csv` is the source of truth; the JSON dictionaries are
generated and must never be hand-edited. Link with `Link` from `@/l10n/navigation`, never `next/link`, or the
`/bn` prefix is lost on navigation.

**Spelling** — a new domain word goes in `cspell.config.json`, not behind an inline disable. JSON, CSV and
Markdown are not checked at all, which covers the translation dictionaries and `l10n/l10n.csv`; the
generated `l10n/*.d.json.ts` is ignored by name. Bengali is skipped by script range as well, because
`docs/project-overview.html` mixes both languages and cspell has no Bangla dictionary. That leaves code —
and of that, `npm run lint` only reaches `.ts`/`.tsx`, so a typo in CSS or HTML shows up in the editor but
never fails the build.

**Definition of done** — `npm run format:write`, then green `npm run lint`, then a successful `npm run build`.

### Git hooks

Husky enforces the definition of done rather than trusting anyone to remember it. A failing check aborts the
operation; the hooks install themselves through the `prepare` script on `npm install`.

| Hook         | Runs                                                     | Blocks     |
| ------------ | -------------------------------------------------------- | ---------- |
| `pre-commit` | Branch-name check, then `npm run lint`, `npm run format` | The commit |
| `commit-msg` | commitlint — Conventional Commits                        | The commit |
| `pre-push`   | `npm run build`, which is the type check                 | The push   |

Branch names must be `feature/`, `bugfix/`, `release/` or `hotfix/` followed by lowercase `a-z0-9-`
(`feature/step-4-data-model`); `master` and `develop` are exempt. Commit messages need a Conventional Commits
type — `feat:`, `fix:`, `chore:`, `docs:`, `refactor:`.

Lint and format run on every commit because they are fast. The build runs once per push, because it is what
catches a type error, a broken metadata route or an invalid env schema — cheap here, expensive in CI or in a
branch someone else has pulled.

If the hooks ever stop firing, `npm run prepare` reinstalls them. `--no-verify` skips them; treat that as a
last resort, not a shortcut.

## Design system

Colors, radii and fonts are CSS variables in [app/globals.css](app/globals.css), mapped into Tailwind through
`@theme inline`. Use the token classes rather than raw palette values —
`eslint-plugin-tailwind-canonical-classes` checks every class name against that file.

| Token group                                     | Purpose                                          |
| ----------------------------------------------- | ------------------------------------------------ |
| `background` / `foreground` / `card` / `muted`  | Surfaces and text                                |
| `primary`                                       | Indigo brand color, used for actions and accents |
| `accent-violet` / `accent-blue` / `accent-teal` | Admin / teacher / student, in that order         |
| `success` / `warning` / `destructive`           | Status feedback                                  |
| `sidebar-*`                                     | Reserved for the dashboard shell (step 6)        |

Typography helpers (`.tagline`, `.text-medium-normal`, `.text-regular-semibold`), section padding
(`.section-py`, `.section-px`) and `.surface-card` are defined alongside the tokens.

The palette ships **light by default** with a complete `.dark` block already written. There is no theme toggle
yet — step 15 adds `next-themes` and puts the class on `<html>`.

### Type

Inter (body) and Poppins (headings) cover the Latin text. Neither has Bengali glyphs, so from step 2 the
Bangla locale swaps in **Noto Sans Bengali** and **Anek Bangla** under `html[lang='bn']`, along with a larger
`line-height` — Bengali conjuncts clip at the leading that suits Latin.

## Internationalization

The app ships in **English** (`/`) and **Bangla** (`/bn`), via next-intl with
`localePrefix: 'as-needed'`. Two URLs rather than one cookie-switched URL, so both languages can be indexed.

### Adding or changing a string

1. Edit [l10n/l10n.csv](l10n/l10n.csv) — columns are `key`, `en-US`, `bn-BD`.
2. Run the generator. **Never hand-edit the JSON dictionaries**; they are build output.

```bash
npm run i18n:generate
```

A blank `bn-BD` cell is allowed: the generator falls back to the English text and prints the list of keys that
fell back, so an untranslated string never becomes a missing-key error in the UI.

### Using a string

Keys are flat and ALL CAPS, scoped `SCOPE_COMPONENT_ELEMENT` (`HOME_HERO_TITLE_LEAD`). The translation
function is **always** named `l10n` — the i18n-ally editor integration matches on that name.

```tsx
import { getTranslations } from 'next-intl/server';

export async function SectionRoles() {
  const l10n = await getTranslations();

  return <h2>{l10n('HOME_ROLES_TITLE')}</h2>;
}
```

Three rules that are easy to break:

- **Keys are written as literals at the call site.** Do not collect them into an array and map over it — the
  editor integration only detects the literal call form. That is why `constants/home.const.ts` holds icons and
  accent classes but no text, and each card is rendered explicitly.
- **Client components receive translated strings as props.** Server components do the lookup.
- **Link with `Link` from [l10n/navigation.ts](l10n/navigation.ts)**, never `next/link`. Only the wrapper
  keeps the `/bn` prefix across a navigation. The same applies to `redirect`, `usePathname` and `useRouter`.

### How the locale reaches a component

From the `[locale]` root param, read natively by Next 16.3's `next/root-params` in
[l10n/request.config.ts](l10n/request.config.ts). Server components just call `getTranslations()` — there is
no locale to thread through props, and no `setRequestLocale()` call in any layout or page. Static rendering
still works: `generateStaticParams()` prerenders both locales.

**Root params are not available in Route Handlers or Server Actions.** Those pass a locale explicitly and the
request config takes it from the argument instead:

- `app/llms.txt/route.ts` → `getTranslations({ locale: DEFAULT_APP_LOCALE })`
- `signOutAction` → the locale arrives as a hidden form field, validated before use, because otherwise the
  redirect after signing out would always land on English

### Locale model

Two tiers, resolved in exactly one place ([constants/i18n.const.ts](constants/i18n.const.ts)): the **URL
locale** (`en`, `bn`) appears in routes, and the **message locale** (`en-US`, `bn-BD`) names the dictionary.
`getMessageLocale()` maps between them — nothing else should mention `en-US` or `bn-BD`.

Dates and numbers are formatted in `Asia/Dhaka` with `numberingSystem: 'latn'`, so Bangla shows `09:30` and
`401` rather than Bengali numerals, which read badly beside course codes like `CSE-401`.

## SEO and structured data

Everything here is derived from `APP_BASE_URL` and the message dictionary, so nothing has to be kept in sync
by hand.

| Route              | What it serves                                                              |
| ------------------ | --------------------------------------------------------------------------- |
| `/sitemap.xml`     | One entry per locale, each with `en-US`, `bn-BD` and `x-default` alternates |
| `/robots.txt`      | Gated on `ROBOTS_ENABLED`; disallows the private segments when enabled      |
| `/llms.txt`        | Short index for LLM crawlers, per the llmstxt.org convention                |
| `/llms-full.txt`   | The long form — every landing section as markdown                           |
| `/opengraph-image` | 1200×630 social card, generated by `next/og`                                |

The page head carries `metadataBase`, a canonical link, `hreflang` alternates for both locales plus
`x-default`, `og:locale` with its alternate, and a JSON-LD `@graph` of `Organization` → `WebSite` →
`SoftwareApplication`, cross-linked by `@id` fragments.

### Two things to know

**Indexing is off unless a deploy opts in.** `ROBOTS_ENABLED` defaults to `false`, which makes `robots.txt`
emit `Disallow: /` _and_ the page metadata emit `noindex, nofollow`. Two independent signals, because getting
a staging site back out of the index is far more work than setting one variable. Production must set
`ROBOTS_ENABLED=true`.

**Structured data is typed.** [constants/json-ld.const.ts](constants/json-ld.const.ts) builds a `Graph` from
`schema-dts`, so a node or property that is not in the schema.org vocabulary fails the build instead of
failing a validator after deploy. [components/shared/json-ld.tsx](components/shared/json-ld.tsx) renders it as
a `<script type="application/ld+json">` and ships no client JavaScript.

The organization node currently describes the project itself. When the department's real identity is known it
becomes an `EducationalOrganization` with address and contact details — inventing those now would put false
data in front of crawlers.

## Data layer

### The Result pattern

Services and server actions never throw for an expected failure — they return a result. Three shapes cover
everything: `EmptyResult` (nothing to return), `SingleResult<T>` (one item), `ListResult<T>` (many, with
optional paging info). All three carry `success`, `errors` and `messages`.

```ts
import { CODES } from '@/constants';
import { createError, singleFailure, singleSuccess } from '@/lib/result';

if (!course) {
  const { CODE, MESSAGE } = CODES.VALIDATION.COMMON.RESOURCE_NOT_FOUND;
  return singleFailure<CourseDto>(createError(CODE, MESSAGE));
}

return singleSuccess(courseFromEntity(course));
```

Error codes live in [constants/codes.const.ts](constants/codes.const.ts) as five digits —
`[layer][feature][sequence]`, so `20002` is a common validation error and `50001` an authorization one. Zod
messages carry their code inline (`encodeZodMessage`), and `mapZodErrorsToErrorDto()` unpacks the whole
`ZodError` into field-level `ErrorDto`s a form can render.

Only genuinely exceptional things throw. A refused action is data, not an exception.

### MongoDB

[lib/mongodb.ts](lib/mongodb.ts) exports `connectToDatabase()`. It caches the connection on `globalThis`,
because Next.js re-evaluates server modules on every change in development and would otherwise open a new
connection per reload until the pool is exhausted.

```ts
import { connectToDatabase } from '@/lib/mongodb';

export async function GET() {
  await connectToDatabase();
  // ...query through a Mongoose model
}
```

**The database name is set in code**, not read from the connection string. Atlas hands out URIs without a
path segment, and a missing one silently routes every write to a database called `test` — the app works and
nothing complains. `connectToDatabase()` passes `dbName: DATABASE_NAME` explicitly, so no environment can get
it wrong.

### Models

One per file in `models/`, each guarded with `mongoose.models.X ?? mongoose.model('X', schema)` so hot reload
re-uses the compiled model instead of redefining it.

| Model          | Holds                                                                                |
| -------------- | ------------------------------------------------------------------------------------ |
| `User`         | Identity, credentials, the department's record, and an address change awaiting proof |
| `Course`       | code, title, semester, credits, assigned teacher                                     |
| `ClassSession` | course, teacher, room, day, start and end time, semester                             |
| `Material`     | course, uploader, file name, MIME type, size, storage key                            |
| `Notice`       | title, body, audience, publisher, publish date                                       |

Times are 24-hour `HH:mm` strings. Zero-padded, so `startTime < endTime` is a plain string comparison — and so
is the overlap test that step 8's conflict detection runs between two sessions.

Passwords are hashed in the model's `pre('save')` hook, so every path that saves a user gets it, including the
seed script. The field carries `select: false`: it is absent unless a query asks for it with
`.select('+password')`.

### DTOs

Nothing reaches a component as a Mongoose document. Each entity has a mapper in `types/{entity}.dto.ts` that
names every field explicitly — so `password`, `_id` and `__v` cannot leak by being forgotten, and a new
sensitive column stays invisible until someone deliberately adds it.

```ts
import { userFromEntity } from '@/types';

return singleSuccess(userFromEntity(user));
```

Mappers take a structural entity type rather than a `HydratedDocument`, so they accept both hydrated documents
and `.lean()` results. `toId()` renders a reference as a string whether or not the query populated it.

### Seeding the first administrator

Every account is created by somebody already signed in, which leaves the first one with no way in. That is
what the seed script is for — and it seeds the **super administrator**, not an administrator: there is exactly
one, it cannot be created or changed through any screen, and it is the account that creates the first
administrator. Pass the credentials in the environment rather than on the command
line, so the password stays out of shell history:

```bash
SEED_SUPER_ADMIN_NAME="Department Head" SEED_SUPER_ADMIN_EMAIL="head@dept.edu" SEED_SUPER_ADMIN_PASSWORD="…" npm run seed:super-admin
```

Re-running it never resets an existing password — if the email is already registered it reports and stops.

## Authentication

A session JWT signed with [`jose`](https://github.com/panva/jose), stored in an httpOnly cookie. No auth
library sits in between — the pieces are small enough that owning them costs less than working around someone
else's abstraction, and it keeps the project free of pre-release dependencies.

Accounts arrive two ways. Teachers and students **register themselves** (step 12) and are issued a login ID
once they prove their address; administrators are created by the super administrator, which is why the first
account comes from the seed script. Both routes end at the same gate — an account signs in only when its
address is verified **and** the department has approved it.

### The pieces

| File                           | Runs            | Does                                     |
| ------------------------------ | --------------- | ---------------------------------------- |
| `lib/auth/session.ts`          | Server and edge | Signs and verifies the token             |
| `lib/auth/session-cookie.ts`   | Server only     | Sets and clears the cookie               |
| `lib/auth/current-user.ts`     | Server only     | `getSessionUser()` for pages and layouts |
| `lib/services/auth.service.ts` | Server only     | Checks credentials, returns a Result     |

`proxy.ts` imports **`@/lib/auth/session` directly, not the barrel** — the barrel also exports the cookie
helpers, which use `next/headers`, and that does not exist in the middleware runtime. Verifying a token needs
only `jose`, which runs there fine.

### What the session carries

`userId`, `role`, `email`, `name` and `isApproved` ride inside the token, so a guarded page knows who is
asking without a database round trip. The shape is [types/session-user.ts](types/session-user.ts) — an
ordinary type, no module augmentation.

Two things `verifySessionToken()` does that are easy to leave out:

- **Pins the algorithm.** `algorithms: ['HS256']` is what refuses a token arriving with `alg: none`.
- **Parses the payload with zod after checking the signature.** A signature proves the token was minted here,
  not that its shape still matches the current code — a token issued before a field was renamed verifies
  perfectly and then hands back nonsense.

The cookie is `httpOnly` (so a scripting bug cannot lift the session), `sameSite: lax`, `secure` in
production, and lives seven days.

Because the token is self-contained, whatever is inside it goes stale until it is re-minted. Editing your own
profile therefore re-issues the cookie, so the name greeting you in the topbar is the name you just saved. The
address in it comes from the stored record rather than the form — an email change is not in force until its
link is followed, and must not reach the session ahead of that.

### Refusals

`AuthService.verifyCredentials()` checks the password **first**, then account state. An unknown email and a
wrong password return the same `INVALID_CREDENTIALS` code, and "waiting for approval" or "deactivated" is only
ever disclosed to someone who has already proved they own the account. Otherwise the sign-in form doubles as a
way to discover which addresses are registered.

Reasons travel as codes, not sentences: the service returns a `SingleResult` carrying an `ErrorDto`, and the
form renders the translated string for that code.

### The route guard

`PROTECTED_SEGMENTS` in [constants/routes.const.ts](constants/routes.const.ts) is the single source for both
the guard and the `Disallow` list in robots.txt. A signed-out request to a protected route is redirected to
sign-in **in the language it was already reading**, with the intended destination in `?next=`.

### Role-based access

The proxy answers "is there a session"; the page answers "is it the right one". Two guards, in
[lib/auth/guards.ts](lib/auth/guards.ts):

```ts
const sessionUser = await requireSession(); // redirects to sign-in
const admin = await requireRole(USER_ROLES.ADMIN); // redirects to /unauthorized
```

Both redirect rather than returning `null`, so no caller can forget the refused case and render a page to
nobody. They read the locale themselves, so the redirect keeps the language.

**A wrong role is not a missing session.** Sending both to sign-in would tell an already-authenticated teacher
to sign in again, which reads as a bug rather than a refusal — so the wrong role gets `/unauthorized`, a 403
with a link to the visitor's _own_ dashboard.

### One thing to know about sessions

The session is a self-contained JWT. **Deleting or deactivating a user does not end a session already in
progress** — the token keeps verifying until it expires, because nothing checks the database on each request.
That is the trade for not doing a lookup per page view. Deactivation takes effect at the next sign-in; closing
the gap entirely needs a token version on the user record, which is in the plan's backlog.

## Roadmap

Straight from the project proposal, mapped onto the
[implementation plan](docs/IMPLEMENTATION-PLAN.md).

| Phase | Activity                                        | Estimate | Steps |
| ----- | ----------------------------------------------- | -------- | ----- |
| 1     | Requirement analysis and UI/UX design           | Week 1   | 0–3   |
| 2     | Database schema design and authentication setup | Week 2   | 4–5   |
| 3     | Admin dashboard and user management             | Week 3-4 | 6–7   |
| 4     | Scheduling system and teacher dashboard         | Week 5-6 | 8–9   |
| 5     | Student dashboard and material management       | Week 7   | 10–14 |
| 6     | Testing, bug fixing and final deployment        | Week 8   | 15–16 |

`typedRoutes` is on, so a `<Link>` to a route that does not exist yet is a build error. That is why the
landing page uses in-page anchors and `ROUTES` currently holds only `HOME`.

## Toolchain notes

Two dev dependencies are intentionally **not** on their newest major, because the rest of the toolchain
cannot load them yet. Revisit when the upstream issues close.

| Package      | Pinned   | Newest   | Why                                                                                                                                                                                                                                  |
| ------------ | -------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `typescript` | `6.0.3`  | `7.0.2`  | `typescript-eslint` refuses to load under TS 7.0 ([#10940](https://github.com/typescript-eslint/typescript-eslint/issues/10940)), which breaks `npm run lint` entirely. Next.js also needs `experimental.useTypeScriptCli` for TS 7. |
| `eslint`     | `9.39.5` | `10.8.0` | `eslint-plugin-react` (pulled in by `eslint-config-next`) still calls `context.getFilename()`, removed in ESLint 10. `eslint-config-next` declares no ESLint 10 support.                                                             |

Dependencies are pinned to exact versions — no `^` or `~`.

`eslint-import-resolver-typescript` is declared at the root on purpose. `eslint-config-next` keeps its own
nested copy, which `eslint-plugin-import` cannot find — it then falls back to loading the `typescript`
compiler package as a resolver and every `@/*` import fails to resolve.

`next/font/google` downloads Inter and Poppins at build time, so `npm run build` needs network access to
`fonts.googleapis.com`. As of Next 16.2 a failed font fetch is a build error, not a warning.

## Deployment

[next.config.ts](next.config.ts) sets `output: 'standalone'`, but only when `VERCEL` is unset. On Linux,
`npm run build:linux` copies `.next/static` and `public` into the standalone bundle, and
[ecosystem.config.js](ecosystem.config.js) runs it under PM2 on port **3101**.

On Vercel the option is skipped. The platform traces and packages the output itself, and leaving
`standalone` on makes the build fail on a missing `.next/next-server.js.nft.json` — the file the standalone
copy step reads. Nothing else differs between the two targets.

```bash
npm run build:linux
```

```bash
pm2 start ecosystem.config.js
```

## Naming

`AcademicSync` is a placeholder short name. It is defined once in
[constants/app-data.const.ts](constants/app-data.const.ts) and used everywhere, so renaming it is a one-line
change.
