# signedprice public P1 release gate

## Authority boundary

This checklist prepares a protected exact-SHA Preview. It does not authorize a
Production promotion, indexing launch, DNS or redirect changes, legacy guide
migration, Vercel Firewall changes, or Runtime Cache deletion. The internal
`/kr/seoul/tools/rent-check/` proof remains `noindex, follow`, unlinked from the
public P1 and outside the sitemap.

Public P1 reads only a verified, versioned summary artifact. Never put the MOLIT
service key, provider endpoint, raw rows, cache contents or rights evidence in
`SIGNEDPRICE_PUBLIC_SUMMARY_ARTIFACT`.

## 1. Candidate and deterministic gates

From a clean checkout of the candidate SHA:

```bash
git status --short
cd v2
pnpm install --frozen-lockfile
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm check:rent-client-boundary
pnpm exec playwright test --list
pnpm e2e --project=desktop-chromium --project=mobile-chromium
cd ..
node scripts/v2-migration/verify-phase-0.cjs
git diff --check
```

Acceptance:

- every automated row in `artifacts/public-p1/workbook-qa.json` passes;
- the missing-feed build succeeds with `/sitemap.xml` empty and the three public
  P1 pages unavailable rather than populated with zeros;
- fixture browser gates cover desktop 1366×768 and mobile 390×844, quote typing
  causes zero requests, and all measured controls are at least 44px;
- SG/AE overview and intent paths return the custom 404;
- browser assets contain no source endpoint, credential, raw-provider or rights
  evidence marker; and
- Phase 0 reports the exact approved legacy baseline with no new failure class.

## 2. Verified public-summary feed

The Preview requires both server-only values:

- `SIGNEDPRICE_PUBLIC_SUMMARY_ARTIFACT`: exact JSON matching
  `signedprice-public-summary-v2`;
- `SIGNEDPRICE_PUBLIC_SUMMARY_PERIOD`: the artifact provenance period, exactly
  `YYYY-MM/YYYY-MM`.

The artifact must come from the reviewed normalization and public-summary job.
It must contain only public summary objects and aggregate provenance. Missing,
malformed, incomplete, wrong-version, wrong-period or duplicate input fails
closed. Do not copy the deterministic Playwright fixture into Vercel.

Check presence without printing either value. Any change requires a new exact-SHA
deployment. Record the artifact job ID, digest, period, generated instant,
candidate SHA and deployment ID.

## 3. Indexing cohort

The code contract is:

| Cohort | Robots | Canonical | Sitemap |
| --- | --- | --- | --- |
| Published `/kr/` | `index, follow` | `https://signedprice.com/kr/` | yes |
| Published `/kr/check/seoul/` | `index, follow` | exact self URL | yes |
| Published `/kr/seoul/` | `index, follow` | exact self URL | yes |
| Any public summary with `n < 5` | `noindex, follow` | none | no |
| Missing or invalid feed | 404 | none | no |
| Internal exact-record proof | `noindex, follow` | none | no |
| Singapore and Dubai public paths | custom 404 | none | no |

Preview protection must still emit an indexing-blocking response header. Do not
remove Vercel Authentication or promote the deployment merely because the
published page metadata is ready for a future Production cohort.

## 4. Manual workbook evidence

The only P1 manual workbook row is QA 5, greyscale rendering. Capture `/kr/`,
`/kr/check/seoul/`, `/kr/seoul/` and a withheld fixture at desktop and 390px
with a greyscale filter. Confirm filled, outlined, hatched and hairline states
remain distinguishable without colour and attach the images to the exact SHA.

Rows marked deferred in the JSON are not silently waived: they belong to future
market switching, multi-contract-type, rankings, migration or map cohorts and
must be reopened before those surfaces are published.

## 5. Protected Preview and stop point

Push the reviewed branch, require both GitHub jobs to pass, and identify one
Vercel Preview whose commit equals the candidate SHA. Verify:

- `/api/status` reports that SHA and `environment: "preview"`;
- Vercel Authentication remains active and the unauthenticated response carries
  an indexing block;
- the verified summary artifact exists without exposing its value;
- built/served public HTML contains the five values and sample count before
  hydration; and
- canonical, sitemap and SG/AE 404 behavior match the table above.

Stop there. The internal Rent Check cache purge and ordered live MOLIT
miss→hit→UI proof remain the separate protected-proof gate. Production,
redirect, DNS, indexing activation and Firewall publication each require a new
explicit authorization.

## 6. Verified Preview artifact evidence

The reviewed generator candidate `e4d06f5f21ad60f3d442f0c167da0a9bc37fdc30`
completed all 700 Seoul coordinates for `2026-01/2026-07` on Preview deployment
`dpl_Fiq68bZSzdu4A88ActsV492UUBFr`. The aggregate contains 13,008 eligible
zero-rent jeonse contracts in the 45–55㎡ band and has SHA-256
`e1e7f8adbe1297b0807232c8e864b5217eb4cd79e8860c012da50054f012eb72`.

Both server-only values are installed as Config variables for Preview and the
exact `codex/signedprice-seoul-rent-check-v2` branch. The artifact-backed
deployment `dpl_GaB1Z7sRsbNpSQCdiN4iZsUvRGoF` returned 200 for all three Korea
public routes, served the same sample count in initial HTML, emitted canonical
metadata, and included only those public pages in the sitemap. No Production
environment value, deployment promotion, DNS, redirect, indexing, Firewall or
Runtime Cache mutation was performed.
