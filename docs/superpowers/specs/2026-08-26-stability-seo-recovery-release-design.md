# KoreaHomeGuide Stability and SEO Recovery Release Design

**Date:** 2026-08-26  
**Status:** Approved for implementation planning  
**Repository baseline:** local commit `bb06fa0` on top of remote `main` commit `0333af4`

## 1. Context

KoreaHomeGuide currently has two different kinds of work in one repository state:

1. A completed local SEO-content patch that adds six localized guide pages, reduces dynamic sitemap breadth, and keeps building pages out of search.
2. Newer v10.8-v11.3 tests and partial production files on remote `main` whose implementations are incomplete or inconsistent.

At the approved baseline, the complete test suite contains 345 tests: 296 pass and 49 fail. The failures cover lead-form layout, date script order, Dong SEO enrichment, Explorer ranking and Seoul-wide mode, API request protection, MOLIT retry and caching, Fair Rent Intelligence, and the Vercel function budget. The `api/` directory contains 13 deployable JavaScript functions, while the portability target is at most 11.

Search Console reported 13,408 discovered pages but only two impressions. The immediate SEO response is therefore quality and crawl control rather than publishing another large batch of pages.

## 2. Release Goal

Produce one coherent stability release that:

- completes the already-checked-in v10.8-v11.3 behavior;
- makes official MOLIT data access resilient to rate limits and repeated cold requests;
- reduces deployable Vercel functions to 11 without changing public URLs;
- keeps indexable SEO surfaces narrow, localized, and supported by sufficient data;
- completes the existing Rent Check distribution UI without changing its verdict thresholds;
- preserves the simple Rent Check-first product hierarchy and EN/ZH parity; and
- can be uploaded as an incremental package containing fewer than 100 files.

## 3. Non-Goals

This release will not add:

- more guide topics beyond the six localized pages already in `bb06fa0`;
- live listings, landlord contact, or brokerage services;
- payments, ads, affiliate networks, or partner integrations;
- new cities, countries, or languages;
- personalized accounts or saved searches;
- changes to the existing `below`, `fair`, and `above` thresholds; or
- indexable building-detail pages.

The existing move-service foundation remains dormant and is not expanded in this release.

## 4. Architecture

### 4.1 Request protection and MOLIT resilience

`lib/api-guard.cjs` will own the shared request-safety behavior:

- production source validation for `koreahomeguide.com` and `www.koreahomeguide.com`;
- same-origin and trusted-referrer handling for browser requests;
- permissive headerless behavior outside production so local tests and server-to-server use remain possible;
- validation that requested deal months are completed months inside the configured historical window;
- a five-second default upstream timeout;
- bounded retry for HTTP 429 and transient failures, honoring `Retry-After` when present;
- a warm-instance semaphore that permits at most two concurrent upstream attempts; and
- safe structured error logging that includes only allowlisted context fields and never logs service keys, upstream URLs, lead data, or other PII.

Every direct MOLIT-backed endpoint will use this shared path. Error responses remain generic and do not reveal upstream credentials or URLs. Permanent 4xx responses such as 403 are not retried.

### 4.2 Month-request cache layers

`lib/real-price-core.cjs` will become the single path for paged MOLIT rental and apartment-sale requests.

The read sequence is:

1. Coalesce identical in-flight month requests inside a warm function instance.
2. Check the Vercel Runtime Cache through the lazy adapter in `lib/runtime-cache.cjs`.
3. On a miss, call MOLIT through the shared timeout, retry, and concurrency guard.
4. Parse and normalize all result pages.
5. Write successful normalized rows to Runtime Cache for 86,400 seconds with the `molit-month` tag.
6. Return the successful result even when the cache write fails.

Cache keys use the stable form:

```text
molit-v1:{rent|sale}:{propertyType}:{districtCode}:{dealMonth}:{pageSize}
```

The key never contains the public-data service key. Cache read failures fall back to MOLIT, and failed MOLIT requests are never retained in the warm cache.

### 4.3 Function consolidation

Public paths remain unchanged while two duplicate function files are removed:

- `/api/maps-config` continues to rewrite to `api/fx.js?resource=maps-config`; `api/maps-config.js` is deleted.
- `/api/explore-seoul` rewrites to the shared `api/explore-area.js` handler with an all-Seoul scope; `api/explore-seoul.js` is deleted.

`api/explore-area.js` will dispatch between:

- a single supported district using the existing six-month provider summaries; and
- all ten supported districts using three completed months in bounded district batches.

Both modes retain their existing response shapes. The all-Seoul response keeps district code and district name on every neighborhood and keeps its six-hour CDN cache. This reduces deployable API files from 13 to 11 without breaking browser URLs.

### 4.4 Explorer behavior

The EN and ZH Explorer pages add an explicit all-supported-Seoul option. Clients use `/api/explore-seoul` for that selection and `/api/explore-area` for a single district.

Explorer will:

- display overall market medians from summary fields rather than from an arbitrary deposit band;
- preserve district identity when constructing neighborhood links from an all-Seoul response;
- rank budget-filtered neighborhoods by the number of matching contracts, while preserving provider order when no budget filter is active; and
- expose matching-contract evidence internally for future UI use without adding a new recommendation badge in this release.

### 4.5 Dong SEO and indexing policy

One shared Dong quality helper is consumed by both the page endpoint and dynamic sitemap. The approved threshold is 10 reported contracts over the current analysis window. Older tests that assert a threshold of three are migrated to the approved threshold rather than weakening the production policy.

Indexing rules are:

- Dynamic sitemaps emit Dong URLs only.
- Building URLs never appear in a sitemap.
- Building SEO responses remain `noindex,follow` in both HTML and `X-Robots-Tag`.
- Dong building links lead to the interactive Explorer detail view and carry `rel="nofollow"`.
- English dynamic Dong URLs may be emitted for all ten supported districts when the quality threshold is met.
- Chinese dynamic Dong URLs are emitted only for the five districts with complete localized static market coverage: Gangnam-gu, Mapo-gu, Yongsan-gu, Seongdong-gu, and Yeongdeungpo-gu.

Static sitemap coverage will include all 30 English district/type market pages. Chinese static market pages remain limited to the 15 complete pages in the five localized districts; thin Chinese copies are not generated.

Qualifying Dong pages gain:

- search-first core metrics;
- a localized market snapshot;
- localized same-district neighborhood links;
- floor context in recent-contract rows when available;
- a conservative note explaining why identical-looking records are not heuristically deduplicated; and
- localized Chinese Dataset JSON-LD with machine-readable six-month coverage.

### 4.6 Rent Check distribution intelligence

Fair Rent Intelligence uses the exact comparable set already selected for the existing verdict. When at least five comparables are available, the response adds:

- P25;
- median;
- P75; and
- the empirical percentile rank of the user's quote.

Monthly-rent comparisons use monthly rent values. Jeonse comparisons use deposit values and never treat zero monthly rent as the comparison amount. When data is insufficient, all distribution fields are `null` and the UI panel remains hidden.

The existing verdict boundary stays unchanged: values at or beyond -10% and +10% are `below` and `above`; values inside that interval remain `fair`. EN and ZH use localized percentile sentences and correct English ordinal suffixes.

### 4.7 Small UI consistency fixes

The release also resolves the three remaining low-risk presentation regressions:

- lead email and consent fields use separate grid rows without shrinking the email input;
- help-request actions use the same primary button treatment as email capture; and
- every transaction-rendering page loads `date-utils.js` before its locale runtime.

These changes do not alter the homepage's single-primary-action hierarchy.

## 5. Error Handling and Compatibility

- Unsupported methods, filters, property types, and request origins retain explicit 4xx responses.
- Missing configuration and upstream failures retain each endpoint's current public status and generic error body. Any intentional status-code change must be named in the implementation plan and covered by a dedicated compatibility test; no such change is approved by this design.
- Retry logic does not retry permanent authorization errors.
- Runtime-cache failures never turn successful MOLIT data into an error.
- Existing API response fields remain backward compatible.
- Existing canonical URLs, hreflang pairs, and public rewrites remain stable.
- Maps continue to show the existing safe fallback when no browser key is configured.

## 6. Verification Strategy

The already-failing tests are the red phase for this release. Implementation proceeds in dependency order:

1. API guard, retry, coalescing, and Runtime Cache.
2. Function consolidation and route compatibility.
3. Explorer behavior.
4. Dong SEO, structured data, and sitemap localization.
5. Rent Check distribution intelligence.
6. Lead and date-loading consistency.

Completion requires:

- every repository test to pass, including all 345 baseline tests after changing only the obsolete three-contract Dong-threshold assertions to the approved threshold of 10, plus tests added for the completed behavior;
- no passing baseline test to regress;
- JavaScript syntax checks for every changed runtime file;
- `git diff --check` with no whitespace errors;
- at most 11 deployable files in `api/`;
- zero building URLs in generated sitemaps;
- verification of EN and ZH home, Rent Check, Explorer, guide hub, and representative Dong pages at a 390px mobile viewport and a desktop viewport;
- verification of map-key fallback, MOLIT 429 handling, and cache-failure fallback; and
- an audit showing that tests were not deleted or weakened merely to obtain a green suite.

## 7. Release Packaging and Rollback

Implementation is committed on top of `bb06fa0` as a separate release commit so the stability work can be reviewed or reverted independently.

The handoff contains:

1. a full repository ZIP built from the verified release commit; and
2. an incremental GitHub-web-upload ZIP containing fewer than 100 files and preserving repository-relative paths.

Both archives are integrity-tested and accompanied by a SHA-256 checksum. Because the ChatGPT GitHub connector in this workspace is read-only, repository integration occurs either through a GitHub-connected Codex cloud environment and pull request or by uploading the incremental archive. No partial remote upload is attempted.

## 8. Success Criteria

The release is complete when all of the following are true:

- the full automated suite is green;
- API function count is 11 or fewer;
- repeated and concurrent MOLIT month requests are bounded and cached;
- the public routes used by the current site remain unchanged;
- dynamic crawl growth is limited to substantial Dong pages;
- Rent Check distribution information appears only with reliable data;
- EN/ZH primary flows remain readable and functional on mobile; and
- both verified deployment archives are ready for upload.
