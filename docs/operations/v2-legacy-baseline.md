# V2 legacy baseline

Captured on 2026-08-29 against `https://koreahomeguide.com` with the approved
read-only cloud Chrome runner. The machine-local Playwright test is committed as
the reproducible contract, but its Chromium binary was unavailable because the
official v1234 download could not be installed. `npx playwright test --list -c
playwright.legacy.config.ts` discovered one test; it did not launch a browser.

## Browser baseline

`artifacts/v2-migration/legacy-browser-baseline.json` records the read-only
Dongjak-gu / Noryangjin-dong flow. Cloud Chrome verified the explorer page,
`dong=` URL selection stable for at least 10 seconds, exactly seven building
rows, the central building dialog, a ready Street View frame unchanged between
two and eight seconds, Escape close/focus return, and the Rent Check layout,
idle status, disclosures, and no horizontal overflow.

Cloud Chrome blocked the deliberately invalid target before navigation with
`ERR_BLOCKED_BY_CLIENT`; the evidence calls this `runner-policy-blocked`, not a
connection failure. Configured-target handling is established statically by the
contract's relative navigation and `playwright.legacy.config.ts` resolving
`LEGACY_BASE_URL`. Cloud Chrome could establish and render both production pages,
but does not expose navigation response status to its read-only evaluation
surface; `pageAvailable: true` is the captured availability signal. The local
Playwright contract explicitly asserts the Rent Check navigation response is
200 when a browser is available. No form was submitted and no lead, community,
login, upload, or other external mutation was performed.

Console errors are separately redacted in the artifact: cloud extension metadata
messages and Google Maps vector-to-raster fallback. No cookies, request headers,
credentials, IP addresses, or secrets are recorded.

The pre-fix production snapshot recorded `lawdCd=11590` in the Rent Check URL
while the rendered district control remained at `11680`. This is now a fixed
local regression with an expected `11590` control value; it must be re-run only
against the controller-provided Vercel Preview, not misreported as a Production
GREEN result.

## Legacy Node suite classification

Run once with:

```bash
node --test tests/*.test.cjs > artifacts/v2-migration/legacy-test-baseline.txt 2>&1
```

Result: **887 total, 864 pass, 23 fail, 0 cancelled, 0 skipped, 0 todo**. The
additional passing test is the EN+ZH actual-select Explorer handoff regression;
all 23 failures are the pre-existing SEO/currency-contract failures below.

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
