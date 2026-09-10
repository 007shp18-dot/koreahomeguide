# SignedPrice shared release policy

- All implementation tasks prepare a branch and PR. Do not merge or deploy each task independently.
- Mark a same-repository PR `release-ready` only after review and the required checks succeed. The Unified production release workflow collects these PRs daily at 09:00 UTC (18:00 Asia/Seoul), with manual dispatch for urgent validated changes. Schedule timing is best-effort.
- The workflow validates the combined changes before a single normal push to main. Conflicts and incomplete checks stay queued. Never force push main or bypass branch protection.
- Repository-managed Vercel build exclusions are disabled at the user's request pending redesign. Commit markers do not control build eligibility. Reserve `[release]` for the release coordinator and emergency recovery as an operational convention.
- Data and editorial publishing use the authenticated DB workflows and targeted cache refresh, not source commits or redeployments.
- Preserve required CI and representative browser gates.
- Report code merged and production READY separately. Failed builds preserve the last good deployment. Do not roll back DB content with a code rollback.
- User instructions override this policy. Existing authorization does not require a new permission prompt, but apply this release batching policy to the execution.
