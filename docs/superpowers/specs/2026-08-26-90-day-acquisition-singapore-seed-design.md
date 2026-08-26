# KoreaHomeGuide 90-Day Acquisition and Singapore Seed Design

**Date:** 2026-08-26
**Status:** Approved for implementation planning
**Allocation:** Seoul acquisition proof 80% / Singapore seed work 20%

## 1. Context

KoreaHomeGuide has moved beyond its initial product and stability build. The production site now has a working Rent Check, Explorer, brokerage-fee calculator, seven substantive English guides, 30 English district/property-type market pages, and localized Chinese surfaces. The next constraint is not feature availability or raw page count. It is proving that qualified foreign renters can discover the site, complete a Rent Check, and take a measurable follow-up action.

The site previously experienced excessive crawl discovery with almost no search exposure. The response for this phase is therefore a narrow, evidence-led acquisition system rather than another programmatic page expansion.

Singapore is the first expansion candidate. The likely requested source is Singapore's Urban Redevelopment Authority (URA), which covers private residential property data. Housing and Development Board (HDB) public-housing rental data is a separate source. Singapore work remains a seed track until access, use rights, data quality, and brand architecture are confirmed.

Official source references:

- URA private residential rental contracts: <https://eservice.ura.gov.sg/property-market-information/pmiResidentialRentalSearch>
- URA REALIS: <https://eservice.ura.gov.sg/reis/index>
- HDB rental dataset: <https://data.gov.sg/datasets/d_c9f57187485a850908655db0e8cfe651/view>
- Singapore API and dataset terms: <https://data.gov.sg/privacy-and-terms>

## 2. Goal

Build and validate one repeatable acquisition loop:

```text
Search or trusted referral
  -> intent-matched guide or market page
  -> prefilled Rent Check
  -> useful official-data result
  -> share, save, email, or help request
```

Within 90 days, KoreaHomeGuide must be able to answer three questions with measured evidence:

1. Can relevant search queries generate qualified visits?
2. Do those visitors complete the Rent Check?
3. Does the result create enough value for a visitor to share, save, or register interest?

## 3. Strategic Decision

Three acquisition models were considered:

1. **Programmatic market-page expansion:** broadens search coverage quickly but risks thin content, crawl waste, and a repeat of the prior discovery problem.
2. **Editorial guide expansion:** builds trust and long-tail coverage but is slow and does not reliably connect readers to the core product.
3. **Tool-led mixed acquisition:** uses focused guides and substantial market pages as entry points, then routes visitors into a prefilled Rent Check and measurable follow-up action.

The approved model is tool-led mixed acquisition.

Within the Seoul track, effort is allocated as follows:

- 40%: improve the existing English market pages and guides as search entry points;
- 25%: strengthen the path from those pages into Rent Check and shareable results;
- 20%: answer-led community distribution and relevant institutional outreach; and
- 15%: measurement, conversion, and retention experiments.

## 4. Product and SEO Principles

- Do not publish pages merely to increase URL count.
- Give every indexable entry page one primary search intent and one primary Rent Check action.
- Keep useful content visible without requiring an email address.
- Prefill Rent Check inputs when the entry page already establishes district or property type.
- Use Search Console evidence to decide which topics to expand, refresh, merge, or retire.
- Publish no more than six to eight new search pages during the first 90 days.
- Do not create indexable result permutations or revive building-detail SEO pages.
- Keep Chinese content maintained, but prioritize English acquisition until its funnel is proven.
- Do not use paid acquisition before calculator completion and follow-up actions are measured reliably.
- Treat community participation as answer-first distribution, not link dropping.

## 5. Twelve-Week Roadmap

### Phase 1: Measurement and search readiness (Weeks 1-2)

Seoul work:

- record a clean Search Console and GA4 baseline;
- assign one primary query and search intent to each existing English entry page;
- identify cannibalization, duplicate intent, weak introductions, and missing decision information;
- verify canonical, hreflang, sitemap, robots, indexability, and internal-link consistency;
- verify the complete analytics path from landing page to Rent Check start, result, and follow-up action; and
- freeze new SEO-page publishing until the baseline audit is complete.

Singapore seed work:

- identify whether the pending application is URA API access, REALIS access, or another data service;
- record allowed storage, caching, public display, derived analysis, commercial use, attribution, and rate limits;
- map URA private residential and HDB public-housing data as separate product sources; and
- create a field-coverage matrix for rent, contract period, size, location, property type, and update date.

Exit gate:

- all intended funnel events are observable without collecting PII in analytics;
- every intended English search page has a unique query assignment; and
- there is no site-controlled technical blocker to crawling or indexing eligible pages.

### Phase 2: Entry-page and tool connection (Weeks 3-5)

Seoul work:

- rewrite titles, descriptions, introductions, and FAQs around the approved query map;
- add page-specific evidence, data dates, methodology, and official-source language where missing;
- connect every guide and market page to a contextually prefilled Rent Check;
- add a stable, non-indexable way to share a completed result;
- improve the Explorer-to-Rent-Check path; and
- verify mobile performance and official-data failure states across the complete path.

Singapore seed work:

- design one normalized rental-observation contract that keeps HDB and private-residential provenance explicit;
- define source attribution and data-limitation language; and
- prepare a private fixture-based prototype without publishing empty or misleading Singapore tools.

Exit gate:

- every search entry page has a clear next action;
- district and property-type context survive the transition into Rent Check;
- calculation and follow-up events are attributable to source page and campaign; and
- valid Rent Check requests succeed at least 95% of the time during the verification window.

### Phase 3: Controlled acquisition (Weeks 6-9)

Seoul work:

- review Search Console query and page data every week;
- create no more than two new search pages per week and only where observed demand or a validated foreign-renter question justifies them;
- refresh pages receiving impressions at weak click-through rates before adding substitutes;
- publish two useful community answers per week with links only when directly relevant;
- contact five relevant university, relocation, expat-support, or housing-information organizations per week;
- use UTM parameters on every controlled external placement; and
- collect objections and unanswered questions as product and content research.

Singapore seed work:

- test the normalized model against available HDB data and permitted URA samples;
- research search-intent clusters without publishing thin country pages; and
- decide whether Singapore should use an independent brand, an umbrella global brand, or another domain structure.

Exit gate:

- search impressions, qualified visits, and completed Rent Checks show a positive multi-week direction;
- at least one search cluster and one external channel generate measurable Rent Check usage; and
- new content is justified by evidence rather than publishing cadence alone.

### Phase 4: Concentration and expansion decision (Weeks 10-12)

Seoul work:

- concentrate revisions and links on the strongest query/page clusters;
- merge, redirect, or noindex weak and overlapping pages where appropriate;
- publish a linkable Seoul Rent Snapshot using transparent, reproducible official-data aggregates;
- test one honest retention proposition, such as a monthly rent update or saved check; and
- document the channels and page types that produced completed Rent Checks rather than visits alone.

Singapore seed work:

- move to a limited public beta only if every Singapore launch gate is satisfied;
- otherwise keep the prototype private and continue data validation without creating public launch debt; and
- prepare a separate launch plan rather than mixing Singapore implementation into the Seoul acquisition release.

Exit gate:

- the Seoul track has enough measured evidence for an expand, optimize, or reposition decision; and
- the Singapore track has an explicit launch or hold decision with no unresolved legal or data-access assumption.

## 6. Measurement Contract

The acquisition dashboard must distinguish acquisition, activation, and follow-up value.

Required events:

- the existing GA4 `page_view`, with a qualified landing view derived as a non-bot session entry on an approved search entry page;
- Rent Check start;
- Rent Check result;
- result share or save;
- lead form view;
- lead submit; and
- help request.

Required dimensions include locale, source page, page/query cluster, district, property type, sufficient/insufficient result, UTM values, and referrer host. Email, help text, phone numbers, and other contact PII must never be sent to GA4.

## 7. Initial KPI Targets

The first 14 days establish the new baseline. Absolute targets may be adjusted by up to 30% after that baseline, but funnel ratios and decision rules remain fixed unless a documented measurement flaw is found.

| Metric, trailing 28 days | Week 4 | Week 8 | Week 12 |
|---|---:|---:|---:|
| Search impressions | 1,000 | 5,000 | 15,000 |
| Organic-search clicks | 30 | 150 | 450 |
| Rent Check starts | 20 | 75 | 200 |
| Completed Rent Checks | 15 | 50 | 150 |
| Share, save, email, or help actions | 1 | 4 | 10 |
| Relevant earned mentions or links | 1 | 3 | 5 |
| Eligible pages indexed | 70% | 85% | at least 90% |

Directional funnel thresholds:

- search CTR of at least 3% for pages averaging position 20 or better;
- landing-page-to-Rent-Check-start rate of at least 10%;
- Rent Check start-to-result rate of at least 60%;
- result-to-follow-up-action rate of at least 5%; and
- valid calculation-request success rate of at least 95%.

These are operating targets, not traffic guarantees.

For KPI calculation:

- the eligible-page denominator is the set of approved indexable English pages published at that checkpoint; it excludes building pages, result permutations, redirects, and intentional `noindex` pages; and
- one earned mention or link is one unique third-party domain or moderated community thread that names or links KoreaHomeGuide without payment or ownership by KoreaHomeGuide. Repeated posts on the same domain count once.

## 8. Diagnosis and Decision Rules

Use the earliest failing stage to determine the response:

| Observed condition | Primary interpretation | Response |
|---|---|---|
| No meaningful impressions | Indexing or search-intent mismatch | Correct technical eligibility and query/page fit |
| Impressions without clicks | Weak title, snippet, or promise | Improve SERP presentation before adding pages |
| Clicks without Rent Check starts | Entry-page and tool mismatch | Improve relevance, prefill, proof, and CTA |
| Starts without results | API, speed, or usability failure | Stop acquisition expansion and fix activation |
| Results without follow-up actions | Insufficient persistent value | Test sharing, saving, updates, or a clearer follow-up proposition |

Week-12 decisions:

- **Expand Seoul:** at least 300 monthly organic clicks, 100 completed Rent Checks, five follow-up actions, and a continuing positive trend.
- **Optimize specific stages:** impressions are growing, but one or more click, activation, or follow-up ratios remain below threshold.
- **Reposition acquisition:** fewer than 3,000 monthly impressions after 12 weeks with no positive trend, after verifying that measurement and technical eligibility are sound.

## 9. Singapore Public-Beta Gates

Singapore remains private until all of the following are true:

1. URA access is approved and its public-display, derived-use, caching, attribution, and commercial-use conditions are documented.
2. HDB and private-residential observations remain distinguishable throughout storage, analysis, and presentation.
3. The data path achieves at least 95% successful valid requests over two weeks and exposes sufficient fields for a defensible comparison.
4. The Singapore brand and domain structure is approved; no `/sg/` section is published under KoreaHomeGuide by default.

URA data must not be scraped from consumer-facing search pages as a substitute for approved access. Credentials remain server-side, and the product must display source date, coverage, and limitations.

## 10. Out of Scope

- large-scale programmatic SEO expansion;
- indexable building-result or user-result pages;
- paid acquisition before funnel validation;
- Japanese localization;
- listings, brokerage, payments, advertising, or partner commissions;
- public Singapore launch before all four gates are satisfied;
- mixing Singapore feature implementation into the first Seoul acquisition release; and
- changing Rent Check verdict logic merely to improve conversion.

## 11. Risks and Controls

- **SEO time lag:** combine search work with measured, answer-led community and institutional distribution.
- **Crawl expansion:** limit new pages, keep strict sitemap eligibility, and consolidate weak pages.
- **API instability:** treat activation reliability as a release blocker and preserve transparent unavailable-data states.
- **Vanity traffic:** judge channels by completed Rent Checks and follow-up actions, not sessions alone.
- **Community rejection:** prohibit mass posting and require question-specific value before linking.
- **Singapore licence ambiguity:** keep the prototype private until use rights are documented.
- **Brand confusion:** resolve the global/independent brand structure before publishing Singapore routes.

## 12. Completion Criteria for This Roadmap

This design is ready for implementation planning when:

- the Seoul 80% / Singapore 20% allocation is explicit;
- the tool-led mixed acquisition model is preserved;
- the 12-week phases, KPI targets, and diagnostic rules are implementable without hidden assumptions;
- public Singapore work is gated by access, provenance, reliability, and brand decisions; and
- the first implementation plan is limited to Weeks 1-2 measurement and search readiness rather than attempting the entire 90-day roadmap in one release.
