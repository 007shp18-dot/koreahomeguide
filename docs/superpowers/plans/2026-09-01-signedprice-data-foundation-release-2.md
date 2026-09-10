# SignedPrice Data Foundation Release 2 Implementation Plan

> **Execution:** Use `superpowers:executing-plans` task by task. Every behavior change starts with a failing focused test and ends with the full release gates.

**Goal:** Replace the legacy `45–55㎡` pure-jeonse publication boundary with verified all-area jeonse, monthly-rent, and sale evidence while keeping each transaction, area, housing type, and rental contract group independently gated.

**Architecture:** Reuse the complete seven-month MOLIT rental cache and add a separate complete sale cache. Both feed strict multi-cohort evidence artifacts keyed by observed building identity. The installed snapshot registry activates rent and sale independently; route models keep discovery available when a selected price cohort is withheld. Browser traffic reads only verified public projections and never calls MOLIT.

**Tech stack:** TypeScript 5.9.3, Vitest 4.1.11, Next.js 16.3.3 App Router, React 19.2.8, Vercel Runtime Cache, pnpm 11.19.0

**Approved specifications:**

- `docs/superpowers/specs/2026-09-01-signedprice-korea-singapore-data-foundation-design.md`
- `docs/superpowers/specs/2026-09-01-signedprice-unified-market-explorer-v2-design.md`
- `docs/superpowers/specs/2026-09-01-signedprice-unified-building-decision-detail-design.md`

## Global constraints

- Default Korea evidence uses `area=all`; `under-40`, `40-60`, `60-85`, and `85-plus` remain separately selectable exact cohorts.
- Jeonse is `depositWon > 0 && monthlyRentWon === 0`; monthly rent is `monthlyRentWon > 0` and retains both filed money fields.
- Sale, jeonse, and monthly rent never share a distribution or recent-transaction list.
- Rental `new`, `renewal`, `unknown`, and `all` counts reconcile. Sale uses `not-applicable`.
- Every exact cohort requires at least five non-cancelled records before price publication.
- The `all` area cohort is an explicitly selected aggregate; it never substitutes for a thin selected band.
- Building identity remains discoverable when every selected evidence cohort is withheld.
- Page traffic never calls MOLIT and no source key, raw row, provider error, or internal token enters a client bundle.
- Snapshot activation remains digest-, schema-, period-, count-, source-completeness-, and rights-verified and fail-closed.
- No Production promotion happens until exact-SHA Preview verification passes.

---

### Task 0: Separate the two Vercel project build boundaries

**Files:**

- Modify: `vercel.json`
- Create: `v2/apps/web/vercel.json`
- Create: `v2/apps/web/test/vercel-project-boundary.test.ts`

- [x] Write a behavioral test that executes each configured ignore command against controlled Git histories.
- [x] Prove the test fails without project-specific build boundaries.
- [x] Make KoreaHomeGuide build only for legacy-root changes and SignedPrice build only for `v2/**` changes.
- [x] Run focused and full Vitest suites.

### Task 1: Define strict Korea evidence cohorts

**Files:**

- Create: `v2/packages/korea-rent/src/evidence-cohorts.ts`
- Create: `v2/packages/korea-rent/test/evidence-cohorts.test.ts`
- Modify: `v2/packages/korea-rent/src/index.ts`
- Modify: `v2/packages/korea-rent/src/browser.ts`

**Produces:** `KoreaEvidenceTransaction`, `KoreaEvidenceAreaBand`, `KoreaEvidenceContractGroup`, `classifyAreaBand`, `selectRentEvidenceRecords`, and `buildRentEvidenceDistribution`.

- [x] Test exact area boundaries at 40, 60, and 85㎡; test `all` independently.
- [x] Test jeonse/monthly separation, cancellations, zero-money rejection, contract groups, integer money, publication minimum, and signed three-month change.
- [x] Implement pure selectors and distributions without changing the legacy artifact.
- [x] Run focused tests and commit the cohort contract.

### Task 2: Build a multi-cohort Korea rental evidence artifact

**Files:**

- Create: `v2/packages/korea-rent/src/rent-evidence.ts`
- Create: `v2/packages/korea-rent/test/rent-evidence.test.ts`
- Create: `v2/apps/web/lib/public-market/rent-evidence-schema.ts`
- Create: `v2/apps/web/lib/public-market/rent-evidence-artifact-builder.server.ts`
- Create: `v2/apps/web/test/rent-evidence-artifact.test.ts`

**Produces:** one `kr-rent` payload containing district and building records for `jeonse | monthly`, every approved area band, every supported housing type, and applicable rental contract groups.

- [x] Test district totals, building identity, transaction/area/group uniqueness, unknown reconciliation, period membership, and exact-cohort withholding.
- [x] Prove monthly distributions publish monthly rent only while retaining a separate deposit distribution and recent filed pairs.
- [x] Prove jeonse distributions publish deposits only and include every positive-area record in `all`.
- [x] Test strict schema keys, provenance, digest, record count, and malformed/cross-period rejection.
- [x] Implement the minimal package builder and server artifact encoder.

### Task 3: Finalize all rental artifacts from the existing 700-coordinate cache

**Files:**

- Modify: `v2/packages/korea-rent/src/public-summary-job.ts`
- Create: `v2/apps/web/app/api/internal/korea-rent-snapshot/route.ts`
- Create: `v2/apps/web/lib/public-market/korea-rent-job-handler.server.ts`
- Create: `v2/apps/web/test/korea-rent-job-handler.test.ts`

- [x] Test Preview-only, bearer-token, method, canonical instant, cursor, configuration, retry, and coverage failures.
- [x] Reuse the existing complete rental-month store; do not duplicate provider calls per artifact.
- [x] Finalize observed inventory and `kr-rent` only after all 700 coordinates exist; conversion remains Task 8.
- [x] Return downloadable public artifacts and digests without raw rows or credentials.
- [x] Keep the previous verified installed artifacts active on any failure.

### Task 4: Add complete MOLIT sale adapters and cache

**Files:**

- Create: `v2/packages/korea-rent/src/sale.ts`
- Create: `v2/packages/korea-rent/src/sale-source-month-store.ts`
- Create: `v2/packages/korea-rent/test/sale.test.ts`
- Create: `v2/packages/korea-rent/test/sale-source-month-store.test.ts`

**Supports:** apartment, officetel, row-house/multifamily, and detached/multifamily-house sale services through independently declared official endpoints and parser versions.

- [x] Test paginated parsing, source month/district reconciliation, integer KRW, area, building identity fields, cancellation status, stable-id conflicts, provider errors, timeouts, and total-count changes.
- [x] Test each housing-type endpoint explicitly; never fall back to rentals or another housing type.
- [x] Add a sale-specific runtime-cache namespace and completeness contract.

### Task 5: Build and collect the `kr-sale` snapshot

**Files:**

- Create: `v2/packages/korea-rent/src/sale-evidence.ts`
- Create: `v2/packages/korea-rent/src/sale-summary-job.ts`
- Create: `v2/packages/korea-rent/test/sale-evidence.test.ts`
- Create: `v2/packages/korea-rent/test/sale-summary-job.test.ts`
- Create: `v2/apps/web/lib/public-market/sale-evidence-schema.ts`
- Create: `v2/apps/web/lib/public-market/sale-evidence-artifact-builder.server.ts`
- Create: `v2/apps/web/app/api/internal/korea-sale-snapshot/route.ts`

- [x] Test the 25-district × 4-housing-type × 7-month complete plan.
- [x] Publish sale price distributions independently for all five area bands and observed building identities.
- [x] Exclude cancellations and reconcile active, cancelled, unmatched, published, and withheld counts.
- [x] Fail closed for any missing coordinate, page, rights gate, schema mismatch, or digest mismatch.

### Task 6: Install rent and sale repositories independently

**Files:**

- Modify: `v2/apps/web/data/installed-snapshots.json`
- Modify: `v2/apps/web/lib/snapshots/installed-snapshot-repository.server.ts`
- Create: `v2/apps/web/lib/public-market/rent-evidence-repository.server.ts`
- Create: `v2/apps/web/lib/public-market/sale-evidence-repository.server.ts`
- Create: `v2/apps/web/test/korea-evidence-repositories.test.ts`

- [x] Test independent `kr-rent` and `kr-sale` activation, missing dataset, period mismatch, count mismatch, digest mismatch, and last-known-good behavior.
- [ ] Keep the legacy 45–55㎡ artifact readable for one migration release but never use it as the default new Explore evidence.

### Task 7: Connect Explore, Detail, and Rankings to transaction and area state

**Files:**

- Modify: `v2/apps/web/lib/navigation/explorer-selection.ts`
- Modify: `v2/apps/web/lib/public-market/area-route-model.server.ts`
- Modify: `v2/apps/web/lib/public-market/building-route-model.server.ts`
- Modify: `v2/apps/web/lib/public-market/rankings-route-model.server.ts`
- Modify: `v2/apps/web/components/public-market/area-explorer.tsx`
- Modify: the corresponding Explore, Detail, and Rankings route tests and styles.

- [ ] Test canonical `transaction`, `area`, `property`, and rental `contractType` restoration across Explore → Detail → Back.
- [ ] Make `전세 / 월세 / 매매` real controls and keep the selected building on transaction changes.
- [ ] Default to `area=all`; never display `45–55㎡` copy unless that exact legacy cohort is explicitly selected during migration.
- [ ] Show separate filed deposit and monthly rent for monthly evidence.
- [ ] Rank one exact transaction/housing/area cohort only; use Top five and Bottom five first.
- [ ] Preserve identity-only withheld states without district-average substitution.

### Task 8: Activate Check only with verified conversion evidence

**Files:**

- Modify: `v2/packages/korea-rent/src/conversion-artifact.ts`
- Modify: `v2/apps/web/lib/contract-check/*`
- Modify: Contract Check tests and route components.

- [ ] Derive conversion curves from compatible monthly-rent pairs with exact period, area, housing type, and disclosed sample gates.
- [ ] Test each offer as `monthly rent + deposit × annual opportunity rate ÷ 12` for the approved opportunity-cost comparison.
- [ ] Keep measured deposit conversion and user opportunity-cost assumptions visually and mathematically separate.
- [ ] Allow zero monthly rent and empty optional inputs; never turn empty input into zero.
- [ ] Render the four-line calculation ledger and fail closed outside verified evidence.

### Task 9: Preview generation, release verification, and Production promotion

**Files:**

- Add only privacy-safe compressed public artifacts and matching registry records.
- Do not commit raw source caches, service keys, internal tokens, or provider responses.

- [ ] Push the exact feature SHA and confirm only SignedPrice builds for `v2/**` changes.
- [ ] Generate all 700 rental and 700 sale coordinates in Preview with server-only secrets.
- [ ] Validate schemas, digests, periods, counts, exclusion reconciliation, and client-secret boundaries.
- [ ] Run full Vitest, typecheck, lint, Production build, client-boundary scans, and browser flows at 390/720/1366/1440.
- [ ] Verify apex redirect, `www` HTTPS, mobile navigation, Explore, Detail, Rankings, and Check on the exact Preview SHA.
- [ ] Request code review, merge the PR, verify the Production SHA and runtime logs, and retain rollback to the prior installed snapshots.
