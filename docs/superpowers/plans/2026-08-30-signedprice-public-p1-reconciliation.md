# signedprice Public P1 Reconciliation Implementation Plan

> **Execution rule:** Implement one task at a time with strict RED → GREEN →
> review commits. Keep the existing Seoul Rent Check route as a protected
> noindex proof until the public P1 has passed every gate in this plan.

**Goal:** Build the Korea-first public signedprice P1 defined by
`signedprice-build-spec.xlsx`: SSR market evidence, two-input client-only quote
positioning, total suppression below five contracts, and no public future-market
routes.

**Architecture:** Add a market-neutral published-summary boundary to
`market-core`. Generate or load a verified Korea summary on the server, serialize
only the discriminated public shape, and render it through static Korea route
composition. A small client component receives the published five-number summary
and changes only the user's marker and verdict; it never requests market data.
The completed Rent Check provider/cache/API remains isolated behind its current
noindex route and is not the public P1 contract.

**Tech stack:** TypeScript 5.9, Next.js 16.3 App Router, React 19.2, Vitest 4,
Playwright 1.62, pnpm workspaces.

**Product spec:**
`docs/superpowers/specs/2026-08-30-signedprice-public-p1-reconciliation-design.md`

## Global constraints

- Never edit, stage, or publish `upload/` or the attached workbook.
- Read `v2/apps/web/AGENTS.md` and the relevant bundled Next.js 16 docs before
  editing routes, metadata, server/client boundaries, or caching.
- Public data with `n < 5` contains identity, `n`, and `published:false` only.
  Do not serialize monetary fields as zero or `null`.
- Public quote changes perform zero network requests and never construct a
  marker or percentile from a withheld summary.
- Initial server HTML contains every published number and sample count.
- Korea is the only ready market. Public Singapore and Dubai paths return the
  custom 404 and are absent from public navigation.
- Keep the internal Rent Check proof `noindex, follow` with no canonical,
  hreflang, sitemap entry, or public navigation link.
- Keep the 5.0% methodology wording exactly as a signedprice comparison
  assumption; do not call it statutory or legal.
- Preserve Archivo, `#f3f2f2`, `#201e1d`, `#1d4ed8`, radius `0`, no shadows,
  two-pixel structure, 44px mobile targets, and visible two-pixel focus.
- No Production, DNS, redirect, indexing, or Firewall mutation is authorized by
  this plan.

---

### Task 1: Freeze the public summary and market-config contracts

**Files:**

- Create: `v2/packages/market-core/src/public-summary.ts`
- Create: `v2/packages/market-core/src/public-market-config.ts`
- Create: `v2/packages/market-core/test/public-summary.test.ts`
- Create: `v2/packages/market-core/test/public-market-config.test.ts`
- Modify: `v2/packages/market-core/src/index.ts`

- [ ] Write failing tests for `WithheldMarketSummary` and
  `PublishedMarketSummary`, including a compile-time proof that withheld values
  cannot contain `min`, `p25`, `med`, `p75`, `max`, or `chg3m`.
- [ ] Test `createPublicMarketSummary()` with `n=0`, `n=4`, `n=5`, malformed
  five-number order, non-finite values, and an invalid period.
- [ ] Test the Korea config and unavailable Singapore/Dubai configs without UI
  conditionals. Include currency, quote unit, geography noun, source label,
  axis, and guide family.
- [ ] Run the focused tests and confirm RED because the modules do not exist.
- [ ] Implement the minimum discriminated union, deny-safe constructor, and
  market config types. Freeze returned values.
- [ ] Run focused tests and `pnpm --filter @signedprice/market-core typecheck`.
- [ ] Commit as `feat(v2): add public market summary contracts`.

### Task 2: Add five-point quote positioning as a pure browser-safe policy

**Files:**

- Create: `v2/packages/market-core/src/quote-position.ts`
- Create: `v2/packages/market-core/test/quote-position.test.ts`
- Modify: `v2/packages/market-core/src/index.ts`

- [ ] Write failing literal tests below minimum, at each of
  `min/p25/med/p75/max`, between each segment, and above maximum.
- [ ] Test stable interpolation, axis clamping, signed difference, verdict copy,
  non-finite quote rejection, and duplicate adjacent percentile points.
- [ ] Prove the function accepts `PublishedMarketSummary` and cannot accept a
  withheld summary.
- [ ] Implement a pure `positionQuote(summary, quote, axis)` with no locale,
  DOM, fetch, or Korea dependency.
- [ ] Run focused tests and package typecheck.
- [ ] Commit as `feat(v2): add public quote positioning policy`.

### Task 3: Create the verified Korea public-summary server adapter

**Files:**

- Create: `v2/packages/korea-rent/src/public-summary.ts`
- Create: `v2/packages/korea-rent/test/public-summary.test.ts`
- Modify: `v2/packages/korea-rent/src/index.ts`
- Modify: `v2/packages/korea-rent/src/browser.ts`

- [ ] Write failing tests using complete normalized contract fixtures for
  `n=4`, `n=5`, odd/even samples, cancelled records, unknown status, and
  provenance mismatch.
- [ ] Require the server adapter to validate source period, market identity,
  source completeness, rights, parser version, and ordered five-number output
  before constructing a public summary.
- [ ] Prove `n < 5` returns no monetary keys recursively and that the browser
  export exposes only public types/constants, never provider URLs or loaders.
- [ ] Implement the adapter over existing normalized Korea records and shared
  percentile helpers. Do not reuse the internal 3–4 median fallback.
- [ ] Run Korea package tests, browser-boundary tests, and package typecheck.
- [ ] Commit as `feat(v2): derive deny-safe Korea public summaries`.

### Task 4: Add a versioned server summary repository

**Files:**

- Create: `v2/apps/web/lib/public-market/summary-repository.server.ts`
- Create: `v2/apps/web/lib/public-market/summary-schema.ts`
- Create: `v2/apps/web/test/public-summary-repository.test.ts`
- Modify: `v2/apps/web/package.json` only if a server-only dependency is needed

- [ ] Write failing tests for a published Seoul artifact, a withheld artifact,
  wrong market/period/version, missing provenance, and forbidden monetary keys
  on withheld data.
- [ ] Make the repository server-only and require an explicit versioned summary
  source. It must fail closed when the verified artifact/feed is missing.
- [ ] Keep provider credentials and source endpoints out of serialized props,
  client manifests, and errors.
- [ ] Run focused tests, web typecheck, and the client-boundary scanner.
- [ ] Commit as `feat(v2): add verified public summary repository`.

### Task 5: Build reusable stroke-state, box-plot, and verdict components

**Files:**

- Create: `v2/apps/web/components/public-market/stroke-state.tsx`
- Create: `v2/apps/web/components/public-market/box-plot.tsx`
- Create: `v2/apps/web/components/public-market/verdict-line.tsx`
- Create: `v2/apps/web/components/public-market/public-market.module.css`
- Create: `v2/apps/web/test/public-market-components.test.tsx`

- [ ] Write failing SSR markup tests for filled, outlined, hatched, and hairline
  states; five-number labels; withheld hatching; and non-colour text labels.
- [ ] Test zero-width ranges, clamped marker geometry, tabular numerals, and
  accessible figure descriptions.
- [ ] Implement square, shadowless components using workbook tokens only.
- [ ] Run focused tests, lint, and web typecheck.
- [ ] Commit as `feat(v2): add public market evidence components`.

### Task 6: Build the two-input no-network quote client

**Files:**

- Create: `v2/apps/web/components/public-market/quote-input.tsx`
- Create: `v2/apps/web/test/public-quote-input.test.tsx`
- Create: `v2/tests/e2e/public-quote.spec.ts`

- [ ] Write failing component tests for area selection, quote typing, empty and
  invalid edits, marker/verdict updates, withheld state, and preserved input.
- [ ] Instrument `fetch`, XHR, and navigation in tests and assert zero requests
  for every quote keystroke.
- [ ] Test keyboard operation, visible focus, 44px targets, and 390px natural
  scrolling.
- [ ] Implement the minimum client island receiving only market config and a
  `PublishedMarketSummary | WithheldMarketSummary` prop.
- [ ] Run focused Vitest tests and Playwright list/static checks.
- [ ] Commit as `feat(v2): add no-network public quote interaction`.

### Task 7: Compose the Korea SSR routes and public navigation

**Files:**

- Create: `v2/apps/web/app/kr/page.tsx`
- Create: `v2/apps/web/app/kr/check/[area]/page.tsx`
- Create or replace at cutover: `v2/apps/web/app/kr/[area]/page.tsx`
- Create: `v2/apps/web/lib/public-market/route-model.server.ts`
- Create: `v2/apps/web/test/public-korea-routes.test.tsx`
- Modify: `v2/apps/web/components/site-header.tsx`
- Modify: `v2/apps/web/components/site-footer.tsx`

- [ ] Write failing route tests for `/kr/`, `/kr/check/seoul`, `/kr/seoul`, an
  unknown area, withheld evidence, and missing feed.
- [ ] Assert the initial server HTML contains sample count and every published
  five-number value before hydration.
- [ ] Assert withheld HTML contains the real count and refusal but no monetary
  value, percentile, range, marker, or JSON leakage.
- [ ] Implement server route composition and Korea-only navigation. Preserve the
  deeper protected `/kr/seoul/tools/rent-check/` route as noindex.
- [ ] Run route tests, build, and inspect built HTML/metadata.
- [ ] Commit as `feat(v2): add Korea public P1 routes`.

### Task 8: Enforce future-market 404 and indexing cohorts

**Files:**

- Modify: `v2/apps/web/app/[country]/[city]/page.tsx`
- Modify: `v2/apps/web/app/[country]/[city]/[intent]/page.tsx`
- Modify: `v2/apps/web/lib/route-model.ts`
- Modify: `v2/apps/web/test/public-route-contract.test.ts`
- Modify: `v2/tests/e2e/public-route-contract.ts`
- Modify: `v2/tests/e2e/visible-foundation.spec.ts`

- [ ] Write failing tests that public Singapore/Dubai overview and intent URLs
  return the custom 404 and that no market switcher exposes them.
- [ ] Define the exact Korea indexing cohort. Published Korea pages may receive
  canonical metadata only in this task; withheld/thin pages and the protected
  proof remain noindex.
- [ ] Prove sitemap, canonical, and navigation contain no unavailable market or
  protected proof URL.
- [ ] Implement the smallest route/readiness changes and run the route matrix.
- [ ] Commit as `fix(v2): enforce Korea-only public availability`.

### Task 9: Run workbook QA and prepare a protected public-P1 Preview

**Files:**

- Create: `docs/operations/signedprice-public-p1-release-gate.md`
- Create: `artifacts/public-p1/workbook-qa.json`
- Modify: `.github/workflows/signedprice-v2-ci.yml`
- Modify: `v2/tests/e2e/public-route-contract.ts`

- [ ] Convert every applicable workbook QA row into an automated check or a
  named manual evidence item with owner and reason.
- [ ] Run unit, lint, typecheck, build, client-boundary, legacy identity, and
  locked desktop/mobile Chromium gates.
- [ ] Verify server HTML, zero-network quote behavior, greyscale states, 390px
  touch/focus, withheld response shape, and future-market 404s.
- [ ] Push only the reviewed branch and create an exact-SHA noindex Preview.
- [ ] Stop before Production. Present the exact indexing/canonical/sitemap,
  redirect, DNS, and Firewall diffs for separate approval.
- [ ] Commit as `test(v2): gate signedprice public P1 release`.

## Completion boundary

This plan is complete when Tasks 1–9 pass on one exact Preview SHA. It does not
authorize Production or mean the protected Rent Check proof can be merged as the
public product. Live source/cache purge evidence and Production migration remain
separate, explicitly approved operational gates.
