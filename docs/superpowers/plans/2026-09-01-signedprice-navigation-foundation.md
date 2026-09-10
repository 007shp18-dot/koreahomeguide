# SignedPrice Navigation Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give Guide the shared two-tier SignedPrice chrome and establish one validated canonical market-selection codec before snapshot-backed transaction modes are activated.

**Architecture:** Route pages continue to own global header/footer chrome, using one Korea guide shell model so index and document pages cannot drift. A pure navigation module parses, normalizes, and serializes the cross-surface selection contract; later Explore, Detail, Rankings, and Check tasks consume the same codec rather than creating route-specific query formats.

**Tech Stack:** TypeScript 5.9.3, Vitest 4.1.11, Next.js 16.3.3 App Router, React 19.2.8

**Spec:** `docs/superpowers/specs/2026-09-01-signedprice-navigation-data-normalization-design.md`

## Global Constraints

- Route pages own `SiteHeader` and `SiteFooter`; Guide content components do not render global chrome.
- Guide uses the current shared product links and marks `/kr/seoul/guide/` active.
- Korea allows `sale | jeonse | monthly`; Singapore allows `sale | rent`; Dubai retains only a normalized safe market state in this release.
- Free-form search, money, personal information, and secrets never enter shared navigation URLs.
- Invalid fields are dropped; unsupported market/transaction combinations normalize to the market's safe default.
- Canonical query keys are deterministic and default values are omitted.
- No new runtime dependency.

---

### Task 1: Shared Guide route chrome

**Files:**
- Create: `v2/apps/web/lib/guide/guide-shell.ts`
- Modify: `v2/apps/web/app/(en)/kr/seoul/guide/page.tsx`
- Modify: `v2/apps/web/app/(en)/kr/seoul/guide/[slug]/page.tsx`
- Modify: `v2/apps/web/test/guide-routes.test.tsx`

**Interfaces:**
- Produces: `KOREA_GUIDE_HEADER` and `KOREA_GUIDE_FOOTER`.
- Consumes: existing `productNavigationLinks`, `SiteHeader`, `SiteFooter`, and Guide content components.

- [ ] **Step 1: Write failing Guide shell tests**

Render the real index and every real document route. Assert exactly one market tier, one product tier, one footer, the five product links, Guide `aria-current="page"`, and no building-only tabs.

- [ ] **Step 2: Run the focused test and verify failure**

Run: `pnpm vitest run apps/web/test/guide-routes.test.tsx`

Expected: FAIL because Guide routes do not render the shared header or footer.

- [ ] **Step 3: Implement the shared route models**

```ts
export const KOREA_GUIDE_HEADER = Object.freeze({
  brand: 'signedprice',
  homeLabel: 'signedprice home',
  navigationLabel: 'Seoul guide navigation',
  marketLabel: 'Seoul',
  languageLabel: 'EN',
  links: productNavigationLinks,
} satisfies SiteHeaderModel);
```

Create a matching Korea evidence footer using `KOREA_PUBLIC_RELEASE_STATUS` and links to Home, Explore, Check, Trust, and Corrections.

- [ ] **Step 4: Wrap both route pages with one header and footer**

Keep `GuideIndex` and `GuideDocument` responsible only for their existing page content. Add `id="top"` to the route-owned shell.

- [ ] **Step 5: Run the Guide suite and verify pass**

Run: `pnpm vitest run apps/web/test/guide-routes.test.tsx`

- [ ] **Step 6: Commit Guide chrome**

```bash
git add 'v2/apps/web/app/(en)/kr/seoul/guide/page.tsx' 'v2/apps/web/app/(en)/kr/seoul/guide/[slug]/page.tsx' v2/apps/web/lib/guide/guide-shell.ts v2/apps/web/test/guide-routes.test.tsx
git commit -m "feat(guide): add shared SignedPrice navigation"
```

### Task 2: Canonical market-selection codec

**Files:**
- Create: `v2/apps/web/lib/navigation/explorer-selection.ts`
- Create: `v2/apps/web/test/explorer-selection.test.ts`

**Interfaces:**
- Produces: `ExplorerSelection`, `normalizeExplorerSelection(input)`, `parseExplorerSelection(searchParams, defaults)`, `serializeExplorerSelection(selection, defaults)`, and `createSelectionHref(path, selection, defaults)`.

```ts
export type ExplorerSelection = Readonly<{
  market: 'kr' | 'sg' | 'ae';
  transaction: 'sale' | 'jeonse' | 'monthly' | 'rent';
  propertyType?: string;
  district?: string;
  neighborhood?: string;
  buildingId?: string;
  contractType?: 'new' | 'renewal' | 'all';
  sort?: string;
}>;
```

- [ ] **Step 1: Write failing codec tests**

Use literal expected query strings. Cover all supported Korea and Singapore transactions, unsupported combinations, duplicate/array inputs, invalid identifiers, orphan descendants, allow-listed contract types, deterministic key order, default omission, and round-trip stability.

- [ ] **Step 2: Run the focused test and verify the missing module failure**

Run: `pnpm vitest run apps/web/test/explorer-selection.test.ts`

- [ ] **Step 3: Implement normalization**

Use these defaults: Korea `jeonse`, Singapore `sale`, Dubai `sale`. Accept IDs only when they match `/^[a-z0-9]+(?:-[a-z0-9]+)*$/`; clear neighborhood and building when district is absent, and clear building when neighborhood is absent. Allow property type and sort only from explicit module-owned allow-lists.

- [ ] **Step 4: Implement deterministic serialization**

Canonical key order is `market`, `transaction`, `propertyType`, `district`, `neighborhood`, `buildingId`, `contractType`, `sort`. Omit the default market and transaction supplied for the destination route.

- [ ] **Step 5: Run the focused test and verify pass**

Run: `pnpm vitest run apps/web/test/explorer-selection.test.ts`

- [ ] **Step 6: Commit the codec**

```bash
git add v2/apps/web/lib/navigation/explorer-selection.ts v2/apps/web/test/explorer-selection.test.ts
git commit -m "feat(navigation): add canonical market selection codec"
```

### Task 3: Initial Explore and Guide handoffs

**Files:**
- Modify: `v2/apps/web/app/(en)/kr/seoul/explore/page.tsx`
- Modify: `v2/apps/web/components/public-market/area-explorer.tsx`
- Modify: `v2/apps/web/lib/guide/guide-content.ts`
- Modify: `v2/apps/web/test/public-area-explorer.test.tsx`
- Modify: `v2/apps/web/test/guide-routes.test.tsx`

**Interfaces:**
- Consumes: the codec from Task 2.
- Produces: canonical Explore initial selection and validated Guide contextual actions.

- [ ] **Step 1: Write failing integration tests**

Assert that `transaction=jeonse&district=jongno-gu` restores the Explore selection, invalid `transaction=rent` normalizes to Korea's default, and Guide actions contain only validated context without free-form search or money fields.

- [ ] **Step 2: Run focused tests and verify failure**

Run: `pnpm vitest run apps/web/test/public-area-explorer.test.tsx apps/web/test/guide-routes.test.tsx`

- [ ] **Step 3: Parse the active Explore query through the codec**

Pass the normalized district and transaction into the server route model. Keep currently unavailable sale/monthly price modes disabled; this task establishes state continuity and does not imply dataset activation.

- [ ] **Step 4: Build Guide actions through `createSelectionHref`**

Keep article URLs clean. Only contextual actions into Explore or Check receive allowed market selection fields.

- [ ] **Step 5: Run focused and existing navigation suites**

Run: `pnpm vitest run apps/web/test/explorer-selection.test.ts apps/web/test/public-area-explorer.test.tsx apps/web/test/guide-routes.test.tsx apps/web/test/explorer-state-contract.test.ts`

- [ ] **Step 6: Commit the initial handoffs**

```bash
git add 'v2/apps/web/app/(en)/kr/seoul/explore/page.tsx' v2/apps/web/components/public-market/area-explorer.tsx v2/apps/web/lib/guide/guide-content.ts v2/apps/web/test/public-area-explorer.test.tsx v2/apps/web/test/guide-routes.test.tsx
git commit -m "feat(navigation): preserve verified market context"
```

### Task 4: Navigation verification

**Files:**
- Verify all files changed in Tasks 1–3.

**Interfaces:**
- Produces: a buildable prerequisite for the data-foundation plan.

- [ ] **Step 1: Run repository gates**

Run from `v2/`: `pnpm test`, `pnpm typecheck`, `pnpm lint`, and `pnpm build`.

- [ ] **Step 2: Run browser verification**

Verify Guide index, one Guide document, and Korea Explore at 390, 720, 1366, and 1440 pixels. Confirm both navigation tiers, active Guide state, footer, focus visibility, back/forward URL restoration, and no horizontal overflow.

- [ ] **Step 3: Review the prerequisite diff**

Confirm no data mode was activated without a valid snapshot and no unrelated page lost its existing header/footer behavior.
