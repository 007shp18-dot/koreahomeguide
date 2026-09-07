# Singapore Nearby Evidence Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Collect official Singapore rail and school locations, seed nearest-place rows for coordinate-ready private and HDB buildings, and show them on SignedPrice detail pages.

**Architecture:** A deterministic gzip artifact separates network collection from production seeding. The existing `nearby_places` table and public entity projection carry the facts to server-rendered pages without weakening current snapshot fallbacks.

**Tech Stack:** Node.js ESM, TypeScript, Vitest, PostgreSQL/Neon, Next.js 16 App Router, React 19.

**Spec:** `v2/docs/superpowers/specs/2026-09-07-singapore-nearby-evidence-design.md`

## Global Constraints

- Modify only `v2/`.
- Deploy only Vercel project `prj_FlviCE6qvhYYScYNSIbrRSt7VDnd`.
- Keep compressed Singapore price/property snapshots as runtime fallbacks.
- Store straight-line distance only; do not claim walking time.
- Restrict database writes to Singapore building keys and official LTA/MOE/OneMap sources.

---

### Task 1: Deterministic official-data builder

**Files:**
- Create: `v2/apps/web/scripts/singapore-nearby-place-source.mjs`
- Create: `v2/apps/web/scripts/build-singapore-nearby-places.mjs`
- Test: `v2/apps/web/test/singapore-nearby-place-source.test.ts`

**Interfaces:**
- Consumes: property rows from `loadSingaporePrivateSeed()` and `loadSingaporeHdbSeed()`.
- Produces: validated nearest-place artifact rows and deterministic summary digest.

- [x] Write parser, exact-match, distance, and deterministic-output tests.
- [x] Run the focused test and confirm missing exports fail.
- [x] Implement the pure source functions and artifact loader.
- [x] Run the focused test and confirm it passes.
- [x] Implement the downloader with bounded retries, rate limiting, and resumable cache.
- [x] Collect the artifact and validate source/count metadata.

### Task 2: Singapore-only idempotent database seed

**Files:**
- Create: `v2/apps/web/scripts/seed-singapore-nearby-places.mjs`
- Modify: `v2/apps/web/package.json`
- Test: `v2/apps/web/test/singapore-nearby-place-seed-runner.test.ts`

**Interfaces:**
- Consumes: `loadSingaporeNearbyPlaceSeed()`.
- Produces: `createSingaporeNearbyPlaceSeedRunner(port, loadSeed)` and CLI seed/verify commands.

- [x] Write tests for batching, scope rejection, replay, and digest verification.
- [x] Run the focused test and confirm the runner is missing.
- [x] Implement scoped upsert and exact-source verification queries.
- [x] Run the focused test and confirm it passes.
- [x] Add `db:seed:singapore-nearby` and `db:verify:singapore-nearby` scripts.

### Task 3: Cross-market public projection

**Files:**
- Modify: `v2/apps/web/lib/public-data/entity-location-projection.server.ts`
- Test: `v2/apps/web/test/public-entity-projection.test.ts`

**Interfaces:**
- Consumes: entity IDs and `nearby_places` rows joined through `legacyBuildingKey`.
- Produces: `PublicEntityProximity` for Seoul and Singapore entities.

- [x] Add a failing test that requires the nearby query to use the property entity mapping and accept Singapore locations.
- [x] Run the focused test and confirm it fails on the Seoul-only query/validation.
- [x] Generalize the query and location market validation.
- [x] Run the focused test and confirm existing Seoul behavior and new Singapore behavior pass.

### Task 4: Singapore detail presentation

**Files:**
- Create: `v2/apps/web/components/singapore/singapore-nearby-places.tsx`
- Modify: `v2/apps/web/components/singapore/singapore-project-detail.tsx`
- Modify: `v2/apps/web/components/singapore/hdb-block-detail.tsx`
- Modify: `v2/apps/web/app/(en)/sg/singapore/explore/[area]/[projectId]/page.tsx`
- Modify: `v2/apps/web/app/(en)/sg/singapore/hdb/[town]/[blockId]/page.tsx`
- Modify: `v2/apps/web/components/singapore/singapore.module.css`
- Test: `v2/apps/web/test/singapore-routes.test.tsx`
- Test: `v2/apps/web/test/hdb-market-panel.test.tsx`

**Interfaces:**
- Consumes: `PublicEntityProximity | null` from the server page.
- Produces: an accessible nearby section with nearest rail, nearest school, source labels, and straight-line distance wording.

- [x] Add failing SSR tests for private and HDB nearby facts.
- [x] Run the focused tests and confirm props/content are missing.
- [x] Add the shared component and wire projections into both server pages.
- [x] Run the focused tests and confirm correct rendering and unavailable omission.

### Task 5: Production data and release verification

**Files:**
- Modify: `v2/docs/persistent-content-database.md`

**Interfaces:**
- Consumes: the generated artifact, Neon production URL, and SignedPrice Vercel project.
- Produces: verified production rows and released Singapore pages.

- [ ] Seed production and record the total/digest.
- [ ] Run the identical seed again and require zero changed rows.
- [ ] Verify Seoul/Dubai counts are unchanged.
- [ ] Run lint, typecheck, focused tests, full tests, and build.
- [ ] Commit, merge into the latest `main`, and deploy SignedPrice.
- [ ] Verify representative Singapore private/HDB routes and unchanged Seoul/Dubai routes in the browser.
