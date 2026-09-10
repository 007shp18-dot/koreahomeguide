# Unified release and publication

## Code release

The coordinator is `.github/workflows/unified-release.yml`, scheduled daily at 09:00 UTC (18:00 Korea) and manually dispatchable for urgent changes. GitHub schedules are best-effort, not an exact-time SLA.

Work in same-repository PRs. After review, apply `release-ready`. The coordinator selects only open, non-draft PRs with successful latest `verify` and no pending or failed checks. It merges them locally, leaves conflicts queued, and runs the combined lint, types, tests, memory check, production build, boundary checks, legacy gate and browser suite. On failure nothing is pushed to main. Before pushing it checks PR heads/labels and the original main SHA again. A normal fast-forward push rejects races. Runtime changes already on main since the previous release marker are included even when no new PR is selected. Concurrency serializes coordinators.

Production Vercel builds require `[release]` at the beginning of the final commit subject. Preview builds require `[preview]`. Other pushes are held. A requested release with only documentation/tests skips the Vercel build; runtime dependencies and data are included. Diff uses the last Vercel deployment SHA, not the marker commit's empty diff. Markers are workflow conventions, not access control. Maintainers can still explicitly bypass them; protect main using repository settings where supported. Do not force-push or bypass required checks if GitHub rejects a coordinator push.

Initial installation is a single `[release]` bootstrap merge. After installation, use the coordinator; do not individually merge and deploy each task. Vercel's Git integration remains the deploy transport, so no additional deploy token is embedded in the repository. GitHub's built-in token has contents write only in the release job; validation steps do not receive that token and checkout does not persist credentials. Publishing script is copied from the trusted base before merging candidate changes.

The GitHub job summary lists selected and blocked PRs. A pushed main commit is not a successful deployment: verify Vercel READY and representative public routes. Vercel preserves the previous deployment on build failure. A code rollback does not roll back DB writes. This workflow's first scheduled run and any account-level branch permission restrictions must be checked after installation.

## Editorial publishing

`admin/evidence` → 배포·기사 발행 provides draft, review-complete scheduling, cancellation, due-item processing and failure history. It supports new news/data-story articles in English, Korean and Chinese. Existing compiled portfolio articles and published article revisions remain on their existing editing workflow; this release does not silently migrate or overwrite them. The global/other-city option covers content outside the three market IDs currently supported by the content schema.

Scheduling validates the existing bounded article contract and requires a reviewer and source evidence (the UI requires a primary source). Drafts never appear publicly. Reservation versions reject stale edits. Scheduled items are processed every 15 minutes after their due time, or explicitly from the authenticated admin panel. Failed publication requires review/rescheduling; expired worker leases and pending cache refreshes can recover automatically. Save article, source metadata and source links atomically in a DB transaction. Cache refresh follows persistence, with an outbox state for retries. Published items are immutable in this first queue interface.

Public `/news/` and localized equivalents merge verified published database articles with the established portfolio. New article routes resolve from the database without generateStaticParams changes. A slug lookup queries that slug directly, not just the newest 200 records. Listing is currently bounded at 200 per locale; the editorial sitemap has the same bound and needs pagination before that volume is exceeded. `/editorial-sitemap.xml` is advertised in robots.txt and refreshed on publication. No site rebuild is triggered by these actions.

Use Markdown for articles. Images continue to follow the existing renderer and photo permissions; this does not create a new image ingestion or matching system. Draft content payloads are fetched on demand; the queue list excludes article bodies.

## Data operations

Existing collection schedules and the authenticated 정기 수집 운영 panel remain the authority for source-specific freshness, pending review and failures. Collection writes to DB independently of code deployment. Publishing approved data must use the existing source-specific publishers; raw collection completion is not approval. The new system does not bypass photo identity/rights checks. Full incremental photo inventory optimization and cost measurements remain tracked in #282; do not mark those items complete based on this release.

## Cost accounting

No-change code queue exits before installing dependencies or building. Normal task pushes no longer request Vercel Preview builds. Required verification runs in Actions, and Vercel performs one final production build; these are separate services/costs. No claim of zero build cost, guaranteed savings, or automatic observability plan changes. Compare future Build CPU Minutes, deployment count and total platform costs to the #282 baseline.
