# Code deployment and publication

## Code deployment

The daily unified code release workflow and its queue/publish scripts were removed at the user's request. Code changes can be merged individually after the applicable GitHub checks; there is no daily batch or `release-ready` label requirement. Vercel's Git integration handles production deployment from `main`. No new deploy token is required.

Repository-managed cost controls prevent routine feature-branch commits from starting a four-minute SignedPrice build. Production and `main` always build. A hosted preview is opt-in: include `[vercel-preview]` in the commit message. The complete build and browser release gate continues to run inside GitHub Actions for every applicable pull request. The legacy KoreaHomeGuide redirect project keeps its last READY deployment and has automatic Git deployments disabled; deploy it manually only when its root redirect configuration changes.

Report GitHub merge and Vercel READY separately. A code rollback does not roll back database content. Existing CI workflows and branch protections remain in effect.

## Editorial publishing

`admin/evidence` → 배포·기사 발행 provides draft, review-complete scheduling, cancellation, due-item processing and failure history. It supports new news/data-story articles in English, Korean and Chinese. Existing compiled portfolio articles and published article revisions remain on their existing editing workflow; this release does not silently migrate or overwrite them. The global/other-city option covers content outside the three market IDs currently supported by the content schema.

Scheduling validates the existing bounded article contract and requires a reviewer and source evidence (the UI requires a primary source). Drafts never appear publicly. Reservation versions reject stale edits. Scheduled items are processed every 15 minutes after their due time, or explicitly from the authenticated admin panel. Failed publication requires review/rescheduling; expired worker leases and pending cache refreshes can recover automatically. Save article, source metadata and source links atomically in a DB transaction. Cache refresh follows persistence, with an outbox state for retries. Published items are immutable in this first queue interface.

Public `/news/` and localized equivalents merge verified published database articles with the established portfolio. New article routes resolve from the database without generateStaticParams changes. A slug lookup queries that slug directly, not just the newest 200 records. Listing is currently bounded at 200 per locale; the editorial sitemap has the same bound and needs pagination before that volume is exceeded. `/editorial-sitemap.xml` is advertised in robots.txt and refreshed on publication. No site rebuild is triggered by these actions.

Use Markdown for articles. Images continue to follow the existing renderer and photo permissions; this does not create a new image ingestion or matching system. Draft content payloads are fetched on demand; the queue list excludes article bodies.

## Data operations

Existing collection schedules and the authenticated 정기 수집 운영 panel remain the authority for source-specific freshness, pending review and failures. Collection writes to DB independently of code deployment. Publishing approved data must use the existing source-specific publishers; raw collection completion is not approval. The new system does not bypass photo identity/rights checks. Full incremental photo inventory optimization and cost measurements remain tracked in #282; do not mark those items complete based on this release.

## Cost accounting

Required verification runs in Actions; Vercel builds are a separate service/cost. Routine branch pushes no longer request Vercel Preview builds. Compare future Build CPU Minutes, Observability Events, Fluid Active CPU, ISR Writes, deployment count and total platform costs to the September 2026 baseline documented in `vercel-cost-control.md`.
