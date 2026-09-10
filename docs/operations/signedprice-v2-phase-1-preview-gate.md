# signedprice V2 Phase 1 Preview gate

## Authorization boundary

The Phase 1 Preview must use a **separate Vercel project** whose repository
Root Directory is exactly `v2/apps/web`. The branch stays Draft and unmerged
until the visible Preview is reviewed and approved.

This gate does not authorize any of the following:

- a Production deployment or promotion;
- attaching `signedprice.com` or any other custom domain;
- a DNS change;
- a change to the legacy KoreaHomeGuide Vercel project;
- merging the branch to `main`; or
- adding migration redirects.

Stop and obtain explicit approval before any remote project creation,
deployment, domain, Production, DNS, merge, or redirect action.

## Local code gate

Run from a clean checkout of the exact candidate commit:

```bash
cd v2
pnpm install --frozen-lockfile
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm e2e tests/e2e/visible-foundation.spec.ts
cd ..
node scripts/v2-migration/verify-phase-0.cjs
git diff --check
```

The E2E command builds and starts the local Next production server
automatically. It requires an already-installed Playwright Chromium runtime;
browser installation is a separate, explicitly authorized action.

Local acceptance requires:

- [ ] Frozen-lockfile installation succeeds.
- [ ] V2 lint, typecheck, unit tests, and production build pass.
- [ ] Desktop and mobile Playwright projects pass.
- [ ] The 1366×768 homepage exposes all three market cards in the first viewport.
- [ ] All public routes have no page-level horizontal overflow.
- [ ] Phase 0 reports `ok: true`, `890` tests, `867` pass, and the approved `23` legacy failures.
- [ ] `git diff --check` passes.
- [ ] The exact candidate commit and gate output are recorded.

## Preview project configuration

After explicit approval to create the remote Preview:

- [ ] Create or select a Vercel project separate from KoreaHomeGuide.
- [ ] Set Root Directory to exactly `v2/apps/web`.
- [ ] Enable **Include source files outside of the Root Directory in the Build Step**. This is required because `@signedprice/market-core`, `pnpm-workspace.yaml`, and the locked workspace dependencies live above `v2/apps/web`.
- [ ] Before deployment, verify and record both the exact Root Directory and the enabled outside-source setting in the candidate evidence.
- [ ] From the candidate checkout, run `pnpm --dir v2/apps/web install --frozen-lockfile` and `pnpm --dir v2/apps/web build` to verify the app resolves its workspace dependency from that project root.
- [ ] Deploy only the approved Draft branch commit as a Preview.
- [ ] Do not promote it to Production.
- [ ] Do not attach a custom domain or change DNS.
- [ ] Do not alter the legacy Vercel project or its settings.
- [ ] Record the Preview URL, candidate commit, and Vercel deployment identifier.

## Preview verification checklist

Run the same two-project contract against the exact Preview URL and candidate
commit:

```bash
cd v2
PLAYWRIGHT_BASE_URL='https://PREVIEW_HOST' \
PLAYWRIGHT_EXPECTED_COMMIT_SHA='CANDIDATE_GIT_SHA' \
PLAYWRIGHT_EXPECTED_ENVIRONMENT='preview' \
pnpm e2e tests/e2e/visible-foundation.spec.ts \
  --project=desktop-chromium \
  --project=mobile-chromium
```

When `PLAYWRIGHT_BASE_URL` is present, Playwright does not build or start a
local server. The expected commit and environment inputs are mandatory so the
deployed `/api/status` identity is checked against the reviewed candidate.

- [ ] Deployment reaches `READY` with zero build errors.
- [ ] `GET /api/status` returns only `brand`, `commit`, `environment`, `markets`, and `indexing`.
- [ ] Status reports `brand: signedprice`, the deployed commit, Preview environment, the three approved markets, and `indexing: blocked`.
- [ ] `/`, `/kr/seoul/`, `/sg/singapore/`, `/ae/dubai/`, and `/compare/` return `200` in desktop and mobile passes.
- [ ] All nine `/rent/`, `/buy/`, and `/invest/` routes return `200`.
- [ ] Unknown market and intent paths return the custom `404`.
- [ ] Every HTML route emits `noindex,follow` and no canonical or hreflang.
- [ ] Home → Seoul → Compare markets works with keyboard/mouse and touch-sized navigation.
- [ ] The 1366×768 homepage exposes all three market cards in the first viewport.
- [ ] No checked route has page-level horizontal overflow on desktop or mobile.
- [ ] Preview logs show zero observed `5xx` responses during verification.
- [ ] Seoul is labelled Full product; Singapore and Dubai are labelled Market intelligence.
- [ ] No fake prices, yields, taxes, transactions, inventory, partners, or unsupported claims appear.
- [ ] The branch remains Draft and unmerged after evidence is recorded.

Preview verification is evidence for review, not authorization to launch.
