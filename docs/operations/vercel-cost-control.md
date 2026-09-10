# Vercel cost control

## Baseline

The September 2026 billing snapshot showed $20 of included credit consumed and $85.38 in on-demand charges with 14 days left in the cycle. The largest line items were Build CPU Minutes ($47.46), Observability Events ($19.38), Fluid Active CPU ($14.69), and ISR Writes ($7.01).

The deployment audit found at least 200 recent SignedPrice deployments and 200 legacy KoreaHomeGuide deployments in the newest paginated sample. A SignedPrice production build took about four minutes, generated about 2,994 static pages, and uploaded a 523 MB build cache. The legacy redirect build took about three seconds and uploaded a 4.92 MB cache.

## Controls implemented in the repository

### SignedPrice Git deployments

`v2/apps/web/vercel.json` calls `scripts/release/ignore-build.mjs` as its Ignored Build Step.

- Production and `main` always continue to build.
- Routine non-main pushes skip the hosted Vercel Preview build.
- Add `[vercel-preview]` to a commit message when a hosted preview is specifically required.
- Missing Vercel Git metadata fails open and permits a manual or bootstrap build.

GitHub Actions remains the required verification path. It installs dependencies, runs lint, type checking, unit tests, the production build, the complete browser matrix, and the isolated map interaction tests without sending the full suite through a hosted Vercel deployment.

### KoreaHomeGuide redirects

The root `vercel.json` sets `git.deploymentEnabled` to `false`. The last READY deployment continues serving the existing redirects. When redirect rules change, run a deliberate manual production deployment from the repository root, verify the old URLs, and leave automatic Git deployments disabled.

### Background schedules

The enrichment, approved-media projection, and photo-source recovery jobs run every six hours instead of every hour. Transaction, news, OneMap, Japan's 23-ward rotation, and scheduled editorial publication frequencies remain unchanged because they have stronger freshness requirements.

The original configuration generated about 258 scheduled requests per day. This first pass removes 100 idle polling opportunities per day, reducing the configured total to about 158 per day without delaying transactions, Japan's ward rotation, daily news collection, or 15-minute scheduled editorial publication.

### Singapore ISR

English and Korean Singapore overview, Explore, project, Check, and Rankings pages use a one-hour fallback revalidation window instead of one minute. Successful Singapore data publication already calls `revalidatePath`, so newly approved source data still invalidates the affected pages immediately.

Do not disable caching to avoid Runtime Cache charges. Longer TTLs and targeted invalidation reduce ISR writes, active CPU, origin transfer, and database reads together.

## Vercel dashboard verification

After the first production deployment containing these controls:

1. Open **Project → Settings → Git** for SignedPrice.
2. Confirm the Ignored Build Step resolves to the repository command from `v2/apps/web/vercel.json`. Remove any stale dashboard override such as `exit 1` if the dashboard reports that it supersedes the repository value.
3. Open the KoreaHomeGuide project and confirm automatic Git deployments are disabled. Do not delete the current READY deployment or its domains.
4. Push a normal test commit to a feature branch. SignedPrice should report the deployment as skipped and KoreaHomeGuide should not create a deployment.
5. Use a commit containing `[vercel-preview]` only when a hosted preview URL is required.
6. Confirm a merge to `main` still creates exactly one SignedPrice production deployment.

## Monthly review

Check **Team → Usage → Billing** weekly and record:

- Build CPU Minutes
- Observability Events
- Fluid Active CPU and Provisioned Memory
- ISR Writes
- Runtime Cache reads and writes
- Production and preview deployment counts

Compare equal-length periods. Do not project savings from a development burst across a full month. If Build CPU remains dominant after preview gating, the next change is to pre-render only high-traffic building pages and generate the long tail on demand. That change requires a separate SEO and sitemap regression review.

If Observability Events remain high, inspect request sources before reducing monitoring. Keep Web Analytics; its baseline charge was only $0.56. Prefer removing repetitive success logs and limiting hosted smoke tests over disabling error visibility.
