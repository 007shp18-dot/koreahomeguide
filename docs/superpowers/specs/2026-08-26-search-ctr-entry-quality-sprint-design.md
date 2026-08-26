# KoreaHomeGuide Search CTR and Entry-Page Quality Sprint Design

**Date:** 2026-08-26
**Status:** Approved in chat; awaiting written-spec review
**Roadmap position:** Seoul acquisition proof, Sprint 2
**Baseline:** 37 English acquisition entry pages, 385 passing tests, 11 deployable API functions

## 1. Context

The first acquisition release is live. GitHub `main` contains the uploaded release at `6117010`, the production market pages load the shared acquisition context and link helpers, and a live Gangnam apartment Rent Check returned official-data results successfully. The local `main` reconciles that web-upload history at `2bf13b4`.

The entry-page audit found that all 37 pages have unique canonical URLs and primary-query assignments, but their search presentation and content depth are uneven:

- 29 titles exceed the sprint's preferred 60-character review threshold;
- 13 titles exceed 65 characters;
- six descriptions exceed 160 characters;
- the 30 market-page descriptions rely heavily on one repeated template; and
- three of the seven English guides have no FAQ section.

These lengths are internal quality guardrails, not claims about a fixed Google truncation or ranking rule. Search Console page-and-query data is not available in the current authenticated session, so the sprint must not claim that its first ten pages are the highest-volume pages. It uses the approved query map and representative page types until observed Search Console data can replace the initial prioritization.

## 2. Goal

Improve the two earliest measurable acquisition transitions without increasing indexable URL count:

1. search impression to qualified click; and
2. entry-page visit to a contextually prefilled Rent Check.

The sprint should make each existing English entry page state one search intent clearly, give the visitor useful information immediately, and preserve the source-page and campaign context through the Rent Check result.

## 3. Chosen Approach

Three approaches were considered:

1. **Ten-page focused sprint:** apply metadata quality rules to all 37 pages, then deeply improve seven guides and three representative market pages.
2. **Deep rewrite of all 37 pages:** creates broad consistency but is slower, encourages templated copy, and makes the effect of individual changes harder to learn from.
3. **External distribution first:** can generate visits sooner, but sends those visits to pages whose search promise and first-screen content are not yet consistently strong.

The approved approach is the ten-page focused sprint. It combines broad metadata hygiene with a small number of substantial page improvements and a reviewable external-distribution kit.

## 4. Scope

### 4.1 All 37 English entry pages

Every catalogued page receives a metadata review and, where necessary, a rewrite:

- one unique title aligned to its existing `primaryQuery`;
- one unique meta description that describes the page's actual value;
- the primary intent and user benefit near the start of the title;
- no claim of live listings, guaranteed savings, appraisal, legal review, or current availability;
- unchanged canonical URL, hreflang policy, and indexability; and
- unchanged contextual Rent Check attribution.

Operational authoring guardrails are:

- title: no more than 65 characters;
- description: 110 to 160 characters; and
- no exact duplicate title or description across the 37-page catalogue.

The tests enforce these repository standards. They do not assert that search engines always display a particular number of characters.

### 4.2 Ten deep-improvement pages

The ten initial pages are the seven existing English guides plus three market-page representatives:

1. `/guides/wolse-vs-jeonse/`
2. `/guides/korea-rental-contract-checklist/`
3. `/guides/seoul-brokerage-fees/`
4. `/guides/before-you-sign/`
5. `/guides/rent-apartment-korea-foreigner/`
6. `/guides/korea-rental-scams/`
7. `/guides/seoul-officetel-rent/`
8. `/rent/gangnam-gu/apartment/`
9. `/rent/mapo-gu/officetel/`
10. `/rent/yongsan-gu/villa/`

The three market pages cover the apartment, officetel, and villa/low-rise page archetypes in three districts familiar to international renters. They are test representatives, not a statement that those URLs have the highest search demand. Search Console evidence may change the next sprint's page order without changing this sprint's content contract.

Each deep-improvement page must provide:

- a first-screen answer or orientation that matches the assigned query;
- an explanation of what the source data or guidance can establish;
- an explicit limitation explaining what it cannot establish;
- a visible official-source or methodology statement where data is discussed;
- decision information specific to the page rather than generic filler;
- at least three useful FAQ questions with visible answers; and
- one primary path to Rent Check, preserving page and campaign context.

Guides may retain a secondary calculator or sibling-guide link, but the primary product action remains Rent Check. Market pages retain their official dynamic transaction sections and existing Explorer and brokerage-calculator paths.

### 4.3 External-distribution kit

The release includes an operations document containing:

- four answer-first drafts suitable for relevant foreign-renter communities or institutional outreach;
- one canonical destination page per draft;
- UTM-tagged URLs for controlled external placement;
- a plain, non-promotional disclosure of what KoreaHomeGuide does; and
- a log template for channel, placement date, URL, response, visits, Rent Check starts, and completed results.

The repository must not post, send, or submit these drafts. Any public community post or institutional message is a separate representational action and requires the user's review and authorization.

### 4.4 Advertising preparation

Advertising remains inactive in this sprint.

- Each of the seven long-form English guide pages receives exactly one dormant content-ad mount after the main answer and outside the first viewport.
- A dormant mount loads no AdSense script, reserves no visible empty block, sets no advertising cookie, and creates no layout shift while inactive.
- Rent Check, Explorer, calculators, result areas, and market-data interaction surfaces contain neither active ads nor dormant ad mounts.
- Activating AdSense, implementing advertising consent, or adding partner offers requires a separate design and release.

## 5. Content and Data Flow

The existing acquisition flow remains the sole contract:

```text
Search or trusted referral
  -> approved guide or market page
  -> contextual Rent Check link
  -> district/property prefill when known
  -> official-data result
  -> optional save, email, or help action
```

External acquisition uses `utm_source`, `utm_medium`, and `utm_campaign` on the entry-page URL. When the visitor follows an internal Rent Check link, the acquisition helper converts those values to validated `origin_*` parameters. The Rent Check and lead boundary keep the original entry page separate from the current tool page and from any district or property type the user later changes.

No email address, help message, exact quote amount, phone number, or other contact information is sent to GA4. This sprint does not change the lead-storage contract.

## 6. Component Boundaries

### 6.1 Acquisition catalogue

`seo/acquisition-catalog.cjs` remains the canonical inventory. It will be extended with the minimum fields required to test the search contract, such as priority tier, user question, and page promise. It must not become a second copy of every HTML title or paragraph.

### 6.2 Static guide HTML

The seven English guide files own their editorial content, FAQs, primary CTA, and dormant content-ad mount. Existing shared white-first layout classes are reused; no guide-specific visual system is introduced.

### 6.3 Static market HTML and runtime data

The three selected market HTML files own their district/property-specific introduction, decision context, limitations, and CTA placement. `rent-market-page.js` continues to own official dynamic transaction rendering. The sprint does not change request parameters, comparable calculations, cache behavior, API routes, or verdict logic.

### 6.4 Acquisition and lead helpers

`acquisition-context.js`, `acquisition-links.js`, Rent Check prefill utilities, and the lead boundary retain their current validated attribution contract. They may receive tests, but no behavior change is planned unless a failing test demonstrates a regression caused by the content changes.

## 7. Failure and Integrity Behavior

- If market data is temporarily unavailable, the page keeps its substantial static guidance, displays the existing transparent unavailable-data state, and makes no fabricated market claim.
- A content page never substitutes asking prices or listing inventory for official signed transactions.
- Unsupported or manipulated source paths and campaign values continue to be rejected or sanitized by the current allowlist.
- Missing Search Console data changes prioritization confidence, not the truthfulness standard of the published copy.
- If a page cannot satisfy its assigned intent with substantive content, it is left unchanged and documented for later merge, retirement, or evidence gathering rather than filled with generic text.

## 8. Testing and Verification

Implementation uses test-first changes. The release is complete only when all of the following pass:

### Automated checks

- all 37 pages retain unique canonical paths and unique primary-query assignments;
- all 37 titles and descriptions are non-empty, unique, and inside the sprint guardrails;
- all ten deep pages include their required answer/orientation, source or methodology language, limitation, FAQ, and Rent Check action;
- market-page CTA links still receive exact district, property type, source page, and campaign attribution;
- every guide contains at least two useful sibling links;
- no new indexable page is added to the sitemap;
- no building page becomes indexable;
- no AdSense script exists in the repository;
- Rent Check, Explorer, calculators, and result surfaces contain no ad mount;
- analytics and lead tests continue to prohibit PII; and
- the deployable API function count remains at most 11.

The existing 385-test suite and every new test must pass. JavaScript syntax checks and `git diff --check` must also pass.

### Browser checks

At 390px mobile width and a desktop viewport, inspect at least:

- one improved guide with FAQ and dormant ad mount;
- each of the three selected market-page archetypes;
- the contextual transition from a market page to Rent Check; and
- the completed Rent Check result state.

One production-style calculation must return official transactions, a verdict, median, range, and percentile without exposing a site-controlled console error. A public-data outage remains acceptable only when the existing honest unavailable-data state appears.

## 9. Deployment and Deliverables

The implementation is developed in an isolated worktree, reviewed, and merged into local `main` only after verification. The release produces:

1. a GitHub web-upload incremental ZIP with fewer than 100 files;
2. a full tracked-repository ZIP;
3. the external-distribution drafts and tracked-link document; and
4. an updated Search Console and GA4 measurement checklist.

The incremental package must state its file count and whether any deletions are required. No force push is used. If direct GitHub write access is still unavailable, the web-upload package remains the approved deployment path.

After upload, verify the remote tree, live asset delivery, one guide, all three representative market pages, contextual prefill, and one official-data Rent Check.

## 10. Measurement Schedule

If the release is deployed on 2026-08-26, record or preserve the baseline immediately and compare:

- first 14-day review: 2026-09-09;
- Week 4: 2026-09-23;
- Week 8: 2026-10-21; and
- Week 12: 2026-11-18.

If deployment occurs after 2026-08-26, shift all four checkpoints by the same number of days and record the actual deployment timestamp in the measurement handoff.

The primary measures are Search Console impressions, clicks, CTR, and average position by page and query; GA4 qualified entry sessions, Rent Check starts and results; and follow-up actions. The sprint uses the 90-day roadmap's existing funnel thresholds and does not invent baseline values when an authenticated data source is unavailable.

Observed data determines the next action:

- impressions without clicks: revise title, description, and search promise;
- clicks without Rent Check starts: revise first-screen relevance, proof, and CTA;
- starts without results: stop acquisition expansion and fix reliability or usability;
- results without follow-up action: test useful save, share, or follow-up value; and
- no meaningful impressions: verify indexability and intent fit before creating new pages.

## 11. Out of Scope

- new indexable SEO pages;
- deep rewriting of the remaining 27 market pages;
- changes to Chinese page content;
- active AdSense, advertising consent, or advertising revenue experiments;
- paid acquisition;
- automated external posting or outreach;
- partner, affiliate, brokerage, payment, or listing functionality;
- changes to MOLIT providers, API request volume, cache behavior, Rent Check comparables, thresholds, or verdict wording;
- re-indexing building pages; and
- public Singapore routes or a Singapore product launch.

## 12. Completion Criteria

The sprint is complete when:

- all 37 English entry pages meet the metadata contract;
- the ten deep pages meet the content and CTA contract;
- campaign and source attribution survive the full entry-to-result flow;
- content-only dormant ad mounts create no active advertising behavior and product tools remain ad-free;
- the external-distribution kit is ready for user review without having been posted;
- all automated and browser checks pass;
- local `main` contains the reviewed release; and
- both upload packages and the measurement handoff are available.
