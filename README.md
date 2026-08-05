# Academic Workflow Synchronization System

A departmental ERP for academic work — class scheduling, course materials, notices and user management in one
platform, with role-based dashboards for **administrators**, **teachers** and **students**.

Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS v4 · MongoDB

> **Current state: step 3 of 14 complete.** Toolchain, design system, validated environment, the shared
> result/error layer, English/Bangla localization and the full SEO surface are in place. Schemas and
> authentication are next — see [docs/IMPLEMENTATION-PLAN.md](docs/IMPLEMENTATION-PLAN.md).

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
13. [Roadmap](#roadmap)
14. [Toolchain notes](#toolchain-notes)
15. [Deployment](#deployment)

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

| Layer      | Choice                          | Why                                                            |
| ---------- | ------------------------------- | -------------------------------------------------------------- |
| Framework  | Next.js 16 (App Router)         | Server rendering and the API layer in one codebase             |
| UI         | React 19 + Tailwind CSS v4      | Design tokens, responsive by default                           |
| Primitives | shadcn (`base-nova`) on Base UI | Accessible components that match the token system              |
| Language   | TypeScript (strict)             | No `any`, no unchecked casts                                   |
| Database   | MongoDB + Mongoose              | Document-shaped data: profiles, courses, nested structures     |
| Auth       | NextAuth v5 (from step 5)       | Credentials provider with role on the session                  |
| i18n       | next-intl (from step 2)         | English and Bangla, `l10n('KEY')` from a CSV-driven dictionary |

## Getting started

**Prerequisites:** Node.js 20+ and npm. MongoDB is only needed from step 4 onward — locally or on Atlas.

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
| `MONGODB_URI`    | From step 4               | `mongodb://127.0.0.1:27017/academic-workflow`, or an Atlas SRV string |
| `AUTH_SECRET`    | From step 5               | At least 32 characters — `openssl rand -base64 32`                    |

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

A clean clone runs with no `.env.local` at all: nothing on the landing page touches the database, and the two
optional variables become required in the step that starts using them.

## Scripts

| Script                  | Description                                                |
| ----------------------- | ---------------------------------------------------------- |
| `npm run dev`           | Start the dev server                                       |
| `npm run build`         | Production build (`output: 'standalone'`)                  |
| `npm run start`         | Serve the production build                                 |
| `npm run lint`          | ESLint — import order, cspell, canonical classes, Prettier |
| `npm run lint:fix`      | ESLint with `--fix`                                        |
| `npm run format`        | Prettier check                                             |
| `npm run format:write`  | Prettier write                                             |
| `npm run i18n:generate` | Regenerate the locale dictionaries from `l10n/l10n.csv`    |

## Project structure

```
app/
  [locale]/       Localized routes — layout (the root layout), page, not-found, catch-all
                  opengraph-image.tsx
  llms.txt/ · llms-full.txt/   Route handlers for LLM crawlers
  globals.css · global-error.tsx · robots.ts · sitemap.ts · icon.svg
l10n/             l10n.csv (source of truth), generated dictionaries, routing, navigation
proxy.ts          Locale negotiation (Next 16's middleware file)
components/
  home/           Landing sections — hero, roles, features, stack, roadmap
  layout/         SiteHeader, SiteFooter
  shared/         Container, AppLogo
  ui/             shadcn (base-nova) primitives
constants/        Copy, structural data and the error-code registry
env/              Zod-validated server and client environment
lib/
  api/            Route-handler response helpers — withOk, withBadRequest, withForbidden…
  result/         SingleResult · ListResult · EmptyResult and their factories
  error.utils.ts  Display formatting, normalizing unknown caught values
  zod.utils.ts    Zod issues → ErrorDto, with the code encoded in the message
  logger.ts       pino — JSON in production, pretty in development
  llms.utils.ts   Builds /llms.txt and /llms-full.txt from the dictionary
  mongodb.ts      globalThis-cached Mongoose connection
  url.utils.ts    buildLocaleUrl() — absolute, locale-prefixed URLs
  utils.ts        cn()
types/            One type per file, re-exported from types/index.ts
docs/             IMPLEMENTATION-PLAN.md · project-overview.html
.husky/           pre-commit, commit-msg and pre-push guards
```

**[docs/project-overview.html](docs/project-overview.html)** is a standalone visual walkthrough — request
lifecycle, the i18n pipeline, how a write travels through the layers, the data model, and build progress.
Open it in a browser; it has no dependencies.

Growing into this as the steps land:

```
lib/schemas/      Zod schemas, {entity}-{action}.schema.ts
lib/services/     Business logic, one class per entity
models/           Mongoose models, one per file
auth.ts           NextAuth configuration
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
literal.

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

**Spelling** — a new domain word goes in `cspell.config.json`, not behind an inline disable.

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
| `sidebar-*`                                     | Reserved for the dashboard shell (step 5)        |

Typography helpers (`.tagline`, `.text-medium-normal`, `.text-regular-semibold`), section padding
(`.section-py`, `.section-px`) and `.surface-card` are defined alongside the tokens.

The palette ships **light by default** with a complete `.dark` block already written. There is no theme toggle
yet — step 12 adds `next-themes` and puts the class on `<html>`.

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

Schemas arrive in [step 4](docs/IMPLEMENTATION-PLAN.md#step-4): one model per file in `models/`, each guarded
with `mongoose.models.X ?? mongoose.model('X', schema)` so hot reload does not redefine it, and each reaching
the UI only through a DTO mapper so `passwordHash` and `_id` never leak into a component.

## Roadmap

Straight from the project proposal, mapped onto the
[implementation plan](docs/IMPLEMENTATION-PLAN.md).

| Phase | Activity                                        | Estimate | Steps |
| ----- | ----------------------------------------------- | -------- | ----- |
| 1     | Requirement analysis and UI/UX design           | Week 1   | 0–3   |
| 2     | Database schema design and authentication setup | Week 2   | 4–5   |
| 3     | Admin dashboard and user management             | Week 3-4 | 6–7   |
| 4     | Scheduling system and teacher dashboard         | Week 5-6 | 8–9   |
| 5     | Student dashboard and material management       | Week 7   | 10–11 |
| 6     | Testing, bug fixing and final deployment        | Week 8   | 12–13 |

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

[next.config.ts](next.config.ts) sets `output: 'standalone'`. On Linux, `npm run build:linux` copies
`.next/static` and `public` into the standalone bundle, and [ecosystem.config.js](ecosystem.config.js) runs it
under PM2 on port **3101**.

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
