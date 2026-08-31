# SignedPrice Global Trust Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a country-neutral Trust layer that makes evidence state, freshness, publication limits, rights, and corrections explicit without publishing unsupported accuracy claims.

**Architecture:** Immutable trust contracts live in `@signedprice/market-core`; market repositories translate their source metadata into those contracts. Server Components render one shared disclosure vocabulary, while global and market correction routes consume immutable ledgers. Missing evidence always becomes a typed reason with a next action, never a substituted number.

**Tech Stack:** TypeScript 5.9, React 19 Server Components, Next.js 16 App Router, CSS Modules, Vitest 4, Playwright 1.62.

**Spec:** `docs/superpowers/specs/2026-08-31-signedprice-global-trust-detail-singapore-design.md`

## Global Constraints

- Shared trust contracts contain no Korea, URA, jeonse, KRW, SGD, or provider-specific calculation logic.
- Every empty evidence state renders a title, reason, and next action.
- Missing numeric evidence is never serialized as zero or replaced by a market average.
- Freshness copy derives from artifact `period` and `generatedAt`; UI literals do not carry dates.
- Production correction ledgers may be empty and never include invented `FIXED` or `UPHELD` records.
- Accuracy metrics remain absent until a separately reproducible accuracy artifact is installed.
- Existing Modernist tokens remain authoritative: no literal hex colours, rounded cards, shadows, or one-pixel structural borders.
- All new routes remain `noindex, follow`, without canonical, hreflang, or sitemap entries.
- KoreaHomeGuide content, URLs, deployment, and metadata remain unchanged.

---

## File Responsibility Map

- `v2/packages/market-core/src/trust.ts`: immutable global evidence, empty-reason, freshness, and correction contracts.
- `v2/packages/market-core/test/trust.test.ts`: validation, immutability, and unsupported-state refusal.
- `v2/apps/web/components/trust/evidence-disclosure.tsx`: source, period, method, rights, and boundary disclosure.
- `v2/apps/web/components/trust/evidence-empty-state.tsx`: complete title/reason/next-action unavailable UI.
- `v2/apps/web/components/trust/correction-ledger.tsx`: empty and populated correction histories.
- `v2/apps/web/components/trust/trust.module.css`: shared Modernist trust layout and focus treatment.
- `v2/apps/web/lib/trust/correction-ledgers.server.ts`: server-only market correction records.
- `v2/apps/web/app/trust/page.tsx`: global Trust policy route.
- `v2/apps/web/app/kr/seoul/corrections/page.tsx`: Seoul correction ledger.

---

### Task 1: Immutable Trust Contracts

**Files:**
- Create: `v2/packages/market-core/src/trust.ts`
- Modify: `v2/packages/market-core/src/index.ts`
- Create: `v2/packages/market-core/test/trust.test.ts`

**Interfaces:**
- Consumes: ISO timestamps and already-validated market artifact metadata.
- Produces: `createEvidenceDescriptor`, `createEvidenceEmptyState`, `createCorrectionLedger`, and the immutable types below.

- [ ] **Step 1: Write the failing contract tests**

```ts
const evidence = createEvidenceDescriptor({
  marketId: 'kr-seoul', provider: 'MOLIT', dataset: 'reported rent contracts',
  period: '2026-01/2026-07', generatedAt: '2026-08-30T00:00:00.000Z',
  state: 'ready', publicationMinimum: 5,
  methodologyId: 'kr-jeonse-45-55-v1', rightsPolicyId: 'kr-molit-rent-v1',
});
expect(evidence.state).toBe('ready');
expect(Object.isFrozen(evidence)).toBe(true);
expect(() => createEvidenceDescriptor({ ...evidence, generatedAt: 'yesterday' }))
  .toThrow('Invalid evidence descriptor.');
expect(() => createEvidenceEmptyState({
  code: 'INSUFFICIENT', count: 5, threshold: 5,
})).toThrow('Invalid evidence empty state.');
```

Also assert duplicate correction IDs, invalid dates, blank summaries, mutable output, a `FIXED` record, an `UPHELD` record, and a valid empty ledger.

- [ ] **Step 2: Run the focused test and verify RED**

Run: `cd v2 && pnpm exec vitest run packages/market-core/test/trust.test.ts`

Expected: FAIL because `trust.ts` exports do not exist.

- [ ] **Step 3: Implement the exact trust unions and factories**

```ts
export type EvidenceState =
  | 'ready' | 'insufficient' | 'incomplete' | 'not_loaded'
  | 'rights_blocked' | 'source_unavailable' | 'invalid';

export type EmptyReason =
  | Readonly<{ code: 'INSUFFICIENT'; count: number; threshold: number }>
  | Readonly<{ code: 'NOT_REPORTABLE'; note: string }>
  | Readonly<{ code: 'NOT_LOADED'; market: string }>
  | Readonly<{ code: 'RIGHTS_BLOCKED'; source: string }>
  | Readonly<{ code: 'SOURCE_UNAVAILABLE'; retryable: boolean }>;

export type EvidenceEmptyState = Readonly<{
  title: string;
  reason: string;
  nextAction: string;
  detail: EmptyReason;
}>;

export type Correction = Readonly<{
  id: string; date: string; marketId: string; scope: string;
  status: 'FIXED' | 'UPHELD'; raisedBy: 'USER' | 'INTERNAL'; summary: string;
}>;
```

Validate `publicationMinimum` as a non-negative safe integer or `null`, `generatedAt` with round-trip ISO parsing, non-empty trimmed identifiers, `count < threshold` for `INSUFFICIENT`, unique correction IDs, and chronological newest-first ledger output. Deep-freeze every returned object and array.

- [ ] **Step 4: Run focused and package tests**

Run: `cd v2 && pnpm exec vitest run packages/market-core/test/trust.test.ts packages/market-core/test/markets.test.ts && pnpm --filter @signedprice/market-core typecheck`

Expected: PASS.

- [ ] **Step 5: Commit the contracts**

```bash
git add v2/packages/market-core/src/trust.ts v2/packages/market-core/src/index.ts v2/packages/market-core/test/trust.test.ts
git commit -m "feat(v2): define global trust contracts"
```

---

### Task 2: Shared Trust Components

**Files:**
- Create: `v2/apps/web/components/trust/evidence-disclosure.tsx`
- Create: `v2/apps/web/components/trust/evidence-empty-state.tsx`
- Create: `v2/apps/web/components/trust/correction-ledger.tsx`
- Create: `v2/apps/web/components/trust/trust.module.css`
- Create: `v2/apps/web/test/trust-components.test.tsx`
- Modify: `v2/apps/web/components/public-market/public-source-boundary.tsx`
- Modify: `v2/apps/web/test/public-source-boundary.test.tsx`

**Interfaces:**
- Consumes: Task 1 `EvidenceDescriptor`, `EvidenceEmptyState`, and `readonly Correction[]`.
- Produces: server-renderable `EvidenceDisclosure`, `EvidenceEmptyStatePanel`, and `CorrectionLedger`.

- [ ] **Step 1: Write failing server-render tests**

```tsx
const html = renderToStaticMarkup(<EvidenceEmptyStatePanel state={state} />);
expect(html).toContain('<h2');
expect(html).toContain(state.title);
expect(html).toContain(state.reason);
expect(html).toContain(state.nextAction);
expect(html).not.toMatch(/>0(?:\.0)?</);

const ledger = renderToStaticMarkup(<CorrectionLedger corrections={[]} />);
expect(ledger).toContain('No published corrections');
```

Assert disclosure terms `Source`, `Dataset`, `Period`, `Generated`, `Method`, `Rights`, `Publication minimum`, and `Boundary`; assert `FIXED` and `UPHELD` text rather than colour-only state.

- [ ] **Step 2: Run and verify RED**

Run: `cd v2 && pnpm exec vitest run apps/web/test/trust-components.test.tsx apps/web/test/public-source-boundary.test.tsx`

Expected: FAIL because the shared trust components do not exist.

- [ ] **Step 3: Implement semantic server components**

Render disclosures with `<section><dl>`, corrections with `<ol><article>`, and the empty state with a heading, paragraph, and real link when an action URL is supplied. Use text labels `Fixed` and `Upheld`; never use a badge colour as the only distinction. Keep all components free of `'use client'`.

- [ ] **Step 4: Adapt the Korea source boundary**

Convert `PublicSourceBoundaryModel` into an `EvidenceDescriptor` in the server route model, then have `PublicSourceBoundary` compose `EvidenceDisclosure` while retaining Korea-specific inclusion notes and geometry attribution. Existing HTML phrases remain covered by regression tests.

- [ ] **Step 5: Run tests, lint, and typecheck**

Run: `cd v2 && pnpm exec vitest run apps/web/test/trust-components.test.tsx apps/web/test/public-source-boundary.test.tsx apps/web/test/public-area-explorer.test.tsx apps/web/test/public-district-detail.test.tsx && pnpm lint && pnpm typecheck`

Expected: PASS with no client boundary added.

- [ ] **Step 6: Commit shared rendering**

```bash
git add v2/apps/web/components/trust v2/apps/web/components/public-market/public-source-boundary.tsx v2/apps/web/test/trust-components.test.tsx v2/apps/web/test/public-source-boundary.test.tsx
git commit -m "feat(v2): render shared evidence trust states"
```

---

### Task 3: Global Trust and Korea Corrections Routes

**Files:**
- Create: `v2/apps/web/lib/trust/correction-ledgers.server.ts`
- Create: `v2/apps/web/app/trust/page.tsx`
- Create: `v2/apps/web/app/kr/seoul/corrections/page.tsx`
- Create: `v2/apps/web/test/trust-routes.test.tsx`
- Modify: `v2/apps/web/lib/site-copy.ts`
- Modify: `v2/apps/web/components/site-footer.tsx`
- Modify: `v2/apps/web/test/public-route-contract.test.tsx`

**Interfaces:**
- Consumes: Task 1 factories and Task 2 components.
- Produces: `/trust/`, `/kr/seoul/corrections/`, `listCorrections(marketId, scope?)`, and stable Trust footer navigation.

- [ ] **Step 1: Write failing route and ledger tests**

Assert both routes render as server HTML, Production data is an empty frozen ledger, scope filtering cannot return another market, metadata is `noindex, follow` with no `alternates`, and `sitemap()` remains empty.

```ts
expect(listCorrections('kr-seoul')).toEqual([]);
expect(globalMetadata.robots).toEqual({ index: false, follow: true });
expect(globalMetadata).not.toHaveProperty('alternates');
expect(sitemap()).toEqual([]);
```

- [ ] **Step 2: Run and verify RED**

Run: `cd v2 && pnpm exec vitest run apps/web/test/trust-routes.test.tsx apps/web/test/public-route-contract.test.tsx`

Expected: FAIL because the routes and ledger do not exist.

- [ ] **Step 3: Implement server-only correction storage and pages**

Keep the Production constant exactly `Object.freeze([] as Correction[])`. Tests construct populated ledgers directly through the Task 1 factory. The global route explains evidence states, rights, freshness, accuracy policy, and correction semantics; it must state that no model-accuracy figure is currently published. The Korea route scopes copy to MOLIT evidence and links back to Seoul Explore and Rankings.

- [ ] **Step 4: Add stable Trust navigation**

Add `/trust/` to the global footer and `/kr/seoul/corrections/` to Korea evidence footers. Do not add Singapore correction navigation until the Singapore artifact is ready.

- [ ] **Step 5: Verify routes and commit**

Run: `cd v2 && pnpm exec vitest run apps/web/test/trust-routes.test.tsx apps/web/test/public-route-contract.test.tsx apps/web/test/home-content.test.ts apps/web/test/home-layout.test.ts && pnpm lint && pnpm typecheck`

```bash
git add v2/apps/web/lib/trust v2/apps/web/app/trust v2/apps/web/app/kr/seoul/corrections v2/apps/web/lib/site-copy.ts v2/apps/web/components/site-footer.tsx v2/apps/web/test/trust-routes.test.tsx v2/apps/web/test/public-route-contract.test.tsx
git commit -m "feat(v2): publish trust and correction routes"
```

---

### Task 4: Official SignedPrice Brand Assets

**Files:**
- Create from the user-supplied archive: `v2/apps/web/public/brand/lockup.svg`
- Create from the user-supplied archive: `v2/apps/web/public/brand/lockup-dark.svg`
- Create from the user-supplied archive: `v2/apps/web/public/brand/favicon.svg`
- Create from the user-supplied archive: `v2/apps/web/public/brand/apple-touch-icon.png`
- Create from the user-supplied archive: `v2/apps/web/public/brand/og-default.png`
- Modify: `v2/apps/web/components/site-header.tsx`
- Modify: `v2/apps/web/app/layout.tsx`
- Modify: `v2/apps/web/app/globals.css`
- Create: `v2/apps/web/test/brand-assets.test.tsx`

**Interfaces:**
- Consumes: the official `signedprice-logo_1.zip` asset package; no generated or redrawn substitute is permitted.
- Produces: light/dark lockups, favicon/application icons, OG metadata, and an accessible linked home logo.

- [ ] **Step 1: Restore the exact official archive as an execution input**

Confirm the archive contains the expected light and dark SVG lockups plus icon/OG assets. If it is not present in the execution workspace, mark only this task blocked and continue the code-only Trust tasks; do not recreate the logo from screenshots or typography.

- [ ] **Step 2: Write failing brand-contract tests**

Assert every asset exists, is non-empty, SVGs contain a finite `viewBox`, SVGs contain no script, event-handler attribute, external HTTP reference, embedded raster data URL, or foreign object, and raster dimensions are non-zero. Render `SiteHeader` and assert the image has `alt="signedprice"`, the parent link has the existing home aria-label, and no text-only `.wordmark` remains.

- [ ] **Step 3: Run and verify RED**

Run: `cd v2 && pnpm exec vitest run apps/web/test/brand-assets.test.tsx`

Expected: FAIL until the official assets and header integration are present.

- [ ] **Step 4: Install and wire the official files**

Preserve the archive bytes for all raster assets and SVG path data. Use `/brand/lockup.svg` on paper/light headers and `/brand/lockup-dark.svg` only on ink backgrounds. Configure `layout.tsx` metadata icons and default OG image from the installed files. Size with CSS while preserving intrinsic aspect ratio; do not recolour SVG paths in application CSS.

- [ ] **Step 5: Verify and commit branding**

Run: `cd v2 && pnpm exec vitest run apps/web/test/brand-assets.test.tsx apps/web/test/home-layout.test.ts apps/web/test/market-overview-modernist.test.ts && pnpm lint && pnpm typecheck && pnpm build`

```bash
git add v2/apps/web/public/brand v2/apps/web/components/site-header.tsx v2/apps/web/app/layout.tsx v2/apps/web/app/globals.css v2/apps/web/test/brand-assets.test.tsx
git commit -m "feat(v2): install official SignedPrice branding"
```

---

### Task 5: Trust Release Contracts

**Files:**
- Create: `v2/tests/e2e/trust.spec.ts`
- Modify: `v2/tests/e2e/public-route-contract.ts`
- Modify: `v2/playwright.config.ts`
- Modify: `v2/tests/browser-ci-contract.test.ts`
- Create: `v2/apps/web/test/trust-copy-contract.test.tsx`

**Interfaces:**
- Consumes: completed Trust routes.
- Produces: browser, secret-boundary, forbidden-claim, and SEO release gates.

- [ ] **Step 1: Add failing browser and copy guards**

At 390px, 720px, 1366px, and 1440px assert headings, disclosure terms, correction empty state, keyboard focus, 44px links, zero horizontal overflow, no console errors, and no 5xx responses. Scan `app`, `components`, and `lib` for unsupported literals `191,067`, `8.2%`, `감정가`, `가장 정확`, `예상 가격`, and credential values.

- [ ] **Step 2: Run test collection and verify intended RED**

Run: `cd v2 && pnpm exec vitest run apps/web/test/trust-copy-contract.test.tsx tests/browser-ci-contract.test.ts && pnpm exec playwright test --list`

Expected: FAIL until the new route list and viewport project matching include `trust.spec.ts`.

- [ ] **Step 3: Register the exact routes and viewport projects**

Add `/trust/` and `/kr/seoul/corrections/` to `publicRoutes`. Include `trust` in tablet and wide project `testMatch` expressions. Do not add sitemap URLs.

- [ ] **Step 4: Run the complete Trust gate**

Run: `cd v2 && pnpm exec vitest run packages/market-core/test/trust.test.ts apps/web/test/trust-components.test.tsx apps/web/test/trust-routes.test.tsx apps/web/test/trust-copy-contract.test.tsx tests/browser-ci-contract.test.ts && pnpm lint && pnpm typecheck && pnpm build && pnpm check:rent-client-boundary && pnpm exec playwright test tests/e2e/trust.spec.ts`

Expected: every command PASS.

- [ ] **Step 5: Commit the release contract**

```bash
git add v2/tests/e2e/trust.spec.ts v2/tests/e2e/public-route-contract.ts v2/playwright.config.ts v2/tests/browser-ci-contract.test.ts v2/apps/web/test/trust-copy-contract.test.tsx
git commit -m "test(v2): gate global trust surfaces"
```
