# SignedPrice Building Decision Detail Phase 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the dense Seoul building evidence page with one responsive, provenance-safe decision shell that keeps Rent live, exposes Buy and Invest honestly behind evidence gates, and moves secondary evidence below native disclosure.

**Architecture:** Keep the canonical building route and verified rent artifact intact. Parse decision mode and contract cohort at the Next.js page boundary, derive a pure immutable decision model, and render server-side links and panels without adding a new dependency. Phase 1 creates the rights-safe visual slot and a truthful no-image state; licensed photos, official sale evidence, investment calculations, and additional markets remain independent releases.

**Tech Stack:** Next.js 16.3.3 App Router, React 19.2.8 Server Components, TypeScript 5.9.3, CSS Modules, pnpm 11.19.0, Vitest 4.1.11, Playwright 1.62.1

**Spec:** `docs/superpowers/specs/2026-09-01-signedprice-unified-building-decision-detail-design.md`

## Global Constraints

- No new dependencies.
- Internal Korea money remains integer KRW; formatting happens only at the display boundary.
- Area remains square metres internally.
- Fewer than five eligible contracts remain unpublished.
- No invented building facts, coordinates, images, sale prices, yields, rights, or forecasts.
- Every unavailable state has a title, reason, and next valid action.
- New is the default rent cohort; All, New, and Renewal remain visible together.
- Internal links end in `/` before any query string.
- Geometry remains square with two-pixel structural rules, one-pixel row rules, zero radius, and no shadow.
- Use only existing SignedPrice color tokens in first-party CSS.
- Building pages remain `noindex, follow` in Phase 1.
- Production promotion is outside this plan and requires an exact-SHA Preview review.

## Scope Boundary

The approved spec contains four independently testable releases. This plan implements only the first release:

- unified building shell and route state;
- compact market header and building identity hero;
- rights-safe visual contract plus no-image state;
- Overview, live Rent, gated Buy, gated Invest, and Evidence modes;
- progressive disclosure of existing floor, area-band, recent-contract, News, Community, and methodology content;
- responsive and browser verification.

Create separate implementation plans after Phase 1 passes for:

1. licensed-photo or provider-render connection after display-rights review;
2. official sale artifact and live Buy comparisons;
3. investment scenario calculations;
4. Singapore and Dubai building modes;
5. inline Rent quote input/verdict and cross-entry quote carry after the current district/type Rent Check context can bind the new verified building identity without legacy-ID substitution.

Until item 5 lands, Phase 1's Rent decision uses the independently published building distribution, keeps New/Renewal/All separate, and sends the user to the existing full Rent Check with verified district and housing-type context. It does not pretend that the current Rent Check result is building-scoped.

## File Structure

### New files

- `v2/apps/web/lib/public-market/building-decision-state.ts` — validates `mode` and `contract` query values and creates canonical query links.
- `v2/apps/web/lib/public-market/building-decision-model.ts` — derives immutable readiness and selected-cohort presentation from the verified building model.
- `v2/apps/web/lib/public-market/building-visual-model.ts` — validates a same-origin licensed-photo record and otherwise returns the no-image state.
- `v2/apps/web/components/public-market/building-detail-header.tsx` — compact SignedPrice/market/current-product header used only by full building detail.
- `v2/apps/web/components/public-market/building-visual.tsx` — renders a licensed same-origin photo or the truthful no-image state.
- `v2/apps/web/components/public-market/building-decision-tabs.tsx` — server-rendered mode and cohort links.
- `v2/apps/web/components/public-market/building-decision-views.tsx` — Overview, Rent, Buy gate, Invest gate, and Evidence mode content.
- `v2/apps/web/components/public-market/building-evidence-details.tsx` — existing floor, area, recent records, News, Community, navigation, and source details below disclosure.
- `v2/apps/web/test/public-building-decision-state.test.ts` — query validation and href contract.
- `v2/apps/web/test/public-building-decision-model.test.ts` — readiness, cohort publication, and gating tests.
- `v2/apps/web/test/public-building-visual.test.tsx` — provenance-safe image and no-image rendering tests.
- `v2/apps/web/test/public-building-decision-views.test.tsx` — mode rendering and disclosure tests.

### Modified files

- `v2/apps/web/app/kr/seoul/explore/[district]/[buildingId]/page.tsx:1-72` — await `searchParams`, build selection/decision/visual models, and pass them to the page.
- `v2/apps/web/components/public-market/building-detail-page.tsx:1-205` — replace the dense hero/two-column rail with the unified decision composition.
- `v2/apps/web/components/public-market/building-detail.module.css:1-106` — implement the approved desktop/mobile hierarchy and progressive-disclosure styling.
- `v2/apps/web/test/public-building-detail.test.tsx:1-126` — update the SSR, metadata, semantic, and CSS contracts.
- `v2/apps/web/test/public-building-route-model.test.ts:1-123` — preserve the verified building model regression boundary.
- `v2/tests/e2e/korea-detail.spec.ts:105-126` — verify mode navigation, browser history, disclosure, overflow, touch size, and noindex state.

---

### Task 1: Decision Query and Link Contract

**Files:**
- Create: `v2/apps/web/lib/public-market/building-decision-state.ts`
- Test: `v2/apps/web/test/public-building-decision-state.test.ts`

**Interfaces:**
- Consumes: Next.js page query shape `Readonly<Record<string, string | string[] | undefined>>`.
- Produces: `BuildingDecisionMode`, `BuildingContractCohort`, `BuildingDecisionSelection`, `parseBuildingDecisionSelection(query)`, and `buildingDecisionHref(input)`.

- [ ] **Step 1: Write the failing query-contract tests**

```ts
import { describe, expect, it } from 'vitest';

import {
  buildingDecisionHref,
  parseBuildingDecisionSelection,
} from '../lib/public-market/building-decision-state';

describe('building decision state', () => {
  it('defaults to Overview and New and rejects arrays or unknown values', () => {
    expect(parseBuildingDecisionSelection({})).toEqual({ mode: 'overview', contract: 'new' });
    expect(parseBuildingDecisionSelection({ mode: 'rent', contract: 'all' }))
      .toEqual({ mode: 'rent', contract: 'all' });
    expect(parseBuildingDecisionSelection({ mode: ['rent'], contract: 'renewal' }))
      .toEqual({ mode: 'overview', contract: 'renewal' });
    expect(parseBuildingDecisionSelection({ mode: 'forecast', contract: 'mixed' }))
      .toEqual({ mode: 'overview', contract: 'new' });
  });

  it('keeps the canonical building path and omits default query values', () => {
    const base = '/kr/seoul/explore/gangnam-gu/evidence-tower/';
    expect(buildingDecisionHref({ base, mode: 'overview', contract: 'new' })).toBe(base);
    expect(buildingDecisionHref({ base, mode: 'rent', contract: 'new' }))
      .toBe(`${base}?mode=rent`);
    expect(buildingDecisionHref({ base, mode: 'rent', contract: 'renewal' }))
      .toBe(`${base}?mode=rent&contract=renewal`);
  });
});
```

- [ ] **Step 2: Run the test and verify the missing module failure**

Run from `v2/`:

```bash
pnpm exec vitest run apps/web/test/public-building-decision-state.test.ts
```

Expected: FAIL because `building-decision-state.ts` does not exist.

- [ ] **Step 3: Implement the immutable parser and href builder**

```ts
export const BUILDING_DECISION_MODES = [
  'overview', 'rent', 'buy', 'invest', 'evidence',
] as const;

export const BUILDING_CONTRACT_COHORTS = ['all', 'new', 'renewal'] as const;

export type BuildingDecisionMode = (typeof BUILDING_DECISION_MODES)[number];
export type BuildingContractCohort = (typeof BUILDING_CONTRACT_COHORTS)[number];

export type BuildingDecisionSelection = Readonly<{
  mode: BuildingDecisionMode;
  contract: BuildingContractCohort;
}>;

type BuildingDecisionQuery = Readonly<Record<
  string,
  string | string[] | undefined
>>;

function singleAllowed<T extends string>(
  value: string | string[] | undefined,
  allowed: readonly T[],
  fallback: T,
): T {
  return typeof value === 'string' && allowed.includes(value as T)
    ? value as T
    : fallback;
}

export function parseBuildingDecisionSelection(
  query: BuildingDecisionQuery,
): BuildingDecisionSelection {
  return Object.freeze({
    mode: singleAllowed(query.mode, BUILDING_DECISION_MODES, 'overview'),
    contract: singleAllowed(query.contract, BUILDING_CONTRACT_COHORTS, 'new'),
  });
}

export function buildingDecisionHref(input: Readonly<{
  base: string;
  mode: BuildingDecisionMode;
  contract: BuildingContractCohort;
}>): string {
  if (!input.base.startsWith('/') || !input.base.endsWith('/')) {
    throw new TypeError('Building decision base must be a trailing-slash internal path.');
  }
  const query = new URLSearchParams();
  if (input.mode !== 'overview') query.set('mode', input.mode);
  if (input.contract !== 'new') query.set('contract', input.contract);
  const suffix = query.toString();
  return suffix === '' ? input.base : `${input.base}?${suffix}`;
}
```

- [ ] **Step 4: Run the targeted test**

```bash
pnpm exec vitest run apps/web/test/public-building-decision-state.test.ts
```

Expected: PASS with 2 tests.

- [ ] **Step 5: Commit the query contract**

```bash
git add v2/apps/web/lib/public-market/building-decision-state.ts \
  v2/apps/web/test/public-building-decision-state.test.ts
git commit -m "feat(building): define decision route state"
```

---

### Task 2: Building Decision Readiness Model

**Files:**
- Create: `v2/apps/web/lib/public-market/building-decision-model.ts`
- Test: `v2/apps/web/test/public-building-decision-model.test.ts`

**Interfaces:**
- Consumes: `PublicBuildingModel` and `BuildingDecisionSelection` from Task 1.
- Produces: `BuildingDecisionModel` and `buildBuildingDecisionModel(model, selection)`.
- The Rent view in Task 5 relies on `decision.rent.summary`, `decision.rent.axis`, and `decision.rent.readiness`.

- [ ] **Step 1: Write failing tests for live Rent and gated Buy/Invest**

```ts
import { describe, expect, it } from 'vitest';
import { buildBuildingDecisionModel } from '../lib/public-market/building-decision-model';
import { buildPublicBuildingModel } from '../lib/public-market/building-route-model.server';
import {
  PUBLIC_BUILDING_FIXTURE_PERIOD,
  createPublicBuildingFixture,
} from './public-building-fixture';

function buildingModel() {
  const model = buildPublicBuildingModel('gangnam-gu', 'gangnam-evidence-tower', {
    source: createPublicBuildingFixture(),
    period: PUBLIC_BUILDING_FIXTURE_PERIOD,
    referenceInstant: '2026-09-01T00:00:00.000Z',
  });
  if (model === null) throw new Error('Expected verified building model.');
  return model;
}

describe('building decision model', () => {
  it('keeps New selected but fails the unpublished cohort closed', () => {
    const decision = buildBuildingDecisionModel(buildingModel(), {
      mode: 'rent', contract: 'new',
    });
    expect(decision.rent).toMatchObject({
      cohort: 'new',
      readiness: {
        state: 'insufficient', count: 3,
        title: 'New contract evidence is not published',
      },
      summary: null,
    });
    expect(decision.rent.axis).toEqual({ min: 300_000_000, max: 340_000_000 });
  });

  it('publishes All from the verified artifact and keeps future modes gated', () => {
    const decision = buildBuildingDecisionModel(buildingModel(), {
      mode: 'overview', contract: 'all',
    });
    expect(decision.rent.summary).toMatchObject({ published: true, n: 6, med: 320_000_000 });
    expect(decision.overview.primaryMode).toBe('rent');
    expect(decision.buy).toMatchObject({
      readiness: { state: 'unavailable', title: 'Official sale evidence is not ready' },
    });
    expect(decision.invest).toMatchObject({
      readiness: { state: 'insufficient', title: 'Investment evidence is incomplete' },
    });
    expect(decision.rentCheckHref)
      .toBe('/kr/seoul/check/?lawdCd=11680&type=apartment');
  });
});
```

- [ ] **Step 2: Run the test and verify the missing model failure**

```bash
pnpm exec vitest run apps/web/test/public-building-decision-model.test.ts
```

Expected: FAIL because `building-decision-model.ts` does not exist.

- [ ] **Step 3: Implement the exact readiness and selected-cohort model**

```ts
import {
  createPublicMarketSummary,
  type PublishedMarketSummary,
  type QuotePositionAxis,
} from '@signedprice/market-core';

import type { PublicBuildingModel } from './building-route-model.server';
import type {
  BuildingContractCohort,
  BuildingDecisionSelection,
} from './building-decision-state';

export type BuildingDecisionReadiness =
  | Readonly<{ state: 'published'; count: number }>
  | Readonly<{
      state: 'confirmed_future'; title: string; reason: string; nextAction: string;
    }>
  | Readonly<{
      state: 'insufficient'; count: number; title: string; reason: string; nextAction: string;
    }>
  | Readonly<{
      state: 'unavailable'; title: string; reason: string; nextAction: string;
    }>;

export type BuildingDecisionModel = Readonly<{
  selection: BuildingDecisionSelection;
  overview: Readonly<{ primaryMode: 'rent' }>;
  rent: Readonly<{
    cohort: BuildingContractCohort;
    readiness: BuildingDecisionReadiness;
    summary: PublishedMarketSummary | null;
    axis: QuotePositionAxis;
  }>;
  buy: Readonly<{ readiness: BuildingDecisionReadiness }>;
  invest: Readonly<{ readiness: BuildingDecisionReadiness }>;
  rentCheckHref: string;
}>;

function cohortGroup(model: PublicBuildingModel, cohort: BuildingContractCohort) {
  return cohort === 'all' ? model.building.groups.all : model.building.groups[cohort];
}

function rentCheckType(model: PublicBuildingModel): 'apartment' | 'officetel' | 'villa' {
  return model.building.housingType === 'villa_multifamily'
    ? 'villa'
    : model.building.housingType;
}

function rentReadiness(
  cohort: BuildingContractCohort,
  group: ReturnType<typeof cohortGroup>,
  minimum: number,
): BuildingDecisionReadiness {
  if (group.published) return Object.freeze({ state: 'published', count: group.n });
  const label = cohort === 'all' ? 'All' : cohort === 'new' ? 'New' : 'Renewal';
  return Object.freeze({
    state: 'insufficient',
    count: group.n,
    title: `${label} contract evidence is not published`,
    reason: `${group.n} eligible records are below the ${minimum}-record publication minimum.`,
    nextAction: cohort === 'all' ? 'Return to district evidence' : 'View All contract evidence',
  });
}

function summaryFor(
  model: PublicBuildingModel,
  cohort: BuildingContractCohort,
): PublishedMarketSummary | null {
  const group = cohortGroup(model, cohort);
  if (!group.published) return null;
  const summary = createPublicMarketSummary({
    marketId: 'kr-seoul',
    area: model.building.buildingId,
    parent: model.district.slug,
    deal: 'jeonse',
    band: `building:${cohort}`,
    period: model.building.period,
    n: group.n,
    min: group.min,
    p25: group.p25,
    med: group.med,
    p75: group.p75,
    max: group.max,
    chg3m: null,
  });
  if (!summary.published) throw new TypeError('Published cohort summary required.');
  return summary;
}

export function buildBuildingDecisionModel(
  model: PublicBuildingModel,
  selection: BuildingDecisionSelection,
): BuildingDecisionModel {
  const group = cohortGroup(model, selection.contract);
  const query = new URLSearchParams({
    lawdCd: model.district.lawdCd,
    type: rentCheckType(model),
  });
  return Object.freeze({
    selection,
    overview: Object.freeze({ primaryMode: 'rent' }),
    rent: Object.freeze({
      cohort: selection.contract,
      readiness: rentReadiness(
        selection.contract,
        group,
        model.evidence.publicationMinimum,
      ),
      summary: summaryFor(model, selection.contract),
      axis: model.plotAxis,
    }),
    buy: Object.freeze({
      readiness: Object.freeze({
        state: 'unavailable',
        title: 'Official sale evidence is not ready',
        reason: 'No rights-cleared official sale artifact is installed for this building.',
        nextAction: 'Review the current evidence ledger',
      }),
    }),
    invest: Object.freeze({
      readiness: Object.freeze({
        state: 'insufficient',
        count: 0,
        title: 'Investment evidence is incomplete',
        reason: 'Official sale evidence and explicit financing assumptions are required.',
        nextAction: 'Review the current evidence ledger',
      }),
    }),
    rentCheckHref: `/kr/seoul/check/?${query.toString()}`,
  });
}
```

- [ ] **Step 4: Run model and existing route-model tests**

```bash
pnpm exec vitest run \
  apps/web/test/public-building-decision-model.test.ts \
  apps/web/test/public-building-route-model.test.ts
```

Expected: PASS with the new readiness tests and all existing route-model tests.

- [ ] **Step 5: Commit the decision model**

```bash
git add v2/apps/web/lib/public-market/building-decision-model.ts \
  v2/apps/web/test/public-building-decision-model.test.ts
git commit -m "feat(building): derive decision readiness"
```

---

### Task 3: Rights-Safe Building Visual

**Files:**
- Create: `v2/apps/web/lib/public-market/building-visual-model.ts`
- Create: `v2/apps/web/components/public-market/building-visual.tsx`
- Test: `v2/apps/web/test/public-building-visual.test.tsx`

**Interfaces:**
- Consumes: an optional same-origin licensed-photo record and the canonical Explore map href.
- Produces: `BuildingVisualModel`, `buildBuildingVisualModel(input)`, and `<BuildingVisual model />`.
- Phase 1 production calls the builder without a photo and therefore renders the no-image state.

- [ ] **Step 1: Write failing model and rendering tests**

```tsx
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { BuildingVisual } from '../components/public-market/building-visual';
import { buildBuildingVisualModel } from '../lib/public-market/building-visual-model';

describe('building visual', () => {
  it('fails closed when a licensed photo is not connected', () => {
    const model = buildBuildingVisualModel({
      buildingName: 'Evidence Tower',
      mapHref: '/kr/seoul/explore/?district=gangnam-gu',
      photo: null,
    });
    expect(model).toEqual({
      kind: 'unavailable',
      title: 'Verified building image is not available',
      reason: 'A rights-cleared building photo or provider render is not connected.',
      nextAction: { label: 'View this building area on the map', href: '/kr/seoul/explore/?district=gangnam-gu' },
    });
    const html = renderToStaticMarkup(<BuildingVisual model={model} />);
    expect(html).toContain('Verified building image is not available');
    expect(html).not.toContain('<img');
  });

  it('accepts only a licensed same-origin building asset', () => {
    const model = buildBuildingVisualModel({
      buildingName: 'Evidence Tower',
      mapHref: '/kr/seoul/explore/?district=gangnam-gu',
      photo: {
        src: '/assets/buildings/evidence-tower.jpg',
        sourceLabel: 'Owner-authorized building photograph',
        rightsPolicyId: 'kr-building-photo-owner-v1',
      },
    });
    expect(model.kind).toBe('licensed_photo');
    const html = renderToStaticMarkup(<BuildingVisual model={model} />);
    expect(html).toContain('Owner-authorized building photograph');
    expect(html).toContain('Evidence Tower exterior');
  });

  it('rejects remote, hot-linked, or malformed photo records at runtime', () => {
    const model = buildBuildingVisualModel({
      buildingName: 'Evidence Tower',
      mapHref: '/kr/seoul/explore/?district=gangnam-gu',
      photo: {
        src: 'https://images.example.com/evidence-tower.jpg',
        sourceLabel: 'Unverified remote image',
        rightsPolicyId: 'unknown',
      } as never,
    });
    expect(model.kind).toBe('unavailable');
  });
});
```

- [ ] **Step 2: Run the test and verify missing module failures**

```bash
pnpm exec vitest run apps/web/test/public-building-visual.test.tsx
```

Expected: FAIL because the visual model and component do not exist.

- [ ] **Step 3: Implement strict visual provenance validation**

```ts
export type LicensedBuildingPhoto = Readonly<{
  src: `/assets/buildings/${string}`;
  sourceLabel: string;
  rightsPolicyId: string;
}>;

export type BuildingVisualModel =
  | Readonly<{
      kind: 'licensed_photo'; src: LicensedBuildingPhoto['src']; alt: string;
      sourceLabel: string; rightsPolicyId: string;
    }>
  | Readonly<{
      kind: 'unavailable'; title: string; reason: string;
      nextAction: Readonly<{ label: string; href: string }>;
    }>;

function trimmed(value: string): boolean {
  return value.length > 0 && value === value.trim();
}

export function buildBuildingVisualModel(input: Readonly<{
  buildingName: string;
  mapHref: string;
  photo: LicensedBuildingPhoto | null;
}>): BuildingVisualModel {
  const photo = input.photo;
  if (
    photo !== null
    && /^\/assets\/buildings\/[a-z0-9][a-z0-9._/-]*$/i.test(photo.src)
    && trimmed(photo.sourceLabel)
    && trimmed(photo.rightsPolicyId)
  ) {
    return Object.freeze({
      kind: 'licensed_photo',
      src: photo.src,
      alt: `${input.buildingName} exterior`,
      sourceLabel: photo.sourceLabel,
      rightsPolicyId: photo.rightsPolicyId,
    });
  }
  return Object.freeze({
    kind: 'unavailable',
    title: 'Verified building image is not available',
    reason: 'A rights-cleared building photo or provider render is not connected.',
    nextAction: Object.freeze({
      label: 'View this building area on the map',
      href: input.mapHref,
    }),
  });
}
```

- [ ] **Step 4: Implement the image/no-image component**

```tsx
import Image from 'next/image';
import Link from 'next/link';
import type { BuildingVisualModel } from '../../lib/public-market/building-visual-model';
import styles from './building-detail.module.css';

export function BuildingVisual({ model }: Readonly<{ model: BuildingVisualModel }>) {
  if (model.kind === 'unavailable') {
    return (
      <section className={styles.visualUnavailable} aria-label={model.title}>
        <strong>{model.title}</strong>
        <p>{model.reason}</p>
        <Link href={model.nextAction.href}>{model.nextAction.label}</Link>
      </section>
    );
  }
  return (
    <figure className={styles.visualPhoto}>
      <Image src={model.src} alt={model.alt} fill sizes="(max-width: 720px) 100vw, 54vw" />
      <figcaption>{model.sourceLabel}</figcaption>
    </figure>
  );
}
```

- [ ] **Step 5: Run visual tests**

```bash
pnpm exec vitest run apps/web/test/public-building-visual.test.tsx
```

Expected: PASS with 3 tests, including the fail-closed remote-image branch.

- [ ] **Step 6: Commit the visual boundary**

```bash
git add v2/apps/web/lib/public-market/building-visual-model.ts \
  v2/apps/web/components/public-market/building-visual.tsx \
  v2/apps/web/test/public-building-visual.test.tsx
git commit -m "feat(building): add rights-safe visual boundary"
```

---

### Task 4: Compact Header and Server-Rendered Decision Tabs

**Files:**
- Create: `v2/apps/web/components/public-market/building-detail-header.tsx`
- Create: `v2/apps/web/components/public-market/building-decision-tabs.tsx`
- Modify: `v2/apps/web/test/public-building-detail.test.tsx:32-59`

**Interfaces:**
- Consumes: `BuildingDecisionSelection`, canonical building `base`, and market routes.
- Produces: `<BuildingDetailHeader />` and `<BuildingDecisionTabs base selection />`.
- Tabs use server-rendered `Link` elements and preserve the selected cohort.

- [ ] **Step 1: Add failing header and tab assertions to the building detail test**

```tsx
const html = renderToStaticMarkup(
  <BuildingDecisionTabs
    base="/kr/seoul/explore/gangnam-gu/gangnam-evidence-tower/"
    selection={{ mode: 'rent', contract: 'renewal' }}
  />,
);
expect(html).toContain('role="tablist"');
expect(html).toContain('aria-selected="true"');
expect(html).toContain('?mode=buy&amp;contract=renewal');
expect(html).toContain('?mode=rent&amp;contract=all');
expect(html).toContain('?mode=rent');
```

Also render `<BuildingDetailHeader />` and assert SignedPrice, Seoul, Singapore, Dubai, and Explore are present; assert Dubai is not an anchor.

- [ ] **Step 2: Run the targeted test and verify missing component failures**

```bash
pnpm exec vitest run apps/web/test/public-building-detail.test.tsx
```

Expected: FAIL because the header and tabs do not exist.

- [ ] **Step 3: Implement the compact building header**

```tsx
import Link from 'next/link';
import { BrandWordmark } from '../brand-mark';
import styles from './building-detail.module.css';

export function BuildingDetailHeader() {
  return (
    <header className={styles.compactHeader}>
      <Link href="/" aria-label="signedprice home"><BrandWordmark /></Link>
      <nav aria-label="Building detail market navigation">
        <Link href="/kr/seoul/" aria-current="location">Seoul</Link>
        <Link href="/sg/singapore/explore/">Singapore</Link>
        <span aria-disabled="true">Dubai</span>
      </nav>
      <span className={styles.currentProduct}>Explore</span>
    </header>
  );
}
```

- [ ] **Step 4: Implement mode and cohort links**

Use `BUILDING_DECISION_MODES`, `BUILDING_CONTRACT_COHORTS`, and `buildingDecisionHref` from Task 1. Map mode labels with the exact text `Overview`, `Rent`, `Buy`, `Invest`, and `Evidence`. Map cohort labels with `All`, `New`, and `Renewal`. Render both groups as labelled tab/button groups and set `aria-selected` or `aria-pressed` from `selection`.

```tsx
<nav className={styles.decisionTabs} aria-label="Building decision mode">
  <div role="tablist">
    {BUILDING_DECISION_MODES.map((mode) => (
      <Link
        key={mode}
        id={`building-mode-${mode}-tab`}
        href={buildingDecisionHref({ base, mode, contract: selection.contract })}
        role="tab"
        aria-selected={selection.mode === mode}
        aria-controls="building-mode-panel"
      >
        {MODE_LABELS[mode]}
      </Link>
    ))}
  </div>
  {selection.mode === 'rent' ? (
    <div role="group" aria-label="Rent contract cohort">
      {BUILDING_CONTRACT_COHORTS.map((contract) => (
        <Link
          key={contract}
          href={buildingDecisionHref({ base, mode: 'rent', contract })}
          role="button"
          aria-pressed={selection.contract === contract}
        >
          {COHORT_LABELS[contract]}
        </Link>
      ))}
    </div>
  ) : null}
</nav>
```

- [ ] **Step 5: Run the targeted test**

```bash
pnpm exec vitest run apps/web/test/public-building-detail.test.tsx
```

Expected: PASS for the new component-level assertions while the existing page assertions remain unchanged.

- [ ] **Step 6: Commit the navigation components**

```bash
git add v2/apps/web/components/public-market/building-detail-header.tsx \
  v2/apps/web/components/public-market/building-decision-tabs.tsx \
  v2/apps/web/test/public-building-detail.test.tsx
git commit -m "feat(building): add compact decision navigation"
```

---

### Task 5: Overview, Rent, Buy Gate, Invest Gate, and Evidence Views

**Files:**
- Create: `v2/apps/web/components/public-market/building-decision-views.tsx`
- Test: `v2/apps/web/test/public-building-decision-views.test.tsx`

**Interfaces:**
- Consumes: `PublicBuildingModel`, `BuildingDecisionModel`, and the canonical building base.
- Produces: `<BuildingDecisionView model decision base />`.
- Uses the existing `BoxPlot`, `EvidenceEmptyStatePanel`, and `EvidenceDisclosure` components.

- [ ] **Step 1: Write failing mode-rendering tests**

Create a verified building model with `createPublicBuildingFixture()` and derive decisions for each mode. Assert:

```tsx
const overview = render('overview', 'new');
expect(overview).toContain('Evidence is ready for a rent comparison');
expect(overview).toContain('Official sale evidence is not ready');
expect(overview).not.toContain('Privacy-safe reported contracts');

const rentAll = render('rent', 'all');
expect(rentAll).toContain('data-plot-variant="full"');
expect(rentAll).toContain('6 reported contracts');
expect(rentAll).toContain('Open full Rent Check');

const rentNew = render('rent', 'new');
expect(rentNew).toContain('New contract evidence is not published');
expect(rentNew).not.toContain('₩320,000,000');

const buy = render('buy', 'new');
expect(buy).toContain('Official sale evidence is not ready');
expect(buy).not.toMatch(/asking price.*official sale/i);

const invest = render('invest', 'new');
expect(invest).toContain('Investment evidence is incomplete');
expect(invest).not.toMatch(/expected return|forecast|appreciation rate/i);

const evidence = render('evidence', 'new');
expect(evidence).toContain('MOLIT');
expect(evidence).toContain('kr-molit-rent-v1');
expect(evidence).toContain('Official sale evidence');
```

- [ ] **Step 2: Run the test and verify the missing view failure**

```bash
pnpm exec vitest run apps/web/test/public-building-decision-views.test.tsx
```

Expected: FAIL because `building-decision-views.tsx` does not exist.

- [ ] **Step 3: Implement the selected-mode dispatcher**

```tsx
export function BuildingDecisionView({ model, decision, base }: Readonly<{
  model: PublicBuildingModel;
  decision: BuildingDecisionModel;
  base: string;
}>) {
  const mode = decision.selection.mode;
  const content = (() => {
    switch (mode) {
      case 'rent': return <RentDecisionView model={model} decision={decision} base={base} />;
      case 'buy': return <GatedDecisionView mode="Buy" readiness={decision.buy.readiness} base={base} />;
      case 'invest': return <GatedDecisionView mode="Invest" readiness={decision.invest.readiness} base={base} />;
      case 'evidence': return <EvidenceDecisionView model={model} />;
      default: return <OverviewDecisionView model={model} decision={decision} base={base} />;
    }
  })();
  return (
    <section
      id="building-mode-panel"
      role="tabpanel"
      aria-labelledby={`building-mode-${mode}-tab`}
    >
      {content}
    </section>
  );
}
```

- [ ] **Step 4: Implement Overview and the future-mode gates**

Overview renders one conclusion, three readiness rows, and one primary Rent action. Buy and Invest rows use their exact readiness titles and never render numbers. `GatedDecisionView` converts readiness into the existing `EvidenceEmptyStatePanel` contract:

```tsx
<EvidenceEmptyStatePanel
  state={{
    title: readiness.title,
    reason: readiness.reason,
    nextAction: readiness.nextAction,
    detail: {
      code: 'NOT_REPORTABLE',
      note: readiness.reason,
    },
  }}
  actionHref={buildingDecisionHref({
    base,
    mode: 'evidence',
    contract: 'new',
  })}
/>
```

Import `type EvidenceEmptyState` from `@signedprice/market-core` and assign the object above to a local `const emptyState: EvidenceEmptyState` before passing it to the panel. The required fields are exactly `title`, `reason`, `nextAction`, and `detail`; `detail` uses the installed `NOT_REPORTABLE` variant with a non-empty `note`.

- [ ] **Step 5: Implement the Rent view**

When `decision.rent.summary` is published, render:

```tsx
<BoxPlot
  summary={decision.rent.summary}
  axis={decision.rent.axis}
  formatValue={(value) => money.format(value)}
/>
<Link className={styles.primaryAction} href={decision.rentCheckHref}>
  Open full Rent Check
</Link>
```

When the selected cohort is insufficient, render its exact title, reason, and next action. For New or Renewal, the next action links to `mode=rent&contract=all`; for All, it links back to the district detail page. Do not fall back to the All median inside an unpublished selected cohort.

- [ ] **Step 6: Implement the Evidence view**

Render the existing `EvidenceDisclosure` and an explicit ledger with these rows:

- Building identity — Verified by the signed building artifact.
- Rent contracts — Published from `model.evidence.provider`, `dataset`, `period`, `generatedAt`, `publicationMinimum`, `descriptor.methodologyId`, and `rightsPolicyId`; render these through the existing `EvidenceDisclosure` labels rather than inventing a second source vocabulary.
- Official sale evidence — Not connected; not used by Phase 1.
- Building visual — No rights-cleared source connected unless `BuildingVisualModel.kind` is `licensed_photo`.
- Community — Preserve the existing independent threshold state; never merge it with official evidence.

- [ ] **Step 7: Run the view tests**

```bash
pnpm exec vitest run apps/web/test/public-building-decision-views.test.tsx
```

Expected: PASS for all five modes and both published/insufficient Rent cohorts.

- [ ] **Step 8: Commit the decision views**

```bash
git add v2/apps/web/components/public-market/building-decision-views.tsx \
  v2/apps/web/test/public-building-decision-views.test.tsx
git commit -m "feat(building): add unified decision views"
```

---

### Task 6: Preserve Secondary Evidence Below Disclosure

**Files:**
- Create: `v2/apps/web/components/public-market/building-evidence-details.tsx`
- Modify: `v2/apps/web/components/public-market/building-detail-page.tsx:54-205`
- Modify: `v2/apps/web/test/public-building-detail.test.tsx:32-95`

**Interfaces:**
- Consumes: `PublicBuildingModel` and the existing News, Community, floor, area-band, recent-contract, and source models.
- Produces: `<BuildingEvidenceDetails model />` inside native `details`/`summary` and a compact related-context section.

- [ ] **Step 1: Change the SSR test to require progressive disclosure without data loss**

Assert the final HTML contains:

```tsx
expect(html).toContain('<details');
expect(html).toContain('<summary>See records, adjustments, and methodology</summary>');
expect(html).toContain('Floor adjustment evidence');
expect(html).toContain('Evidence by filed area band');
expect(html).toContain('Privacy-safe reported contracts');
expect(html).toContain('Latest verified News');
expect(html).toContain('Community signal');
expect(html).toContain('Use this evidence within its boundary');
expect(html.indexOf('Open full Rent Check')).toBeLessThan(html.indexOf('<details'));
```

- [ ] **Step 2: Run the building-detail test and verify the disclosure failure**

```bash
pnpm exec vitest run apps/web/test/public-building-detail.test.tsx
```

Expected: FAIL because existing evidence is always expanded.

- [ ] **Step 3: Extract existing evidence sections without changing their claims**

Move the current floor, area-band, recent-contract, News, Community, building-navigation, and source JSX into `BuildingEvidenceDetails`. Keep these exact gates:

- six eligible pairs for floor coefficient publication;
- explicit fixed `45–55㎡` single-band reason and next action;
- privacy-safe month/area/floor/contract/deposit rows;
- MOLIT attribution and current exclusions;
- existing independent Community state.

Move `contractTypeLabel`, `floorLabel`, and `BuildingNavigation` from `building-detail-page.tsx` into the new file. Split the extracted sections into private `FloorEvidence`, `AreaBandEvidence`, `RecentContractEvidence`, and `BuildingSourceEvidence` functions, preserving their existing JSX and copy. Export this exact composition:

```tsx
export function BuildingEvidenceDetails({ model }: Readonly<{ model: PublicBuildingModel }>) {
  return (
    <details className={styles.evidenceDetails}>
      <summary>See records, adjustments, and methodology</summary>
      <div className={styles.evidenceDetailsBody}>
        <FloorEvidence model={model} />
        <AreaBandEvidence model={model} />
        <RecentContractEvidence model={model} />
        <BuildingSourceEvidence model={model} />
        <div className={styles.relatedContext}>
          <DetailNewsList news={model.news} />
          <CommunitySignal model={model.communitySignal} />
        </div>
        <BuildingNavigation model={model} />
      </div>
    </details>
  );
}
```

Do not duplicate, shorten, or paraphrase the extracted evidence. `BuildingSourceEvidence` retains `EvidenceDisclosure`, the four source rows, and the two Trust/corrections actions. `RecentContractEvidence` retains the current empty state and the full privacy-safe table.

- [ ] **Step 4: Render related News and Community after official evidence**

Use a two-column `relatedContext` section on desktop and one column below 960 pixels. The DOM order is official records and methodology, then News, then Community, then navigation.

- [ ] **Step 5: Run detail and Community regressions**

```bash
pnpm exec vitest run \
  apps/web/test/public-building-detail.test.tsx \
  apps/web/test/community-signal.test.tsx \
  apps/web/test/news-routes.test.tsx
```

Expected: PASS with all prior exact evidence and threshold strings retained.

- [ ] **Step 6: Commit the evidence disclosure extraction**

```bash
git add v2/apps/web/components/public-market/building-evidence-details.tsx \
  v2/apps/web/components/public-market/building-detail-page.tsx \
  v2/apps/web/test/public-building-detail.test.tsx
git commit -m "refactor(building): disclose secondary evidence"
```

---

### Task 7: Compose the Route and Refined Responsive Page

**Files:**
- Modify: `v2/apps/web/app/kr/seoul/explore/[district]/[buildingId]/page.tsx:1-72`
- Modify: `v2/apps/web/components/public-market/building-detail-page.tsx:1-205`
- Modify: `v2/apps/web/components/public-market/building-detail.module.css:1-106`
- Modify: `v2/apps/web/test/public-building-detail.test.tsx:1-126`

**Interfaces:**
- Consumes: Tasks 1-6.
- Produces: a complete SSR building page with the selected mode, decision model, no-image state, and compact hierarchy.

- [ ] **Step 1: Add failing route-state and composition tests**

Update every `BuildingPageProps` test call to include `searchParams: Promise.resolve({})`. Add:

```tsx
const params = Promise.resolve({
  district: 'gangnam-gu', buildingId: 'gangnam-evidence-tower',
});
const html = renderToStaticMarkup(await BuildingRoute({
  params,
  searchParams: Promise.resolve({ mode: 'rent', contract: 'all' }),
}));
expect(html).toContain('aria-selected="true"');
expect(html).toContain('6 reported contracts');
expect(html).toContain('Verified building image is not available');
expect(html).not.toContain('data-detail-rail="true"');
```

Add an invalid-query case and assert Overview/New defaults.

- [ ] **Step 2: Read the installed Next.js page API before editing the route**

Read:

```text
v2/apps/web/node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/page.md
```

Confirm that `params` and `searchParams` are promises in Next.js 16.3.3 and that using `searchParams` opts the page into request-time rendering.

- [ ] **Step 3: Extend the route props and build the selected models**

```tsx
type BuildingPageProps = Readonly<{
  params: Promise<Readonly<{ district: string; buildingId: string }>>;
  searchParams: Promise<Readonly<Record<string, string | string[] | undefined>>>;
}>;

export default async function BuildingRoute({ params, searchParams }: BuildingPageProps) {
  const { district, buildingId } = await params;
  const propertyTypeModel = buildPublicPropertyTypeModel(district, buildingId);
  if (propertyTypeModel !== null) {
    const siblings = listPublicPropertyTypeRouteParams()
      .filter((route) => (
        route.district === propertyTypeModel.district.slug
        && route.propertyType !== propertyTypeModel.propertyType.slug
      ))
      .flatMap((route) => {
        const sibling = buildPublicPropertyTypeModel(route.district, route.propertyType);
        return sibling === null ? [] : [sibling.propertyType];
      });
    return <PropertyTypeDetailPage model={propertyTypeModel} siblings={siblings} />;
  }
  const model = buildPublicBuildingModel(district, buildingId);
  if (model === null) notFound();
  const selection = parseBuildingDecisionSelection(await searchParams);
  const decision = buildBuildingDecisionModel(model, selection);
  const base = `/kr/seoul/explore/${model.district.slug}/${model.building.buildingId}/`;
  const visual = buildBuildingVisualModel({
    buildingName: model.building.name,
    mapHref: `/kr/seoul/explore/?district=${model.district.slug}`,
    photo: null,
  });
  return <BuildingDetailPage model={model} decision={decision} visual={visual} base={base} />;
}
```

Keep `generateStaticParams` and the property-type branch in `generateMetadata` unchanged; only the building-page branch consumes `searchParams`.

- [ ] **Step 4: Compose the refined page**

`BuildingDetailPage` receives:

```ts
Readonly<{
  model: PublicBuildingModel;
  decision: BuildingDecisionModel;
  visual: BuildingVisualModel;
  base: string;
}>
```

The identity summary uses only fields already verified in `PublicBuildingModel`: `building.name`, `district.nameEn`, `building.neighborhoodName`, `building.housingType`, `display.sampleLabel`, and `evidence.period`. Because the current artifact has no verified street address, do not render one. Its back action is `/kr/seoul/explore/?district=${model.district.slug}`; this preserves the server-addressable Explore district state without claiming to restore the current client-only rail selection.

Compose in this exact DOM order:

1. `BuildingDetailHeader`;
2. `main` with `data-building-detail="ready"`;
3. hero grid with `BuildingVisual` then identity summary;
4. `BuildingDecisionTabs`;
5. concise selected-mode status line;
6. `BuildingDecisionView`;
7. `BuildingEvidenceDetails`;
8. existing `SiteFooter`.

Do not render `SiteHeader`, `PublicSectionTabs`, the old breadcrumb row, or the old permanent 380-pixel detail rail on this route.

- [ ] **Step 5: Replace CSS with the approved hierarchy**

Required selectors and values:

```css
.main { width: min(100%, 1240px); max-width: 100%; margin-inline: auto; border-inline: 2px solid var(--ink); }
.compactHeader { min-height: 44px; display: grid; grid-template-columns: minmax(160px, 1.2fr) minmax(0, 2fr) minmax(88px, .6fr); border-bottom: 2px solid var(--ink); }
.identityHero { display: grid; grid-template-columns: minmax(0, 1.08fr) minmax(340px, .92fr); border-bottom: 2px solid var(--ink); }
.visualPhoto, .visualUnavailable { position: relative; min-height: 330px; border-right: 1px solid var(--divider); }
.visualPhoto img { object-fit: cover; }
.identitySummary { padding: clamp(1rem, 3vw, 2rem); display: flex; flex-direction: column; }
.decisionTabs > div:first-child { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); }
.decisionTabs a { min-height: 52px; display: grid; place-items: center; border-right: 1px solid var(--divider); }
.decisionTabs a[aria-selected="true"], .decisionTabs a[aria-pressed="true"] { color: var(--canvas); background: var(--petrol); }
.decisionLayout { display: grid; grid-template-columns: minmax(0, 1.35fr) minmax(250px, .65fr); }
.primaryAction { min-height: 44px; display: inline-grid; place-items: center; color: var(--canvas); background: var(--accent); }
.evidenceDetails > summary { min-height: 52px; display: flex; align-items: center; padding: 0.8rem 1rem; border-top: 2px solid var(--ink); }
```

Mobile requirements:

```css
@media (max-width: 720px) {
  .main { border-inline: 0; }
  .identityHero, .decisionLayout { grid-template-columns: minmax(0, 1fr); }
  .visualPhoto, .visualUnavailable { min-height: 230px; border-right: 0; border-bottom: 1px solid var(--divider); }
  .decisionTabs > div:first-child { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .decisionTabs > div:first-child > :last-child { grid-column: 1 / -1; }
  .factGrid, .decisionMetrics, .relatedContext { grid-template-columns: minmax(0, 1fr); }
}
```

Use existing tokens only. Do not copy the illustrative generated photo into the repository.

- [ ] **Step 6: Run SSR, CSS-token, type, and lint tests**

```bash
pnpm exec vitest run \
  apps/web/test/public-building-detail.test.tsx \
  apps/web/test/public-building-decision-state.test.ts \
  apps/web/test/public-building-decision-model.test.ts \
  apps/web/test/public-building-visual.test.tsx \
  apps/web/test/public-building-decision-views.test.tsx \
  apps/web/test/design-tokens.test.ts
pnpm --filter @signedprice/web typecheck
pnpm --filter @signedprice/web lint
```

Expected: all targeted tests PASS; typecheck and lint exit 0.

- [ ] **Step 7: Commit the complete page composition**

```bash
git add 'v2/apps/web/app/kr/seoul/explore/[district]/[buildingId]/page.tsx' \
  v2/apps/web/components/public-market/building-detail-page.tsx \
  v2/apps/web/components/public-market/building-detail.module.css \
  v2/apps/web/test/public-building-detail.test.tsx
git commit -m "feat(building): ship unified decision detail shell"
```

---

### Task 8: Browser, SEO, and Full Regression Gates

**Files:**
- Modify: `v2/tests/e2e/korea-detail.spec.ts:105-126`
- Modify: `v2/apps/web/test/public-building-detail.test.tsx:96-126`

**Interfaces:**
- Consumes: completed Phase 1 page.
- Produces: release evidence for navigation, responsive layout, accessibility, SEO, and fail-closed content.

- [ ] **Step 1: Extend the building E2E flow**

Within the local synthetic building test, add these exact actions and assertions:

```ts
await expect(page.getByRole('tab', { name: 'Overview' })).toHaveAttribute('aria-selected', 'true');
await expect(page.getByText('Verified building image is not available')).toBeVisible();

await page.getByRole('tab', { name: 'Rent' }).click();
await expect(page).toHaveURL(/\?mode=rent$/);
await page.getByRole('button', { name: 'All' }).click();
await expect(page).toHaveURL(/\?mode=rent&contract=all$/);
await expect(page.locator('[data-plot-variant="full"]')).toBeVisible();

await page.getByRole('tab', { name: 'Buy' }).click();
await expect(page.getByText('Official sale evidence is not ready')).toBeVisible();
await expect(page.getByText(/₩/)).toHaveCount(0);

await page.getByRole('tab', { name: 'Invest' }).click();
await expect(page.getByText('Investment evidence is incomplete')).toBeVisible();

await page.goBack();
await expect(page.getByRole('tab', { name: 'Buy' })).toHaveAttribute('aria-selected', 'true');
await page.reload();
await expect(page.getByRole('tab', { name: 'Buy' })).toHaveAttribute('aria-selected', 'true');

await page.getByRole('tab', { name: 'Evidence' }).click();
await expect(page.getByText('kr-molit-rent-v1')).toBeVisible();
await page.getByText('See records, adjustments, and methodology').click();
await expect(page.getByText('Privacy-safe reported contracts')).toBeVisible();
```

Keep the existing noindex/canonical/hreflang assertions.

- [ ] **Step 2: Add touch-size and overflow assertions**

Use the existing `expectTouchTarget` and `expectContained` helpers. Check the active market link, all five mode tabs, the primary action, and disclosure summary. At desktop and wide widths, assert the identity hero has two computed columns; at tablet and mobile widths, assert one column. In the mobile project, resize once to 320 pixels and repeat the containment assertion for the header, tablist, selected tabpanel, and disclosure summary. Focus the first mode tab with the keyboard, press `Enter`, and assert the selected tab and matching `aria-labelledby` panel update. Toggle the native disclosure with `Enter` and assert its `open` state changes.

- [ ] **Step 3: Run the building E2E test across all configured widths**

```bash
pnpm exec playwright test tests/e2e/korea-detail.spec.ts \
  --project=desktop-chromium \
  --project=mobile-chromium \
  --project=tablet-chromium \
  --project=wide-chromium
```

Expected: PASS at 390, 720, 1366, and 1440 pixels, plus the explicit 320-pixel containment check, with no console error, 5xx response, horizontal overflow, or sub-44-pixel target.

- [ ] **Step 4: Run the complete quality gates**

```bash
pnpm test
pnpm typecheck
pnpm lint
pnpm build
pnpm check:rent-client-boundary
pnpm check:singapore-client-boundary
```

Expected: every command exits 0. The production build retains the building route, property-type routes, and current `noindex, follow` metadata for building pages.

- [ ] **Step 5: Run prohibited-content scans**

```bash
rg -n "expected return|price forecast|guaranteed|appraisal|rights cleared" \
  v2/apps/web/components/public-market/building-* \
  v2/apps/web/lib/public-market/building-* || true
rg -n "#[0-9a-fA-F]{3,8}" \
  v2/apps/web/components/public-market/building-detail.module.css || true
```

Expected: no unsupported predictive or guarantee copy; no raw color literals in the building CSS.

- [ ] **Step 6: Commit browser and release gates**

```bash
git add v2/tests/e2e/korea-detail.spec.ts \
  v2/apps/web/test/public-building-detail.test.tsx
git commit -m "test(building): lock unified detail release gates"
```

- [ ] **Step 7: Record the reviewed implementation SHA without promoting Production**

```bash
git status --short
git log -1 --oneline
```

Expected: the worktree contains no Phase 1 changes outside committed files. Record the exact SHA for a subsequent Preview review; do not promote Production from an unreviewed or different SHA.

---

## Phase 1 Completion Criteria

- Direct building visits show Overview/New.
- Rent/All renders the existing published distribution and Rent Check action.
- Unpublished New or Renewal cohorts never fall back to All values.
- Buy and Invest remain visible, useful, and free of invented numbers.
- The visual region exists but renders no photograph until a licensed same-origin asset is provided.
- Existing floor, area-band, record, News, Community, and source evidence remains accessible below native disclosure.
- The first screen contains one conclusion, no more than three supporting measures, and one primary action.
- The route remains `noindex, follow` and keeps no canonical or hreflang alternates.
- All targeted, full, build, client-boundary, and four-width browser gates pass.
