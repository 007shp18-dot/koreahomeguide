# SignedPrice Connected Market Journeys Implementation Plan

> **For Codex:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Make the existing Seoul, Singapore, and Dubai products easier to discover and move between without presenting unavailable work as a live tool.

**Architecture:** Keep market switching and product navigation in one resolver, let the shared header render the supplied market-specific contract, and add context-preserving handoffs from evidence detail pages to Check. Keep homepage photography editorial and subordinate to the primary actions.

**Tech Stack:** Next.js App Router, React, TypeScript, CSS Modules, Vitest, React server rendering tests.

---

### Task 1: Lock the market navigation contract

- [ ] Add failing cases to `v2/apps/web/test/market-route-isolation.test.ts` for Singapore and Dubai.
- [ ] Assert that Singapore exposes only live evidence surfaces and Dubai exposes only overview/market comparison.
- [ ] Assert that the shared header honors `navigationVariant: 'supplied'` and does not synthesize unavailable routes.
- [ ] Run `pnpm --filter @signedprice/web test -- market-route-isolation.test.ts` and confirm RED.

### Task 2: Make the shared header capability-safe

- [ ] Extend `v2/apps/web/lib/navigation/market-route-resolver.ts` with a Dubai overview-only contract.
- [ ] Update `v2/apps/web/components/site-header.tsx` to render supplied links when requested.
- [ ] Make the primary CTA resolve to Seoul Check, Singapore Check, Dubai market comparison, or global Prices.
- [ ] Update `v2/apps/web/lib/route-model.ts` so market overview and intent pages receive the centralized navigation contract.
- [ ] Run the focused navigation tests and confirm GREEN.

### Task 3: Connect Singapore project evidence to Check

- [ ] Add a failing route-model test for a context-only Singapore project handoff.
- [ ] Add a typed `checkHref` to the ready Singapore project model in `v2/apps/web/lib/singapore/route-types.ts` and `route-model.server.ts`.
- [ ] Prefill segment, project, district, and observed property type without fabricating price or area values.
- [ ] Render “Check this project price” beside the project evidence and keep Explore as the return path.
- [ ] Run the focused Singapore tests and confirm GREEN.

### Task 4: Connect editorial pages to the relevant market product

- [ ] Add failing component tests that Seoul reports lead to Seoul evidence and Singapore reports lead to Singapore evidence.
- [ ] Replace the generic Prices action in `v2/apps/web/components/insights/insights-article.tsx` with market-specific Explore/Check actions.
- [ ] Keep Dubai reports on the honest overview/market-comparison path until evidence is released.
- [ ] Run focused insight tests and confirm GREEN.

### Task 5: Verify the complete journeys

- [ ] Run web tests, typecheck, and lint.
- [ ] Run the production build.
- [ ] Verify homepage market switching and Seoul/Singapore/Dubai navigation in a real browser.
- [ ] Verify Seoul building → Check and Singapore project → Check query handoffs.
- [ ] Deploy to Production only after all gates pass, then repeat the browser checks on `www.signedprice.com`.

