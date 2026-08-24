# Security & Quality Audit Report

**Target:** Academic Workflow Synchronization System (Next.js 16 · React 19 · TypeScript · MongoDB/Mongoose)
**Date:** 2026-08-17
**Scope:** Full application — authentication/session, authorization/RBAC, injection, file upload/download,
denial-of-service surface, HTTP security headers, secrets/logging, dependencies, and test coverage.
**Branch:** `feature/step-16-security-hardening-and-tests`

---

## 1. Executive summary

This is a **notably disciplined codebase**. The self-rolled `jose` JWT pins `HS256` and verifies
issuer/audience/expiry, then re-parses the payload with a zod schema; cookie flags are correct; every write
path validates raw `unknown` input with zod **before** it reaches a query (defeating NoSQL-operator injection
and mass assignment); IDOR/RBAC is enforced by service-layer re-checks rather than by hiding UI; the
file-serving routes are hardened with `attachment`/`nosniff`/CSP-`sandbox` and magic-byte checks; and token
entropy, hashing-at-rest, and secret handling are all sound.

**No critical or high-severity runtime vulnerability was found.** The injection audit found _nothing_
exploitable. The real gaps are one tier down and cluster into five themes:

1. **Request-boundary DoS ceilings** — multipart bodies are buffered before size caps run; one upload route
   is unthrottled; sign-in bcrypt work is throttled only per-identifier.
2. **HTTP response hardening** — the app ships **no security headers at all** on page responses.
3. **Secrets/logging discipline** — a fallback mail driver logs raw single-use tokens; the SMTP failure path
   logs recipient PII; unauthenticated rate limits trust a spoofable `x-forwarded-for`.
4. **No automated test safety net** — no test framework, zero unit tests, no CI.
5. **Documented, accepted trade-offs** at their true low severity (fail-open session re-validation,
   admin-ceiling race, unbounded list queries, a sign-in timing oracle, a latent JSON-LD XSS sink).

Of the 15 findings plus 1 dependency advisory, **13 are fixed on this branch**; **3 are deferred** with
rationale (they need a schema/transaction change, UI pagination, or a deployment decision).

---

## 2. Testing methodology

| Test type                                     | How it was performed                                                                                                                                                                                                                                                                                             | Result                                                                                           |
| --------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| **Static application security review (SAST)** | 8 independent adversarial auditors read the real source across auth/session, RBAC/IDOR, injection, file-upload, DoS/rate-limit, headers/XSS, secrets/deps/logging, and test-coverage — then a synthesis pass cross-verified every finding against the code, marking each `CONFIRMED` / `PLAUSIBLE` / `REJECTED`. | 15 verified findings                                                                             |
| **Runtime probing (DAST, non-destructive)**   | Booted the dev server and probed live: security headers, the `/api` same-origin perimeter (no-origin / self-origin / cross-origin), the unauthenticated route guard (`/admin` → redirect), unauthenticated API access, and invalid-`ObjectId` handling.                                                          | Confirmed SEC-03 (no headers), validated the same-origin guard and download hardening as correct |
| **Dependency / supply-chain**                 | `npm audit`.                                                                                                                                                                                                                                                                                                     | 1 high (transitive `nanoid`)                                                                     |
| **Authentication / access control**           | Traced every route handler and Server Action for the session→role→ownership chain; verified the DTO mappers strip `password`/`_id`.                                                                                                                                                                              | RBAC/IDOR sound; findings are DoS/timing, not bypass                                             |
| **Unit testing**                              | Assessed existing coverage. The 8 `verify:*` scripts are **manual integration harnesses that require a live, mutable MongoDB** — there is no fast, deterministic unit test anywhere.                                                                                                                             | Gap → added Vitest + tests (SEC-07/08)                                                           |

### What was deliberately **not** done, and why

The database is a **live MongoDB Atlas cluster holding real data**, not a local instance. Running destructive
**DoS / traffic-flooding** against endpoints backed by it would risk polluting data, exhausting the Atlas
connection pool, and tripping real account lockouts — so it was not run. The DoS _surface_ was instead
assessed statically (findings SEC-01, SEC-02, SEC-05, SEC-06, SEC-12, SEC-13), which is what actually yields
fixable defects. Full black-box load/DoS testing belongs against a throwaway environment and is noted as
future work.

---

## 3. What the app does well (verified, not assumed)

- **Auth:** `HS256` pinned (rejects `alg:none`), issuer/audience/expiry checked, payload re-validated with zod
  after signature check; cookie is `httpOnly` + `sameSite:lax` + `secure`-in-prod.
- **CSRF perimeter:** `/api` requires same-origin via `Sec-Fetch-Site` (unforgeable), with `Origin`/`Referer`
  fallback; Server Actions get Next's built-in Origin check.
- **Injection:** every action/route parses input with zod `safeParse` before the value reaches Mongoose — no
  operator injection, no mass assignment. DTO mappers name every field, so `password`/`_id` cannot leak.
- **File serving:** download/view/notice-image routes are access-checked and served with `nosniff` +
  CSP `sandbox` + `Content-Disposition` (attachment, or inline only for raster types) + escaped filename +
  `private, no-store`. Uploads are magic-byte checked; SVG/HTML are not accepted.
- **Rate limiting:** atomic (`$inc` upsert), DB-backed (correct across multi-instance), fails-open by design.

---

## 4. Findings

Severity reflects real impact. Confidence and verification verdict are from the cross-check pass.

| ID     | Sev    | Finding                                                                                                        | Disposition                            |
| ------ | ------ | -------------------------------------------------------------------------------------------------------------- | -------------------------------------- |
| SEC-01 | Medium | Multipart body fully buffered by `request.formData()` before any size cap → memory-exhaustion DoS (4 handlers) | **Fixed**                              |
| SEC-02 | Medium | Notice `PATCH` route has no rate limit → unthrottled 5 MB upload + `sharp` re-encode loop                      | **Fixed**                              |
| SEC-03 | Medium | No security headers on any HTML response (no CSP/frame-ancestors, HSTS, Referrer-Policy, nosniff)              | **Fixed**                              |
| SEC-04 | Medium | Fallback log-mail driver writes raw verification/reset **tokens** (and recipient PII) to logs                  | **Fixed**                              |
| SEC-05 | Medium | Unauthenticated rate-limit key derives from spoofable `x-forwarded-for` → registration mail-flood              | **Fixed** (trusted-proxy gate)         |
| SEC-06 | Medium | Sign-in bcrypt spray: limit keyed only on identifier, no per-caller ceiling → CPU exhaustion                   | **Fixed**                              |
| SEC-07 | Medium | No test framework, zero automated tests, no CI                                                                 | **Fixed** (Vitest + GitHub Actions)    |
| SEC-08 | Medium | Security-relevant pure controls (magic-byte sniff, session-payload schema, schedule overlap) untested          | **Fixed** (unit tests)                 |
| SEC-09 | Low    | Sign-in bcrypt timing oracle discloses which login IDs are live                                                | **Fixed**                              |
| SEC-10 | Low    | Session re-validation fails **open** on DB error → privileged revocation delayed up to token lifetime          | **Fixed** (fail-closed for admins)     |
| SEC-11 | Low    | Admin-ceiling enforcement is a check-then-act race (TOCTOU)                                                    | **Deferred** — needs transaction/index |
| SEC-12 | Low    | `sharp` sets no explicit input-pixel limit (pixel-bomb hardening)                                              | **Fixed**                              |
| SEC-13 | Low    | List queries fetch entire collections with no pagination/limit                                                 | **Deferred** — needs UI pagination     |
| SEC-14 | Low    | SMTP send-failure log records recipient email + login-ID-bearing subject                                       | **Fixed**                              |
| SEC-15 | Info   | `JsonLd` uses `dangerouslySetInnerHTML` with unescaped `JSON.stringify` (latent, not reachable today)          | **Fixed**                              |
| DEP-01 | High*  | Transitive `nanoid < 3.3.18` advisory (GHSA-2v37-7h3g-55p8)                                                    | **Fixed** (`npm audit fix`)            |

\* npm's advisory rating; the vulnerable code path (zero-size custom generator) is not reached by this app, so
real-world impact is low — fixed regardless.

### Finding detail

Each entry: **defect → exploit/failure → fix applied.**

**SEC-01 — Multipart body buffered before size cap.** `app/api/materials/upload/route.ts`,
`app/api/notices/route.ts`, and both `[id]` `PATCH` routes call `await request.formData()` — which buffers the
entire body into heap — _before_ the 25 MB/5 MB cap (which lives in the zod schema) runs. App Router route
handlers have no default body limit and `next.config.ts` sets none. _Exploit:_ an authenticated
teacher/admin POSTs a multi-GB body; the rate-limit and storage gates pass instantly (they don't inspect the
body), and the process OOMs on the single-fork PM2 target before the schema ever rejects it. _Fix:_ a shared
`withPayloadTooLarge` (413) helper and a `Content-Length` pre-check before `formData()` on all four handlers,
returning the same size error code the form already renders.

**SEC-02 — Notice `PATCH` unthrottled.** The material `PATCH` and notice `POST` routes both
`consumeRateLimit('upload', …)` before `formData()`; the notice `PATCH` handler did not. _Exploit:_ a tight
`PATCH` loop against one's own notice drives unbounded 5 MB writes + `sharp` re-encodes against the shared
GridFS bucket, uncounted. _Fix:_ added the same upload-budget guard before `formData()`.

**SEC-03 — No security headers.** _Exploit:_ with no `frame-ancestors`/`X-Frame-Options`, an admin
state-changing page can be framed for clickjacking; no CSP means any future XSS/malicious dependency runs
unmitigated; no `Referrer-Policy` leaks id-bearing authenticated URLs. _Fix:_ `async headers()` in
`next.config.ts` applying CSP (`frame-ancestors 'self'`), `X-Frame-Options: DENY`,
`X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy`,
and (production-only) `Strict-Transport-Security`.

**SEC-04 / SEC-14 — Token & PII logging.** The dev fallback mail driver logged the full message body
(containing the raw single-use token); the SMTP failure path logged recipient email and the login-ID-bearing
subject. _Fix:_ log only `{ to, subject }` (no body/token) and at a lower level; drop the recipient/subject
from the SMTP failure log, keeping the error itself.

**SEC-05 / SEC-06 — Rate-limit key trust & sign-in ceiling.** The unauthenticated caller key trusted a
client-supplied `x-forwarded-for`; sign-in was throttled only per-identifier (enumerable login IDs → unbounded
distributed bcrypt spray). _Fix:_ a `TRUSTED_PROXY` env flag (default `false`) — the forwarded IP is trusted
only when the operator asserts the proxy overwrites it; otherwise callers collapse to a shared bucket
(degrades to _one_ budget, not _none_). Added a second caller-scoped sign-in budget alongside the
per-identifier one, so total bcrypt work from a source is bounded regardless of how many identifiers are tried.

**SEC-09 — Sign-in timing oracle.** A non-existent identifier returned in milliseconds; an existing one ran
bcrypt (~250 ms). _Fix:_ on the not-found branch, compare against a fixed dummy hash so the path cost is equal
either way.

**SEC-10 — Fail-open session re-validation.** On a DB error, `getSessionUser()` returned the stale token,
delaying revocation of a deactivated/demoted account up to the token lifetime. _Fix:_ fail **closed** for
privileged roles (`admin`/`super-admin`) on DB error while keeping fail-open for students/teachers
(availability). Reverses a documented trade-off — see §6.

**SEC-12 — `sharp` pixel bomb.** _Fix:_ explicit `limitInputPixels`, `failOn:'error'`, `animated:false` on the
`sharp()` constructor.

**SEC-15 — JSON-LD injection sink.** Not reachable today (static constants + i18n copy only). _Fix:_ escape
`<` / `>` / U+2028 / U+2029 before injection so a future caller passing dynamic data cannot break out of the
script tag.

**SEC-07 / SEC-08 — Tests & CI.** _Fix:_ added Vitest, a `test` script, unit tests for the security-relevant
pure functions (magic-byte sniffer, session-payload schema, schedule overlap/conflict detection, and the
locale/URL split), and a GitHub Actions workflow running lint → format → build → test on push/PR.

---

## 5. Deferred findings (with rationale)

These are **real** but were not auto-fixed because a safe fix needs a decision, schema/transaction change, or
UI work beyond a hardening edit. Each is low severity.

- **SEC-11 — Admin-ceiling TOCTOU.** `countDocuments(...) >= ADMIN_LIMIT` and the write are separate,
  non-atomic statements across three call sites. Only the **trusted super-admin** can trigger it, and the
  outcome is a business-invariant violation (a 4th admin), not privilege escalation. A correct fix is a Mongo
  transaction or a partial-unique index — a data-layer change that should be tested against the replica set on
  its own, not bundled into a hardening sweep. **Recommended next step.**
- **SEC-13 — Unbounded list queries.** Admin/notice/material/schedule lists `find()` whole collections. All are
  behind auth gates, so this is a scaling concern, not an attack. A safe fix is real server-side pagination
  (query + UI), because a bare `.limit()` would silently truncate data — worse than the current behavior.
  **Recommended once collections grow.**
- **Full black-box DoS/load testing.** Not run against the live Atlas-backed app (see §2). **Recommended
  against a throwaway environment.**

---

## 6. Notable decision in this branch

**SEC-10 reverses a documented trade-off.** The original design deliberately failed _open_ on a DB error to
favor availability (a DB blip must not sign the whole department out). This branch keeps that for
students/teachers but fails _closed_ for `admin`/`super-admin`, so a revoked admin cannot keep privileged
access through a DB outage. During an outage, admins are bounced to sign-in (which also needs the DB, so no
usable access is lost). If availability is valued over this, revert the privileged-role branch in
`lib/auth/current-user.ts`.

---

## 7. Remediation order (as applied on this branch)

1. SEC-02 (trivial) → 2. SEC-01 (413 pre-checks) → 3. SEC-12 → 4. SEC-15 → 5. SEC-09 →
2. SEC-04 + SEC-14 (mail logging) → 7. SEC-03 (headers) → 8. SEC-05 + SEC-06 (caller key + sign-in ceiling) →
3. SEC-10 (fail-closed for admins) → 10. SEC-07 + SEC-08 (Vitest + tests + CI) → 11. DEP-01 (`npm audit fix`).

Each fix is its own commit; `npm run lint`, `npm run format`, and `npm run build` are green after the sweep.
