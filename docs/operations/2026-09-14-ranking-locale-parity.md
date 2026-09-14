# Ranking deduplication, Dubai and language parity

## Implemented

- Seoul/Singapore contract ranking: select the highest/lowest contract per stable property ID within the latest completed source month, then rank and limit to 50 distinct properties. Preserve competition ties and pre-deduplication eligible-contract counts. Do not merge similarly named but distinct properties.
- Regional rental medians continue to use all eligible contracts; their cohort/sample rules are unchanged.
- Dubai: reuse the approved, digest- and period-bound project publication. Rank apartment project medians, explicitly not individual contracts; require 30 sales and keep ready/off-plan separate. Current checked-in publication has 47 eligible off-plan and one ready project. Show the actual result count, never pad to 50. Preserve publication/rights checks and DLD attribution.
- Tokyo: preserve anonymous records; building deduplication would require identities absent from the source.
- English/Korean/Chinese global ranking routes use one server renderer, data queries, controls and table components. Form actions and property links use the active language. Header language links retain safe ranking query fields before hydration, too.
- Per-square-metre ranking is not part of this change.

## Verification

- Window-selection SQL CTEs executed against controlled SQLite records: deduplication before the 50-row limit, ascending/descending representatives, competition ties, latest-month isolation, and market isolation. This tests standard window semantics, not a live PostgreSQL query plan.
- Focused ranking and existing Dubai project tests; full TypeScript checking; targeted three-route Next.js build.
- Local production HTTP smoke checks for the language routes and Dubai stages. The initial stale local build had missing module factories; rebuilding from a separated cache resolved this.
- No production database connection is configured locally. Live Seoul/Singapore database results must be checked in the deployment environment. No database writes or migrations are introduced.
- Cloud Browser cannot access the local address (`ERR_BLOCKED_BY_CLIENT`); browser visual/interactive QA remains pending. Targeted debug build output is for verification only, never deployment.

## Additional language-structure audit (not changed in this PR)

- `/guides/`: English uses EditorialGuides (city tabs/search), Korean uses GuideDirectory (different grouping/default), Chinese uses EditorialPortfolioIndex. Follow up with one shared guide surface, retaining each published translation and avoiding invented translation links.
- `/markets/`: English renders a standalone GlobalProductHub; Korean redirects to its home page. Decide on one shared market overview, then align canonical/hreflang and navigation.
- `/prices/` already uses PricesPage across languages; `/tools/` uses ToolsHub. Shared entry components do not prove every nested detail is translated or visually identical; those require a separate route-level audit.
- Older building-comparison pages remain separate destinations. In particular, a Chinese Seoul building-ranking route is not yet published; the supplemental link still falls back to English.

Preserve the existing design, country-specific data scope and source rights. Do not equate language parity with making different countries' data identical.
