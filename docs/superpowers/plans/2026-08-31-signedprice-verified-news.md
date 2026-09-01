# SignedPrice Verified News Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a real Seoul News surface whose official citations and SignedPrice evidence lines are strictly validated and never contain unsupported market numbers.

**Architecture:** Version-controlled News records pass an exact-key server validator before index/detail route models can render them. Each record separates the external official source from a mandatory `Our data:` evidence status, and numeric evidence references verified artifact identities. News becomes the fourth primary navigation destination only when its index and detail routes exist.

**Tech Stack:** Next.js 16 App Router, React 19 Server Components, TypeScript 5.9, Vitest 4, CSS Modules, existing public artifact repositories.

**Spec:** `docs/superpowers/specs/2026-08-31-signedprice-contract-split-news-community-design.md`

## Global Constraints

- Every News record has one official source citation and one visible `Our data:` line.
- `verified` numeric claims reconcile with declared installed artifacts.
- `not-confirmed` contains no unverified number and names the missing comparison.
- Source article bodies are not copied into the repository.
- Initial content is strict, version-controlled, and server-rendered; no CMS is required.
- `/kr/seoul/news/` is canonical; `/kr/news/` redirects to it while Seoul is the only Korean market.
- Material corrections retain an updated timestamp and correction-ledger link.

---

### Task 1: Strict News Content Contract

**Files:**
- Create: `v2/apps/web/lib/news/news-schema.ts`
- Create: `v2/apps/web/lib/news/news-repository.server.ts`
- Create: `v2/apps/web/content/news/kr-seoul.ts`
- Test: `v2/apps/web/test/news-schema.test.ts`
- Test: `v2/apps/web/test/news-repository.test.ts`

**Interfaces:**
- Consumes: authored unknown records and optional evidence resolver.
- Produces: `VerifiedNewsRecord`, `parseVerifiedNewsRecord`, and `createNewsRepository`.

- [ ] **Step 1: Write failing exact-schema tests**

```ts
expect(parseVerifiedNewsRecord(validRecord())).toMatchObject({
  schemaVersion: 1,
  marketId: 'kr-seoul',
  evidence: { status: 'not-applicable' },
});
expect(() => parseVerifiedNewsRecord({ ...validRecord(), extra: true })).toThrow();
expect(() => parseVerifiedNewsRecord({
  ...validRecord(),
  evidence: { status: 'not-confirmed', line: 'Prices rose 12%', artifactIds: [] },
})).toThrow();
```

Also reject duplicate IDs/slugs, non-HTTPS sources, control characters, invalid instants, `updatedAt < publishedAt`, empty body, unknown blocks, and copied-looking body fields such as `html` or `articleText`.

- [ ] **Step 2: Run focused tests and verify RED**

```bash
cd v2
pnpm exec vitest run apps/web/test/news-schema.test.ts apps/web/test/news-repository.test.ts
```

- [ ] **Step 3: Implement exact-key parsing**

Define the approved block union explicitly:

```ts
export type NewsBlock =
  | Readonly<{ type: 'paragraph'; text: string }>
  | Readonly<{ type: 'heading'; text: string }>
  | Readonly<{ type: 'list'; items: readonly string[] }>;
```

The repository freezes records and exposes:

```ts
export type NewsRepository = Readonly<{
  list(marketId: 'kr-seoul'): readonly VerifiedNewsRecord[];
  getBySlug(marketId: 'kr-seoul', slug: string): VerifiedNewsRecord | null;
}>;
```

Sort by `publishedAt` descending, then stable ID. No route imports raw authored objects directly.

- [ ] **Step 4: Add initial non-numeric official/methodology records**

Start with records whose `evidence.status` is `not-applicable` or an honest `not-confirmed`. Each source URL must be an official publisher URL already reviewed for the record. Do not add example market numbers merely to fill the page.

- [ ] **Step 5: Run tests, typecheck, and commit**

```bash
cd v2
pnpm exec vitest run apps/web/test/news-schema.test.ts apps/web/test/news-repository.test.ts
pnpm typecheck
git add apps/web/lib/news/news-schema.ts apps/web/lib/news/news-repository.server.ts apps/web/content/news/kr-seoul.ts apps/web/test/news-schema.test.ts apps/web/test/news-repository.test.ts
git commit -m "feat(v2): define verified News records"
```

### Task 2: Artifact-Reconciled Evidence Lines

**Files:**
- Create: `v2/apps/web/lib/news/news-evidence.server.ts`
- Modify: `v2/apps/web/lib/news/news-repository.server.ts`
- Test: `v2/apps/web/test/news-evidence.test.ts`

**Interfaces:**
- Consumes: declared artifact IDs and existing public area/building repositories.
- Produces: `resolveNewsEvidence(record, dependencies): ResolvedNewsEvidence` and sanitized unavailable states.

- [ ] **Step 1: Write failing reconciliation tests**

Cover exact current-period count/median/change references, wrong period, wrong group, altered number, missing artifact, v1 snapshot requested as split evidence, and withheld evidence.

```ts
expect(resolveNewsEvidence(verifiedRecord, dependencies)).toEqual({
  status: 'verified',
  line: '25 Seoul districts are present in the completed-period artifact.',
  artifactIds: ['kr-seoul:2026-01/2026-07:area:v2'],
});
expect(() => resolveNewsEvidence(tamperedNumberRecord, dependencies)).toThrow(
  'Verified News evidence is unavailable.',
);
```

- [ ] **Step 2: Run the evidence test and verify RED**

```bash
cd v2
pnpm exec vitest run apps/web/test/news-evidence.test.ts
```

- [ ] **Step 3: Implement a typed claim resolver**

Do not parse arbitrary prose to discover numbers. A verified authored record carries machine-readable claims in a server-only sibling object:

```ts
type NewsEvidenceClaim =
  | Readonly<{ kind: 'district-count'; artifactId: string; expected: number }>
  | Readonly<{ kind: 'summary-field'; artifactId: string; area: string; group: PublicContractGroup; field: 'n' | 'med' | 'chg3m'; expected: number }>;
```

The resolver compares each claim to the repository and returns only the authored display line after every claim passes. Fail closed to the route model; do not downgrade a tampered verified claim to `not-confirmed` automatically.

- [ ] **Step 4: Run tests and commit**

```bash
cd v2
pnpm exec vitest run apps/web/test/news-evidence.test.ts apps/web/test/news-repository.test.ts
git add apps/web/lib/news/news-evidence.server.ts apps/web/lib/news/news-repository.server.ts apps/web/test/news-evidence.test.ts
git commit -m "feat(v2): reconcile News with public evidence"
```

### Task 3: News Index, Detail, and Four-Tab Navigation

**Files:**
- Create: `v2/apps/web/lib/news/news-route-model.server.ts`
- Create: `v2/apps/web/components/news/news-index-page.tsx`
- Create: `v2/apps/web/components/news/news-detail-page.tsx`
- Create: `v2/apps/web/components/news/news.module.css`
- Create: `v2/apps/web/app/kr/seoul/news/page.tsx`
- Create: `v2/apps/web/app/kr/seoul/news/[slug]/page.tsx`
- Create: `v2/apps/web/app/kr/news/page.tsx`
- Modify: `v2/apps/web/components/public-market/public-section-tabs.tsx`
- Modify: `v2/apps/web/components/public-market/public-market.module.css`
- Test: `v2/apps/web/test/news-routes.test.tsx`
- Modify: `v2/apps/web/test/public-section-tabs.test.tsx`
- Modify: `v2/apps/web/test/guide-routes.test.tsx`
- Modify: `v2/apps/web/test/contract-check-evidence-navigation.test.tsx`
- Modify: `v2/apps/web/test/public-area-rankings.test.tsx`

**Interfaces:**
- Consumes: Tasks 1–2 repository and resolved evidence.
- Produces: canonical index/detail pages, redirect, metadata, static params, and `current: 'check' | 'explore' | 'news' | 'guide'` navigation.

- [ ] **Step 1: Replace absence assertions with failing real-route assertions**

```tsx
const tabs = renderToStaticMarkup(<PublicSectionTabs current="news" />);
expect(tabs).toContain('data-public-tab="news"');
expect(tabs).toContain('href="/kr/seoul/news"');
expect(tabs.match(/aria-current="page"/g)).toHaveLength(1);

expect(indexHtml).toContain('Our data:');
expect(detailHtml).toContain('rel="noopener noreferrer"');
expect(detailHtml).not.toContain('articleText');
```

Assert all four tabs are anchors and at least 44px. Assert the legacy `/kr/news/` route redirects rather than rendering duplicate canonical content.

- [ ] **Step 2: Run focused route/navigation tests and verify RED**

```bash
cd v2
pnpm exec vitest run apps/web/test/news-routes.test.tsx apps/web/test/public-section-tabs.test.tsx apps/web/test/guide-routes.test.tsx apps/web/test/contract-check-evidence-navigation.test.tsx apps/web/test/public-area-rankings.test.tsx
```

- [ ] **Step 3: Implement server-first News pages**

`generateStaticParams()` uses only validated slugs. Unknown slugs call `notFound()`. The detail page renders source publisher/title/date/link, evidence status, `Our data:` line, body blocks, updated time when present, and correction link. External source links open safely. Do not add a client bundle for static content.

- [ ] **Step 4: Add metadata and structured data**

Index metadata identifies verified Seoul briefs. Detail JSON-LD uses `NewsArticle` only for actual official-update/data-brief records, includes SignedPrice as author/publisher, the source URL as citation, and the page canonical. Methodology may use `Article`. No unsupported image URL is invented while the official logo/OG archive is unavailable.

- [ ] **Step 5: Run tests, lint, typecheck, build, and commit**

```bash
cd v2
pnpm exec vitest run apps/web/test/news-routes.test.tsx apps/web/test/public-section-tabs.test.tsx apps/web/test/guide-routes.test.tsx apps/web/test/contract-check-evidence-navigation.test.tsx apps/web/test/public-area-rankings.test.tsx
pnpm lint
pnpm typecheck
pnpm build
git add apps/web/lib/news/news-route-model.server.ts apps/web/components/news/news-index-page.tsx apps/web/components/news/news-detail-page.tsx apps/web/components/news/news.module.css apps/web/app/kr/seoul/news/page.tsx apps/web/app/kr/seoul/news/[slug]/page.tsx apps/web/app/kr/news/page.tsx apps/web/components/public-market/public-section-tabs.tsx apps/web/components/public-market/public-market.module.css apps/web/test/news-routes.test.tsx apps/web/test/public-section-tabs.test.tsx apps/web/test/guide-routes.test.tsx apps/web/test/contract-check-evidence-navigation.test.tsx apps/web/test/public-area-rankings.test.tsx
git commit -m "feat(v2): launch verified Seoul News"
```

### Task 4: News SEO and Browser Release Gate

**Files:**
- Modify: `v2/apps/web/app/sitemap.ts`
- Modify: `v2/apps/web/test/public-route-contract.test.tsx`
- Create: `v2/tests/e2e/news.spec.ts`
- Modify: `docs/operations/signedprice-public-p1-release-gate.md`

**Interfaces:**
- Consumes: Tasks 1–3.
- Produces: indexable validated News routes and exact-SHA Preview evidence.

- [ ] **Step 1: Add failing sitemap/SEO/browser assertions**

Require only validated News slugs in the sitemap, clean canonicals, no query canonical variants, one H1, visible source and `Our data:`, keyboard focus, 44px tabs, zero overflow at 390/720/1440, no console errors or 5xx, and no external article body fetch.

- [ ] **Step 2: Implement deterministic sitemap entries**

The sitemap imports the validated server repository, not raw content. Items missing strict validation never enter the sitemap. Use `updatedAt ?? publishedAt` for `lastModified`.

- [ ] **Step 3: Run the complete gate**

```bash
cd v2
pnpm test
pnpm lint
pnpm typecheck
pnpm build
pnpm exec playwright test tests/e2e/news.spec.ts
git diff --check
```

- [ ] **Step 4: Verify exact-SHA Preview and commit the release record**

Verify index/detail/redirect responses, canonical and sitemap, raw server HTML, source links, real artifact-backed evidence lines, runtime errors, and KoreaHomeGuide preservation. Production promotion remains separate.

```bash
git add apps/web/app/sitemap.ts apps/web/test/public-route-contract.test.tsx tests/e2e/news.spec.ts docs/operations/signedprice-public-p1-release-gate.md
git commit -m "test(v2): gate verified News release"
```
