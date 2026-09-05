# SignedPrice enrichment database activation plan

**Goal:** Make the existing Seoul/Singapore building enrichment flows produce durable, reviewable database data and show it on production pages while preserving the compressed snapshot fallback and leaving Dubai untouched.

**Scope:** Only files under `v2/`. The existing property identity seed remains the source of truth for 48,999 Seoul estates, 3,862 Singapore private projects, and 10,011 Singapore HDB blocks.

## Task 1: Stop photo discovery starvation and expose useful run results

1. Add failing unit tests for case-insensitive address matching, per-market selection, and exclusion of previously attempted candidates.
2. Add a `building_enrichment_attempts` migration and extend the schema contract test.
3. Record Wikimedia and Google lookup outcomes with a retry time so one failed building cannot occupy every run.
4. Select Seoul and Singapore independently, and rank Singapore private projects before HDB blocks for Commons discovery.
5. Return safe checked/candidate/skipped counts from the protected enrichment route.
6. Run the focused photo/enrichment tests.

## Task 2: Persist and serve proximity data through Postgres

1. Add failing tests for reading Seoul proximity rows from `nearby_places` and using them when no installed compressed artifact is active.
2. Add a database proximity repository keyed by the canonical Seoul building id.
3. Add an idempotent artifact publisher that replaces one building's school/station rows only after a fully validated artifact is available and records an ingestion run.
4. Prefer the validated database projection on the Seoul detail page; retain the installed compressed artifact as the fallback.
5. Keep coordinate status pending unless the validated source provides coordinates.
6. Run proximity repository, route composition, and projection tests.

## Task 3: Batch official building facts into the existing cache

1. Add failing tests for a protected Seoul-only enrichment worker that selects buildings without cached facts.
2. Reuse the current official K-apt/building-register loader and `building_facts` store.
3. Record success, unavailable reason, and retry time in the enrichment-attempt table.
4. Keep the existing on-demand building-facts route as a fallback.
5. Run the official facts store/route/enrichment tests.

## Task 4: Activate production inputs and collect reviewable photos

1. Deploy the schema/code changes to the signedprice Vercel project.
2. Configure the production official-data and Google inputs without printing secret values. If Vercel's existing secret values cannot be read or shared, finish all code and identify only the exact variable values that must be supplied or rotated.
3. Run the photo collector separately for Seoul and Singapore until it advances beyond the previous targets.
4. Review exact-subject Wikimedia candidates and approve only licensed building-exterior images with complete attribution.
5. Publish approved Seoul photos into the public entity projection.

## Task 5: Verify and ship

1. Run lint, typecheck, focused tests, full tests, and build.
2. Re-run the property seed against the test database twice and verify counts and both digests remain unchanged; verify Dubai rows are unchanged.
3. Apply and verify the same state on Neon main.
4. Commit the `v2/`-only changes, merge them into `main`, and let Vercel deploy production.
5. Verify representative Seoul and Singapore pages, photo rendering, official facts/proximity states, and unchanged Dubai behavior.

## Follow-on database projection

After enrichment is active, project source releases and observation metadata into `evidence_releases`, `source_records`, `observations`, and `transactions` in a separate migration. Keep the installed compressed artifacts as the read fallback until row counts and digests match for every dataset.
