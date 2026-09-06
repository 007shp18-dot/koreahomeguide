# All-Building Photo Coverage Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Attempt every seeded Seoul and Singapore property entity, publish every exact provider photo that passes identity and rights checks, and record a truthful visual-coverage state for every entity.

**Architecture:** Keep licensed assets and stable provider place IDs in the existing approval path, add a coverage projection keyed by property entity, and run bounded resumable provider batches. Google Places supplies live provider galleries, NAVER Image Search supplies non-persistent review leads, Wikimedia supplies licensed candidates, and existing NAVER/Google street-view components remain labelled fallbacks.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript 5.9, Neon Postgres, Vitest, Google Maps JavaScript/Places APIs, NAVER Search API, Wikimedia Commons API, Vercel cron and sensitive environment variables.

**Spec:** `v2/docs/superpowers/specs/2026-09-06-all-building-photo-coverage-design.md`

## Global Constraints

- All repository changes stay under `v2/`.
- Cover `kr-seoul` and `sg-singapore`; do not mutate Dubai data or behavior.
- Preserve all existing photo approvals and the compressed JSON read fallback.
- Never persist Google photo bytes or expiring Google photo resource names.
- Never persist raw NAVER image-search payloads or thumbnails as public media.
- Require exact identity evidence, source attribution, rights state, approval actor, and visual-review time before public projection.
- Label street view and parent-project media truthfully and exclude them from exact-photo counts.
- Keep paid-provider request and spend caps finite and configurable.
- Use test-first changes and commit each independently reviewable task.

---

### Task 1: Persist per-entity photo coverage

**Files:**
- Create: `v2/apps/web/db/migrations/0008_building_photo_coverage.sql`
- Create: `v2/apps/web/lib/photos/photo-coverage-store.server.ts`
- Create: `v2/apps/web/test/photo-coverage-store.test.ts`
- Modify: `v2/apps/web/db/migrations/0007_building_enrichment_operations.sql` only if the migration loader requires a canonical pipeline list in an existing assertion

**Interfaces:**
- Produces: `PhotoCoverageState`, `PhotoCoverageSummary`, `syncPhotoCoverage(limit?: number, marketId?: 'kr-seoul' | 'sg-singapore')`, and `readPhotoCoverageSummary()`.
- Consumes: `contentDatabase()` from `lib/db/postgres.server.ts` and current `property_entities`, `buildings`, `building_photos`, and `public_entity_media` rows.

- [ ] **Step 1: Write store tests that fail because coverage storage does not exist**

```ts
it('reports exact and visual coverage separately', async () => {
  const summary = await readPhotoCoverageSummary();
  expect(summary).toEqual({
    total: 3,
    exactPhoto: 1,
    providerPhoto: 1,
    parentPhoto: 0,
    streetView: 0,
    unavailable: 1,
    complete: 3,
  });
});
```

- [ ] **Step 2: Run the focused tests and confirm the missing migration/module failure**

Run: `pnpm vitest run apps/web/test/photo-coverage-store.test.ts`

Expected: FAIL because `photo-coverage-store.server.ts` does not exist.

- [ ] **Step 3: Add the migration**

```sql
CREATE TABLE IF NOT EXISTS building_photo_coverage (
  entity_id text PRIMARY KEY REFERENCES property_entities(id) ON UPDATE CASCADE ON DELETE CASCADE,
  market_id text NOT NULL REFERENCES markets(key) ON UPDATE CASCADE ON DELETE RESTRICT,
  state text NOT NULL CHECK (state IN ('exact-photo', 'provider-photo', 'parent-photo', 'street-view', 'unavailable')),
  building_photo_id bigint REFERENCES building_photos(id) ON UPDATE CASCADE ON DELETE SET NULL,
  parent_entity_id text REFERENCES property_entities(id) ON UPDATE CASCADE ON DELETE SET NULL,
  provider text,
  reason text,
  policy_version text NOT NULL,
  checked_at timestamptz NOT NULL,
  next_retry_at timestamptz NOT NULL,
  attempt_count integer NOT NULL DEFAULT 0 CHECK (attempt_count >= 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (entity_id <> coalesce(parent_entity_id, ''))
);

CREATE INDEX IF NOT EXISTS building_photo_coverage_retry
  ON building_photo_coverage (market_id, next_retry_at, entity_id);

CREATE TABLE IF NOT EXISTS photo_provider_health (
  provider text PRIMARY KEY,
  state text NOT NULL CHECK (state IN ('ready', 'paused', 'not-configured')),
  reason text,
  paused_until timestamptz,
  checked_at timestamptz NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS photo_provider_daily_usage (
  provider text NOT NULL,
  usage_date date NOT NULL,
  request_count integer NOT NULL DEFAULT 0 CHECK (request_count >= 0),
  estimated_cost_microusd bigint NOT NULL DEFAULT 0 CHECK (estimated_cost_microusd >= 0),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (provider, usage_date)
);

ALTER TABLE building_photos
  ADD COLUMN IF NOT EXISTS match_policy_version text,
  ADD COLUMN IF NOT EXISTS match_confidence numeric(5, 4),
  ADD COLUMN IF NOT EXISTS match_evidence jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS provider_source_uri text,
  ADD COLUMN IF NOT EXISTS provider_checked_at timestamptz;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'building_photos_match_confidence_check'
  ) THEN
    ALTER TABLE building_photos ADD CONSTRAINT building_photos_match_confidence_check
      CHECK (match_confidence IS NULL OR (match_confidence >= 0 AND match_confidence <= 1));
  END IF;
END $$;

ALTER TABLE building_enrichment_attempts DROP CONSTRAINT IF EXISTS building_enrichment_attempts_pipeline_check;
ALTER TABLE building_enrichment_attempts ADD CONSTRAINT building_enrichment_attempts_pipeline_check
  CHECK (pipeline IN (
    'photo-wikimedia', 'photo-google', 'photo-naver-search',
    'photo-naver-panorama', 'photo-google-street-view',
    'photo-coverage', 'official-building-facts'
  ));
```

- [ ] **Step 4: Implement the coverage store with idempotent upserts and aggregate reads**

```ts
export type PhotoCoverageState =
  | 'exact-photo' | 'provider-photo' | 'parent-photo' | 'street-view' | 'unavailable';

export type PhotoCoverageSummary = Readonly<{
  total: number;
  exactPhoto: number;
  providerPhoto: number;
  parentPhoto: number;
  streetView: number;
  unavailable: number;
  complete: number;
}>;

export async function syncPhotoCoverage(
  limit = 300,
  marketId?: 'kr-seoul' | 'sg-singapore',
): Promise<Readonly<{ checked: number; updated: number }>>;

export async function readPhotoCoverageSummary(): Promise<PhotoCoverageSummary>;
```

The synchronization query must prefer approved exact `public_entity_media`, then an approved Google place row mapped through `buildings`, then an approved parent entity medium. It writes `unavailable` only after all enabled providers have a current terminal attempt; entities without terminal attempts are absent from this table and count as incomplete.

- [ ] **Step 5: Run the focused tests and confirm they pass**

Run: `pnpm vitest run apps/web/test/photo-coverage-store.test.ts`

Expected: PASS with no warnings.

- [ ] **Step 6: Commit the schema and store**

```bash
git add v2/apps/web/db/migrations/0008_building_photo_coverage.sql v2/apps/web/lib/photos/photo-coverage-store.server.ts v2/apps/web/test/photo-coverage-store.test.ts
git commit -m "feat(signedprice): track property photo coverage"
```

### Task 2: Make photo identity matching strict and explainable

**Files:**
- Create: `v2/apps/web/lib/photos/photo-identity-policy.ts`
- Create: `v2/apps/web/test/photo-identity-policy.test.ts`
- Modify: `v2/apps/web/lib/photos/building-photo-store.server.ts`
- Modify: `v2/apps/web/test/building-photo-candidates.test.ts`

**Interfaces:**
- Produces: `scorePhotoIdentity(input): PhotoIdentityDecision`, `selectWikimediaPhotoCandidate(building, pages)`, and policy version `photo-identity-v1`.
- Consumes: canonical name, aliases, market, address, postal code, coordinates, provider name/address/coordinates, and Commons metadata.

- [ ] **Step 1: Write failing tests for generic names, conflicting markets, and exact addresses**

```ts
it('rejects a generic Singapore name when the Commons result is in another country', () => {
  expect(selectWikimediaPhotoCandidate({
    name: 'The Interlace', market: 'singapore', address: 'Depot Road, Singapore',
  }, [commonsPage('Interlace Apartments London.jpg', 'London, England')])).toBeNull();
});

it('auto-approves a provider place only when name and locality evidence agree', () => {
  expect(scorePhotoIdentity({
    market: 'singapore', canonicalName: 'RIVERGATE', aliases: [],
    address: '99 ROBERTSON QUAY SINGAPORE 238258', postalCode: '238258',
    providerName: 'RiverGate', providerAddress: '99 Robertson Quay, Singapore 238258',
    entityLocation: null, providerLocation: null, hasPhoto: true,
  })).toMatchObject({ disposition: 'auto-approve', policyVersion: 'photo-identity-v1' });
});
```

- [ ] **Step 2: Run the focused tests and confirm the permissive selector fails them**

Run: `pnpm vitest run apps/web/test/photo-identity-policy.test.ts apps/web/test/building-photo-candidates.test.ts`

Expected: FAIL because the current selector accepts a title substring without market/address evidence.

- [ ] **Step 3: Implement a pure scoring policy**

```ts
export type PhotoIdentityDecision = Readonly<{
  disposition: 'auto-approve' | 'review' | 'reject';
  confidence: number;
  policyVersion: 'photo-identity-v1';
  evidence: readonly string[];
}>;

export function scorePhotoIdentity(input: PhotoIdentityInput): PhotoIdentityDecision;
```

Set `auto-approve` only for name plus postal-code agreement, or name plus locality agreement and coordinate distance at most 250 metres. A country conflict, explicit block/tower conflict, missing photo, or normalized name shorter than five characters returns `reject`. Complete name with locality but without independent coordinate or postal evidence returns `review`.

- [ ] **Step 4: Route Commons and Google candidates through the policy**

Pass building market and address into `selectWikimediaPhotoCandidate`. Request Google `places.location` and `places.googleMapsUri` in addition to current fields. Persist the decision confidence, evidence, and policy version on candidate rows after Task 1's migration is present. Existing approved rows remain unchanged on conflict.

- [ ] **Step 5: Run the focused tests and confirm they pass**

Run: `pnpm vitest run apps/web/test/photo-identity-policy.test.ts apps/web/test/building-photo-candidates.test.ts`

Expected: PASS, including the existing high-resolution preference test.

- [ ] **Step 6: Commit the identity policy**

```bash
git add v2/apps/web/lib/photos/photo-identity-policy.ts v2/apps/web/lib/photos/building-photo-store.server.ts v2/apps/web/test/photo-identity-policy.test.ts v2/apps/web/test/building-photo-candidates.test.ts
git commit -m "fix(signedprice): require exact photo identity evidence"
```

### Task 3: Enable NAVER Image Search as a non-persistent review source

**Files:**
- Create: `v2/apps/web/lib/photos/naver-image-search.server.ts`
- Create: `v2/apps/web/app/api/internal/naver-image-candidates/route.ts`
- Create: `v2/apps/web/test/naver-image-search.test.ts`
- Create: `v2/apps/web/test/naver-image-candidates-route.test.ts`
- Modify: `v2/apps/web/.env.example`

**Interfaces:**
- Produces: `searchNaverBuildingImages(input): Promise<NaverImageCandidateResult>` and authenticated `GET /api/internal/naver-image-candidates?buildingKey=...`.
- Consumes: `NAVER_SEARCH_CLIENT_ID`/`NAVER_SEARCH_CLIENT_SECRET`, falling back to the existing `NAVER_NEWS_CLIENT_ID`/`NAVER_NEWS_CLIENT_SECRET` pair.

- [ ] **Step 1: Write failing adapter and route tests**

```ts
it('queries the official NAVER image endpoint without caching results', async () => {
  const result = await searchNaverBuildingImages({
    buildingName: '개포래미안포레스트',
    address: '서울특별시 강남구 개포동',
    display: 20,
  });
  expect(fetch).toHaveBeenCalledWith(
    expect.stringContaining('https://openapi.naver.com/v1/search/image'),
    expect.objectContaining({ cache: 'no-store' }),
  );
  expect(result.candidates[0]).toMatchObject({ sourceDocumentUrl: expect.any(String) });
});

it('never writes NAVER thumbnails to building_photos', async () => {
  await GET(authorizedRequest('building-key'));
  expect(sqlCalls.join('\n')).not.toContain('INSERT INTO building_photos');
});
```

- [ ] **Step 2: Run the focused tests and confirm the module/route failures**

Run: `pnpm vitest run apps/web/test/naver-image-search.test.ts apps/web/test/naver-image-candidates-route.test.ts`

Expected: FAIL because the adapter and route do not exist.

- [ ] **Step 3: Implement the server-only NAVER adapter**

```ts
export type NaverImageCandidate = Readonly<{
  title: string;
  temporaryImageUrl: string;
  temporaryThumbnailUrl: string;
  sourceDocumentUrl: string;
  width: number | null;
  height: number | null;
}>;

export async function searchNaverBuildingImages(input: Readonly<{
  buildingName: string;
  address: string;
  display?: number;
}>): Promise<Readonly<{
  state: 'ready' | 'not-configured' | 'provider-error';
  candidates: readonly NaverImageCandidate[];
}>>;
```

Use `encodeURIComponent` through `URLSearchParams`, send both NAVER authentication headers, set `cache: 'no-store'`, use an eight-second timeout, clamp `display` to 1..100, and return sanitized HTTPS URLs only. Do not log or return credentials.

- [ ] **Step 4: Implement the authenticated live-review route**

Load the canonical building from Postgres, reject Dubai and ambiguous identities, query NAVER live, attach `Cache-Control: private, no-store`, and record only the aggregate `photo-naver-search` attempt status and result count. Do not persist candidate image URLs or response JSON.

- [ ] **Step 5: Document environment names without secrets**

Add these empty entries to `.env.example`:

```dotenv
NAVER_SEARCH_CLIENT_ID=
NAVER_SEARCH_CLIENT_SECRET=
```

- [ ] **Step 6: Run the focused tests and confirm they pass**

Run: `pnpm vitest run apps/web/test/naver-image-search.test.ts apps/web/test/naver-image-candidates-route.test.ts`

Expected: PASS and route responses contain `Cache-Control: private, no-store`.

- [ ] **Step 7: Commit NAVER Image Search support**

```bash
git add v2/apps/web/lib/photos/naver-image-search.server.ts v2/apps/web/app/api/internal/naver-image-candidates/route.ts v2/apps/web/test/naver-image-search.test.ts v2/apps/web/test/naver-image-candidates-route.test.ts v2/apps/web/.env.example
git commit -m "feat(signedprice): add NAVER image review search"
```

### Task 4: Add bounded resumable coverage backfill and provider health

**Files:**
- Create: `v2/apps/web/lib/photos/photo-backfill.server.ts`
- Create: `v2/apps/web/app/api/internal/photo-coverage/route.ts`
- Create: `v2/apps/web/test/photo-backfill.test.ts`
- Create: `v2/apps/web/test/photo-coverage-route.test.ts`
- Modify: `v2/apps/web/app/api/internal/building-enrichment/route.ts`
- Modify: `v2/apps/web/vercel.json`

**Interfaces:**
- Produces: `runPhotoBackfillSlice(options): Promise<PhotoBackfillResult>`, `readPhotoProviderHealth()`, authenticated coverage GET/POST operations.
- Consumes: Task 1 coverage store, Task 2 match policy, current Wikimedia and Google discovery functions, and Task 3 NAVER attempt recording.

- [ ] **Step 1: Write failing tests for resumption, daily caps, and provider pause**

```ts
it('continues after the last stable entity id without duplicating attempts', async () => {
  const first = await runPhotoBackfillSlice({ market: 'kr-seoul', provider: 'wikimedia', limit: 2 });
  const second = await runPhotoBackfillSlice({ market: 'kr-seoul', provider: 'wikimedia', limit: 2 });
  expect(first.entityIds).toEqual(['a', 'b']);
  expect(second.entityIds).toEqual(['c']);
});

it('pauses a provider after an authentication failure', async () => {
  providerFetch.mockResolvedValue(new Response('', { status: 403 }));
  const result = await runPhotoBackfillSlice({ market: 'sg-singapore', provider: 'google', limit: 30 });
  expect(result).toMatchObject({ state: 'provider-paused', checked: 1, reason: 'http-403' });
});
```

- [ ] **Step 2: Run the tests and confirm the missing runner failure**

Run: `pnpm vitest run apps/web/test/photo-backfill.test.ts apps/web/test/photo-coverage-route.test.ts`

Expected: FAIL because the backfill runner and route do not exist.

- [ ] **Step 3: Implement bounded provider slices**

```ts
export type PhotoBackfillOptions = Readonly<{
  market: 'kr-seoul' | 'sg-singapore';
  provider: 'google' | 'wikimedia' | 'naver-search' | 'coverage';
  limit: number;
  dailyRequestCap: number;
  dailySpendCapUsd: number;
  dryRun: boolean;
}>;

export async function runPhotoBackfillSlice(options: PhotoBackfillOptions): Promise<PhotoBackfillResult>;
```

Clamp `limit` to 1..300. Select entity IDs in stable order, skip current approvals and non-due attempts, and stop immediately on 401/403 or billing-disabled responses. Count provider requests in Postgres by UTC day for Google and Korean calendar day for NAVER. A dry run returns eligible rows and an upper-bound request estimate without provider calls or database writes.

- [ ] **Step 4: Implement authenticated coverage operations**

`GET /api/internal/photo-coverage` returns summary, provider health, daily usage, missing coordinates, and review queue size. `POST` accepts a validated provider, market, limit, cap, and dry-run flag; it rejects Dubai and requires `CONTENT_ADMIN_SECRET`.

- [ ] **Step 5: Route the existing cron through the runner**

Keep the current hourly path and source query compatibility. The scheduled run uses conservative defaults and synchronizes coverage after candidate discovery. Manual operations can request larger bounded slices. No request may exceed the route's 60-second maximum duration.

- [ ] **Step 6: Run focused and existing enrichment tests**

Run: `pnpm vitest run apps/web/test/photo-backfill.test.ts apps/web/test/photo-coverage-route.test.ts apps/web/test/seeded-building-enrichment.test.ts apps/web/test/building-photo-candidates.test.ts`

Expected: PASS with one provider failure producing one pause record rather than a full batch of duplicate errors.

- [ ] **Step 7: Commit the backfill coordinator**

```bash
git add v2/apps/web/lib/photos/photo-backfill.server.ts v2/apps/web/app/api/internal/photo-coverage/route.ts v2/apps/web/app/api/internal/building-enrichment/route.ts v2/apps/web/test/photo-backfill.test.ts v2/apps/web/test/photo-coverage-route.test.ts v2/apps/web/vercel.json
git commit -m "feat(signedprice): add resumable photo coverage backfill"
```

### Task 5: Render up to five approved Google photos with truthful fallbacks

**Files:**
- Modify: `v2/apps/web/components/maps/google-place-photo.tsx`
- Modify: `v2/apps/web/components/maps/building-street-view.module.css`
- Modify: `v2/apps/web/components/public-market/projected-entity-media.tsx`
- Modify: `v2/apps/web/lib/photos/property-media-model.ts`
- Modify: `v2/apps/web/lib/photos/property-media-resolver.server.ts`
- Create: `v2/apps/web/test/google-place-photo-gallery.test.tsx`
- Modify: `v2/apps/web/test/projected-entity-media.test.tsx`
- Modify: `v2/apps/web/test/provider-building-street-view.test.tsx`

**Interfaces:**
- Produces: an approved Google provider gallery with one primary and up to four secondary images, per-image attribution, and visible relationship labels.
- Consumes: approved Google place ID returned by `/api/building-photo`, Google Maps browser key, and existing street-view components.

- [ ] **Step 1: Write failing gallery and labelling tests**

```tsx
it('renders no more than five live photos and credits each attributed author', async () => {
  render(<GooglePlacePhoto verifiedPlaceId="place-1" {...baseProps} />);
  await screen.findByAltText('RIVERGATE place photo 1');
  expect(screen.getAllByRole('img')).toHaveLength(5);
  expect(screen.getByRole('link', { name: 'Photographer One' })).toHaveAttribute('href', 'https://maps.google.com/author/1');
});

it('labels panorama and parent-project media separately from exact photos', () => {
  expect(renderedStreetView).toContain('Street view');
  expect(renderedParentPhoto).toContain('Parent project photograph');
});
```

- [ ] **Step 2: Run the tests and confirm the single-photo implementation fails**

Run: `pnpm vitest run apps/web/test/google-place-photo-gallery.test.tsx apps/web/test/projected-entity-media.test.tsx apps/web/test/provider-building-street-view.test.tsx`

Expected: FAIL because `findGooglePlacePhoto` returns one photo and the gallery/labels are absent.

- [ ] **Step 3: Return a bounded live gallery from the Google SDK**

```ts
export async function findGooglePlacePhotos(
  Place: GooglePlaceClass,
  approvedPlaceId: string,
  maximum = 5,
): Promise<readonly GooglePlacePhotoResult[]>;
```

Fetch only `photos`, clamp `maximum` to 1..5, and use each photo's ephemeral `getURI()` result without Next Image transformation or persistence. Render available author name and URI adjacent to that image. Remove the unapproved client-side text-search fallback; public pages may use only server-approved place IDs.

- [ ] **Step 4: Add accessible gallery controls and relationship labels**

Use a primary image plus thumbnail buttons with `aria-label="Show photo N"`. Display `Verified place photos`, `Parent project photograph`, or `Nearby street view` according to the resolver result. On SDK failure, fall through to the previously approved media or location fallback without replacing database state.

- [ ] **Step 5: Run the focused tests and confirm they pass**

Run: `pnpm vitest run apps/web/test/google-place-photo-gallery.test.tsx apps/web/test/projected-entity-media.test.tsx apps/web/test/provider-building-street-view.test.tsx apps/web/test/google-place-map.test.tsx`

Expected: PASS with at most five images and no unapproved public text search.

- [ ] **Step 6: Commit the gallery**

```bash
git add v2/apps/web/components/maps/google-place-photo.tsx v2/apps/web/components/maps/building-street-view.module.css v2/apps/web/components/public-market/projected-entity-media.tsx v2/apps/web/lib/photos/property-media-model.ts v2/apps/web/lib/photos/property-media-resolver.server.ts v2/apps/web/test/google-place-photo-gallery.test.tsx v2/apps/web/test/projected-entity-media.test.tsx v2/apps/web/test/provider-building-street-view.test.tsx
git commit -m "feat(signedprice): show approved provider photo galleries"
```

### Task 6: Verify provider access on the test branch and run a precision canary

**Files:**
- Create: `v2/docs/operations/photo-coverage-backfill.md`
- Modify: `v2/apps/web/.env.example`

**Interfaces:**
- Consumes: authenticated Vercel environment management, Neon branch `br-patient-sky-b3ssnche`, provider health endpoint, and Task 4 dry run.
- Produces: documented operations commands, verified provider states, and a 100-entity private candidate canary.

- [ ] **Step 1: Document exact secret names and safe checks**

Document `GOOGLE_MAPS_API_KEY`, `GOOGLE_MAPS_BROWSER_KEY`, `NAVER_SEARCH_CLIENT_ID`, `NAVER_SEARCH_CLIENT_SECRET`, `NAVER_MAP_CLIENT_ID`, `CONTENT_ADMIN_SECRET`, `CRON_SECRET`, and `DATABASE_URL`. Commands must show only environment-variable names and aggregate provider responses; they must not echo values, signed URLs, or provider payloads.

- [ ] **Step 2: Enable and verify Google Places API (New)**

Use the Google Cloud console linked to the existing key, enable billing and Places API (New), and restrict the server key to the Places API. Restrict the browser key to SignedPrice production and preview origins plus the Maps JavaScript API. Verify one private Seoul and one private Singapore candidate request returns HTTP 200 before increasing caps.

- [ ] **Step 3: Enable and verify NAVER Image Search**

Confirm the existing NAVER application has Search API permission. If it does, configure the generic `NAVER_SEARCH_*` names with the existing credentials through authenticated Vercel tooling. Verify a live private request for `개포래미안포레스트` returns candidates with `Cache-Control: private, no-store` and leaves no candidate URL in Postgres.

- [ ] **Step 4: Apply migration 0008 to the Neon test branch**

Run the repository migration command against `br-patient-sky-b3ssnche`, then query table and constraint existence. Run it a second time and confirm no duplicate schema objects or row changes.

- [ ] **Step 5: Run a dry run and a 100-entity canary**

Dry-run Seoul and Singapore for each provider. Then process 50 Seoul and 50 Singapore entities with automatic approval disabled. Inspect every generated Google and Wikimedia candidate for identity precision; NAVER candidates remain live review results and are not persisted.

- [ ] **Step 6: Record canary evidence and commit operations documentation**

The document records date, branch, aggregate counts, false-positive count, provider status class, and whether automatic approval is allowed. It excludes entity-level provider payloads and all secrets.

```bash
git add v2/docs/operations/photo-coverage-backfill.md v2/apps/web/.env.example
git commit -m "docs(signedprice): document photo coverage operations"
```

### Task 7: Full verification, production rollout, and resumable backfill

**Files:**
- Modify only files under `v2/` if verification exposes a defect; every defect receives a failing test before its fix.

**Interfaces:**
- Consumes: all earlier tasks, Neon test/main branches, Vercel production, existing SignedPrice routes, and approved user authorization for commits and deployment.
- Produces: merged code, production deployment, active provider backfill, and verified coverage reporting.

- [ ] **Step 1: Verify seed invariants on the test branch**

Confirm Seoul `48,999`, Singapore private `3,862`, Singapore HDB `10,011`, total `62,872`, legacy digest `d86ae08ab146e07570ccbd7b15f07a80f3ca5fd537d7199f58628348439e446a`, and entity digest `92be10891460d8604c8b6661cd4884c3eaee9ce5791a14ec6c59a49a2d9e3729`. Confirm Dubai counts and media are unchanged.

- [ ] **Step 2: Run repository verification**

Run:

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

Expected: every command exits 0. Record exact passed/skipped test counts from the fresh run.

- [ ] **Step 3: Push the branch and open a reviewable pull request**

Push `codex/all-building-photo-coverage`. The PR description lists the coverage states, provider storage boundaries, canary precision, test commands, migration idempotence, and expected paid-provider behavior.

- [ ] **Step 4: Merge after required checks pass and deploy production**

Apply migration 0008 to `br-super-butterfly-b31hhh93`, merge the approved PR to main, and let Vercel deploy. Verify the deployment SHA and that production aliases point to it.

- [ ] **Step 5: Browser-verify representative routes**

Verify one Seoul licensed photo, one Seoul Google provider gallery, one Singapore private gallery, one HDB block, one street-view fallback, one unavailable fallback, and the Dubai overview. Check photo count, primary selection, per-photo attribution, source access, relationship labels, layout, and browser/runtime errors.

- [ ] **Step 6: Start staged production backfill**

Start with conservative daily Google and NAVER caps. Increase only after the production precision sample has no known false positives and provider health remains ready. Continue resumable slices until coverage summary reports `complete = 62,872`; exact/provider/street-view/unavailable totals must add to the same number.

- [ ] **Step 7: Verify idempotence and final state**

Run the final due slice a second time and confirm it creates no duplicate approvals, media, attempts, or coverage rows. Recheck seed counts/digests, Dubai invariants, runtime errors, and representative pages. Preserve the compressed JSON fallback until this verification is recorded.
