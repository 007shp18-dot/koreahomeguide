# Passport candidate journey — 7 September 2026

User-approved continuation after the readable property charts release (#189).

## Scope

- Seoul candidates now use published apartment-building, all-size sale medians.
  Withheld cohorts and other housing types are excluded. The checked-in snapshot
  contains 2,157 qualifying buildings, covering February–August 2026.
- Singapore retains published projects; Dubai retains Ready apartment area
  medians. Each candidate states its aggregation level, count and evidence period.
  These are research candidates, with no claim of available inventory.
- Three candidates per city per page; changing the comparison resets the page.
  Detail links retain the Korean Seoul route. English-only detail destinations
  are labelled in Korean/Chinese flows.
- Cost scenarios start at the selected median in the city's native currency.
  Users can return to the evidence or their original Passport budget, currency
  and language. Optional Passport links accept only local supported paths and
  the budget/currency query fields.
- Existing dated reference exchange rates, budget limits and user-entered
  acquisition/rental assumptions remain the calculation basis.

## Verification

- 25 targeted unit/render tests passed, including publication thresholds,
  all three language/market handoffs, bounded initial pagination and rejected
  malformed Passport return URLs.
- Local app typecheck and lint passed. Production build and remote full CI
  are release gates; their final state is recorded in the release PR.
- Browser regression covers a fixture-backed Singapore candidate → SGD scenario →
  original USD Passport budget journey. The shared Passport browser fixture has three Singapore projects and no Seoul
  sale repository, so pagination navigation is not exercised by that fixture.
- The existing Sites preview could not run this monorepo; no claim of manual
  cloud-browser visual approval. Automated browser results and actual deployment
  state must be checked before claiming release completion.

## Next

Save candidate and scenario assumptions, then compare compatible evidence types,
areas and periods. Dubai project-level evidence and real partner sourcing remain
separate work; this release does not create either.
