# SignedPrice product roadmap

Updated 2026-09-06. Current user-approved order supersedes the August preview-only plan.

## Product direction

Build a property research service that can grow into cross-border investment support and licensed brokerage: research → shortlist → due diligence → professional connection → purchase → ownership and resale.

## Release now: shared foundation, Seoul/Singapore and Dubai research

- Preserve the existing SignedPrice typography, white/navy surfaces, restrained blue actions, and common control sizes.
- One primary navigation order: Markets, Prices, News, Guides. Market navigation stays separate. One footer with product, market and company columns.
- Explore uses a short page title and separate market/period context. Keep the same workspace frame across Seoul, Singapore and Dubai.
- EN/KO/中文 controls retain their positions. Link only actual translations or an explicitly available language destination; unavailable translations remain labelled. Preserve Seoul search/selection in available translated routes; use published translation groups for articles.
- Prices covers Seoul and Singapore transaction search, with Dubai clearly labelled area research. No fixed Seoul jeonse sample on the global page.
- Current News is the destination for local news links. External headlines cover all three markets with publisher and publication date.
- Prefer stored headlines for response speed; refresh collection after the response. Retain source freshness and explicit unavailable states.
- Dubai release: government annual/quarterly market releases, a selected-area directory/map, official project and service-charge checks, AED user-assumption calculator, news. It does not include individual transaction prices, active listings or brokerage.
- Verify desktop, mobile, tablet and wide layouts, navigation, selection, language links, price search and calculator before release.

Implementation and validation evidence: `docs/operations/2026-09-06-shared-navigation-dubai.md`. A commit or preview alone does not establish production completion.

## Sitewide benchmark, applied without changing the brand

Reference: Dubai Real Estate Data `/projects`, `/market`, `/areas`, `/compare` and `/methodology` (inspected 2026-09-06). Adopt its short headings, adjacent period/source context, aligned search and filters, result counts, compact comparison tables and chart-to-exact-data drill-down. Keep SignedPrice photography, typography and restrained blue links; do not copy its ticker, navigation sprawl, prose or datasets.

This release applies the shared heading to Markets, Prices, News, Guides and Dubai; flattens repeated hub cards; adds city-filtered Guides and monthly chart period controls; links home evidence to sources. Existing Explore list/map selection remains the central discovery flow. Later property comparison must use matching sale types, areas and periods, with currencies kept explicit.

## Next: deepen evidence and help readers keep a shortlist

1. Close remaining Seoul/Singapore address, coordinate and approved exact-building photo gaps. Extend Seoul monthly transaction history beyond the currently exposed recent observations. Track refresh dates and coverage explicitly.
2. Save properties, compare compatible properties side by side, retain user-entered cost scenarios. Start with a clearly described personal shortlist; add account sync and alerts only with corresponding controls.
3. Improve Korean/English/Chinese route coverage and substantive guides. Keep translated articles in matched groups. Measure search impressions, indexed useful pages, visits and successful detail journeys toward the user's monthly 100,000-PV goal.
4. Dubai transaction expansion requires an actual source agreement/display scope, source adapter, verified records, entity/coordinate mapping and sufficient comparable cohorts. A government press-release chart is not a substitute for property-level evidence.
5. Japan follows the current shared foundation and Dubai stage. Validate the initial city, official source coverage, currency/area conventions and foreign-buyer workflow before expanding routes.

## Professional services

- Verified partner profiles and scoped inquiry handoff, with the user's consent before sending property or personal information.
- Local brokerage, tax/legal and financing/remittance support connected to a documented due-diligence workflow.
- Purchase milestones, ownership costs, rental management and eventual resale support.
- Display actual people, qualifications and review history only when verified. Never fabricate authors, reviewers, inventory, returns or completion claims.

## Definition of done

A feature works from its public entry point through selection and detail, respects actual data availability, uses shared design rules, and has verified release evidence. Keep implemented, preview-verified and production-verified status distinct. Do not reopen the deprecated Search this map or decorative legend features without a demonstrated user need.
