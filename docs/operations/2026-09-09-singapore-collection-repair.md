# Singapore collection repair — 2026-09-09

## Problem and changes
URA private rental responses include numeric rent, areaSqft, NA bedrooms and open-ended square-metre bands. The former parser rejected these legitimate responses. The collector now accepts and validates those forms, retains unknown bedrooms as null, and stores reported area ranges without presenting their midpoint as exact area.

Anonymous URA rows now use stable content identities and occurrence numbers that survive provider reordering and the appearance of an identical contract. Complete month scopes reconcile active observations only after every batch writes successfully. Previous source records remain as history; this prevents overlap with the legacy positional-key sale seed. Reconciliation also includes entity identity, so later rental-to-sale project linking cannot leave two active copies. Rentals reuse existing private sale project IDs only on a unique normalized project/street/district match.

Building-register lookups now distinguish unresolved addresses, unavailable providers, empty results, ambiguous matches and invalid records. Logs contain a service pathname and sanitized status/code only, never credentials or provider messages. This adds diagnosis; it does not establish that Seoul building-register authorization is repaired.

## Real-response verification
All four sale batches and rental quarters 26q2 and 26q3 were retrieved through the existing production URA proxy. Successful proxy payloads were wrapped as parser envelopes for replay; this is not a direct authenticated cron canary.

An isolated Neon branch, br-divine-lab-b3h2rivw, was created from production main. Replay used the normal collector and persistence repository:

| Dataset | Received | First insert | Repeat insert/update | Scope |
| --- | ---: | ---: | --- | --- |
| Private sale | 1,352 | 1,352 | 0 / 0 | August–September 2026 |
| Private rent | 34,326 | 34,326 | 0 / 0 | Q2–Q3 2026 |

Rent records actually cover April–July; the latest fetched quarter is incomplete as of collection. 32,049 rent observations link to existing sale projects; 2,277 retain separate project identities. No rental row claims an exact property area. Sale reconciliation retired 1,028 August positional-key observations, retaining their history. Active sale count is 134,266; active rent count is 34,326.

Full local suite: 2,912 passed, 72 skipped. Lint: no errors, 10 existing unrelated warnings. Typecheck passed. Production build and external release verification are tracked separately.

## Operational boundary
The September 8 skipped Singapore run predates a documented update enabling both Singapore jobs in Vercel production. That historical row is not proof of the current configuration. The existing schedule is sale Tuesday/Friday and rent monthly on the 16th; a successful authenticated provider-to-database cron run remains to be verified.

Explore and Check currently consume installed snapshots. Collection into the unified database does not itself publish new page evidence. Snapshot release requires the existing evidence and release gates.

Replay utility: v2/apps/web/scripts/verify-singapore-collection.mts. Default parses only; --apply requires an explicit DATABASE_URL. Provider payloads and credentials are not committed.
