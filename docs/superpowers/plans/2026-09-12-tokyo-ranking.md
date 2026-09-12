# Tokyo ranking and single-image card implementation plan

> **For agentic workers:** Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Publish 50 verified anonymous Tokyo resale-condominium records and one 1080 × 1350 TOP 10 card.

**Architecture:** An explicitly dated source snapshot powers both server-rendered ranking cards and the deterministic SVG/PNG export. The existing ranking route selects Tokyo before querying Seoul or Singapore.

**Tech Stack:** Next.js, React, CSS modules, Vitest, SVG, Sharp.

**Spec:** User-approved one-page format in this conversation: badges, prominent full currency units, latest publicly available period, mobile readability, full TOP 50 destination.

## Global Constraints

- One portrait image per city; no carousel.
- Tokyo observation period is 2026 Q1, checked 12 September 2026.
- Anonymous district records have no inferred building names or Street View.
- Equal prices sort by area descending then source ward, district and reference; state this on card and page.
- Dubai publication is blocked until current individual records and permitted reuse are verified.

### Task 1: Verified ranking destination

- [x] Re-query the current 23 ward releases and save 50 rows in `v2/apps/web/data/tokyo-ranking-2026-q1.json`.
- [ ] Add `test/tokyo-rankings.test.tsx` asserting 50 unique records, exact full prices, source period, no building links, and Tokyo routing without a Seoul query.
- [ ] Run `pnpm exec vitest run test/tokyo-rankings.test.tsx` and observe the missing component failure.
- [ ] Create `components/rankings/tokyo-rankings.tsx` and its CSS module; route `query.city === 'tokyo'` to it and expose the link on all market hubs.
- [ ] Run the focused test and TypeScript; review changes and complete required CI before merge.

### Task 2: Single-image export

- [ ] Create `artifacts/rankings/render-tokyo.cjs` reading the same snapshot and producing a 1080 × 1350 SVG and PNG.
- [ ] Match existing Seoul/Singapore typography, left badges and highlighted first row. Spell out JPY million, source quarter, and the tie-break.
- [ ] Inspect the rendered image for text collisions at full and mobile sizes.
- [ ] Verify the production TOP 50 destination before releasing the card with its CTA.
