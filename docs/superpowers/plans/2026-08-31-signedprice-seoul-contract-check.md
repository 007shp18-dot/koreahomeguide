# SignedPrice Seoul Contract Check Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make `/kr/` a two-offer Seoul rent-contract comparison that consumes only a verified conversion-curve artifact and preserves the existing one-offer Rent Check and Seoul evidence routes.

**Architecture:** Put market-neutral offer normalization in `@signedprice/market-core`, Korea curve artifact validation in `@signedprice/korea-rent`, and server-only environment/repository composition in the Next.js web app. The page renders a client comparison workspace from a strictly validated, browser-safe curve projection; malformed, missing, stale, or rights-blocked evidence fails closed without exposing provider metadata or credentials.

**Tech Stack:** TypeScript 5.9, React 19.2, Next.js 16.3 App Router, Zod-free strict parsers, Vitest 4.1, Playwright 1.62, pnpm 11.

**Spec:** `docs/superpowers/specs/2026-08-31-signedprice-contract-decision-platform-design.md`

## Global Constraints

- The first screen compares two Seoul contracts; the existing one-offer Rent Check remains secondary.
- Safe-integer KRW is calculation state; 억/만원 strings exist only at the rendering boundary.
- Both offers must use the same supported housing type.
- Each offer uses the verified empirical rate at its own deposit.
- The comparison reference is `min(offerA.depositWon, offerB.depositWon)`.
- Missing, malformed, stale, rights-blocked, or mathematically contradictory curve evidence fails closed.
- `72,291`, `29.4%`, historical hard-coded anchors, and other empirical claims remain absent until reproduced by the verified artifact.
- Seoul is the only visible market; no Singapore or Dubai switcher is rendered.
- KoreaHomeGuide routes, metadata, sitemap entries, and production behavior remain unchanged.
- SignedPrice Korea routes remain `noindex, follow` with no canonical, hreflang, or sitemap entry.
- No provider URL, raw record ID, credential, artifact source JSON, or environment variable is serialized to the client.
- Use the existing Modernist canvas/ink/cobalt system and square geometry.

---

### Task 1: Portable two-offer normalization engine

**Files:**
- Create: `v2/packages/market-core/src/contract-check.ts`
- Create: `v2/packages/market-core/test/contract-check.test.ts`
- Modify: `v2/packages/market-core/src/index.ts`

**Interfaces:**
- Consumes: finite, non-negative native-money numbers from a market adapter.
- Produces: `conversionRateAt(curve, deposit)`, `compareRentOffers(input)`, `ConversionCurve`, `RentContractOffer`, `AppliedConversionRate`, and `RentContractComparison`.

- [ ] **Step 1: Write failing engine tests.**

```ts
const curve = {
  housingType: 'apartment',
  period: '2026-03/2026-08',
  anchors: [
    { deposit: 30_000_000, annualRate: 0.05, pairCount: 140 },
    { deposit: 100_000_000, annualRate: 0.04, pairCount: 160 },
  ],
} as const;

expect(conversionRateAt(curve, 65_000_000)).toMatchObject({
  annualRate: 0.045,
  rangeState: 'observed',
});
expect(conversionRateAt(curve, 10_000_000).rangeState).toBe('held-below');
expect(conversionRateAt(curve, 200_000_000).rangeState).toBe('held-above');

expect(compareRentOffers({
  curve,
  offers: [
    { id: 'a', housingType: 'apartment', deposit: 30_000_000, monthlyRent: 1_000_000 },
    { id: 'b', housingType: 'apartment', deposit: 100_000_000, monthlyRent: 800_000 },
  ],
})).toMatchObject({
  referenceDeposit: 30_000_000,
  winner: 'a',
  roundedMonthlyDifference: 33_333,
  rankingFlipped: true,
});
```

Cover exact anchors, interpolation, held boundaries, input immutability, mismatched housing types, unordered/duplicate anchors, unsafe values, ties, rounded equality, and raw-versus-normalized ranking flips.

- [ ] **Step 2: Run `pnpm vitest run packages/market-core/test/contract-check.test.ts` and require failure because the module/export does not exist.**
- [ ] **Step 3: Implement the immutable engine.**

```ts
export type ConversionCurveAnchor = Readonly<{
  deposit: number;
  annualRate: number;
  pairCount: number;
}>;

export type ConversionCurve<THousingType extends string = string> = Readonly<{
  housingType: THousingType;
  period: string;
  anchors: readonly ConversionCurveAnchor[];
}>;

export type RentContractOffer<THousingType extends string = string> = Readonly<{
  id: 'a' | 'b';
  label?: string;
  housingType: THousingType;
  deposit: number;
  monthlyRent: number;
}>;

export type AppliedConversionRate = Readonly<{
  annualRate: number;
  rangeState: 'observed' | 'held-below' | 'held-above';
  evidencePairCount: number;
}>;

export type RentContractComparison<THousingType extends string = string> = Readonly<{
  housingType: THousingType;
  referenceDeposit: number;
  offers: readonly [Readonly<{
    offer: RentContractOffer<THousingType>;
    normalizedMonthlyCost: number;
    roundedNormalizedMonthlyCost: number;
    appliedRate: AppliedConversionRate;
  }>, Readonly<{
    offer: RentContractOffer<THousingType>;
    normalizedMonthlyCost: number;
    roundedNormalizedMonthlyCost: number;
    appliedRate: AppliedConversionRate;
  }>];
  winner: 'a' | 'b' | 'equal';
  monthlyDifference: number;
  roundedMonthlyDifference: number;
  effectivelyEqual: boolean;
  rankingFlipped: boolean;
}>;

export function compareRentOffers<THousingType extends string>(input: Readonly<{
  curve: ConversionCurve<THousingType>;
  offers: readonly [RentContractOffer<THousingType>, RentContractOffer<THousingType>];
}>): RentContractComparison<THousingType>;
```

Validate every public input before arithmetic, freeze returned arrays/objects, calculate with unrounded values, and decide `effectivelyEqual` only from the public whole-unit difference.

- [ ] **Step 4: Run the focused test and `pnpm --filter @signedprice/market-core typecheck`; require zero failures.**
- [ ] **Step 5: Commit `feat(v2): add portable contract comparison engine`.**

### Task 2: Strict Korea conversion-curve artifact contract

**Files:**
- Create: `v2/packages/korea-rent/src/conversion-artifact.ts`
- Create: `v2/packages/korea-rent/test/conversion-artifact.test.ts`
- Modify: `v2/packages/korea-rent/src/index.ts`
- Modify: `v2/packages/korea-rent/src/browser.ts`
- Modify: `v2/packages/korea-rent/package.json`

**Interfaces:**
- Consumes: unknown decoded JSON plus `{ marketId, period, sha256 }` expectations.
- Produces: `parseKoreaConversionArtifact`, `toBrowserConversionCurves`, `KOREA_CONVERSION_ARTIFACT_VERSION`, `VerifiedKoreaConversionArtifact`, and browser-safe `KoreaConversionCurveProjection`.

- [ ] **Step 1: Write failing exact-schema and fail-closed tests.**

```ts
const artifact = {
  artifactVersion: 1,
  generatedAt: '2026-08-31T00:00:00.000Z',
  provenance: {
    marketId: 'kr-seoul',
    period: '2026-03/2026-08',
    provider: 'MOLIT',
    endpointVersion: 'rtms-rent-v1',
    parserVersion: 1,
    rightsPolicyId: 'molit-rent-v1',
    sourceComplete: true,
    sha256: 'a'.repeat(64),
  },
  readiness: { state: 'ready', maximumAgeDays: 45 },
  totals: {
    eligiblePairCount: 620,
    excluded: { cancelled: 4, invalidMoney: 2, differentBuildingOrArea: 10 },
  },
  curves: [
    {
      housingType: 'apartment',
      observedMinDepositWon: 30_000_000,
      observedMaxDepositWon: 100_000_000,
      anchors: [
        { depositWon: 30_000_000, annualRate: 0.05, pairCount: 140 },
        { depositWon: 100_000_000, annualRate: 0.04, pairCount: 160 },
      ],
    },
  ],
};
expect(parseKoreaConversionArtifact(artifact, {
  marketId: 'kr-seoul',
  period: '2026-03/2026-08',
  sha256: 'a'.repeat(64),
}, '2026-09-01T00:00:00.000Z').curves).toHaveLength(1);
```

Mutate every root/provenance/readiness/total/curve/anchor key and assert rejection. Also reject wrong digest, non-canonical instants, future generation, stale evidence, missing rights, unsupported housing types, fewer than two anchors, non-increasing deposits, rates outside `(0, 1)`, pair counts below the artifact's declared curve minimum, ranges that disagree with anchors, and total counts that disagree with curve/exclusion totals.

- [ ] **Step 2: Run `pnpm vitest run packages/korea-rent/test/conversion-artifact.test.ts` and require the missing-module failure.**
- [ ] **Step 3: Implement the parser with exact key lists and deny-by-default rights checks.**

The browser projection contains only:

```ts
type KoreaConversionCurveProjection = Readonly<{
  housingType: 'apartment' | 'officetel';
  period: string;
  generatedAt: string;
  anchors: readonly Readonly<{
    deposit: number;
    annualRate: number;
    pairCount: number;
  }>[];
}>;
```

It excludes provider endpoint, parser version, rights ID, SHA, exclusion details, and raw identifiers.

- [ ] **Step 4: Run focused tests and all Korea package typechecks.**
- [ ] **Step 5: Commit `feat(v2): validate Korea conversion evidence`.**

### Task 3: Server-only curve repository and route model

**Files:**
- Create: `v2/apps/web/lib/contract-check/conversion-repository.server.ts`
- Create: `v2/apps/web/lib/contract-check/route-model.server.ts`
- Create: `v2/apps/web/test/contract-check-repository.test.ts`
- Create: `v2/apps/web/test/contract-check-route-model.test.ts`

**Interfaces:**
- Consumes environment variables `SIGNEDPRICE_CONVERSION_CURVE_ARTIFACT`, `SIGNEDPRICE_CONVERSION_CURVE_PERIOD`, and `SIGNEDPRICE_CONVERSION_CURVE_SHA256` only on the server.
- Produces `createConversionRepository`, `diagnoseConversionEnvironment`, `buildContractCheckRouteModel`, `ConversionEvidenceUnavailableError`, and a browser-safe route model.

- [ ] **Step 1: Write failing repository and route-model tests.**

Require ready projections for valid evidence and deterministic diagnostics for `artifact_missing`, `period_missing`, `sha_missing`, `artifact_json_invalid`, `artifact_contract_invalid`, `curve_missing`, and `ready`. Require the route model to expose only apartment/officetel curves, disclosure copy derived from artifact fields, secondary check links, and the four-tab IA without dead News/Guide destinations.

- [ ] **Step 2: Run the two focused files and require missing-module failures.**
- [ ] **Step 3: Implement server-only composition.**

```ts
export type ContractCheckRouteModel = Readonly<{
  status: 'ready' | 'unavailable';
  curves: readonly KoreaConversionCurveProjection[];
  disclosure: Readonly<{
    source: 'MOLIT reported rental contracts';
    basis: 'Matched contracts in the same building and filed area';
    period: string;
    boundary: string;
  }>;
  navigation: readonly Readonly<{ label: string; href: string; available: boolean }>[];
}>;
```

The unavailable model contains no curve, fabricated result, or empirical claim.

- [ ] **Step 4: Run focused tests, web typecheck, and the client-boundary scan after a fixture-backed build.**
- [ ] **Step 5: Commit `feat(v2): load contract comparison evidence server side`.**

### Task 4: Two-offer Contract Check workspace

**Files:**
- Create: `v2/apps/web/components/contract-check/contract-check-workspace.tsx`
- Create: `v2/apps/web/components/contract-check/contract-check.module.css`
- Create: `v2/apps/web/lib/contract-check/client-state.ts`
- Create: `v2/apps/web/test/contract-check-state.test.ts`
- Create: `v2/apps/web/test/contract-check-workspace.test.tsx`
- Modify: `v2/apps/web/app/kr/page.tsx`

**Interfaces:**
- Consumes: `ContractCheckRouteModel` and `compareRentOffers`.
- Produces: controlled Offer A/B fields, a result region, field errors, evidence disclosure, and links to the secondary area check.

- [ ] **Step 1: Write failing reducer tests for canonical KRW parsing, field edits, calculation snapshots, validation errors, type switching, reset, and stale-result clearing.**
- [ ] **Step 2: Write failing server-render tests for Offer A → Offer B → Result order, 44px controls, unavailable state, disclosure rows, result focus target, no market switcher, and absence of unverified claims.**
- [ ] **Step 3: Run the two focused files and require failure.**
- [ ] **Step 4: Implement a pure state reducer and client workspace.**

The form uses `inputMode="numeric"`, stores digit-only KRW strings, converts to safe integers only during validation, and never sends money to analytics or a server. The result uses the route's validated curve projection, formats values with `ko-KR`, and renders applied annual rate to two decimal percentage points.

- [ ] **Step 5: Replace `/kr/`'s current single-distribution page with the Contract Check shell while preserving `generateMetadata()` containment.**
- [ ] **Step 6: Run focused tests, web typecheck, lint, and `git diff --check`.**
- [ ] **Step 7: Commit `feat(v2): build Seoul two-offer contract check`.**

### Task 5: Evidence navigation and Rankings integration boundary

**Files:**
- Modify: `v2/apps/web/components/public-market/public-section-tabs.tsx`
- Modify: `v2/apps/web/components/public-market/public-market-page.tsx`
- Modify: `v2/apps/web/components/public-market/area-explorer.tsx`
- Modify: `v2/apps/web/components/public-market/district-detail-page.tsx`
- Modify: `v2/apps/web/test/public-section-tabs.test.tsx`
- Modify: `v2/apps/web/test/public-area-explorer.test.tsx`
- Modify: `v2/apps/web/test/public-district-detail.test.tsx`
- Modify: `v2/apps/web/test/public-route-contract.test.tsx`

**Interfaces:**
- Consumes: existing public evidence route models.
- Produces: primary Check/Explore navigation, secondary Rankings link target, and links back to `/kr/` without merging PR #25 yet.

- [ ] **Step 1: Write failing navigation tests requiring `/kr/` as Check, `/kr/seoul/explore` as Explore, unavailable News/Guide labels without clickable fake routes, and `/kr/seoul/rankings` only as a secondary link.**
- [ ] **Step 2: Run the four focused test files and confirm the old navigation fails the new contract.**
- [ ] **Step 3: Implement the smallest compatible navigation update and crosslinks.**
- [ ] **Step 4: Run focused tests, all 708+ regressions, lint, typecheck, and production build.**
- [ ] **Step 5: Commit `feat(v2): connect Contract Check to Seoul evidence`.**

### Task 6: Release evidence and exact-SHA Preview

**Files:**
- Create: `v2/tests/e2e/contract-check.spec.ts`
- Modify: `v2/tests/e2e/public-route-contract.ts`
- Modify: `v2/tests/public-route-contract.test.ts`
- Create: `v2/docs/releases/2026-08-31-signedprice-contract-check.md`

**Interfaces:**
- Produces: executable browser and release evidence; no Production promotion without a ready verified artifact and user-visible Preview acceptance.

- [ ] **Step 1: Add Playwright coverage at 390px, 720px, and 1440px for field order, keyboard traversal, 44px targets, no horizontal overflow, interpolation, held-range disclosure, tie, ranking flip, unavailable artifact, secondary links, and console/5xx cleanliness.**
- [ ] **Step 2: Add static route containment tests requiring one `noindex, follow`, zero canonical/hreflang, and zero sitemap URLs for SignedPrice Korea.**
- [ ] **Step 3: Run `pnpm test`, `pnpm lint`, `pnpm typecheck`, `pnpm build`, `pnpm check:rent-client-boundary`, Playwright collection/execution where Chromium exists, and `git diff --check`.**
- [ ] **Step 4: Scan built client assets for provider credentials, raw artifact JSON, SHA values, environment variable names, and provider URLs.**
- [ ] **Step 5: Push the exact tested branch, create a PR, and verify GitHub checks and the exact-SHA Vercel Preview.**
- [ ] **Step 6: Verify a live-data Preview cannot pass with a fixture-only or missing curve artifact; install the verified curve artifact only through server-side Vercel environment scope.**
- [ ] **Step 7: Record Preview deployment ID, candidate SHA, test counts, artifact period/digest identity, runtime errors, and remaining asset dependency in the release note.**
- [ ] **Step 8: Stop before merge/Production if the official logo archive is still unavailable or if the user has not accepted the visible Preview.**
