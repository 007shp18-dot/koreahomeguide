# v10.5 Transaction Quality Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make rent statistics trustworthy by preserving contract context, segmenting monthly rents by deposit and area, separating new vs renewal contracts, adding apartment sale transactions, and correctly adding detached/multi-family rental data.

**Architecture:** Keep the existing MOLIT provider and page structure, but enrich normalized transactions instead of changing API shapes wholesale. Add one sale fetch path for apartments and one additional rental property type (`detached`) using MOLIT SHRent. Existing median fields remain for backwards compatibility, while UI/SEO switch to contextual metrics that do not imply a synthetic deposit+rent pair.

**Tech Stack:** Node.js CommonJS serverless handlers, vanilla JS frontend, Vercel rewrites, Node built-in test runner.

**Spec:** Conversation-approved v10.5 scope: area split + deposit-band rent + new/renewal split + apartment sale transactions + Villa scope correction + detached/multi-family rental API.

## Global Constraints

- Preserve existing EN/ZH routes and currency/date localization.
- Keep official rental raw units interpreted as 만원 and normalized to KRW.
- Never present separately computed median deposit and median rent as if they are one real contract pair.
- Default market-context metrics to new contracts when contract type is available; retain unknown contracts in coverage counts and label them explicitly.
- Apartment sale data must be optional/non-fatal if the separate public API permission is unavailable.
- GitHub web upload package must remain below 100 files.

---

### Task 1: Preserve rental contract metadata

**Files:** `lib/real-price-core.cjs`, `lib/rent-check-core.cjs`, tests.

- [ ] Add failing tests for `contractType`, `contractTerm`, `useRRRight`, `preDeposit`, `preMonthlyRent` parsing/normalization.
- [ ] Implement metadata preservation with normalized won values for previous deposit/rent.
- [ ] Verify legacy normalization still works.

### Task 2: Contextual rent statistics

**Files:** `lib/rent-market-core.cjs`, `providers/provider-utils.cjs`, tests.

- [ ] Add failing tests proving deposit-band rent does not mix ₩10M and ₩150M contracts into one synthetic pair.
- [ ] Add area clusters so ~60㎡ and ~85㎡ are reported separately.
- [ ] Add new/renewal/unknown counts and new-contract headline medians.
- [ ] Keep legacy median fields for compatibility but mark contextual fields separately.

### Task 3: Apartment sale provider

**Files:** `lib/real-price-core.cjs`, `providers/korea-provider.cjs`, `providers/provider-utils.cjs`, tests.

- [ ] Add failing parser/fetch tests for AptTradeDev `dealAmount`.
- [ ] Add optional 6-month apartment sales fetch and building-name/dong matching.
- [ ] Return `saleSummary` and `recentSales` on apartment building detail; failures must not break rent data.

### Task 4: Property taxonomy correction

**Files:** `providers/seoul-config.cjs`, UI labels/options, SEO renderer, tests.

- [ ] Rename `villa` display label to `Villa / Low-rise (연립·다세대)` (and suitable Chinese wording).
- [ ] Add `detached` property type backed by `RTMSDataSvcSHRent`.
- [ ] Add the new option to homepage, Explorer, Rent Check EN/ZH where supported.

### Task 5: Building/SEO UI trust fixes and packaging

**Files:** building EN/ZH pages/apps, `seo/seo-page-renderer.cjs`, styles, tests.

- [ ] Replace synthetic top-level rent+deposit pair with contextual sections: deposit bands, area groups, contract-type mix.
- [ ] Add apartment sale section when available.
- [ ] Keep recent raw contracts visible for auditability.
- [ ] Run full test suite, syntax checks, and package a <100-file GitHub ZIP.
