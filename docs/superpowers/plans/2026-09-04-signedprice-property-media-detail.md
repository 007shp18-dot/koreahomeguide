# SignedPrice Property Media and Unified Detail Implementation Plan

> **For Codex:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace awkward Street View-first property pages with rights-safe real photography when available and a calm evidence-led fallback when it is not, while making Seoul and Singapore detail pages follow one decision sequence.

**Architecture:** Treat media as a rights-reviewed entity linked to verified property identity. A deterministic resolver selects exact property media, then verified parent/project media, then clearly labeled city editorial media, then a neutral location panel. Street View moves to optional street context and never occupies the hero. A shared detail read model orders identity, evidence, comparisons, facts, provenance, and next action.

**Tech Stack:** PostgreSQL/Neon, Vercel Blob for owned/licensed assets only, Google Places display API without caching photo resources, Next.js Image, React, TypeScript, Vitest, Playwright.

---

### Task 1: Lock the media rights and fallback contract

**Files:**
- Create: `v2/apps/web/lib/photos/property-media-model.ts`
- Create: `v2/apps/web/lib/photos/property-media-resolver.server.ts`
- Test: `v2/apps/web/test/property-media-resolver.test.ts`

- [ ] Write failing cases for `owned`, `licensed`, `provider-display-only`, and `review-required` rights.
- [ ] Require verified subject identity, source page, attribution, checked date, and visual review before public approval.
- [ ] Enforce fallback order: approved exact photo → approved parent/project photo → labeled city editorial photo → neutral location panel.
- [ ] Prove Google photo resource names and photo bytes are never persisted; store a place ID and request the photo at display time.
- [ ] Prove Street View cannot resolve as primary media.

### Task 2: Move current approvals into the common media model

**Files:**
- Modify: `v2/apps/web/lib/photos/building-photo-store.server.ts`
- Modify: `v2/apps/web/app/api/internal/building-photo-approval/route.ts`
- Modify: `v2/apps/web/app/api/building-photo/route.ts`
- Test: `v2/apps/web/test/building-photo-candidates.test.ts`
- Test: `v2/apps/web/test/verified-building-photo-registry.test.ts`
- Test: `v2/apps/web/test/photo-and-news-safety.test.ts`

- [ ] Dual-write approved current records to `media_assets` while retaining `building_photos` during migration.
- [ ] Reject exact-building claims when the subject is only a parent project or a city editorial image.
- [ ] Preserve Wikimedia license/source metadata and manual visual review state.
- [ ] Add coverage reporting by market and fallback level without exposing the internal approval endpoint publicly.

### Task 3: Define the shared property decision detail model

**Files:**
- Create: `v2/apps/web/lib/public-market/property-decision-detail-model.ts`
- Create: `v2/apps/web/lib/public-market/property-decision-detail-model.server.ts`
- Test: `v2/apps/web/test/property-decision-detail-model.test.ts`

- [ ] Require sections in this order: identity → current evidence → comparable observations → property facts → provenance → next action.
- [ ] Preserve market-specific labels for Seoul apartment complex/building, Singapore private project/block, and HDB town/block.
- [ ] Require native currency, observation period, sample, housing sector, source, and limitations for every price statement.
- [ ] Return a capability-safe `checkHref` and state-preserving `exploreHref`.

### Task 4: Replace Street View-first rendering

**Files:**
- Modify: `v2/apps/web/components/public-market/building-visual.tsx`
- Modify: `v2/apps/web/components/public-market/building-detail-header.tsx`
- Modify: `v2/apps/web/components/public-market/building-detail-page.tsx`
- Modify: `v2/apps/web/components/public-market/building-detail.module.css`
- Modify: `v2/apps/web/components/singapore/singapore-explorer.tsx`
- Test: `v2/apps/web/test/public-building-visual.test.tsx`
- Test: `v2/apps/web/test/public-building-detail.test.tsx`
- Test: `v2/apps/web/test/provider-building-street-view.test.tsx`

- [ ] Render approved photography with visible attribution and accurate subject label.
- [ ] Render project/city fallbacks without suggesting they depict the exact building.
- [ ] Move `GoogleBuildingStreetView` and `NaverBuildingStreetView` behind an optional “Street context” disclosure below facts/provenance.
- [ ] Keep the evidence-led fallback useful: name, verified address/identity, evidence status, and next action.

### Task 5: Build the review and maintenance loop

**Files:**
- Create: `v2/apps/web/lib/photos/property-media-health.server.ts`
- Create: `v2/apps/web/app/api/internal/property-media-health/route.ts`
- Test: `v2/apps/web/test/property-media-health.test.ts`

- [ ] Detect broken URLs, expired review dates, missing attribution, duplicate subjects, and mismatched entity identity.
- [ ] Mark failures `broken` or `review_required` without falling back to Street View hero media.
- [ ] Return counts only from the internal health route and require the existing internal authorization boundary.
- [ ] Document how owned/licensed files may enter Vercel Blob and why Google provider photos may not.

### Task 6: Visual and production gates

- [ ] Capture photo, parent fallback, city fallback, and no-photo states at 1440, 1024, 390, and 360 widths.
- [ ] Review crop, attribution, identity wording, layout shift, keyboard order, and optional street context.
- [ ] Run focused tests, full web tests, typecheck, lint, and production build.
- [ ] Run media health against Production data before promotion.
- [ ] Do not claim complete photo coverage; publish the measured coverage and fallback distribution.
