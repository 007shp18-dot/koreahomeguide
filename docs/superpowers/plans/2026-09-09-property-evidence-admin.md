# Property Evidence Admin Implementation Plan

> **For agentic workers:** Execute inline with superpowers:executing-plans. Steps use checkbox syntax for tracking.

**Goal:** A protected Korean operator workspace for registering and reviewing structured property evidence.

**Architecture:** A dedicated Next.js root layout isolates the admin workspace from public analytics. Route handlers authenticate signed sessions and call a parameterized Neon repository. A new additive migration persists sources, evidence and audit events.

**Tech Stack:** Existing Next.js 16.3.3, React 19.2.8, TypeScript, Neon HTTP, Vitest. No dependency changes.

**Spec:** `docs/superpowers/specs/2026-09-09-property-evidence-admin-design.md`

## Global Constraints

- Eight-hour signed HttpOnly SameSite=Strict cookie; existing server-only CONTENT_ADMIN_SECRET of at least 32 characters.
- Every data request authenticated; same-origin mutations; no public analytics.
- No raw posts, comments, authors, scraping or public publication.
- Atomic audited mutations, optimistic version checks, terminal withdrawal, derived expiry.
- No production DB writes or deployment in this implementation-only turn.

### Task 1: Input and authentication boundaries

Files: `v2/apps/web/lib/evidence-pool/contract.ts`, `auth.server.ts`, `http.server.ts`; tests `evidence-pool-contract.test.ts`, `evidence-pool-auth.test.ts`.

- [x] Add failing tests: `expect(parseEvidence({...valid, author:'x'})).toBeNull()`; `expect(verifySession(tampered, secret, now)).toBe(false)`; test future/expired session, short secret, cross-origin mutation and unauthorized read.
- [x] Run `pnpm test apps/web/test/evidence-pool-contract.test.ts apps/web/test/evidence-pool-auth.test.ts` and observe missing-feature failure.
- [x] Implement strict typed parsers, UTC date validation, evidence readiness, session HMAC and bounded JSON reader.
- [x] Rerun the targeted tests and typecheck.

### Task 2: Audited persistent workflow

Files: migration `0020_property_evidence_pool.sql`, `lib/evidence-pool/repository.server.ts`, `app/api/internal/evidence-pool/route.ts`, `app/api/internal/evidence-session/route.ts`; tests `evidence-pool-routes.test.ts` and `evidence-pool-postgres.test.ts`.

- [x] Test API refuses unauthorized DB access, reports validation/conflict/unavailability with sanitized errors, and uses versioned audited transitions.
- [x] Implement additive tables and indexes; atomic INSERT/UPDATE CTEs with audit INSERT; page-limited queries and aggregate counts.
- [x] Implement source/evidence creation, review and correction actions with session checks and same-origin enforcement.
- [x] Run focused tests. Use an isolated database for SQL integration if available; disclose if unavailable.

### Task 3: Operator UI and handoff

Files: `app/(admin)/layout.tsx`, `app/(admin)/admin/evidence/page.tsx`, `components/evidence-admin/*`, `docs/operations/2026-09-09-evidence-admin.md`, `.env.example` comment update.

- [x] Add render tests for login, empty workspace, forms and source evidence readiness.
- [x] Implement Korean login, counts, list/filter/pagination, source and evidence forms, detail/review/history. Disable pending operations and preserve inputs on failures.
- [x] Run targeted tests, existing relevant tests, TypeScript and an isolated no-production-DB Next build.
- [x] Document tested vs untested boundaries and post-deployment activation. Commit the feature branch with explicit files only.
