# SignedPrice Global Property Core Implementation Plan

> **For Codex:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Give Seoul, Singapore, and Dubai one durable identity, observation, provenance, capability, and media contract without flattening their market-specific data.

**Architecture:** Add an additive global core beside the existing Korea and Singapore artifacts. Project current records through market adapters, compare the new read model with existing public results, and only switch consumers after parity and rights checks pass. Market-specific fields remain versioned extensions; public UI reads typed capabilities rather than inferring availability from routes.

**Tech Stack:** PostgreSQL/Neon, Next.js 16 App Router, TypeScript, Vitest, existing `@signedprice/market-core`, `@signedprice/korea-rent`, and `@signedprice/singapore-property` packages.

---

### Task 1: Lock the global identity and capability contract

**Files:**
- Create: `v2/packages/market-core/src/property-identity.ts`
- Create: `v2/packages/market-core/src/market-capabilities.ts`
- Modify: `v2/packages/market-core/src/index.ts`
- Test: `v2/packages/market-core/test/property-identity.test.ts`
- Test: `v2/packages/market-core/test/market-capabilities.test.ts`

- [ ] Write failing cases for hierarchical entity kinds, source-scoped external identifiers, verified/ambiguous identity states, and versioned local attributes.
- [ ] Write failing cases proving Seoul supports transaction detail, Singapore separates private/HDB capability, and Dubai never exposes rights-blocked transaction detail.
- [ ] Run `pnpm --filter @signedprice/market-core exec vitest run test/property-identity.test.ts test/market-capabilities.test.ts` and confirm RED.
- [ ] Implement readonly types, parsers, and capability resolvers; export them from `src/index.ts`.
- [ ] Re-run the focused tests and confirm GREEN.

### Task 2: Add the additive database core

**Files:**
- Create: `v2/apps/web/db/migrations/0003_global_property_core.sql`
- Modify: `v2/apps/web/scripts/apply-content-database.mjs`
- Test: `v2/apps/web/test/migration-manifest-registry.test.ts`
- Test: `v2/apps/web/test/global-property-schema.test.ts`

- [ ] Add failing manifest assertions for migration `0003_global_property_core.sql`.
- [ ] Define `geographies`, `property_entities`, `entity_aliases`, `external_identifiers`, `rights_policies`, `datasets`, `source_records`, `observations`, `evidence_releases`, `metric_definitions`, `metric_observations`, `market_capabilities`, and `media_assets`.
- [ ] Enforce market-scoped uniqueness, parent-child foreign keys, native currency amounts, observation status, media rights/status, and source-record deduplication.
- [ ] Keep current `districts`, `buildings`, `transactions`, and `building_photos` intact for dual-read migration.
- [ ] Run the migration against an ephemeral database or transaction rollback harness and confirm repeatability.

### Task 3: Adapt existing Seoul and Singapore records

**Files:**
- Create: `v2/apps/web/lib/global-property/seoul-adapter.server.ts`
- Create: `v2/apps/web/lib/global-property/singapore-adapter.server.ts`
- Create: `v2/apps/web/lib/global-property/global-property-repository.server.ts`
- Test: `v2/apps/web/test/global-property-seoul-adapter.test.ts`
- Test: `v2/apps/web/test/global-property-singapore-adapter.test.ts`

- [ ] Write failing fixtures proving Korean `sale`, `jeonse`, and `monthly-rent` preserve contract semantics and KRW source values.
- [ ] Write failing fixtures proving URA private projects and HDB blocks remain distinct entity/sector types in SGD.
- [ ] Implement deterministic stable IDs and source-scoped external identifier mapping.
- [ ] Reject unverified entity matches from public observation joins.
- [ ] Re-run focused adapter tests and confirm GREEN.

### Task 4: Expose one public market read model

**Files:**
- Create: `v2/apps/web/lib/global-property/public-market-model.server.ts`
- Modify: `v2/apps/web/lib/design-review/editorial-growth-review-model.server.ts`
- Test: `v2/apps/web/test/public-global-market-model.test.ts`

- [ ] Write failing cases for `ready`, `limited`, `rights_blocked`, `stale`, and `insufficient` presentation states.
- [ ] Include source, observed period, release date, sample size, currency, housing sector, and limitations beside each metric.
- [ ] Return action capabilities separately from evidence values so routes cannot imply unavailable tools.
- [ ] Prove the model renders a truthful status when optional Postgres is absent.

### Task 5: Prove dual-read parity before cutover

**Files:**
- Create: `v2/apps/web/scripts/check-global-read-parity.mjs`
- Create: `v2/apps/web/docs/runbooks/global-property-cutover.md`
- Test: `v2/apps/web/test/global-read-parity.test.ts`

- [ ] Compare current Seoul building/transaction outputs with the new projection for stable ID, transaction count, date, area, and amount.
- [ ] Compare current Singapore project/HDB artifacts with the new projection without merging sectors.
- [ ] Fail the checker on missing source lineage, currency drift, or capability widening.
- [ ] Document migrate, backfill, shadow-read, cutover, and rollback commands.
- [ ] Do not remove legacy tables in this program.

### Task 6: Verify the foundation

- [ ] Run the focused tests above.
- [ ] Run `pnpm --filter @signedprice/market-core typecheck`.
- [ ] Run `pnpm --filter @signedprice/web test` and `pnpm --filter @signedprice/web typecheck`.
- [ ] Run `pnpm --filter @signedprice/web lint`.
- [ ] Commit only after migration repeatability and dual-read parity evidence are recorded.
