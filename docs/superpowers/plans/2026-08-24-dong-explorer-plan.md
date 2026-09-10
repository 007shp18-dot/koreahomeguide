# Dong Explorer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Add district → dong → building exploration and dong-qualified building identity to KoreaHomeGuide v9.4 while keeping the UI simple and packaging it for GitHub web upload.

**Architecture:** Extend the existing provider aggregation layer with dong grouping and composite building keys, add one dong API, then enhance the existing EN/ZH Explorer in place. Reuse existing MOLIT fetch/cache and currency/date utilities; no database or new framework.

**Tech Stack:** Node.js CommonJS Vercel functions, vanilla HTML/CSS/JS, node:test.

**Spec:** `docs/superpowers/specs/2026-08-24-dong-explorer-design.md`

## Global Constraints
- Preserve existing Seoul-only v9.3 behavior and all 68 prior regression tests.
- No live listings, brokerage matching, database, maps, reviews, or auth.
- Building identity must be district-scoped through the API and dong-qualified within provider data.
- Unknown Chinese dong names must not be machine-invented; preserve Korean.
- Keep query-based building detail noindex behavior.
- Create GitHub web upload batches with fewer than 100 files each.

---

### Task 1: Provider dong model and composite building identity
- [x] Write failing provider tests for dong summaries, dong filtering, and duplicate building names in different dongs.
- [x] Run provider tests and confirm RED.
- [x] Implement dong normalization/grouping and dong-qualified building keys.
- [x] Run provider tests and confirm GREEN.

### Task 2: Dong API
- [x] Write failing API tests for `/api/explore-dong` validation and response shape.
- [x] Run API tests and confirm RED.
- [x] Implement provider methods and `api/explore-dong.js`.
- [x] Run API tests and confirm GREEN.

### Task 3: English Explorer UI
- [x] Write failing page/static tests for Neighborhoods section, dong query persistence, all-neighborhood reset, and dong-qualified building links.
- [x] Run tests and confirm RED.
- [x] Implement EN Explorer dong cards/filter state and building metadata.
- [x] Run tests and confirm GREEN.

### Task 4: Chinese Explorer UI
- [x] Write failing tests for Chinese neighborhood labels/fallback, dong query persistence, and EN/ZH switching.
- [x] Run tests and confirm RED.
- [x] Implement ZH Explorer and building metadata updates.
- [x] Run tests and confirm GREEN.

### Task 5: Full regression and packaging
- [x] Run the full test suite.
- [x] Run JS/CJS syntax checks.
- [x] Verify sitemap/noindex/legal-copy invariants.
- [x] Build complete ZIP.
- [x] Build GitHub upload batch ZIPs with <100 files each and correct relative paths.
- [x] Verify every production file appears in exactly one upload batch and each archive integrity check passes.
