# SignedPrice Singapore URA Intelligence Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build SignedPrice's first Singapore market from official URA private-residential sale transactions, with a server-only credential boundary, reproducible snapshot artifact, and evidence-gated Explore, area, and project routes.

**Architecture:** A new `@signedprice/singapore-property` package obtains a short-lived URA token, downloads all official transaction batches, strictly normalizes native Singapore records, and builds a digest-protected public snapshot. Web routes read that snapshot rather than calling URA per request. Singapore remains hidden from global navigation until rights, complete live data, exact-SHA Preview, and failure-state gates all pass.

**Tech Stack:** TypeScript 5.9, Node server fetch, Web Crypto/Node SHA-256, Next.js 16 App Router, React 19 Server Components, CSS Modules, Vitest 4, Playwright 1.62, Vercel environment variables and private server-side artifact storage.

**Spec:** `docs/superpowers/specs/2026-08-31-signedprice-global-trust-detail-singapore-design.md`

## Global Constraints

- Initial scope is URA private residential sale intelligence only; HDB, private rentals, forecasts, valuations, and investment recommendations remain separate.
- The credential environment name is `SIGNEDPRICE_URA_ACCESS_KEY`; its value never enters source, fixtures, artifacts, logs, errors, responses, analytics, or client bundles.
- Official URA token and data endpoints are called only by server code with bounded timeouts and all four documented transaction batches.
- Raw provider payloads are not committed; the canary persists field names, types, counts, version, and digest only.
- Dataset-specific conditions must permit the displayed operations before routes are exposed.
- Routes read a validated snapshot and never call URA on page requests.
- Money is safe integer SGD; area is source square metres; derived square feet uses exactly `1 sqm = 10.7639 sqft`; PSF and PSM labels are never interchanged.
- New sale, subsale, and resale remain distinct; HDB and private residential records never mix.
- Missing, incomplete, rights-blocked, or malformed evidence fails closed with no numeric substitution.
- All routes remain `noindex, follow`, without canonical, hreflang, or sitemap entries until a separate indexing approval.
- Korea and KoreaHomeGuide remain unchanged.

## Official References

- URA Data Service overview: `https://www.developer.tech.gov.sg/products/categories/data-and-apis/ura-apis/overview`
- URA access-key onboarding: `https://www.developer.tech.gov.sg/products/categories/data-and-apis/ura-apis/getting-started`
- URA API terms: `https://www.ura.gov.sg/eservices-info/maps/api-terms-of-service/`
- URA private residential transaction limitations: `https://eservice.ura.gov.sg/property-market-information/pmiResidentialTransactionSearch`

---

## File Responsibility Map

- `v2/packages/singapore-property/src/credential.ts`: server credential presence and redaction.
- `v2/packages/singapore-property/src/ura-client.ts`: token acquisition, timeout, retry, and four-batch transport.
- `v2/packages/singapore-property/src/ura-transaction.ts`: exact raw-envelope and normalized transaction parsing.
- `v2/packages/singapore-property/src/rights.ts`: URA dataset operations and attribution policy.
- `v2/packages/singapore-property/src/artifact.ts`: aggregation, reconciliation, canonical JSON, and digest.
- `v2/packages/singapore-property/src/browser.ts`: credential-free public enums, record, summary, and artifact types.
- `v2/scripts/ura-schema-canary.mts`: live schema-only diagnostic with no provider values.
- `v2/apps/web/lib/singapore/snapshot-repository.server.ts`: environment/private-object snapshot repository.
- `v2/apps/web/lib/singapore/route-model.server.ts`: entry, Explore, segment, and project models.
- `v2/apps/web/app/sg/**`: Singapore server routes.
- `v2/apps/web/components/singapore/**`: Singapore-native evidence components.

---

### Task 1: Singapore Package and Credential Boundary

**Files:**
- Create: `v2/packages/singapore-property/package.json`
- Create: `v2/packages/singapore-property/tsconfig.json`
- Create: `v2/packages/singapore-property/src/credential.ts`
- Create: `v2/packages/singapore-property/src/rights.ts`
- Create: `v2/packages/singapore-property/src/browser.ts`
- Create: `v2/packages/singapore-property/src/index.ts`
- Create: `v2/packages/singapore-property/test/credential.test.ts`
- Create: `v2/packages/singapore-property/test/rights.test.ts`
- Create: `v2/scripts/scan-singapore-client-boundary.mjs`
- Modify: `v2/package.json`

**Interfaces:**
- Consumes: server process environment only.
- Produces: `readUraCredential`, `redactUraDiagnostic`, `SG_URA_PRIVATE_SALE_RIGHTS`, browser-safe Singapore types, and `pnpm check:singapore-client-boundary`.

- [ ] **Step 1: Write failing credential and rights tests**

```ts
expect(() => readUraCredential({})).toThrow('URA access is not configured.');
const credential = readUraCredential({ SIGNEDPRICE_URA_ACCESS_KEY: 'test-only-key' });
expect(credential).toEqual({ accessKey: 'test-only-key' });
expect(Object.isFrozen(credential)).toBe(true);
expect(redactUraDiagnostic('Authorization test-only-key token')).toBe('URA provider request failed.');
expect(SG_URA_PRIVATE_SALE_RIGHTS.operations.display).toBe('requires_dataset_confirmation');
```

Assert blank keys reject, thrown messages never contain input text, and browser exports contain neither credential types nor endpoint strings.

- [ ] **Step 2: Run and verify RED**

Run: `cd v2 && pnpm exec vitest run packages/singapore-property/test/credential.test.ts packages/singapore-property/test/rights.test.ts`

Expected: FAIL because the package does not exist.

- [ ] **Step 3: Implement frozen browser-safe contracts**

```ts
export type SingaporeMarketSegment = 'CCR' | 'RCR' | 'OCR';
export type SingaporeSaleType = 'new_sale' | 'sub_sale' | 'resale';
export type SingaporePropertyType =
  | 'apartment' | 'condominium' | 'executive_condominium'
  | 'detached' | 'semi_detached' | 'terrace'
  | 'strata_detached' | 'strata_semi_detached' | 'strata_terrace';
export type SingaporeAreaBasis = 'strata' | 'land';
```

The server entry point may export credential functions; `./browser` exports only public types and constants. Rights operations are `ingest`, `aggregate`, `display`, `commercial`, and `index`, each `allowed`, `blocked`, or `requires_dataset_confirmation` with a dated source URL and note.

- [ ] **Step 4: Add a built-output boundary scanner**

Scan `.next/static`, `.next/server/app`, and generated source maps for the real environment variable name, token endpoint path, access-key header spelling, and a sentinel test credential. Permit provider strings only in server chunks that are unreachable from client references; fail if any appear in `.next/static`.

- [ ] **Step 5: Run package checks and commit**

Run: `cd v2 && pnpm exec vitest run packages/singapore-property/test/credential.test.ts packages/singapore-property/test/rights.test.ts && pnpm --filter @signedprice/singapore-property typecheck`

```bash
git add v2/packages/singapore-property v2/scripts/scan-singapore-client-boundary.mjs v2/package.json
git commit -m "feat(v2): establish Singapore credential boundary"
```

---

### Task 2: URA Token, Four-Batch Transport, and Strict Parser

**Files:**
- Create: `v2/packages/singapore-property/src/ura-client.ts`
- Create: `v2/packages/singapore-property/src/ura-transaction.ts`
- Create: `v2/packages/singapore-property/test/ura-client.test.ts`
- Create: `v2/packages/singapore-property/test/ura-transaction.test.ts`
- Create: `v2/packages/singapore-property/test/fixtures/ura-transaction-envelope.synthetic.json`
- Modify: `v2/packages/singapore-property/src/index.ts`

**Interfaces:**
- Consumes: URA token endpoint `https://www.ura.gov.sg/uraDataService/insertNewToken.action` and data endpoint `https://www.ura.gov.sg/uraDataService/invokeUraDS?service=PMI_Resi_Transaction&batch={1..4}`.
- Produces: `createUraClient({ accessKey, fetch, now, timeoutMs })`, `fetchPrivateResidentialTransactions()`, and `parseUraPrivateSaleEnvelope`.

- [ ] **Step 1: Write failing transport tests with a fake fetch**

Assert token first, then batches 1–4 exactly once in ascending order; headers contain `AccessKey` and token only on server calls; every response body is consumed once; timeout aborts; one transient 502 is retried once; 401/403, 429, timeout, schema error, and incomplete batch have distinct internal error codes but the public message remains sanitized.

```ts
expect(calls.map(({ url }) => url)).toEqual([
  TOKEN_URL,
  `${DATA_URL}?service=PMI_Resi_Transaction&batch=1`,
  `${DATA_URL}?service=PMI_Resi_Transaction&batch=2`,
  `${DATA_URL}?service=PMI_Resi_Transaction&batch=3`,
  `${DATA_URL}?service=PMI_Resi_Transaction&batch=4`,
]);
```

- [ ] **Step 2: Write failing exact parser tests**

The synthetic fixture mirrors the documented service shape: an exact envelope with `Status`, `Message`, and `Result`; project fields `project`, `street`, `x`, `y`, `marketSegment`; and transaction fields `area`, `floorRange`, `noOfUnits`, `contractDate`, `typeOfSale`, `price`, `propertyType`, `district`, `typeOfArea`, `tenure`. Assert normalization to safe integer SGD, decimal square metres, parsed month, native sale/property/area enums, and stable source order. Extra keys, missing keys, invalid numeric strings, non-positive price/area, unsafe money, invalid `MMYY`, unknown enum, and an empty batch all reject.

- [ ] **Step 3: Run and verify RED**

Run: `cd v2 && pnpm exec vitest run packages/singapore-property/test/ura-client.test.ts packages/singapore-property/test/ura-transaction.test.ts`

Expected: FAIL because transport and parser modules do not exist.

- [ ] **Step 4: Implement bounded server transport**

Use an `AbortController` per request with default `8_000ms`, maximum one retry for 502/503/504 only, and no retry for authentication, rights, quota, or parse failures. Reuse a token only within one collection run; do not persist it or include it in returned values.

- [ ] **Step 5: Implement exact parsing and normalization**

Validate exact object keys before conversion. Map URA labels through explicit exhaustive maps; do not lowercase unknown values into accepted enums. Preserve source `floorRange`, `tenure`, `district`, `project`, and `street` as trimmed display strings after rejecting control characters. Parse `contractDate` as the first day of its month for ordering, but retain the source month label.

- [ ] **Step 6: Run focused tests and commit**

Run: `cd v2 && pnpm exec vitest run packages/singapore-property/test/ura-client.test.ts packages/singapore-property/test/ura-transaction.test.ts && pnpm --filter @signedprice/singapore-property typecheck`

```bash
git add v2/packages/singapore-property/src/ura-client.ts v2/packages/singapore-property/src/ura-transaction.ts v2/packages/singapore-property/src/index.ts v2/packages/singapore-property/test
git commit -m "feat(v2): parse URA private sale transactions"
```

---

### Task 3: Live Schema Canary and Dataset Rights Gate

**Files:**
- Create: `v2/scripts/ura-schema-canary.mts`
- Create: `v2/tests/ura-schema-canary.test.ts`
- Create: `artifacts/singapore/ura-private-sale-schema.json`
- Modify: `v2/packages/singapore-property/src/rights.ts`
- Modify: `v2/packages/singapore-property/test/rights.test.ts`

**Interfaces:**
- Consumes: the configured server credential and official service.
- Produces: a sanitized schema manifest containing endpoint service name, batch count, envelope/project/transaction field names and JSON primitive types, record counts, retrieval instant, terms URLs, parser version, and SHA-256 digest; no provider values.

- [ ] **Step 1: Write the failing sanitizer test**

Given a fake live envelope, assert the manifest contains sorted field/type pairs and counts, but does not contain project names, streets, prices, coordinates, tenure values, transaction dates, access key, token, or headers. Assert any raw value match fails the test.

- [ ] **Step 2: Run and verify RED**

Run: `cd v2 && pnpm exec vitest run tests/ura-schema-canary.test.ts`

Expected: FAIL because the canary does not exist.

- [ ] **Step 3: Implement the canary**

The script exits non-zero for missing credential, non-four-batch retrieval, key/type mismatch against Task 2, blank batches, or rights sources unavailable. It writes only canonical sanitized JSON to `artifacts/singapore/ura-private-sale-schema.json` and prints only `URA schema canary passed: 4 batches, N projects, M transactions.`

- [ ] **Step 4: Run the live canary once**

Run from an environment where `SIGNEDPRICE_URA_ACCESS_KEY` is already configured:

```bash
cd v2 && pnpm exec tsx scripts/ura-schema-canary.mts
```

Expected: PASS, four batches, no secret in stdout or the artifact. If the live key/type set differs from Task 2, stop this track, update the synthetic fixture and exact parser to the observed official shape, rerun all Task 2 tests, and only then rerun the canary.

- [ ] **Step 5: Confirm dataset operations from official terms**

Update the rights record from `requires_dataset_confirmation` to `allowed` only for operations explicitly supported by the URA API terms, Singapore Open Data Licence, and any dataset-specific page reached through the registered account. Keep `index` blocked for this release even if display is permitted. Record review date and exact official URLs; do not encode a legal conclusion beyond those operations.

- [ ] **Step 6: Scan and commit sanitized evidence**

Run: `rg -n "AccessKey|Token|project|street|price|x|y|tenure|contractDate" artifacts/singapore/ura-private-sale-schema.json` and manually confirm only field names, never values. Then run `git diff --check`.

```bash
git add v2/scripts/ura-schema-canary.mts v2/tests/ura-schema-canary.test.ts artifacts/singapore/ura-private-sale-schema.json v2/packages/singapore-property/src/rights.ts v2/packages/singapore-property/test/rights.test.ts
git commit -m "chore(v2): verify URA sale schema and rights"
```

---

### Task 4: Reproducible Singapore Snapshot Artifact

**Files:**
- Create: `v2/packages/singapore-property/src/artifact.ts`
- Create: `v2/packages/singapore-property/test/artifact.test.ts`
- Create: `v2/scripts/build-singapore-snapshot.mts`
- Create: `v2/tests/singapore-snapshot-runner.test.ts`
- Modify: `v2/packages/singapore-property/src/browser.ts`
- Modify: `v2/packages/singapore-property/src/index.ts`

**Interfaces:**
- Consumes: normalized transactions from Task 2 and allowed rights from Task 3.
- Produces: `signedprice-singapore-private-sale-v1`, `buildSingaporeSnapshot`, `parseSingaporeSnapshot`, and a server-installable canonical JSON payload.

- [ ] **Step 1: Write failing artifact math and refusal tests**

The artifact stores records and summaries by `CCR`, `RCR`, `OCR` and project. A project ID is SHA-256 of canonical `marketSegment|district|project|street`, never display name alone. Each transaction stores integer SGD, decimal sqm, derived integer PSF, source area basis, sale type, property type, tenure, floor range, and contract month.

```ts
expect(toSquareFeet(100)).toBeCloseTo(1076.39, 8);
expect(calculatePsf(2_000_000, 100)).toBe(1858);
expect(snapshot.totals.transactions).toBe(
  snapshot.segments.reduce((sum, segment) => sum + segment.n, 0),
);
```

Assert medians/percentiles use raw values, summaries require a fixed publication minimum, unknown and excluded counts reconcile, project IDs are unique, covered period matches records, four source batches are complete, rights permit aggregation/display, and digest mismatch or altered record rejects.

- [ ] **Step 2: Run and verify RED**

Run: `cd v2 && pnpm exec vitest run packages/singapore-property/test/artifact.test.ts tests/singapore-snapshot-runner.test.ts`

Expected: FAIL because artifact functions and runner do not exist.

- [ ] **Step 3: Implement deterministic aggregation**

Sort records by contract month descending, then segment, district, normalized project, street, area, price, and sale type. Use a publication minimum of 5 for initial area/project summaries. Store `null` for unpublished aggregate metrics and never omit the count/reason. Use exact canonical JSON for digest calculation and deep-freeze parsed output.

- [ ] **Step 4: Implement the snapshot runner**

The runner calls the client once, builds once, validates the serialized artifact again, and writes to an explicit operator-provided output path. It logs only version, generated instant, period, project count, transaction count, exclusions, byte size, and digest. It refuses to write if rights display is not `allowed`.

- [ ] **Step 5: Measure and select storage**

Run the live builder to a temporary path and record byte size. If canonical JSON is at most `4 MiB`, install it through the existing encrypted server environment pattern. If larger, upload it to a private Vercel Blob/object with server-only read credentials and put only its URL plus expected digest in environment. Never commit the full live artifact.

- [ ] **Step 6: Run tests and commit code only**

Run: `cd v2 && pnpm exec vitest run packages/singapore-property/test/artifact.test.ts tests/singapore-snapshot-runner.test.ts && pnpm --filter @signedprice/singapore-property typecheck`

```bash
git add v2/packages/singapore-property/src/artifact.ts v2/packages/singapore-property/src/browser.ts v2/packages/singapore-property/src/index.ts v2/packages/singapore-property/test/artifact.test.ts v2/scripts/build-singapore-snapshot.mts v2/tests/singapore-snapshot-runner.test.ts
git commit -m "feat(v2): build Singapore sale snapshots"
```

---

### Task 5: Singapore Repository and Route Models

**Files:**
- Create: `v2/apps/web/lib/singapore/snapshot-repository.server.ts`
- Create: `v2/apps/web/lib/singapore/route-types.ts`
- Create: `v2/apps/web/lib/singapore/route-model.server.ts`
- Create: `v2/apps/web/test/singapore-snapshot-repository.test.ts`
- Create: `v2/apps/web/test/singapore-route-model.test.ts`
- Modify: `v2/packages/market-core/src/markets.ts`
- Modify: `v2/packages/market-core/test/markets.test.ts`

**Interfaces:**
- Consumes: installed Singapore snapshot plus exact digest and rights record.
- Produces: `createSingaporeSnapshotRepository`, `buildSingaporeEntryModel`, `buildSingaporeExploreModel`, `buildSingaporeSegmentModel`, `buildSingaporeProjectModel`, and ready/unavailable unions.

- [ ] **Step 1: Write failing repository tests**

Test environment JSON and private-object loader variants, exact digest, one read per repository, immutable return values, ready segment/project lookup, unknown identity, missing config, malformed payload, period mismatch, rights withdrawal, and network/storage failure. Every failure exposed to routes becomes `Verified Singapore evidence unavailable` without internal detail.

- [ ] **Step 2: Write failing route-model tests**

Assert native SGD labels, transaction count, covered period, sale-type separation, property-type labels, tenure, area basis, PSF/PSM distinction, source caveat limitations, publication refusal for `n < 5`, and no Korea/jeonse/HDB vocabulary. Assert numeric labels derive from typed numbers rather than copy literals.

- [ ] **Step 3: Run and verify RED**

Run: `cd v2 && pnpm exec vitest run apps/web/test/singapore-snapshot-repository.test.ts apps/web/test/singapore-route-model.test.ts packages/market-core/test/markets.test.ts`

Expected: FAIL because repository and route models do not exist and the Singapore profile still advertises HDB.

- [ ] **Step 4: Implement repository and immutable route unions**

Repository methods: `getMarket()`, `listSegments()`, `getSegment(segment)`, `listProjects(segment)`, `getProject(segment, projectId)`, and `listProjectRouteParams()`. Route models include Global Trust `EvidenceDescriptor`, source limitations, correction href, and explicit empty reasons.

- [ ] **Step 5: Correct the Singapore market profile**

Set the data label to `URA private residential sale intelligence`; keep product depth `market_intelligence`, intent capabilities `limited`, and the static private-residential data capability `limited`. Remove the current available HDB claim. The web readiness model, not this static profile, opens Singapore navigation only when the repository reports ready evidence and the active rights record permits display. This profile change alone must not expose navigation.

- [ ] **Step 6: Run tests and commit**

Run: `cd v2 && pnpm exec vitest run apps/web/test/singapore-snapshot-repository.test.ts apps/web/test/singapore-route-model.test.ts packages/market-core/test/markets.test.ts && pnpm lint && pnpm typecheck`

```bash
git add v2/apps/web/lib/singapore v2/apps/web/test/singapore-* v2/packages/market-core/src/markets.ts v2/packages/market-core/test/markets.test.ts
git commit -m "feat(v2): model Singapore sale intelligence"
```

---

### Task 6: Singapore Entry, Explore, Segment, Project, and Corrections UI

**Files:**
- Create: `v2/apps/web/components/singapore/singapore-explorer.tsx`
- Create: `v2/apps/web/components/singapore/singapore-segment-detail.tsx`
- Create: `v2/apps/web/components/singapore/singapore-project-detail.tsx`
- Create: `v2/apps/web/components/singapore/singapore.module.css`
- Create: `v2/apps/web/app/sg/page.tsx`
- Create: `v2/apps/web/app/sg/singapore/explore/page.tsx`
- Create: `v2/apps/web/app/sg/singapore/explore/[area]/page.tsx`
- Create: `v2/apps/web/app/sg/singapore/explore/[area]/[projectId]/page.tsx`
- Create: `v2/apps/web/app/sg/singapore/corrections/page.tsx`
- Create: `v2/apps/web/test/singapore-routes.test.tsx`

**Interfaces:**
- Consumes: Task 5 route models and shared Trust components.
- Produces: `/sg/`, `/sg/singapore/explore/`, `/sg/singapore/explore/[area]/`, `/sg/singapore/explore/[area]/[projectId]/`, and `/sg/singapore/corrections/`.

- [ ] **Step 1: Write failing SSR and metadata tests**

Assert ready and unavailable render states, complete routes from static params, native labels `SGD`, `PSF`, `PSM`, `CCR`, `RCR`, `OCR`, `New sale`, `Subsale`, `Resale`, visible source/period/coverage limitations, Trust/correction links, and no `KRW`, `jeonse`, `HDB`, forecast, valuation, asking-price, or recommendation copy. Assert no route has alternates and sitemap remains empty.

- [ ] **Step 2: Run and verify RED**

Run: `cd v2 && pnpm exec vitest run apps/web/test/singapore-routes.test.tsx apps/web/test/public-route-contract.test.tsx`

Expected: FAIL because Singapore routes and components do not exist.

- [ ] **Step 3: Implement server-first Singapore surfaces**

The entry explains supported private-sale evidence and unsupported rental/HDB boundaries. Explore compares CCR/RCR/OCR with counts and published distributions. Segment detail lists projects in deterministic order. Project detail renders distribution, sale-type composition, property types, tenure labels, and recent privacy-safe transactions from the artifact. No route is a Client Component unless a filter needs local enhancement; all evidence remains in raw server HTML.

- [ ] **Step 4: Implement corrections and metadata**

Use the shared empty correction ledger scoped to `sg-singapore`. Every page sets `robots: { index: false, follow: true }`, no alternates, and no structured-data monetary claim when evidence is unavailable.

- [ ] **Step 5: Run tests and commit**

Run: `cd v2 && pnpm exec vitest run apps/web/test/singapore-routes.test.tsx apps/web/test/singapore-route-model.test.ts apps/web/test/trust-components.test.tsx apps/web/test/public-route-contract.test.tsx && pnpm lint && pnpm typecheck`

```bash
git add v2/apps/web/components/singapore v2/apps/web/app/sg v2/apps/web/test/singapore-routes.test.tsx v2/apps/web/test/public-route-contract.test.tsx
git commit -m "feat(v2): render Singapore URA intelligence"
```

---

### Task 7: Navigation, Browser, Secret, and Promotion Gates

**Files:**
- Create: `v2/tests/e2e/singapore.spec.ts`
- Create: `v2/tests/e2e/singapore-snapshot-fixture.ts`
- Modify: `v2/tests/e2e/public-route-contract.ts`
- Modify: `v2/playwright.config.ts`
- Modify: `v2/tests/browser-ci-contract.test.ts`
- Create: `v2/tests/singapore-client-boundary.test.ts`
- Create: `docs/operations/signedprice-singapore-release-gate.md`
- Modify: `v2/apps/web/lib/site-copy.ts`
- Modify: `v2/apps/web/lib/route-model.ts`

**Interfaces:**
- Consumes: all Singapore tasks and one exact live snapshot installed in Vercel Preview.
- Produces: hidden-until-ready global navigation, complete browser verification, and a documented promotion hold.

- [ ] **Step 1: Write failing readiness navigation tests**

Assert Singapore is absent from global home/header when the snapshot is absent, malformed, rights-blocked, or incomplete; appears only when `buildSingaporeEntryModel().status === 'ready'`; and Dubai remains hidden. Direct unavailable routes remain claim-free and noindex.

- [ ] **Step 2: Add synthetic browser fixture and tests**

At 390px, 720px, 1366px, and 1440px assert entry → Explore → segment → project → back flow, keyboard order, 44px links, raw HTML evidence, count/summary reconciliation, PSF/PSM labels, zero overflow, no console error, no 5xx, and no provider call from any browser route. Exercise absent-artifact and rights-blocked builds separately.

- [ ] **Step 3: Add credential leak gates**

Build with a sentinel key, run both client-boundary scanners, inspect `.next/static` and response HTML, and assert the sentinel, real environment variable name, token endpoint, access-key header, and token never appear. Server tests may reference endpoint constants; client files may not.

- [ ] **Step 4: Run the complete local gate**

Run: `cd v2 && pnpm test && pnpm lint && pnpm typecheck && pnpm build && pnpm check:rent-client-boundary && pnpm check:singapore-client-boundary && pnpm exec playwright test tests/e2e/singapore.spec.ts tests/e2e/visible-foundation.spec.ts tests/e2e/contract-check.spec.ts tests/e2e/area-explore.spec.ts tests/e2e/rankings.spec.ts`

Expected: every command PASS.

- [ ] **Step 5: Deploy the exact SHA to protected Preview**

Install the live credential and snapshot reference in Preview scope only, confirm deployment Git SHA, then verify 4-batch artifact metadata, all ready routes, absent provider requests in browser telemetry, runtime error count, Trust/corrections, failure states, SEO containment, and Korea/KoreaHomeGuide preservation.

- [ ] **Step 6: Keep Production promotion explicitly blocked**

Do not merge or promote until the live schema canary, dataset-specific rights, full artifact, client-secret scan, exact-SHA browser gate, and user-visible Preview acceptance all pass. Record each evidence item in `signedprice-singapore-release-gate.md` with deployment ID and digest, never a credential.

- [ ] **Step 7: Commit release contracts**

```bash
git add v2/tests/e2e/singapore.spec.ts v2/tests/e2e/singapore-snapshot-fixture.ts v2/tests/e2e/public-route-contract.ts v2/playwright.config.ts v2/tests/browser-ci-contract.test.ts v2/tests/singapore-client-boundary.test.ts docs/operations/signedprice-singapore-release-gate.md v2/apps/web/lib/site-copy.ts v2/apps/web/lib/route-model.ts
git commit -m "test(v2): gate Singapore URA release"
```
