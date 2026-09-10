# V2 legacy baseline

Captured on 2026-08-29 at approximately 16:32–16:34 UTC against
`https://koreahomeguide.com` with the approved read-only cloud Chrome runner.
The machine-local Playwright producer is committed as the reproducible contract.
`npx playwright test --list -c playwright.legacy.config.ts` discovers one test
without launching a browser.

## Baseline lineage

The current Production/main baseline is
`4acbcca6476eabd9033915578f8c532cb2f581c8`. It is the approved mainline
reference for Phase 0 verification after the PR #15 hotfix.

`188f30fedf73367dbe564f8fcc458c98df205050` remains the original Phase 0
reference. It is retained for historical comparison and must not be substituted
for the current Production/main baseline.

## Browser baseline

`artifacts/v2-migration/legacy-browser-baseline.json` records the read-only
Dongjak-gu / Noryangjin-dong flow on Production revision `4acbcca`. Cloud Chrome
verified the explorer page, `dong=` URL selection unchanged for the captured
10,000 ms duration, exactly seven building rows, the central building dialog,
a Street View frame with unchanged bounds from two to eight seconds, Escape
close/focus return, and the Rent Check layout, idle status, disclosures, and no
horizontal overflow. The observed Rent Check district control was `11590`
(`Dongjak-gu (동작구)`), matching the URL; this is current Production evidence,
not a pending Preview expectation.

The Playwright producer and offline gate both use
`scripts/v2-migration/browser-baseline-schema.cjs`. The producer writes the
canonical artifact only after every assertion and normalization succeeds. A
non-Production or deliberately invalid `LEGACY_BASE_URL` must set a distinct
`LEGACY_EVIDENCE_PATH`; the resolver rejects the canonical artifact path for
such a target. For example:

```bash
LEGACY_BASE_URL=http://127.0.0.1:9 \
LEGACY_EVIDENCE_PATH=/tmp/invalid-base-browser-evidence.json \
npx playwright test -c playwright.legacy.config.ts
```

Cloud Chrome could establish and render both Production pages, but does not
expose navigation response status to its read-only evaluation surface;
`pageAvailable: true` is the captured availability signal. The Playwright
producer explicitly asserts both navigation responses are 200. No form was
submitted and no lead, community, login, upload, or other external mutation was
performed.

Console errors are separately redacted in the artifact: cloud extension metadata
messages and Google Maps vector-to-raster fallback. No cookies, request headers,
credentials, IP addresses, or secrets are recorded.

The offline gate validates the captured URLs and minimum 10-second duration; it
does not claim to replay elapsed browser time. It also rejects non-finite
viewport, overflow, and box dimensions instead of allowing JavaScript numeric
coercion.

## Deterministic source provenance

Every entry in `legacy-api-contracts.json` records the SHA-256 digest of its
corresponding `api/*.js` implementation. The Korea calculation fixture records
separate SHA-256 digests for `deposit-conversion.js` and
`lib/rent-check-core.cjs`. The Phase 0 gate regenerates these values, so any
source edit fails closed until the contract artifact is explicitly regenerated
and reviewed.

## Legacy Node suite classification

Run once with:

```bash
node --test tests/*.test.cjs > artifacts/v2-migration/legacy-test-baseline.txt 2>&1
```

Historical captured artifact result: **887 total, 864 pass, 23 fail, 0
cancelled, 0 skipped, 0 todo**. The additional passing test is the EN+ZH
actual-select Explorer handoff regression; all 23 failures are the pre-existing
SEO/currency-contract failures below.

Current binding complete-glob result after Task 5 is **890 total, 867 pass, 23
fail, 0 cancelled, 0 skipped, 0 todo**. The three additional tests are the
passing Phase 0 verification-gate cases in
`tests/v2-migration-phase-0-gate.test.cjs`; they are additions to the complete
test glob, not a new legacy failure class. The tracked artifact remains the
historical capture above so that the original failure evidence is preserved.

`legacy-test-failures.json` locks all 23 failures by test file and stable test
title, plus both the historical and current summaries. The Phase 0 CLI runs the
current complete, non-recursive `tests/*.test.cjs` suite in memory and rejects a
new failure that merely replaces a known one:

```bash
node scripts/v2-migration/verify-phase-0.cjs
```

The exported `verifyPhase0(rootDir)` remains a pure artifact check. It does not
spawn tests; callers must explicitly pass `{ suiteEvidence }` to compare a
current run.

| Existing failure group | Count | Tests |
| --- | ---: | --- |
| `analytics-pages.test.cjs` | 1 | shared GA4 loader count |
| `building-seo-publishing-floor.test.cjs` | 7 | publish floor, 404/redirect, Chinese prefix, unconfigured/upstream 503 branches |
| `currency-defaults.test.cjs` | 1 | KRW-first persistent currency preference |
| `seo-discovery.test.cjs` | 1 | homepage/sitemap guide and explorer exposure |
| `seo-endpoints.test.cjs` | 3 | Dong response, thin building 404, Vercel rewrites |
| `seo-page-renderer.test.cjs` | 5 | EN/ZH Dong output and thin/above/below publishing-floor pages |
| `v10-6-dynamic-sitemap.test.cjs` | 2 | root index and shared child-sitemap endpoint |
| `v11-2-building-seo-quarantine.test.cjs` | 3 | named floor, building link eligibility, one aggregation request |

This classification matches the known 23 failures; no new failure class was
introduced.
