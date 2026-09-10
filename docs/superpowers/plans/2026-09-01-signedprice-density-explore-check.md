# SignedPrice Density, Explore, Rankings, and Check Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver one compact SignedPrice visual system, a unified Explore and Rankings experience, and a mathematically correct live contract comparison through Production.

**Architecture:** Shared CSS tokens own width, typography, spacing, and rule hierarchy. Existing page models and Naver map state are recomposed rather than duplicated. Check calculation is corrected in `market-core`, then consumed by the existing client reducer and workspace with explicit unresolved states.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript 5.9, CSS Modules, Vitest, pnpm, Vercel.

**Spec:** `docs/superpowers/specs/2026-09-01-signedprice-density-explore-check-design.md`

## Global Constraints

- No new dependencies.
- No invented buildings, counts, coordinates, transaction data, money, rights, or evidence periods.
- Money remains integer KRW internally; `annualRate` remains a decimal fraction.
- Internal links end in `/`.
- Missing or gated evidence is explicit and never substituted.
- Structural, default, and subtle rules use the three shared border tokens.
- Every behavior change must have a failing test before production code.

---

### Task 1: Shared frame, typography, rule hierarchy, and header

**Files:**
- Modify: `v2/apps/web/app/globals.css`
- Modify: `v2/apps/web/components/site-header.tsx`
- Test: `v2/apps/web/test/design-tokens.test.ts`
- Test: `v2/apps/web/test/brand-mark.test.tsx`

**Interfaces:**
- Produces CSS tokens `--content-frame`, `--workspace-frame`, `--rule-strong`, `--rule-default`, and `--rule-subtle`.
- Produces a two-tier `SiteHeader` whose two rows share the centered content frame.

- [ ] Add failing assertions for the frame, font stack, tracking cap, three rule tokens, tier order, and product active state.
- [ ] Run `pnpm vitest run apps/web/test/design-tokens.test.ts apps/web/test/brand-mark.test.tsx` and confirm the new assertions fail.
- [ ] Add the shared tokens, load local Inter, use Pretendard-first Korean fallback, and replace header-local arbitrary rule widths with semantic tokens.
- [ ] Keep five 44px product targets and horizontal scrolling below 760px.
- [ ] Run the two focused test files and confirm they pass.

### Task 2: Explore unified transaction toolbar and contained workspace

**Files:**
- Modify: `v2/apps/web/components/public-market/area-explorer.tsx`
- Modify: `v2/apps/web/components/public-market/area-explorer.module.css`
- Modify: `v2/apps/web/lib/locale/product-copy.ts`
- Test: `v2/apps/web/test/public-area-explorer.test.tsx`
- Test: `v2/apps/web/test/public-area-explorer-state.test.ts`

**Interfaces:**
- Consumes existing district/building selection reducer and search corpus.
- Produces one `data-transaction-filter` control with `all`, `sale`, `jeonse`, and `monthly-rent` entries whose availability is explicit.

- [ ] Add failing tests proving the Jeonse-only strip is absent, one transaction filter exists, unsupported modes never have links or selected state, search still matches district/building/housing type, and the workspace is capped at 1,440px.
- [ ] Run the two Explore test files and confirm failures are caused by the old strip and edge-to-edge layout.
- [ ] Replace the transaction strip with a toolbar control backed by an availability model; keep Jeonse selected until other datasets are genuinely installed.
- [ ] Recompose desktop into district rail, flexible map, and evidence rail without changing selection/geocode semantics; keep mobile map-first.
- [ ] Apply shared rule tokens and compact vertical rhythm throughout the toolbar and workspace.
- [ ] Run the two Explore test files and confirm they pass.

### Task 3: Rankings density and rule consistency

**Files:**
- Modify: `v2/apps/web/components/public-market/district-rankings.tsx`
- Modify: `v2/apps/web/components/public-market/district-rankings.module.css`
- Test: `v2/apps/web/test/public-area-rankings.test.tsx`
- Test: `v2/apps/web/test/public-area-rankings-model.test.ts`

**Interfaces:**
- Consumes the existing published ranking model without changing ordering or evidence gates.
- Produces a contained ranking frame, compact method header, metric tabs, and consistent row rules.

- [ ] Add failing assertions for the 1,240px maximum frame, compact hero, shared rule tokens, visible period/method context, and complete eligible district list.
- [ ] Run the ranking test files and confirm the new layout contract fails against the current full-width hero.
- [ ] Wrap the workspace in the content frame, reduce hero scale/height, move view tabs adjacent to the header, and use strong rules only at outer section boundaries.
- [ ] Preserve fail-closed change behavior, ranking order, and every published district row.
- [ ] Run the ranking test files and confirm they pass.

### Task 4: Correct full-deposit Check arithmetic

**Files:**
- Modify: `v2/packages/market-core/src/contract-check.ts`
- Modify: `v2/packages/market-core/test/contract-check.test.ts`
- Modify: `v2/apps/web/lib/contract-check/client-state.ts`
- Modify: `v2/apps/web/test/contract-check-state.test.ts`

**Interfaces:**
- Changes `compareRentOffers()` so each `normalizedMonthlyCost` equals `monthlyRent + deposit * appliedRate.annualRate / 12`.
- Produces unresolved/held offer states at the UI boundary; zero monthly rent is valid.

- [ ] Replace old test expectations with a failing regression that proves both full deposits contribute, including equal monthly rents with different deposits.
- [ ] Add failing tests for zero/empty monthly rent and for a deposit outside the measured range producing no comparison.
- [ ] Run `pnpm vitest run packages/market-core/test/contract-check.test.ts apps/web/test/contract-check-state.test.ts` and confirm the intended failures.
- [ ] Correct `compareRentOffers()` to use each full deposit while keeping decimal-fraction rates and integer-won rounding.
- [ ] Update client parsing so empty monthly rent resolves to zero, explicit zero is accepted, and held-below/held-above blocks the result instead of returning extrapolated output.
- [ ] Run the two calculation test files and confirm they pass.

### Task 5: Redesign the Check workspace around live auditable results

**Files:**
- Modify: `v2/apps/web/components/contract-check/contract-check-workspace.tsx`
- Modify: `v2/apps/web/components/contract-check/contract-check.module.css`
- Modify: `v2/apps/web/components/contract-check/conversion-curve.tsx`
- Modify: `v2/apps/web/lib/locale/product-copy.ts`
- Test: `v2/apps/web/test/contract-check-workspace.test.tsx`
- Test: `v2/apps/web/test/korean-embedded-components.test.tsx`

**Interfaces:**
- Consumes corrected `RentContractComparison` values.
- Produces a 1,120px live comparison workspace with two offers, two monthly equivalents, four trace rows, measured curve, and boundary copy.

- [ ] Add failing rendering tests for the compact mode selector, equal offer columns, live calculation copy, complete full-deposit trace, held-range copy, and absence of submit-gated behavior.
- [ ] Run the two workspace test files and confirm the new contracts fail.
- [ ] Recompose the existing client workspace without adding persistence or analytics; expose `Compare two offers` as active and `My budget` as unavailable until its evidence dependencies exist.
- [ ] Replace the old reference-deposit/delta rows with filed deposit, filed monthly rent, applied rate/source, and monthly equivalent.
- [ ] Update the curve to stop at measured boundaries and visually hatch both held bands; do not continue the line into held space.
- [ ] Use the shared typography and rule hierarchy and retain accessible labels, live regions, and 44px controls.
- [ ] Run the workspace tests and confirm they pass.

### Task 6: Full verification, integration, and Production

**Files:**
- Modify only files required by verified regressions.

**Interfaces:**
- Produces the exact reviewed Git commit and matching Vercel Production deployment.

- [ ] Run focused regression tests for header, Explore, Rankings, and Check.
- [ ] Run `pnpm vitest run`, `pnpm typecheck`, `pnpm lint`, and `pnpm build` from `v2/` and require zero failures.
- [ ] Run `git diff --check` and review the full diff for invented claims, accidental files, and secrets.
- [ ] Start the production build and verify Home, Explore, Rankings, Check, and a building detail at desktop and mobile widths, including horizontal overflow, console errors, transaction availability, and live Check arithmetic.
- [ ] Commit the verified branch, update the GitHub remote from the reviewed tree, and deploy that exact tree to Vercel Production.
- [ ] Verify `www.signedprice.com` routes, the live Check calculation, the active product state, and recent Production runtime errors.

