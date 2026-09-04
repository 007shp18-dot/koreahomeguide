# SignedPrice Three-City Home and Navigation Implementation Plan

> **For Codex:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Make the first screen unmistakably about Seoul, Singapore, and Dubai, with each city's real evidence status and valid next action changing together.

**Architecture:** Build a server-derived three-market presentation model from the global capability registry, then render a small client-side city selector. Photography is editorial context; evidence text and actions come from capability data. Market and language navigation remain separate and unavailable routes are never synthesized.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, CSS Modules, Vitest, React server rendering tests, Playwright.

---

### Task 1: Define the three-market home model

**Files:**
- Create: `v2/apps/web/lib/home/three-market-home-model.server.ts`
- Test: `v2/apps/web/test/three-market-home-model.test.ts`

- [ ] Write failing cases requiring Seoul, Singapore, and Dubai in stable order.
- [ ] Require photo, summary, evidence label, period/status, limitations, primary action, and optional secondary action for every city.
- [ ] Derive actions from typed market capabilities; Dubai must resolve to overview/research while transaction detail is rights-blocked.
- [ ] Reuse `MARKET_PHOTOS` only as city-level editorial assets and label them as such.
- [ ] Run the focused test and confirm GREEN.

### Task 2: Build the accessible market hero

**Files:**
- Create: `v2/apps/web/components/home/three-market-hero.tsx`
- Create: `v2/apps/web/components/home/three-market-hero.module.css`
- Test: `v2/apps/web/test/three-market-hero.test.tsx`

- [ ] Write failing interaction tests proving a city selection changes photo, evidence, status, and CTA atomically.
- [ ] Implement three always-visible semantic tabs and one live panel; do not use generic carousel dots.
- [ ] Add a seven-second rotation that stops for the session after click, swipe, hover, or keyboard focus.
- [ ] Disable rotation and transition when `prefers-reduced-motion` is active; cap visual transition at 250ms opacity.
- [ ] Keep one headline, one lead, and at most two actions; no floating badge clusters or decorative KPI cards.

### Task 3: Replace the Seoul-only production home entry

**Files:**
- Modify: `v2/apps/web/components/design-review/editorial-growth-home.tsx`
- Modify: `v2/apps/web/components/design-review/editorial-growth-review.module.css`
- Modify: `v2/apps/web/lib/design-review/editorial-growth-review-model.ts`
- Modify: `v2/apps/web/lib/design-review/editorial-growth-review-model.server.ts`
- Test: `v2/apps/web/test/editorial-growth-public-home.test.tsx`
- Test: `v2/apps/web/test/home-layout.test.ts`

- [ ] Replace Korea-only eyebrow, title, Seoul-only photo, and Seoul-only evidence strip with the three-market model.
- [ ] Keep the existing editorial reports/guides below the hero, but make their market relationship explicit.
- [ ] Verify English and Simplified Chinese copy fit without reducing type below approved tokens.
- [ ] Preserve zero-height advertising boundaries and load no advertising scripts.

### Task 4: Make global, market, product, and language navigation coherent

**Files:**
- Modify: `v2/apps/web/components/site-header.tsx`
- Modify: `v2/apps/web/components/site-header.module.css`
- Modify: `v2/apps/web/lib/navigation/market-route-resolver.ts`
- Test: `v2/apps/web/test/site-header-contract.test.tsx`
- Test: `v2/apps/web/test/market-route-isolation.test.ts`

- [ ] Put the three-market switcher in a stable tier distinct from `EN / 中文 / 한국어`.
- [ ] Render only supplied capability-safe product links per market.
- [ ] Preserve the current market when changing language when an equivalent locale route exists; otherwise disclose the fallback destination.
- [ ] Make the header usable at 360px without hiding the current city or primary action.

### Task 5: Visual and behavioral gates

- [ ] Add Playwright coverage for city selection, stopped auto-rotation, keyboard order, reduced motion, and valid destination links.
- [ ] Capture Home and open navigation at 1440×1000, 1024×900, 390×844, and 360×800.
- [ ] Check headline wrapping, Chinese line height, crop focal points, tap targets, overflow, and image/text contrast.
- [ ] Run web tests, typecheck, lint, and production build.
- [ ] Promote to Production only after the real browser captures are reviewed.
