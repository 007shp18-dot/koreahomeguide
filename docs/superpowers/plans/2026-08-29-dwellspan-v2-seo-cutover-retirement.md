# DwellSpan V2 SEO Cutover and Legacy Retirement Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move KoreaHomeGuide URLs to verified V2 destinations in reversible cohorts, preserve search intent, and retire the legacy application without removing its redirect host.

**Architecture:** A versioned redirect manifest is compiled and tested in both repositories. V2 route readiness controls canonical, hreflang, sitemap, and indexing; the legacy edge applies only approved cohort mappings and emits measurable redirect outcomes.

**Tech Stack:** TypeScript, Node.js, Next.js metadata routes, legacy Vercel functions/config, Vitest, Node test runner, Playwright, search-performance exports

**Spec:** `docs/superpowers/specs/2026-08-29-dwellspan-v2-global-rebuild-design.md`

## Global Constraints

- Begin only after Korea parity and V2 private-beta gates pass.
- Do not deploy a redirect, remove `noindex`, or change a canonical without explicit production approval.
- Every material legacy URL maps to one substantively equivalent V2 destination.
- No home-page catch-all, redirect chain, loop, locale collapse, or mixed canonical destination.
- A cohort release changes redirect, V2 self-canonical, sitemap, hreflang, and internal links together.
- Random visitors never receive different canonical destinations for the same source URL.
- The legacy redirect domain remains owned, monitored, and recoverable after application retirement.

---

### Task 1: Build and validate the migration manifest

**Files:**
- Create in V2: `migrations/legacy-url-map/schema.ts`
- Create in V2: `migrations/legacy-url-map/manifest.json`
- Create in V2: `migrations/legacy-url-map/compile.ts`
- Create in V2: `migrations/legacy-url-map/validate.ts`
- Create in V2: `migrations/legacy-url-map/manifest.test.ts`
- Read from legacy: `artifacts/v2-migration/legacy-static-routes.json`
- Read from legacy: `artifacts/v2-migration/legacy-seo-contracts.json`

**Interfaces:**
- Produces: `MigrationEntry = { source, destination, cohort, locale, status, evidenceId }`
- Produces: `validateManifest(entries, legacyInventory, v2Routes): MigrationValidation`
- Produces: `compileApprovedRedirects(entries): RedirectRule[]`

- [ ] **Step 1: Write exactness and loop tests**

```ts
it('requires one approved destination for every released source', () => {
  expect(validateManifest(duplicateSourceManifest, legacy, v2).errors).toContain('duplicate_source:/guides/');
});

it('rejects home-page catch-all and redirect chains', () => {
  expect(validateManifest(badManifest, legacy, v2).errors).toEqual(
    expect.arrayContaining(['unrelated_destination:/old-building/:/', 'redirect_chain:/a/:/b/:/c/']),
  );
});
```

- [ ] **Step 2: Run and verify missing-validator failure**

Run: `pnpm vitest run migrations/legacy-url-map/manifest.test.ts`

Expected: FAIL because the manifest schema and validator are missing.

- [ ] **Step 3: Implement a closed manifest schema**

```ts
export const MigrationEntrySchema = z.object({
  source: z.string().regex(/^\//), destination: z.string().url(),
  cohort: z.enum(['guides', 'markets', 'rent-check', 'explorer', 'buildings', 'primary-entry']),
  locale: z.enum(['en', 'zh']), status: z.enum(['draft', 'verified', 'approved', 'released', 'rolled_back']),
  evidenceId: z.string().min(1),
}).strict();
```

The initial manifest contains every inventoried source with `draft` status. Compilation emits only `approved` and `released` entries.

- [ ] **Step 4: Generate draft mappings and validate coverage**

Run: `pnpm tsx migrations/legacy-url-map/compile.ts --legacy ../koreahomeguide/artifacts/v2-migration --write-draft && pnpm vitest run migrations/legacy-url-map/manifest.test.ts`

Expected: PASS; unmapped legacy URLs are reported as draft coverage gaps and no redirect rules are emitted for them.

- [ ] **Step 5: Commit the manifest system**

```bash
git add migrations/legacy-url-map
git commit -m "feat: add verified legacy URL manifest"
```

### Task 2: Couple V2 indexing metadata to migration readiness

**Files:**
- Modify in V2: `packages/seo/src/readiness.ts`
- Create in V2: `packages/seo/src/alternates.ts`
- Create in V2: `packages/seo/src/sitemap-entry.ts`
- Create in V2: `packages/seo/test/migration-readiness.test.ts`
- Modify in V2: `apps/web/app/sitemap.ts`
- Create in V2: `tests/e2e/seo-readiness.spec.ts`

**Interfaces:**
- Produces: `buildAlternates(route, locales): Languages<string>`
- Produces: `buildSitemapEntry(route): MetadataRoute.Sitemap[number]`
- Produces: `evaluateMigrationSeo(input): { robots, canonical, sitemapEntry }`
- Consumes: migration status, content readiness, data state, and `canIndex`

- [ ] **Step 1: Write atomic metadata tests**

```ts
it('does not self-canonicalize or enter sitemap before approval', () => {
  const result = evaluateMigrationSeo(draftRoute);
  expect(result).toMatchObject({ robots: 'noindex,nofollow', sitemapEntry: null });
});

it('builds reciprocal English and Chinese alternates for an approved route', () => {
  expect(buildAlternates('/kr/seoul/tools/rent-check/', ['en', 'zh'])).toEqual({
    en: 'https://v2.example/kr/seoul/tools/rent-check/',
    zh: 'https://v2.example/zh/kr/seoul/tools/rent-check/',
  });
});
```

- [ ] **Step 2: Run and verify readiness failure**

Run: `pnpm vitest run packages/seo/test/migration-readiness.test.ts`

Expected: FAIL because migration-aware metadata is absent.

- [ ] **Step 3: Implement one readiness decision**

```ts
const indexable = input.migrationStatus === 'approved'
  && input.contentReady
  && input.canIndex
  && ['fresh', 'stale'].includes(input.dataState);

return indexable
  ? { robots: 'index,follow', canonical: input.v2Url, sitemapEntry: buildSitemapEntry(input.route) }
  : { robots: 'noindex,nofollow', canonical: null, sitemapEntry: null };
```

- [ ] **Step 4: Run metadata, build, and E2E checks**

Run: `pnpm vitest run packages/seo && pnpm --filter @dwellspan/web build && pnpm e2e tests/e2e/seo-readiness.spec.ts`

Expected: PASS; reciprocal alternates exist only for complete locales, and blocked data never enters sitemap.

- [ ] **Step 5: Commit V2 indexing gates**

```bash
git add packages/seo apps/web/app/sitemap.ts tests/e2e/seo-readiness.spec.ts
git commit -m "feat: couple V2 indexing to migration readiness"
```

### Task 3: Add a preview-only redirect compiler to the legacy app

**Files:**
- Create in legacy: `lib/v2-redirect-manifest.cjs`
- Create in legacy: `api/v2-redirect.js`
- Create in legacy: `tests/v2-redirect-manifest.test.cjs`
- Create in legacy: `artifacts/v2-migration/approved-redirects.json`
- Modify in legacy: `vercel.json` only if it already exists; otherwise create it with explicit approved rules

**Interfaces:**
- Produces: `resolveV2Redirect(requestUrl, manifest): { status: 301, location } | null`
- Consumes: compiled approved redirects from Task 1

- [ ] **Step 1: Write query-preservation and no-catch-all tests**

```js
test('redirects the approved Rent Check path in one hop', () => {
  assert.deepEqual(resolveV2Redirect('https://koreahomeguide.com/tools/seoul-rent-check/?size=50', manifest), {
    status: 301,
    location: 'https://v2.example/kr/seoul/tools/rent-check/?size=50',
  });
});

test('leaves an unapproved route on the legacy app', () => {
  assert.equal(resolveV2Redirect('https://koreahomeguide.com/explore/', manifest), null);
});
```

- [ ] **Step 2: Run and verify resolver failure**

Run: `node --test tests/v2-redirect-manifest.test.cjs`

Expected: FAIL because the resolver is missing.

- [ ] **Step 3: Implement exact pathname matching**

```js
function resolveV2Redirect(requestUrl, manifest) {
  const url = new URL(requestUrl);
  const entry = manifest.find((item) => item.source === url.pathname && item.status === 'approved');
  if (!entry) return null;
  const target = new URL(entry.destination);
  target.search = url.search;
  return { status: 301, location: target.toString() };
}
```

Strip tracking parameters only when an approved manifest policy explicitly lists them; retain functional query parameters.

- [ ] **Step 4: Verify only in local and Preview environments**

Run: `node --test tests/v2-redirect-manifest.test.cjs && vercel build && git diff --check`

Expected: PASS; Preview returns 301 for approved fixtures, 200 for unreleased legacy routes, and no production alias is changed.

- [ ] **Step 5: Commit the preview redirect implementation**

```bash
git add lib/v2-redirect-manifest.cjs api/v2-redirect.js tests/v2-redirect-manifest.test.cjs artifacts/v2-migration/approved-redirects.json vercel.json
git commit -m "feat: add cohort-based V2 redirects"
```

### Task 4: Create cohort verification and rollback evidence

**Files:**
- Create in V2: `scripts/migration/verify-cohort.ts`
- Create in V2: `scripts/migration/rollback-cohort.ts`
- Create in V2: `scripts/migration/cohort-metrics.ts`
- Create in V2: `scripts/migration/verify-cohort.test.ts`
- Create in V2: `docs/operations/seo-cohort-runbook.md`
- Create in V2: `artifacts/migration/cohort-evidence.schema.json`

**Interfaces:**
- Produces: `verifyCohort(cohort, legacyBase, v2Base): Promise<CohortEvidence>`
- Produces: `rollbackCohort(cohort, manifest): MigrationEntry[]`
- Evidence includes source status, hop count, destination status, canonical, hreflang, sitemap, robots, structured-data, and performance deltas

- [ ] **Step 1: Write failing rollback-scope test**

```ts
it('rolls back only the requested cohort', () => {
  const result = rollbackCohort('guides', releasedManifest);
  expect(result.filter((item) => item.cohort === 'guides').every((item) => item.status === 'rolled_back')).toBe(true);
  expect(result.filter((item) => item.cohort !== 'guides')).toEqual(releasedManifest.filter((item) => item.cohort !== 'guides'));
});
```

- [ ] **Step 2: Run and verify missing-tool failure**

Run: `pnpm vitest run scripts/migration/verify-cohort.test.ts`

Expected: FAIL because verification and rollback tools are missing.

- [ ] **Step 3: Implement evidence-based release decisions**

```ts
export type CohortEvidence = {
  cohort: Cohort;
  checkedAt: string;
  routes: Array<{ source: string; status: number; hops: number; destination: string; canonical: string | null; robots: string }>;
  errors: string[];
  searchDelta: { clicks: number | null; impressions: number | null; indexed: number | null };
};
```

The runbook requires exact pre-release and post-release evidence commands, owner, observation window, rollback command, and approval record.

- [ ] **Step 4: Run against legacy and V2 Preview URLs**

Run: `pnpm tsx scripts/migration/verify-cohort.ts --cohort guides --legacy "$LEGACY_PREVIEW_URL" --v2 "$V2_PREVIEW_URL" --out artifacts/migration/guides-preview.json && pnpm vitest run scripts/migration/verify-cohort.test.ts`

Expected: PASS with zero loops, zero chains, correct self-canonical destinations, and no production mutation.

- [ ] **Step 5: Commit cohort tooling**

```bash
git add scripts/migration docs/operations/seo-cohort-runbook.md artifacts/migration/cohort-evidence.schema.json
git commit -m "test: verify and roll back SEO cohorts"
```

### Task 5: Execute an approved cohort release

**Files:**
- Modify in V2: `migrations/legacy-url-map/manifest.json`
- Generate in legacy: `artifacts/v2-migration/approved-redirects.json`
- Create in V2: `artifacts/migration/{cohort}-{date}.json`
- Modify in V2: `docs/operations/seo-cohort-runbook.md`

**Interfaces:**
- Consumes: explicit production approval for one named cohort
- Produces: a released manifest version and production evidence for that cohort

- [ ] **Step 1: Record the approved cohort and immutable manifest checksum**

```bash
pnpm tsx migrations/legacy-url-map/compile.ts --cohort guides --status approved --out artifacts/migration/guides-approved.json
sha256sum artifacts/migration/guides-approved.json
```

Expected: every entry has `approved` status and an evidence ID; unmatched routes remain legacy 200 responses.

- [ ] **Step 2: Run the complete pre-production gate**

Run: `pnpm lint && pnpm typecheck && pnpm test && pnpm build && pnpm e2e tests/e2e/seo-readiness.spec.ts && pnpm tsx scripts/migration/verify-cohort.ts --cohort guides --legacy "$LEGACY_PREVIEW_URL" --v2 "$V2_PREVIEW_URL" --out artifacts/migration/guides-preflight.json`

Expected: all checks PASS and evidence errors are empty.

- [ ] **Step 3: Stop for explicit production approval**

Present the commit IDs, Preview URLs, manifest checksum, route count, test output, rollback command, and evidence file. Do not promote either deployment until the founder approves this exact cohort.

- [ ] **Step 4: Promote the approved builds and verify production**

Run after approval: `pnpm tsx scripts/migration/verify-cohort.ts --cohort guides --legacy https://koreahomeguide.com --v2 "$V2_PRODUCTION_URL" --out artifacts/migration/guides-production.json`

Expected: every released source returns one 301 to a 200 V2 self-canonical destination; unreleased sources retain legacy behaviour.

- [ ] **Step 5: Commit release evidence or execute scoped rollback**

```bash
git add migrations/legacy-url-map/manifest.json artifacts/migration/guides-production.json docs/operations/seo-cohort-runbook.md
git commit -m "release: migrate approved guide URLs to V2"
```

If evidence has an error, run `pnpm tsx scripts/migration/rollback-cohort.ts --cohort guides`, deploy only the regenerated legacy manifest, verify legacy 200 responses, and commit the rollback evidence instead.

### Task 6: Retire the legacy application after all cohort gates

**Files:**
- Create in legacy: `docs/operations/legacy-retirement-evidence.md`
- Modify in legacy: `vercel.json`
- Modify in V2: `docs/operations/seo-cohort-runbook.md`
- Create in V2: `scripts/migration/verify-retirement.ts`
- Create in V2: `scripts/migration/verify-retirement.test.ts`

**Interfaces:**
- Produces: `verifyRetirement(input): RetirementEvidence`
- Requires explicit founder approval after evidence reports `eligible: true`

- [ ] **Step 1: Write the retirement eligibility test**

```ts
it('rejects retirement when a material route lacks a redirect or V2 index target', () => {
  expect(verifyRetirement(incompleteEvidence)).toMatchObject({
    eligible: false,
    blockers: expect.arrayContaining(['missing_redirect:/explore/', 'v2_not_indexed:/kr/seoul/explore/']),
  });
});
```

- [ ] **Step 2: Run and verify missing-verifier failure**

Run: `pnpm vitest run scripts/migration/verify-retirement.test.ts`

Expected: FAIL because the retirement verifier is absent.

- [ ] **Step 3: Implement all retirement predicates**

```ts
const eligible = evidence.missingMaterialRedirects.length === 0
  && evidence.coreV2IndexTargets.every((route) => route.indexed)
  && evidence.stabilityWindowPassed
  && evidence.koreaLiveChecksPassed
  && evidence.redirectHostOwner !== null
  && evidence.founderApprovalId !== null;
```

- [ ] **Step 4: Generate evidence and stop for approval**

Run: `pnpm tsx scripts/migration/verify-retirement.ts --manifest migrations/legacy-url-map/manifest.json --out artifacts/migration/retirement-evidence.json`

Expected before founder approval: `eligible: false` with only `founder_approval_missing` after every technical predicate passes.

- [ ] **Step 5: Archive the app while retaining redirects**

After explicit approval, replace legacy application rewrites with the fully verified redirect manifest, retain monitoring and domain renewal, tag the final legacy commit, archive the repository without deleting it, and verify a representative URL from every cohort plus all legacy 404 and locale behaviours.

Commit:

```bash
git add vercel.json docs/operations/legacy-retirement-evidence.md
git commit -m "release: retire KoreaHomeGuide application"
```
