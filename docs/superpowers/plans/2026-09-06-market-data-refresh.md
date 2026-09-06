# SignedPrice Market Data Refresh Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Automatically refresh SignedPrice market evidence from free official Seoul, Singapore, and Dubai sources.

**Architecture:** Source-specific collectors normalize records into a shared batch contract. A transactional Neon writer applies idempotent, versioned upserts while an authenticated Next.js route runs one isolated job per invocation and records operational state.

**Tech Stack:** TypeScript 5.9, Next.js 16 App Router, Vitest 4, Neon Postgres, Vercel Cron.

**Spec:** `docs/superpowers/specs/2026-09-06-market-data-refresh-design.md`

## Global Constraints

- Use only official free sources and configured HTTPS URLs.
- Never bypass DLD CAPTCHA or expose provider credentials.
- Never delete or replace valid data when collection fails.
- Keep public publication controlled by the existing rights gates.
- Every behavior change starts with a failing Vitest test.

---

### Task 1: Shared refresh contract and scheduling

**Files:**
- Create: `v2/apps/web/lib/market-data/refresh-types.ts`
- Create: `v2/apps/web/lib/market-data/refresh-window.ts`
- Test: `v2/apps/web/test/market-data-refresh-window.test.ts`

**Interfaces:**
- Produces: `MarketRefreshJob`, `NormalizedMarketBatch`, `refreshMonthKeys(reference)`, and `refreshQuarterKeys(reference)`.

- [ ] Write tests asserting two completed/current Seoul months, two Singapore quarters, and rejection of invalid reference dates.
- [ ] Run `pnpm vitest run apps/web/test/market-data-refresh-window.test.ts` and confirm failure because the module is absent.
- [ ] Implement immutable job and batch types plus UTC calendar helpers.
- [ ] Re-run the focused test and confirm it passes.

### Task 2: DLD CSV normalization

**Files:**
- Create: `v2/apps/web/lib/market-data/dld-csv.server.ts`
- Test: `v2/apps/web/test/dld-market-data-csv.test.ts`

**Interfaces:**
- Produces: `parseDldTransactionsCsv(csv, observedAt)` and `parseDldRentsCsv(csv, observedAt)` returning `NormalizedMarketBatch`.

- [ ] Write fixtures using the uploaded transaction and rent headers and assert amount-minor conversion, dates, identity, and malformed/empty rejection.
- [ ] Run the focused test and confirm module-not-found failure.
- [ ] Implement an RFC-4180 parser with BOM handling, exact required-column validation, deterministic duplicate ordinals, stable business keys, and SHA-256 content hashes.
- [ ] Re-run the focused test and confirm it passes.

### Task 3: Seoul and Singapore official collectors

**Files:**
- Create: `v2/apps/web/lib/market-data/seoul-collector.server.ts`
- Create: `v2/apps/web/lib/market-data/singapore-collector.server.ts`
- Test: `v2/apps/web/test/official-market-data-collectors.test.ts`

**Interfaces:**
- Consumes: existing `fetchMolitRentalMonth`, `fetchMolitSaleMonth`, `createUraClient`, and URA transaction parser.
- Produces: `collectSeoulEvidence(input)` and `collectSingaporeEvidence(input)` returning normalized batches.

- [ ] Write dependency-injected collector tests for supported windows, all expected coordinates/batches, deterministic identities, cancellation mapping, and empty-response rejection.
- [ ] Run the focused test and confirm failure because collectors are absent.
- [ ] Implement bounded concurrency for MOLIT and four-batch URA sale collection; add a strict URA rental envelope parser for the two requested quarters.
- [ ] Re-run the focused test and confirm it passes.

### Task 4: Transactional Neon persistence and run leases

**Files:**
- Create: `v2/apps/web/db/migrations/0011_market_data_refresh.sql`
- Create: `v2/apps/web/lib/market-data/refresh-repository.server.ts`
- Test: `v2/apps/web/test/market-data-refresh-repository.test.ts`
- Modify: `v2/apps/web/test/property-evidence-migration.test.ts`

**Interfaces:**
- Produces: `createMarketRefreshRepository(port)` with `start`, `persist`, `succeed`, `fail`, and `skip` operations.

- [ ] Write tests that inspect generated queries and prove unchanged reruns, changed-content supersession, transactional persistence, run counters, and expiring leases.
- [ ] Run focused tests and confirm failure.
- [ ] Add run/lease tables and implement the query port without interpolating untrusted SQL identifiers.
- [ ] Re-run focused tests and migration contract tests.

### Task 5: Authenticated refresh route and provider selection

**Files:**
- Create: `v2/apps/web/lib/market-data/refresh-service.server.ts`
- Create: `v2/apps/web/app/api/internal/market-data-refresh/route.ts`
- Test: `v2/apps/web/test/market-data-refresh-route.test.ts`
- Modify: `v2/apps/web/.env.example`

**Interfaces:**
- Consumes: collectors and repository.
- Produces: exact `GET ?job=<job>` cron handling and `POST ?job=ae-dubai-transaction|ae-dubai-rent` CSV upload handling.

- [ ] Write route tests for exact bearer authorization, job allow-listing, missing configuration, successful counters, redacted failure responses, HTTPS-only Dubai URLs, and admin upload authorization.
- [ ] Run the focused test and confirm failure.
- [ ] Implement one-job-per-request orchestration, 300-second maximum duration, no-store responses, safe errors, and environment documentation.
- [ ] Re-run focused tests.

### Task 6: Production schedules and verification

**Files:**
- Modify: `v2/apps/web/vercel.json`
- Modify: `v2/apps/web/test/public-entity-projection-route.test.ts`
- Create: `v2/apps/web/test/market-data-refresh-cron.test.ts`

**Interfaces:**
- Consumes: the authenticated route.
- Produces: six isolated production schedules for Seoul sale/rent, Singapore sale/rent, and Dubai transaction/rent jobs without changing existing jobs.

- [ ] Write a config test that asserts unique paths, exact schedules, and ordering before nightly projection.
- [ ] Run the config test and confirm failure against the old configuration.
- [ ] Add the cron entries and adjust projection time only if required to run after dependent refreshes.
- [ ] Run focused tests, `pnpm test`, `pnpm typecheck`, `pnpm lint`, and `pnpm build`.
- [ ] Review `git diff --check`, confirm no credential values or uploaded raw CSV data entered the diff, commit, push the feature branch, and open a PR.
