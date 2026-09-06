# Photo and Location Coverage Scale Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Increase truthful building-photo coverage by connecting official coordinates, normalizing existing nearby-place facts, and raising free-provider throughput without changing the Google monthly budget.

**Architecture:** The existing property seed derives verified URA project coordinates and publishes them to the existing location projection. K-apt school and subway strings are projected into existing nearby-place rows. The photo runner gains bounded concurrent NAVER work and larger explicit free-provider batches while retaining durable retry, review, rights, and cost gates.

**Tech Stack:** Node.js ESM, TypeScript, Neon Postgres, Next.js 16, Vitest, Vercel Cron, NAVER Search, Wikimedia Commons, Google Places.

**Spec:** `v2/docs/superpowers/specs/2026-09-06-property-evidence-database-design.md`

## Global Constraints

- All repository changes stay under `v2/`.
- Never mutate Dubai or weaken the existing photo approval policy.
- Keep Google at five requests and USD 0.16 per day.
- Never persist NAVER thumbnails or raw search payloads.
- Keep provider calls bounded to the Vercel execution window.
- Preserve existing approved photos and compressed JSON fallback.

---

### Task 1: Seed official Singapore private-project coordinates

**Files:**
- Modify: `v2/apps/web/scripts/property-seed-source.mjs`
- Modify: `v2/apps/web/scripts/seed-property-core.mjs`
- Modify: `v2/apps/web/test/property-seed-source.test.ts`
- Create: `v2/apps/web/test/property-location-seed.test.ts`

**Interfaces:**
- Produces: WGS84 coordinates for 3,402 unambiguous URA projects and verified `public_entity_locations` rows.
- Consumes: SVY21 `x`/`y` values from `singapore-private-sale.json.gz` and rights policy `sg-ura-private-sale-v1`.

- [ ] **Step 1: Write failing coordinate-count and conflict tests**

Assert 3,402 private seed rows have valid Singapore coordinates, 460 remain null, and the known conflicting project remains null. Assert all HDB coordinates remain null.

- [ ] **Step 2: Run the focused tests and verify the current zero-coordinate failure**

Run: `pnpm vitest run apps/web/test/property-seed-source.test.ts apps/web/test/property-location-seed.test.ts`

- [ ] **Step 3: Derive one accepted project coordinate**

Group private records by `projectId`, reject projects whose valid SVY21 points differ by more than 250 metres, convert the accepted point to WGS84, and reject coordinates outside Singapore bounds.

- [ ] **Step 4: Project verified coordinates during the existing seed**

Continue updating `buildings` and `property_entities` through existing changed-row guards. Upsert `public_entity_locations` only for accepted coordinates with precision `parcel`, provider `URA`, verified status, and the URA rights policy. Do not delete prior reviewed locations.

- [ ] **Step 5: Run focused tests and verify counts**

Run: `pnpm vitest run apps/web/test/property-seed-source.test.ts apps/web/test/property-location-seed.test.ts apps/web/test/singapore-project-location.test.ts`

- [ ] **Step 6: Commit coordinate seeding**

```sh
git add v2/apps/web/scripts/property-seed-source.mjs v2/apps/web/scripts/seed-property-core.mjs v2/apps/web/test/property-seed-source.test.ts v2/apps/web/test/property-location-seed.test.ts
git commit -m "feat(signedprice): seed verified URA project locations"
```

### Task 2: Normalize K-apt nearby places

**Files:**
- Create: `v2/apps/web/scripts/kapt-nearby-place-source.mjs`
- Create: `v2/apps/web/scripts/seed-kapt-nearby-places.mjs`
- Create: `v2/apps/web/test/kapt-nearby-place-source.test.ts`
- Modify: `v2/apps/web/package.json`
- Modify: `v2/docs/property-core-seed.md`

**Interfaces:**
- Produces: deterministic station and school rows keyed by K-apt building and source label.
- Consumes: `kapt-building-facts.json.gz`, existing `buildings`, and `nearby_places`.

- [ ] **Step 1: Write failing parser tests against representative official strings**

Assert `1호선(수도권,녹천)` yields a station named `녹천` with line `1호선(수도권)` and `5분이내` yields five walking minutes. Assert school strings produce distinct named schools, ignore empty trailing values, and never invent distance or coordinates.

- [ ] **Step 2: Run the parser test and verify the module is absent**

Run: `pnpm vitest run apps/web/test/kapt-nearby-place-source.test.ts`

- [ ] **Step 3: Implement deterministic extraction**

Create provider IDs from K-apt code, kind, and normalized source name. Retain the original official text in source metadata where the schema permits it. Deduplicate repeated school names per building.

- [ ] **Step 4: Implement changed-row upserts**

Write only Seoul K-apt station/school rows. Use `ON CONFLICT (building_key, kind, provider_id) DO UPDATE` with an `IS DISTINCT FROM` guard. A replay must leave timestamps and counts unchanged.

- [ ] **Step 5: Run parser and replay tests**

Run: `pnpm vitest run apps/web/test/kapt-nearby-place-source.test.ts apps/web/test/seeded-building-enrichment.test.ts`

- [ ] **Step 6: Commit nearby-place normalization**

```sh
git add v2/apps/web/scripts/kapt-nearby-place-source.mjs v2/apps/web/scripts/seed-kapt-nearby-places.mjs v2/apps/web/test/kapt-nearby-place-source.test.ts v2/apps/web/package.json v2/docs/property-core-seed.md
git commit -m "feat(signedprice): normalize official nearby places"
```

### Task 3: Increase free photo discovery throughput safely

**Files:**
- Modify: `v2/apps/web/lib/photos/photo-backfill.server.ts`
- Modify: `v2/apps/web/lib/photos/building-photo-store.server.ts`
- Modify: `v2/apps/web/test/photo-backfill.test.ts`
- Modify: `v2/apps/web/test/building-photo-candidates.test.ts`
- Modify: `v2/apps/web/vercel.json`
- Modify: `v2/docs/operations/photo-coverage-backfill.md`

**Interfaces:**
- Produces: a concurrency-limited NAVER runner and explicit per-provider maximum batch sizes.
- Consumes: existing provider health, daily usage, retry rows, and identity policy.

- [ ] **Step 1: Write failing bounded-concurrency tests**

Use delayed provider calls to assert at most five NAVER requests run simultaneously, input order is preserved in the returned entity IDs, one 401/403 pauses subsequent work, and a retry does not select a not-due entity.

- [ ] **Step 2: Run focused tests and verify the sequential implementation fails**

Run: `pnpm vitest run apps/web/test/photo-backfill.test.ts apps/web/test/building-photo-candidates.test.ts`

- [ ] **Step 3: Implement a five-worker bounded mapper**

Process NAVER results in groups of five. Persist one aggregate attempt per entity after its result completes. Stop scheduling new groups after an authentication or quota failure. Return entity IDs in stable database order.

- [ ] **Step 4: Raise only free-provider batch ceilings**

Allow NAVER batches up to 100 and Wikimedia batches up to 60. Keep Google discovery at 30 internally and retain the five-request/USD 0.16 daily gate. Schedule NAVER at 100 per hour and Wikimedia at 60 per hour only after the test-branch replay succeeds.

- [ ] **Step 5: Run focused photo tests**

Run: `pnpm vitest run apps/web/test/photo-backfill.test.ts apps/web/test/building-photo-candidates.test.ts apps/web/test/photo-coverage-route.test.ts apps/web/test/photo-and-news-safety.test.ts`

- [ ] **Step 6: Commit throughput controls**

```sh
git add v2/apps/web/lib/photos/photo-backfill.server.ts v2/apps/web/lib/photos/building-photo-store.server.ts v2/apps/web/test/photo-backfill.test.ts v2/apps/web/test/building-photo-candidates.test.ts v2/apps/web/vercel.json v2/docs/operations/photo-coverage-backfill.md
git commit -m "feat(signedprice): scale free photo discovery"
```

### Task 4: Test-branch replay and production rollout

**Files:**
- Modify only files under `v2/` if verification exposes a test-first defect.

**Interfaces:**
- Consumes: Neon test/main branches, Vercel production, and the existing photo approval workflow.
- Produces: verified coordinates, nearby-place rows, active free-provider collection, and unchanged paid caps.

- [ ] **Step 1: Apply location and nearby-place seeds on the test branch twice**

Confirm 3,402 verified URA locations, stable nearby-place counts/digests, unchanged property ID digests, and unchanged Dubai counts/digests.

- [ ] **Step 2: Run one bounded NAVER and Wikimedia slice twice**

Confirm the second run selects new or retry-due entities without duplicate attempts or candidates. Inspect the candidate queue for cross-country and generic-name false positives before scheduling the larger limits.

- [ ] **Step 3: Apply the same seeds to production**

Repeat location and nearby-place verification on `br-super-butterfly-b31hhh93`, then deploy the larger free-provider schedule. Keep Google environment caps unchanged.

- [ ] **Step 4: Verify production browser behavior**

Check representative Seoul, Singapore private, Singapore HDB, no-photo, and Dubai routes. Verify approved photos remain primary, provider attribution works, maps use accepted coordinates, and missing images retain the neutral fallback.

- [ ] **Step 5: Run repository verification and integrate**

Run `pnpm lint`, `pnpm typecheck`, `pnpm test`, and `pnpm build`. Push a reviewable PR, wait for required checks, merge, wait for the Vercel production deployment, and repeat the browser checks against `www.signedprice.com`.
