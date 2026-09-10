# SignedPrice Structured Community Signal Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let users submit one privacy-bounded Higher/Similar/Lower response per evidence scope and publish only threshold-safe aggregates.

**Architecture:** Pure exact-key validators and aggregation functions sit in a browser-safe core. A server-only service binds allowlisted evidence, HMAC-pseudonymous identity, rate/origin checks, and a transactional SQL repository. District/building pages always render the module; without configured storage it shows a truthful unavailable state, and with storage it moves through collecting to published at five distinct responses.

**Tech Stack:** Next.js 16 Route Handlers and Server Components, React 19, TypeScript 5.9, Node `crypto`, PostgreSQL SQL migration, Vitest 4, Playwright. Neon through Vercel Marketplace is the recommended Production provider, but provisioning is a separate operational action.

**Spec:** `docs/superpowers/specs/2026-08-31-signedprice-contract-split-news-community-design.md`

## Global Constraints

- No free text, name, email, exact address, exact price, image, link, or direct message is accepted.
- One respondent has one active response per market, scope, and evidence ID; resubmission replaces it.
- Raw cookie values and IP addresses are not stored in response rows.
- Fewer than 5 responses reveal neither exact count nor direction/reason breakdown.
- Reason counts publish only at 5; suppressed reasons cannot be individually inferred.
- Community values never change official evidence, Contract Check, Rankings, or News.
- Without durable storage the visible form is disabled and no endpoint claims success.
- External database provisioning requires explicit operational authorization.

---

### Task 1: Exact Response and Aggregate Core

**Files:**
- Create: `v2/apps/web/lib/community/community-types.ts`
- Create: `v2/apps/web/lib/community/community-schema.ts`
- Create: `v2/apps/web/lib/community/community-aggregate.ts`
- Test: `v2/apps/web/test/community-schema.test.ts`
- Test: `v2/apps/web/test/community-aggregate.test.ts`

**Interfaces:**
- Consumes: unknown request JSON and raw aggregate count rows.
- Produces: `EvidenceResponseInput`, `parseEvidenceResponseInput`, `buildPublicCommunityAggregate`.

- [ ] **Step 1: Write failing exact-schema tests**

```ts
expect(parseEvidenceResponseInput({
  schemaVersion: 1,
  marketId: 'kr-seoul',
  scopeType: 'district',
  scopeId: 'jung-gu',
  evidenceId: 'kr-seoul:2026-01/2026-07:all',
  direction: 'SIMILAR',
  reason: null,
})).toMatchObject({ direction: 'SIMILAR' });

expect(() => parseEvidenceResponseInput({ ...validInput(), comment: 'call me' })).toThrow();
expect(() => parseEvidenceResponseInput({ ...validInput(), direction: 'UP' })).toThrow();
```

Reject arrays, extra/missing keys, unsafe/control-character IDs, unknown market/scope/direction/reason, and oversized JSON-equivalent strings.

- [ ] **Step 2: Write failing privacy and rounding tests**

```ts
expect(buildPublicCommunityAggregate(counts(4))).toEqual({ status: 'collecting' });
expect(buildPublicCommunityAggregate(counts(5))).toMatchObject({
  status: 'published',
  total: 5,
  directions: [
    { direction: 'HIGHER', count: 2, percent: 40 },
    { direction: 'SIMILAR', count: 2, percent: 40 },
    { direction: 'LOWER', count: 1, percent: 20 },
  ],
});
expect(published.directions.reduce((sum, item) => sum + item.percent, 0)).toBe(100);
```

Cover 1/1/1 and other remainder cases with deterministic largest-remainder allocation. Assert reasons with counts below five collapse to one `otherResponses` count and no label/count pair leaks.

- [ ] **Step 3: Run focused tests and verify RED**

```bash
cd v2
pnpm exec vitest run apps/web/test/community-schema.test.ts apps/web/test/community-aggregate.test.ts
```

- [ ] **Step 4: Implement immutable pure functions**

```ts
export type CommunityAggregateModel =
  | Readonly<{ status: 'collecting' }>
  | Readonly<{
      status: 'published';
      total: number;
      directions: readonly Readonly<{ direction: CommunityDirection; count: number; percent: number }>[];
      reasons: readonly Readonly<{ reason: CommunityReason; count: number }>[];
      otherResponses: number;
    }>;
```

Validate raw counts as non-negative safe integers and cross-check their sum before publishing. Freeze nested arrays/objects.

- [ ] **Step 5: Run tests, typecheck, and commit**

```bash
cd v2
pnpm exec vitest run apps/web/test/community-schema.test.ts apps/web/test/community-aggregate.test.ts
pnpm typecheck
git add apps/web/lib/community/community-types.ts apps/web/lib/community/community-schema.ts apps/web/lib/community/community-aggregate.ts apps/web/test/community-schema.test.ts apps/web/test/community-aggregate.test.ts
git commit -m "feat(v2): define structured community signals"
```

### Task 2: Transactional Repository and Migration

**Files:**
- Create: `v2/apps/web/lib/community/community-sql-port.server.ts`
- Create: `v2/apps/web/lib/community/community-repository.server.ts`
- Create: `v2/apps/web/lib/community/migrations/001_evidence_responses.sql`
- Test: `v2/apps/web/test/community-repository.test.ts`

**Interfaces:**
- Consumes: injected transactional `CommunitySqlPort` and parsed response records.
- Produces: `CommunityRepository` with upsert/delete/caller-selection/aggregate operations.

- [ ] **Step 1: Write failing repository contract tests with a fake SQL port**

Assert insert, same-respondent replacement, different-respondent count, delete idempotence, exact scope isolation, evidence-period isolation, rollback on failure, frozen aggregates, and sanitized database errors.

```ts
await repository.upsert({ respondentKey: 'r1', ...validStoredResponse('HIGHER') });
await repository.upsert({ respondentKey: 'r1', ...validStoredResponse('LOWER') });
expect(await repository.aggregate(scope)).toMatchObject({ total: 1, lower: 1 });
expect(await repository.getSelection(scope, 'r1')).toMatchObject({ direction: 'LOWER' });
```

- [ ] **Step 2: Run the repository test and verify RED**

```bash
cd v2
pnpm exec vitest run apps/web/test/community-repository.test.ts
```

- [ ] **Step 3: Add the SQL schema**

```sql
CREATE TABLE signedprice_evidence_responses (
  market_id text NOT NULL,
  scope_type text NOT NULL CHECK (scope_type IN ('district', 'building')),
  scope_id text NOT NULL,
  evidence_id text NOT NULL,
  respondent_key text NOT NULL,
  direction text NOT NULL CHECK (direction IN ('HIGHER', 'SIMILAR', 'LOWER')),
  reason text NULL CHECK (reason IS NULL OR reason IN ('LINE', 'ASPECT', 'FLOOR', 'REMODEL', 'VIEW', 'NOISE', 'OTHER')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (market_id, scope_type, scope_id, evidence_id, respondent_key)
);

CREATE INDEX signedprice_evidence_responses_scope_idx
  ON signedprice_evidence_responses (market_id, scope_type, scope_id, evidence_id);
```

No IP, cookie, user agent, email, name, price, address, or free-text column is permitted.

- [ ] **Step 4: Implement repository SQL operations**

Use `INSERT ... ON CONFLICT (...) DO UPDATE SET direction, reason, updated_at = now()` and parameterized values only. Aggregation returns direction/reason grouped counts in one transactionally consistent read. Wrap provider errors as `CommunityStorageUnavailableError` without SQL text, connection values, or raw parameters.

- [ ] **Step 5: Run tests and commit**

```bash
cd v2
pnpm exec vitest run apps/web/test/community-repository.test.ts
git add apps/web/lib/community/community-sql-port.server.ts apps/web/lib/community/community-repository.server.ts apps/web/lib/community/migrations/001_evidence_responses.sql apps/web/test/community-repository.test.ts
git commit -m "feat(v2): add transactional community repository"
```

### Task 3: Pseudonymous Identity and Protected Service

**Files:**
- Create: `v2/apps/web/lib/community/community-identity.server.ts`
- Create: `v2/apps/web/lib/community/community-rate-limit.server.ts`
- Create: `v2/apps/web/lib/community/community-evidence.server.ts`
- Create: `v2/apps/web/lib/community/community-service.server.ts`
- Test: `v2/apps/web/test/community-identity.test.ts`
- Test: `v2/apps/web/test/community-service.test.ts`

**Interfaces:**
- Consumes: request headers/cookies, server HMAC secret, route scope, current area/building repositories, repository, and rate-limit port.
- Produces: safe respondent cookie, allowlisted current evidence scope, and protected read/upsert/delete service results.

- [ ] **Step 1: Write failing identity tests**

Assert 32-byte opaque cookie creation, `HttpOnly; Secure; SameSite=Lax; Path=/`, deterministic HMAC within a secret rotation, different keys across rotations, and redaction from errors.

```ts
const first = deriveRespondentKey(cookie, 'rotation-secret-A');
expect(first).toMatch(/^[0-9a-f]{64}$/);
expect(deriveRespondentKey(cookie, 'rotation-secret-A')).toBe(first);
expect(deriveRespondentKey(cookie, 'rotation-secret-B')).not.toBe(first);
```

- [ ] **Step 2: Write failing service protection tests**

Cover wrong/missing Origin, non-JSON, oversized body, stale evidence ID, unknown district/building, rate denial, storage unavailable, replacement, delete, and sanitized outputs. Test that GET aggregate never includes respondent keys and POST returns only the caller selection plus thresholded aggregate.

- [ ] **Step 3: Run focused tests and verify RED**

```bash
cd v2
pnpm exec vitest run apps/web/test/community-identity.test.ts apps/web/test/community-service.test.ts
```

- [ ] **Step 4: Implement exact evidence allowlisting**

`resolveCommunityEvidenceScope` obtains the current installed artifact period, selected contract group, district/building stable identity, and artifact version. It produces the only accepted `evidenceId`; the client cannot choose an older or unrelated scope.

Use a small injected rate interface:

```ts
export type CommunityRateLimitPort = Readonly<{
  consume(input: Readonly<{ respondentKey: string; networkKey: string }>): Promise<'allowed' | 'limited'>;
}>;
```

Derive `networkKey` ephemerally with a separate HMAC and never pass the raw address to the repository or return it.

- [ ] **Step 5: Run tests and commit**

```bash
cd v2
pnpm exec vitest run apps/web/test/community-identity.test.ts apps/web/test/community-service.test.ts
git add apps/web/lib/community/community-identity.server.ts apps/web/lib/community/community-rate-limit.server.ts apps/web/lib/community/community-evidence.server.ts apps/web/lib/community/community-service.server.ts apps/web/test/community-identity.test.ts apps/web/test/community-service.test.ts
git commit -m "feat(v2): protect community evidence responses"
```

### Task 4: Route Handler and Honest Configuration Gate

**Files:**
- Create: `v2/apps/web/lib/community/community-environment.server.ts`
- Create: `v2/apps/web/app/api/community/evidence-response/route.ts`
- Test: `v2/apps/web/test/community-route.test.ts`
- Modify: `v2/apps/web/test/server-client-boundary.test.ts`

**Interfaces:**
- Consumes: Task 3 service and environment-injected ports.
- Produces: `GET`, `POST`, and `DELETE` JSON envelopes with `ready`, `collecting`, `published`, `limited`, or `unavailable` states.

- [ ] **Step 1: Write failing Route Handler tests**

```ts
expect((await GET(request(scope))).status).toBe(200);
expect(await json(GET(request(scope)))).toEqual({ state: 'unavailable', code: 'storage_not_configured' });
expect((await POST(nonJsonRequest())).status).toBe(415);
expect((await POST(wrongOriginRequest())).status).toBe(403);
expect((await POST(validRequest())).headers.get('cache-control')).toBe('private, no-store');
```

Require exact envelope keys and no provider/SQL/HMAC/cookie/network details.

- [ ] **Step 2: Run route/boundary tests and verify RED**

```bash
cd v2
pnpm exec vitest run apps/web/test/community-route.test.ts apps/web/test/server-client-boundary.test.ts
```

- [ ] **Step 3: Implement fail-closed environment dependencies**

`createCommunityEnvironment()` returns a discriminated unavailable dependency when the database URL, identity secret, or rate limiter is missing. GET can return the unavailable state. POST/DELETE do not invoke persistence and return `503` with the same browser-safe code. Never fall back to memory, filesystem, or successful no-op writes.

- [ ] **Step 4: Implement the route methods**

Parse a maximum bounded body before exact schema validation. Set or refresh the opaque cookie only through the response cookie API. Caller-specific responses are `private, no-store`; no CORS wildcard is emitted.

- [ ] **Step 5: Run tests, boundary scan, and commit**

```bash
cd v2
pnpm exec vitest run apps/web/test/community-route.test.ts apps/web/test/server-client-boundary.test.ts
pnpm typecheck
git add apps/web/lib/community/community-environment.server.ts apps/web/app/api/community/evidence-response/route.ts apps/web/test/community-route.test.ts apps/web/test/server-client-boundary.test.ts
git commit -m "feat(v2): expose guarded community response API"
```

### Task 5: Community Signal UI and Detail Integration

**Files:**
- Create: `v2/apps/web/components/community/community-signal.tsx`
- Create: `v2/apps/web/components/community/community-signal-client.tsx`
- Create: `v2/apps/web/components/community/community-signal.module.css`
- Modify: `v2/apps/web/components/public-market/district-detail-page.tsx`
- Modify: `v2/apps/web/components/public-market/building-detail-page.tsx`
- Modify: `v2/apps/web/lib/public-market/area-route-types.ts`
- Modify: `v2/apps/web/lib/public-market/area-route-model.server.ts`
- Modify: `v2/apps/web/lib/public-market/building-route-model.server.ts`
- Test: `v2/apps/web/test/community-signal.test.tsx`
- Modify: `v2/apps/web/test/public-district-detail.test.tsx`
- Modify: `v2/apps/web/test/public-building-detail.test.tsx`

**Interfaces:**
- Consumes: safe `CommunitySignalModel` and Task 4 endpoint.
- Produces: visible unavailable, collecting, published, submitting, saved, limited, and error states in district/building contextual rails.

- [ ] **Step 1: Write failing component/state tests**

Assert the unavailable module is visible but contains no enabled form; collecting reveals no count; published totals/directions sum correctly; saved selection is marked; replacement doesn't append; delete returns to no selection; errors never claim success; all controls are labeled and at least 44px.

```tsx
expect(unavailableHtml).toContain('Community responses are not open yet');
expect(unavailableHtml).not.toMatch(/<button(?![^>]*disabled)/);
expect(collectingHtml).toContain('Responses are being collected');
expect(collectingHtml).not.toMatch(/4 responses|Higher.*\d/);
expect(publishedHtml).toContain('Self-selected response, not a representative survey');
```

- [ ] **Step 2: Run focused UI tests and verify RED**

```bash
cd v2
pnpm exec vitest run apps/web/test/community-signal.test.tsx apps/web/test/public-district-detail.test.tsx apps/web/test/public-building-detail.test.tsx
```

- [ ] **Step 3: Implement the server shell and small client form**

The Server Component renders the current aggregate and caveat. The Client Component owns only direction/reason selection and fetch state; it sends the exact Task 1 input, aborts stale requests, and replaces its aggregate from the server response. Do not optimistic-increment public counts.

- [ ] **Step 4: Integrate only verified scopes**

District pages always have a stable scope. Building pages render the module only when a verified building ID/evidence artifact exists; unavailable building fixtures do not become community scopes. Place the module after official evidence and News, before nearby navigation on narrow layouts.

- [ ] **Step 5: Run focused tests, lint, typecheck, and commit**

```bash
cd v2
pnpm exec vitest run apps/web/test/community-signal.test.tsx apps/web/test/public-district-detail.test.tsx apps/web/test/public-building-detail.test.tsx
pnpm lint
pnpm typecheck
git add apps/web/components/community/community-signal.tsx apps/web/components/community/community-signal-client.tsx apps/web/components/community/community-signal.module.css apps/web/components/public-market/district-detail-page.tsx apps/web/components/public-market/building-detail-page.tsx apps/web/lib/public-market/area-route-types.ts apps/web/lib/public-market/area-route-model.server.ts apps/web/lib/public-market/building-route-model.server.ts apps/web/test/community-signal.test.tsx apps/web/test/public-district-detail.test.tsx apps/web/test/public-building-detail.test.tsx
git commit -m "feat(v2): add structured Community signal UI"
```

### Task 6: Database Activation and Live Release Gate

**Files:**
- Create: `v2/apps/web/lib/community/neon-sql-port.server.ts`
- Modify: `v2/apps/web/package.json`
- Create: `v2/apps/web/test/community-neon-port.test.ts`
- Create: `v2/tests/e2e/community.spec.ts`
- Modify: `docs/operations/signedprice-public-p1-release-gate.md`

**Interfaces:**
- Consumes: an explicitly authorized Neon Marketplace resource, server-only connection URL, HMAC secrets, rate limiter, and Tasks 1–5.
- Produces: live transactional writes and thresholded aggregates in Preview, then separately authorized Production.

- [ ] **Step 1: Stop for operational authorization before provisioning**

Present the provider, free/paid plan choice, project/environment scopes, preview-branch behavior, region, retention, and deletion implications. Do not run `vercel install neon`, create a database, or accept a billing plan without approval.

- [ ] **Step 2: After approval, install the provider and driver**

Use the official Vercel Marketplace Neon integration and its serverless driver. Pin the resolved dependency in `pnpm-lock.yaml`. Map its server-only URL into the environment dependency; no `NEXT_PUBLIC_` database variable is allowed.

- [ ] **Step 3: Write and run provider adapter tests**

Test parameter binding, transaction behavior, timeout, unavailable connection, redacted errors, and no connection string in client bundles. Run the migration against an isolated Preview branch and verify schema constraints with rollback-safe synthetic rows.

- [ ] **Step 4: Run local/full and Preview browser gates**

```bash
cd v2
pnpm test
pnpm lint
pnpm typecheck
pnpm build
pnpm exec playwright test tests/e2e/community.spec.ts
git diff --check
```

In exact-SHA Preview, verify unavailable before config, then one respondent upsert/replacement/delete, five distinct synthetic test respondents in a non-public test scope, threshold publication, cookie flags, wrong-origin rejection, rate limit, raw-row inaccessibility, no PII/log leaks, no console/5xx, responsive layout, and KoreaHomeGuide preservation. Remove synthetic rows after verification.

- [ ] **Step 5: Commit adapter/release evidence and keep Production gated**

```bash
git add apps/web/lib/community/neon-sql-port.server.ts apps/web/package.json pnpm-lock.yaml apps/web/test/community-neon-port.test.ts tests/e2e/community.spec.ts docs/operations/signedprice-public-p1-release-gate.md
git commit -m "test(v2): gate structured Community activation"
```

Production writes are enabled only after a separate promotion decision, migration verification, rollback procedure, operator alert destination, and live delete test.
