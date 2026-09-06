# Dubai Area Decision Tools Design

**Date:** 2026-09-06

**Status:** Approved product direction. The operator authorized inclusion of real aggregates in the public PR for noncommercial use. Live display and indexing remain separate release decisions.

## Goal

Turn the uploaded Dubai Land Department transaction and rent exports into an area-level investment research flow without implying that SignedPrice has building, unit, parcel, listing, or ownership-history data.

The first visible journey is:

1. compare publishable Dubai areas in Explore;
2. open a durable, indexable area evidence page;
3. check an asking price and user-supplied rent against that area's released evidence.

This is the roadmap's Dubai evidence-depth slice. Accounts, saved shortlists, alerts, automated news, and project detail stay outside this release.

## Product boundaries

- Preserve the existing SignedPrice header, footer, typography, colors, and `MarketExploreShell` geometry.
- Use `AREA_EN` as an area label only. Never describe an area result as a property, building, unit, listing, or complete market inventory.
- Do not publish raw transaction or rent rows.
- Do not use the one-row project export in navigation, search, or public detail.
- Keep land and valuation inputs out of the visible information architecture. They may later support freehold or confidence annotations after their identity and rights boundaries are validated.
- Treat the sale period and rent period separately. A combined ratio must show both source periods.
- A ratio of an area rent median to an area sale median is an **estimated gross rent-to-price ratio**, not a forecast or net return. It excludes service charges, vacancy, financing, taxes, acquisition costs, repairs, and management.
- Off-plan rows do not publish a yield. An unfinished home must not be presented as currently earning rent.

## Rights release gate

The operator clarified on 2026-09-06 that SignedPrice's current use is noncommercial and explicitly authorized including the real aggregate in public GitHub PR #167. Record that instruction as an owner declaration, not as a DLD licence grant or completed source/unit review. Commercial permission is not a mandatory requirement for a release approved for noncommercial use.

The release gate requires all of the following:

- an official dataset or licence URL;
- permission to store the source privately;
- permission to create and publicly display derived aggregates for the declared intended use;
- a separate commercial or noncommercial permission matching that intended use (legacy records without a purpose retain the commercial requirement);
- required attribution text;
- a checked date and named reviewer/owner confirmation;
- official confirmation that `TRANS_VALUE` and rent amounts are AED and that `ACTUAL_AREA` is square metres.

The operator's subsequent authorization supersedes the earlier prohibition on committing real derived values to the public repository. Include the draft aggregate, canonical slug registry, and declaration in `apps/web/data/review/`. This directory is not the installed production snapshot path. Pending source review and pending currency-unit verification remain explicit; neither is silently converted into approval. Do not insert this draft into production, link it from public navigation, or include it in the sitemap.

## Data contract

The installed aggregate snapshot uses schema `signedprice-dubai-area-evidence-v1` and contains:

- source digests and independent transaction/rent periods;
- source, qualifying, excluded, and published-area counts;
- a stable slug, DLD Land canonical display spelling, and normalized aliases for each area;
- the version of the append-only canonical-area slug registry used for the release;
- separate Ready and Off-Plan apartment/villa sale summaries;
- separate registered apartment/villa rent summaries;
- comparable area identifiers selected within the same housing segment, sale stage, and comparison period by closest price-per-square-metre;
- a rights policy identifier, explicit storage/derivative/commercial/display/index permissions, attribution, and separate display/index release states.

Each sale-stage summary contains source count, median total price, lower quartile, upper quartile, median AED per square metre, and its lower and upper quartiles.

Each rent summary contains source count, median annual amount, median annual AED per square metre, new-contract share, and renewal share.

## Source filters

### Sale

Include a row only when all of these are true:

- `GROUP_EN = Sales`;
- `USAGE_EN = Residential`;
- apartment: `PROP_TYPE_EN = Unit` and `PROP_SB_TYPE_EN = Flat`;
- villa: `PROP_TYPE_EN = Building` and `PROP_SB_TYPE_EN = Villa`;
- `IS_OFFPLAN_EN` is `Ready` or `Off-Plan`;
- `PROCEDURE_EN` is `Sale`, `Sell - Pre registration`, `Delayed Sell`, or `Sale On Payment Plan`;
- `TRANS_VALUE` is finite and inside the documented publication guardrail;
- `ACTUAL_AREA` is finite and inside the documented publication guardrail;
- area identity resolves without an ambiguous alias.

The initial guardrail is AED 100,000–500,000,000 and 10–1,000 m². Exact duplicate rows are retained because the export has no property-line identifier and some repeated rows may represent multi-property registrations.

### Rent

Include a row only when all of these are true:

- `USAGE_EN = Residential`;
- apartment: `PROP_TYPE_EN = Unit` and `PROP_SUB_TYPE_EN = Flat`;
- villa: `PROP_TYPE_EN = Villa` and `PROP_SUB_TYPE_EN = Villa`;
- `ANNUAL_AMOUNT` is finite and inside the documented publication guardrail;
- `ACTUAL_AREA` is finite and inside the documented publication guardrail;
- `TOTAL_PROPERTIES = 1` for the initial single-unit comparison model;
- `VERSION_EN` is `New` or `Renewed`;
- area identity resolves without an ambiguous alias.

The initial guardrail is AED 5,000–20,000,000 annual rent and 10–1,000 m². Exact duplicate rows are retained for source accounting and are not silently deduplicated.

All displayed comparisons use the last common 90-day window: `asOf = min(max sale date, max rent registration date)` and `asOf - 89 days` through `asOf`, inclusive. Median rent and gross ratio use `VERSION_EN = New`; new and renewed rows remain available for the contract-mix share.

## Area identity and publication gate

Normalization is Unicode NFKC, case-folding, curly-apostrophe/dash normalization, and whitespace collapse. The Land export supplies canonical area names. A transaction alias is approved only when at least three distinct shared projects and 20 transaction rows map it to one canonical Land area with 100% agreement. Projects that occur in multiple Land areas are excluded and fuzzy matching is forbidden. Source label, mapping method, and mapping version stay in the private build report.

An area is public and indexable only when:

- it has at least 30 qualifying new registered-rent rows;
- it has at least 30 qualifying sale rows for at least one displayed stage;
- it has a non-colliding stable slug;
- the release rights state is approved;
- all required amount and area units are verified.

Ready and Off-Plan sample counts are never combined to pass the gate. The audited snapshot is expected to yield 46 canonical area pages and 53 area-by-housing-segment combinations at `n = 30`; the builder's verified output, not that expectation, controls publication.

The first approved release persists a canonical-area-to-slug registry. Later refreshes must reuse existing slugs; newly discovered collisions receive a suffix without changing an existing route.

## Explore

`/ae/dubai/explore/` keeps the shared Explore shell and adds:

- deferred area search;
- Ready / Off-Plan stage control;
- maximum median-price filter;
- minimum estimated gross-yield filter for Ready only;
- result pagination;
- median price, median AED/m², registered sale count, median annual rent, and estimated gross ratio;
- area-level map markers/geocoded labels only;
- a detail link for every indexable area;
- query state in the URL with query-bearing pages marked `noindex, follow`.

The browser receives only the compact aggregate model. It never parses raw CSV and never queries all database observations.

## Area evidence pages

The canonical route is `/ae/dubai/explore/[area]/`.

Each page includes:

- apartment/villa separation and Ready/Off-Plan median price and AED/m² comparison;
- registered annual rent and estimated gross ratio;
- sale and rent sample counts and their distinct periods;
- middle-half price and AED/m² ranges for Check interpretation;
- comparable-area links based on the same housing segment and available sale stage, labelled as comparable rather than geographically nearby;
- a prefilled Dubai Check link;
- DLD attribution, methodology, limitations, and corrections link.

`generateStaticParams`, metadata, and sitemap entries use the same repository publication gate. Unknown, insufficient, pending-rights, and invalid records fail closed.

Titles and descriptions are composed from the actual published segment/stage. Villa-only and Off-Plan-only areas must not claim apartment evidence, Ready evidence, or a published rental yield. The year comes from `asOfDate`, not a hardcoded title.

## Dubai Check

The canonical route is `/ae/dubai/check/`.

Inputs are area, Ready/Off-Plan, asking price, area in square metres, and expected annual rent. The result shows:

- asking price;
- area-stage median price and percentage difference;
- asking AED/m²;
- area-stage median AED/m² and percentage difference;
- user-scenario gross yield;
- whether asking AED/m² is below, within, or above the released middle-half range.

All inputs must be finite, positive decimal values within defensive bounds. Check does not guess rent, service charges, taxes, financing, or a project's completion. Query state is shareable and query-bearing pages are `noindex, follow`. A handoff to the neutral ownership-cost calculator preserves verified area, price, size, market, currency, and return path.

## Storage and serving

- Raw CSV remains outside Git and is never shipped to the browser.
- The live artifact is a compact aggregate gzip snapshot after the release gate. The separately authorized PR review artifact remains draft/noindex outside the installed snapshot registry.
- Neon stores release metadata and aggregate metric observations only; this release does not add raw Dubai rows.
- The checked artifact is the fast, deterministic public read path and sitemap source. Neon is the operational mirror and parity target.
- Any database seed is idempotent and is tested on a temporary branch before production.
- When no approved aggregate release exists, `/ae/dubai/explore/` keeps the current four-area research fallback and no new area/Check links are exposed.

## Verification

- Builder unit tests cover quoted commas/newlines, BOMs, duplicate preservation, source filters, alias ambiguity, quartiles, ratios, and publication gates.
- Repository tests reject digest, schema, rights, period, and unit mismatches.
- Route-model tests cover formatting, comparable selection, and Check links.
- UI tests cover filters, zero matches, stage switching, large-number wrapping, source wording, and absence of property-level claims.
- Route tests cover metadata, canonical URLs, query `noindex`, static params, not-found behavior, and sitemap inclusion.
- Check tests cover valid calculations, invalid inputs, middle-half verdicts, query round trips, and calculator handoff.
- Full unit suite, lint, typecheck, and production build must pass before a PR.
