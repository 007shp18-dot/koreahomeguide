# Tool research maintenance and collection priorities

The existing daily `/api/internal/tool-research-expiry/` job (00:43 UTC) now deletes expired submissions, evaluates the current consented market/tool aggregate, then stores its successful check time in migration 0023's `tool_research_maintenance` singleton. An aggregate/query failure returns 503 and does not advance the success marker. The existing cron bearer authorization is unchanged.

Only the job timestamp is stored. No historical contribution counts, individual hashes or copied submission payloads are retained by this maintenance feature. Owner withdrawal continues to physically delete submissions. All dashboard groups, distributions, recent entries and collection priorities query current rows; expired, future-dated, wrong-purpose or wrong-consent-version records are excluded at read time. The maximum window remains 90 days. The daily marker is a job-health signal, not a cache of consented audience counts.

The existing private Tool research panel now shows:

- Direct market-specific share count.
- Cross-city passport comparison count separately; it is never reported as direct market demand.
- Shares with 0–4 supporting observations, counted once per share per market even if multiple comparison fields are low.
- Approved and currently qualified evidence, incomplete evidence, outdated evidence, duplicate candidates and pending-review counts from the existing evidence-pool classifier.
- Current read time and last successful daily aggregate check time.

Ordering is explicit: direct share count descending, then low-evidence share count descending, then incomplete plus outdated evidence count descending. Market ID is only a deterministic tie-breaker. There is no opaque priority score. These are shared scenarios, not unique users or all Tool traffic. Evidence counts cover the review pool, not every record in the official transaction database. Pending review can overlap with quality classifications; the UI warns against adding overlapping columns.

Validation: PostgreSQL/PGlite integration tests cover live withdrawal after a completed daily check, expired and future submission exclusion, no retained counts in the maintenance table, evidence quality/rejection behavior, and passport low-evidence attribution to the correct city. Cron tests cover authorization and failure ordering. Production migration and deployment must complete before this functionality is reported as live.
