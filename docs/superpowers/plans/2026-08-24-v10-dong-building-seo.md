# v10 Dong & Building SEO Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add crawlable, localized Seoul Dong and building rental-data URLs backed by the existing MOLIT provider without generating hundreds of static files.

**Architecture:** Vercel rewrites map public SEO paths to two serverless HTML handlers. Shared route utilities resolve district/dong/building slugs; a shared renderer emits escaped EN/ZH HTML, SEO metadata, data summaries, and internal links. Existing Explorer remains interactive but links to the new canonical SEO routes.

**Tech Stack:** Node.js CommonJS serverless handlers, vanilla JavaScript client, Vercel rewrites, Node built-in test runner.

**Spec:** `docs/superpowers/specs/2026-08-24-v10-dong-building-seo-design.md`

## Global Constraints

- Keep live-listing language out of the SEO pages.
- Reuse `createKoreaHousingProvider`; no duplicate MOLIT parsing.
- Dong pages index only when recent data exists.
- Building pages index only when they resolve exactly, have at least 3 recent contracts, and expose at least one meaningful price metric.
- EN uses USD-primary/KRW-reference; ZH uses CNY-primary/KRW-reference when FX is available.
- Dynamic values must be HTML-escaped.
- Production GitHub upload package must remain below 100 files.

---

### Task 1: Route/slugs

**Files:**
- Modify: `providers/seoul-config.cjs`
- Create: `seo/seo-route-utils.cjs`
- Test: `tests/seo-dynamic-routes.test.cjs`

**Interfaces:**
- Produces district slug/code lookup, Dong slug/name lookup, building slug generation/resolution, and canonical URL builders.

- [ ] Write failing tests for district/Dong resolution and collision-safe building slugs.
- [ ] Run focused tests and confirm RED.
- [ ] Implement minimal route helpers.
- [ ] Run focused tests and confirm GREEN.

### Task 2: Shared SEO renderer

**Files:**
- Create: `seo/seo-page-renderer.cjs`
- Test: `tests/seo-page-renderer.test.cjs`

**Interfaces:**
- Consumes provider summaries/buildings/detail + locale + FX rates.
- Produces full escaped HTML for Dong, building, 404, and 503 pages.

- [ ] Write failing renderer tests for metadata, localization, CNY/USD display, building anchors, index/noindex rules, and listing-language guard.
- [ ] Confirm RED.
- [ ] Implement minimal renderer.
- [ ] Confirm GREEN.

### Task 3: Serverless SEO handlers and rewrites

**Files:**
- Create: `api/seo-dong-page.js`
- Create: `api/seo-building-page.js`
- Create: `vercel.json`
- Test: `tests/seo-endpoints.test.cjs`

**Interfaces:**
- Public rewrites call handlers with `{district,dong,type,building,lang}`.
- Handlers return HTML with proper status, robots metadata, and cache headers.

- [ ] Write failing endpoint tests for 200/404/503 and quality gates.
- [ ] Confirm RED.
- [ ] Implement handlers with provider injection and FX fetch fallback.
- [ ] Add rewrites.
- [ ] Confirm GREEN.

### Task 4: Explorer canonical internal links

**Files:**
- Modify: `explore/explorer-utils.js`
- Modify: `explore/app.js`
- Modify: `zh/explore/app.js`
- Test: `tests/seo-explorer-links.test.cjs`

**Interfaces:**
- Produces canonical Dong/building SEO URLs while preserving current Explorer interactions as secondary actions.

- [ ] Write failing tests for EN/ZH canonical URL creation and rendered links.
- [ ] Confirm RED.
- [ ] Implement links.
- [ ] Confirm GREEN.

### Task 5: Full regression and packaging

**Files:**
- Modify tests only if an intentionally changed expectation is stale.
- Create final ZIP artifacts outside the repo.

- [ ] Run complete Node test suite.
- [ ] Syntax-check all production JS/CJS.
- [ ] Validate `vercel.json` JSON.
- [ ] Count production deployment files and ensure <100.
- [ ] Build complete ZIP and GitHub-upload ZIP.
- [ ] Verify ZIP integrity and file counts.
