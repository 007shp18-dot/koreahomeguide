# Media pipeline reconciliation

This release replaces per-image progress reporting with a canonical-entity inventory and scheduled reconciliation. It does not claim new photo supply or full coordinate coverage.

## Baseline

73,461 canonical entities: Seoul 58,723 estates; Singapore 4,727 projects and 10,011 blocks. Dubai uses a separate regional dataset; Tokyo publishes anonymous area transactions. Neither is counted as a zero-percent building-photo market.

Every entity has exactly one photo stage. The baseline JSON preserves before/after results. Source rows and photo candidates are not the denominator. Publication counts require an approved, visually reviewed, rights-allowed legacy photo and its matching public entity media record; they are not live URL checks.

- Seoul: 808 entities have no legacy building link; 37,160 have rights-blocked candidates; 20,400 have incomplete discovery; 331 have provider errors.
- Singapore: 865 projects have no legacy building link; 3,182 projects/blocks have rights-blocked candidates; 10,607 have incomplete discovery.
- Coordinates remain 1,324 Seoul and 3,403 Singapore. The Singapore block population has no coordinates in this canonical store. Heuristic nearby datasets are not promoted to verified locations.
- Exact ID plus exact name lookup found no safe existing building records to repair the missing legacy links. Address/identity source ingestion is required; fuzzy matching is not a repair.

## Structural changes

The authenticated operations dashboard and photo coverage API expose mutually exclusive photo stages, counts, next actions, coordinates held, and rights-allowed published coordinates. Queries aggregate once per source/entity and do not join transaction rows into photo counts. No full inventory is sent to public pages.

Coverage reconciliation no longer waits for the paused NAVER pipeline, nor treats unlicensed search results as an actionable visual review. It waits for both supported Google/Commons attempts and excludes usable pending candidates before recording no approved result. Approval and rights checks are preserved.

An hourly authenticated media-only publication job runs at minute 57, after the existing discovery jobs. It reconciles revoked approvals, projects all approved photos, then drains changed coverage rows in batches of 300 (at most 40 batches, 20-second loop budget). A full batch at the budget is reported incomplete and the next run resumes through the changed-row filter. The nightly location/proximity job remains separate. API request and spending caps are unchanged.

The initial bulk reconciliation cleared all three approved-but-unprojected entity records (Seoul 1, Singapore 2), and reconciled nine coverage states blocked by the old conditions. These are reconciliation effects, not newly sourced photographs. Remaining approval publication backlog was zero at verification.

## Remaining supply work

Rights-blocked discovery rows require independent reuse permission or replacement supply. Increasing a crawl limit will not make them publishable. Building links require authoritative source ingestion. Coordinate coverage needs verified addresses/IDs and source rights, including the independent HDB/OneMap work. These unresolved populations stay visible rather than becoming artificial photo/coordinate successes.
