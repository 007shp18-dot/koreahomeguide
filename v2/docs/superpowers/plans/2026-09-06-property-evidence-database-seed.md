# Property Evidence Database Seed Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Seed the verified row-level Seoul and Singapore transaction evidence and HDB block metrics into Neon without inventing absent source rows.

**Architecture:** A pure source projector validates installed snapshot versions and hashes, emits deterministic database rows, and exposes paged batches. A separate operator script applies metadata, source records, observations, and metrics with conflict-safe writes and then verifies counts and stable content digests. Existing artifact repositories remain the public aggregate-data fallback.

**Tech Stack:** Node.js ESM, Neon Postgres, checked-in gzip JSON snapshots, SHA-256, Vitest.

**Spec:** `v2/docs/superpowers/specs/2026-09-06-property-evidence-database-design.md`

## Global Constraints

- All repository changes stay under `v2/`.
- Seed only `kr-seoul` and `sg-singapore`; never mutate Dubai.
- Store only source rows present in the checked-in artifacts.
- Preserve installed compressed snapshots and all existing public artifact readers.
- Expected row-level source records: 374,261.
- Expected observations linked to the verified property inventory: 361,760.
- Expected unlinked Seoul sale source records: 12,501.
- Expected HDB metric rows: 40,044.
- Repeated seeds must preserve row counts and deterministic digests.

---

### Task 1: Project verified artifacts into deterministic evidence rows

**Files:**
- Create: `v2/apps/web/scripts/property-evidence-seed-source.mjs`
- Create: `v2/apps/web/test/property-evidence-seed-source.test.ts`

**Interfaces:**
- Produces: `loadPropertyEvidenceSeed()`, `propertyEvidenceSeedPage(kind, offset, limit)`, and summary counts/digests.
- Consumes: `installed-snapshots.json`, `korea-rent-evidence.json.gz`, `korea-sale-evidence.json.gz`, `singapore-private-sale.json.gz`, and `singapore-hdb.json.gz`.

- [ ] **Step 1: Write a failing source-summary test**

```ts
expect(loadPropertyEvidenceSeed().summary).toMatchObject({
  koreaRentObservations: 177_641,
  koreaSaleObservations: 62_678,
  singaporePrivateObservations: 133_942,
  observationTotal: 374_261,
  hdbMetricRows: 40_044,
});
```

Assert that every observation entity ID belongs to Seoul or Singapore, every content hash is 64 lowercase hexadecimal characters, business keys are unique inside each dataset, and two loads return identical digests.

- [ ] **Step 2: Run the focused test and verify it fails because the source module is absent**

Run: `pnpm vitest run apps/web/test/property-evidence-seed-source.test.ts`

- [ ] **Step 3: Implement canonical hashing and snapshot validation**

Validate every artifact's schema version, installed registry dataset ID, JSON payload SHA-256, record count semantics, and market. Hash canonical JSON with sorted object keys. Fail closed on a mismatch.

- [ ] **Step 4: Emit row-level observations and HDB metrics**

Use `kr-seoul:estate:<buildingId>`, `sg-singapore:project:<projectId>`, and `sg-singapore:block:<blockId>` subjects. Preserve reported months, amounts, areas, floor information, tenure, sale type, and source order in typed columns or `local_attributes`. Emit HDB rental/resale median and sample-count metric rows for every block.

- [ ] **Step 5: Run the focused test and verify exact counts and repeatable digests**

Run: `pnpm vitest run apps/web/test/property-evidence-seed-source.test.ts`

- [ ] **Step 6: Commit the verified source projector**

```sh
git add v2/apps/web/scripts/property-evidence-seed-source.mjs v2/apps/web/test/property-evidence-seed-source.test.ts
git commit -m "feat(signedprice): project verified property evidence"
```

### Task 2: Add replay-safe evidence constraints

**Files:**
- Create: `v2/apps/web/db/migrations/0010_property_evidence_seed.sql`
- Create: `v2/apps/web/test/property-evidence-migration.test.ts`
- Modify: `v2/apps/web/test/migration-manifest-registry.test.ts`

**Interfaces:**
- Produces: one deterministic metric-observation identity constraint and indexes for dataset/entity/date reads.
- Consumes: the global schema created in migrations `0003` and `0004`.

- [ ] **Step 1: Write a failing additive-migration test**

Assert that migration `0010` exists, creates no replacement transaction table, adds a unique metric observation index over definition/release/entity/period, and contains no `DROP`, `TRUNCATE`, or Dubai identifier.

- [ ] **Step 2: Run the migration tests and verify the missing-file failure**

Run: `pnpm vitest run apps/web/test/property-evidence-migration.test.ts apps/web/test/migration-manifest-registry.test.ts`

- [ ] **Step 3: Add the indexes**

```sql
CREATE UNIQUE INDEX IF NOT EXISTS metric_observations_seed_identity
  ON metric_observations (
    metric_definition_id, evidence_release_id, subject_entity_id,
    period_start, period_end
  ) WHERE subject_entity_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS observations_market_entity_date
  ON observations (market_id, subject_entity_id, observed_at DESC)
  WHERE status = 'active';
```

- [ ] **Step 4: Run the migration tests and verify they pass**

Run: `pnpm vitest run apps/web/test/property-evidence-migration.test.ts apps/web/test/migration-manifest-registry.test.ts`

- [ ] **Step 5: Commit the additive migration**

```sh
git add v2/apps/web/db/migrations/0010_property_evidence_seed.sql v2/apps/web/test/property-evidence-migration.test.ts v2/apps/web/test/migration-manifest-registry.test.ts
git commit -m "feat(signedprice): constrain evidence seed replay"
```

### Task 3: Implement the idempotent evidence seed runner

**Files:**
- Create: `v2/apps/web/scripts/seed-property-evidence.mjs`
- Create: `v2/apps/web/test/property-evidence-seed-runner.test.ts`
- Modify: `v2/apps/web/package.json`
- Modify: `v2/docs/property-core-seed.md`

**Interfaces:**
- Produces: `db:seed:evidence`, `db:verify:evidence`, `--dry-run`, `--verify-only`, bounded paging, and a JSON-safe aggregate report.
- Consumes: Task 1 pages and Task 2 constraints.

- [ ] **Step 1: Write failing runner tests for replay and scope**

Use an in-memory SQL port to assert that a second identical run reports zero inserted rows, metadata uses update-only-when-changed semantics, batch size stays at or below 1,000, and no statement selects or mutates `ae-dubai`.

- [ ] **Step 2: Run the runner test and verify it fails because the runner is absent**

Run: `pnpm vitest run apps/web/test/property-evidence-seed-runner.test.ts`

- [ ] **Step 3: Implement metadata and row writes**

Upsert four rights policies, four datasets, four evidence releases, four HDB metric definitions, source records, observations, and metric observations. Use `jsonb_to_recordset` bounded batches and transactions. Set release `record_count` to the installed upstream count and store the installed object URL and SHA-256.

- [ ] **Step 4: Implement verification**

Verify per-dataset source/observation counts, metric counts, orphan counts, source content digest, observation identity digest, entity market scope, and the unchanged property entity ID digests. Report Dubai counts and deterministic table digests before and after without updating Dubai rows.

- [ ] **Step 5: Run focused tests and dry-run locally**

Run:

```sh
pnpm vitest run apps/web/test/property-evidence-seed-source.test.ts apps/web/test/property-evidence-seed-runner.test.ts
pnpm --filter @signedprice/web db:seed:evidence -- --dry-run
```

- [ ] **Step 6: Commit the seed runner and operations documentation**

```sh
git add v2/apps/web/scripts/seed-property-evidence.mjs v2/apps/web/test/property-evidence-seed-runner.test.ts v2/apps/web/package.json v2/docs/property-core-seed.md
git commit -m "feat(signedprice): seed verified transaction evidence"
```

### Task 4: Apply and replay the evidence seed

**Files:**
- Modify only files under `v2/` if a verified defect requires a test-first fix.

**Interfaces:**
- Consumes: Neon test branch `br-patient-sky-b3ssnche` and production branch `br-super-butterfly-b31hhh93`.
- Produces: migration and seed reports with exact counts/digests.

- [ ] **Step 1: Apply migration `0010` and seed the Neon test branch**

Supply the pooled branch connection through `DATABASE_URL` without printing it. Record aggregate counts and digests only.

- [ ] **Step 2: Run the identical test-branch seed a second time**

Confirm all evidence counts and digests are unchanged, no orphans exist, property ID digests remain expected, and Dubai counts/digests match the pre-seed snapshot.

- [ ] **Step 3: Apply and replay on Neon production**

Run the same migration, seed, replay, and verification on `br-super-butterfly-b31hhh93`. Keep checked-in snapshot loading enabled.

- [ ] **Step 4: Record aggregate verification evidence**

Update `v2/docs/property-core-seed.md` with date, dataset counts, deterministic digests, test/main branch IDs, and Dubai invariants. Never record credentials or connection strings.
