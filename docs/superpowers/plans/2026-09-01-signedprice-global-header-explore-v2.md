# SignedPrice Global Header and Explore V2 Implementation Plan

**Goal:** Ship the approved compact two-tier global navigation and a map-first Seoul Explore experience to Production without overstating the currently published building inventory.

**Architecture:** Keep `SiteHeader` as the single navigation primitive used by every public route. The first tier owns market and language context; the second tier owns product navigation. Keep verified Seoul jeonse evidence as the only numeric building layer currently published, while transaction tabs make sale and monthly-rent availability explicit rather than substituting data. Recompose the existing `AreaExplorer` state and models instead of introducing a parallel explorer.

**Tech Stack:** Next.js App Router, React, TypeScript, CSS Modules, Vitest, Vercel.

---

## Task 1: Lock the navigation and Explore contracts with failing tests

**Files:**
- Modify: `v2/apps/web/test/brand-mark.test.tsx`
- Modify: `v2/apps/web/test/design-tokens.test.ts`
- Modify: `v2/apps/web/test/home-layout.test.ts`
- Modify: `v2/apps/web/test/public-area-explorer.test.tsx`

1. Add assertions for the two navigation tiers, three market entries, five numbered product entries, active state, and minimum 44px targets.
2. Assert that the homepage no longer renders a duplicate city tablist.
3. Add Explore assertions for transaction tabs, compact unified search/filter controls, map-first DOM order, 65/35 workspace, and explicit unavailable states for monthly rent and sale.
4. Run the focused tests and confirm they fail for the intended missing UI contracts.

## Task 2: Implement the approved global two-tier header

**Files:**
- Modify: `v2/apps/web/components/site-header.tsx`
- Modify: `v2/apps/web/lib/site-copy.ts`
- Modify: `v2/apps/web/app/globals.css`

1. Render the brand, Seoul/Singapore/Dubai market navigation, and EN/KO context in tier one.
2. Render Check, Explore, Rankings, Briefs, and Guide as numbered product tiles in tier two.
3. Derive active product and market state from the page-owned current link without client-side pathname dependencies.
4. Make the second tier horizontally scrollable on narrow screens with 44px touch targets and no document overflow.

## Task 3: Remove the homepage's duplicate market controls

**Files:**
- Modify: `v2/apps/web/components/home-market-browser.tsx`
- Modify: `v2/apps/web/components/home-editorial.module.css`

1. Remove the local city tablist and its keyboard state.
2. Keep the homepage focused on Seoul's currently public evidence and preserve the Rent/Buy/Invest decision entry.
3. Preserve staged Singapore and Dubai access through the global header rather than duplicate controls.

## Task 4: Recompose Explore around the map and evidence rail

**Files:**
- Modify: `v2/apps/web/app/kr/seoul/explore/page.tsx`
- Modify: `v2/apps/web/components/public-market/area-explorer.tsx`
- Modify: `v2/apps/web/components/public-market/area-explorer.module.css`
- Modify: `v2/apps/web/lib/locale/product-copy.ts`

1. Add Rent / Monthly rent / Sale transaction tabs with Rent active and data-unavailable explanations for unsupported modes.
2. Move the compact title, transaction tabs, unified search, district and building-type filters above the workspace.
3. Put the 65% map and 35% evidence rail in the first working viewport; keep the complete coverage and district table beneath it.
4. Search across district, neighborhood, building name, and housing type. Preserve incremental result loading and building selection.
5. Keep Naver Map as the Seoul provider and isolate SDK failures to the map panel fallback.
6. Label price-ready building counts accurately; never present the current published cohort count as the total observed inventory.

## Task 5: Responsive, accessibility, and full verification

**Files:**
- Modify as required by verification failures only.

1. Run focused tests, then the complete web test suite.
2. Run TypeScript, lint, and the Production build.
3. Start the built app and verify homepage, Explore, Rankings, and a detail route at desktop and mobile widths; check overflow and console errors.
4. Review the final diff for accidental data claims, unrelated edits, and secrets.

## Task 6: Integrate and deploy

1. Commit the verified branch and push it to the configured GitHub remote.
2. Deploy the exact verified commit to Vercel Production.
3. Confirm the deployment is READY and verify `www.signedprice.com` homepage and Explore responses against the new release.
