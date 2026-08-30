# signedprice Product and UI Roadmap

**Date:** 2026-08-29

**Status:** Approved sequencing framework

**Product goal:** Global Real Estate Total Solution Provider

**Entry sequence:** International residents → global investors → full local markets

## 1. Roadmap rules

- Korea develops as the first Full Product.
- Singapore and Dubai initially develop as Market Intelligence products.
- The platform expands by verified capability, not by making every country look equally complete.
- Claude owns UI/UX design handoffs; Codex owns production implementation and verification.
- Every phase produces a usable, independently reviewable release candidate.
- Data rights, licensing, privacy, and partner readiness can block a feature regardless of UI readiness.
- Existing KoreaHomeGuide URLs and SEO assets migrate only by approved route cohort.
- No phase activates indexing merely because its UI is complete.

## 2. Current baseline

### Existing KoreaHomeGuide

- Live English and Chinese service on `koreahomeguide.com`.
- Seoul Rent Explorer, Rent Check, building details, Street View, and guides.
- Official reported contract-data pipeline.
- Existing indexed URLs, canonical, hreflang, and sitemaps.
- Approved legacy test baseline: `890 total / 867 pass / 23 known failures`.

### signedprice V2 foundation

- Isolated Next.js application under `v2/`.
- Global homepage.
- Seoul, Singapore, and Dubai market overviews.
- Rent, Buy, and Invest routes for each market.
- Cross-market comparison page.
- Immutable market, capability, rights, and readiness contracts.
- `noindex,follow`, no canonical, no hreflang, and no domain attachment.
- Local code review complete; real Preview browser verification remains a release gate.

## 3. Delivery map

| Stage | Product outcome | Primary market | UI owner | Implementation owner |
| --- | --- | --- | --- | --- |
| 0 | V2 Preview foundation | Global | Claude | Codex |
| 1 | Shared UI system and navigation | Global | Claude | Codex |
| 2 | Korea rent parity | Seoul | Claude | Codex |
| 3 | Korea buy and decision tools | Seoul | Claude | Codex |
| 4 | Localization and saved decisions | Global/Korea | Claude | Codex |
| 5 | Singapore intelligence | Singapore | Claude | Codex |
| 6 | Dubai intelligence | Dubai | Claude | Codex |
| 7 | Verified marketplace pilot | Selected markets | Claude | Codex |
| 8 | Ownership and transaction lifecycle | Selected markets | Claude | Codex |
| 9 | Local-market expansion | New cities | Claude | Codex |

## 4. Stage 0 — V2 Preview foundation

**Timebox:** one release cycle

**Purpose:** make the approved signedprice foundation visible without changing KoreaHomeGuide Production.

Deliverables:

- Push `codex/signedprice-v2-phase1` and create a Draft PR.
- Create a separate Vercel project rooted at `v2/apps/web`.
- Enable source access outside the project root for workspace dependencies.
- Run the locked desktop and mobile Chromium suites against the exact Preview SHA.
- Conduct Claude visual review against the live Preview.
- Resolve visible hierarchy, spacing, responsiveness, and interaction defects.
- Keep the branch unmerged, unindexed, and detached from `signedprice.com` until approval.

Exit gate:

- Preview `READY` with zero observed 5xx;
- desktop and mobile browser contracts pass;
- Claude handoff comparison has no unresolved high-impact visual defect;
- user approves the visible Preview; and
- KoreaHomeGuide Production remains unchanged.

## 5. Stage 1 — Shared UI system and navigation

**Estimated effort:** 1–2 two-week sprints

**Purpose:** turn the foundation styling into a reusable production system before migrating complex tools.

Claude handoff:

- the site-wide Claude Modernist language established by `signedprice-ui.zip`;
- final wordmark and logo applications;
- responsive header and navigation states;
- market, intent, capability, source, and trust components;
- form, table, card, modal, drawer, sheet, tooltip, toast, and skeleton patterns;
- typography, spacing, color, elevation, and motion tokens; and
- English reference screens at all target viewports.

Codex delivery:

- token and component APIs;
- Storybook or an equivalent isolated component verification surface only if it reduces Preview review cost;
- accessibility and contrast contracts;
- responsive and state tests;
- stable analytics event names without personal data; and
- UI versioning and visual-regression workflow.

Exit gate:

- shared components cover the next Korea migration slice without route-specific duplication;
- all states have accessible names and tested focus behavior; and
- the signedprice asset package replaces temporary typography-only branding.

## 6. Stage 2 — Korea rent parity and migration candidate

**Estimated effort:** 3–5 two-week sprints

**Purpose:** make signedprice V2 capable of replacing the deepest Korea rent workflows without losing current behavior.

Workstreams:

1. Seoul Explorer V2: district → neighborhood → property state preservation.
2. Explicit `Search this area` viewport behavior.
3. Building modal and Street View stability.
4. Rent Check with deposit-adjusted comparison methodology.
5. Area, building, and contract comparison.
6. Official-data source, period, correction, cancellation, and limitation disclosures.
7. KoreaHomeGuide cross-brand transition and exact URL migration table.

Claude handoff must include:

- desktop map workspace;
- mobile map and bottom-sheet flow;
- property detail modal/sheet;
- Rent Check form/result/error/loading states;
- comparison states; and
- transition messaging from KoreaHomeGuide.

Exit gate:

- feature parity for approved KoreaHomeGuide rent journeys;
- same neighborhood state remains stable under map movement;
- calculation methodology is consistent across map, property, district, and check;
- all current accessibility and browser contracts pass; and
- no legacy URL redirects are deployed yet.

## 7. Stage 3 — Korea buy, investment, and Decision OS

**Estimated effort:** 3–5 two-week sprints

**Purpose:** expand Korea from a rent product into the first complete signedprice decision market.

Deliverables:

- Sale Explorer and Sale Check.
- Rent-versus-buy scenarios.
- Acquisition-cost component model.
- Jeonse ratio and compatible yield analysis.
- Foreign-buyer and financing-rule guidance with dated sources.
- Initial-cash, recurring-cost, and ownership-cost views.
- Compatible area-basis and currency presentation.

Exit gate:

- sale contracts remain distinct from asking and developer prices;
- missing costs remain unknown or excluded;
- legal-rate guidance remains separate from signedprice comparison assumptions; and
- Seoul rent and sale operate without Korea-specific fields leaking into shared contracts.

## 8. Stage 4 — Localization and saved decisions

**Estimated effort:** 2–4 two-week sprints

**Purpose:** add repeat use without tripling UI implementation cost.

Release order:

1. Korean UI for signedprice global and Korea market routes.
2. Simplified Chinese migration using the existing KoreaHomeGuide knowledge base.
3. Locale-aware market and intent navigation.
4. Saved properties, areas, comparisons, and scenarios.
5. Alerts and notification preferences.

Rules:

- Locale remains independent from market: `/ko/kr/seoul/`, `/zh/ae/dubai/`.
- English is the source content contract; translations are versioned structured data.
- UI components accept localized models and do not encode English literal types.
- Anonymous market browsing remains complete.
- Account prompts appear only at save, alert, or future partner-contact actions.

Exit gate:

- no clipped or hidden critical content in Korean or Chinese;
- canonical, hreflang, sitemap, and redirects release atomically by approved cohort; and
- consent and preference records are implemented before marketing notifications.

## 9. Stage 5 — Singapore Market Intelligence

**Estimated effort:** 2–4 two-week sprints after data-rights confirmation

**Purpose:** deliver a credible second market without presenting private residential data beyond its rights.

Initial scope:

- HDB rent and sale intelligence kept sector-specific.
- Planning-area and town exploration.
- Foreign-buyer eligibility and dated acquisition-cost guidance.
- HDB-versus-private decision explanation without combined statistics.
- Private residential surfaces only when commercial display and indexing rights are documented.

Exit gate:

- public HDB and private residential evidence never mix;
- owner-declared or indicative limitations remain visible;
- source, period, methodology, and rights evidence are published; and
- private detail routes remain blocked until the rights registry permits them.

## 10. Stage 6 — Dubai Market Intelligence

**Estimated effort:** 2–5 two-week sprints after licensed-provider selection

**Purpose:** support international investment decisions while respecting DLD/RERA boundaries.

Initial scope:

- area and project intelligence;
- native annual-rent and cheque-term presentation;
- ownership-cost and service-charge components when licensed;
- freehold eligibility guidance;
- project, developer-price, transaction, and listing trust separation; and
- gross or partial-net yield only when every required component is sourced.

Exit gate:

- commercial-use and public-display rights are recorded per dataset;
- no public CSV or scraped source substitutes for licensed data;
- transaction and partner details remain blocked until permitted; and
- advertising and project-promotion rules are approved before publication.

## 11. Stage 7 — Verified marketplace pilot

**Estimated effort:** 3–6 two-week sprints after legal and operating gates

**Purpose:** connect qualified decisions to regulated fulfilment without weakening market truth.

Sequence:

1. Partner identity, license, language, market, service, and verification records.
2. Listing/project trust labels, expiry, advertiser identity, and sponsorship separation.
3. Purpose-specific enquiry and consent.
4. Internal matching and response workflow.
5. One-to-three verified partners per selected market and service category.
6. Complaint, correction, suspension, and audit workflow.

Exit gate:

- licensing, referral, tax, consent, privacy, and complaint owners are recorded;
- sponsored content cannot influence official-data calculations or rank;
- expired or suspended entities cannot accept new enquiries; and
- the network is not advertised for a category without a verified fulfiller.

## 12. Stage 8 — Ownership and transaction lifecycle

**Estimated effort:** incremental, following marketplace evidence

**Purpose:** expand from decision and connection into the full property lifecycle.

Candidate capabilities:

- financing, insurance, legal, tax, moving, remittance, and telecommunications referrals;
- transaction checklist and milestone tracking;
- move-in and settlement workflows;
- ownership-cost and yield tracking;
- rental management, resale, and reinvestment; and
- portfolio-level comparisons.

Each capability requires its own data, regulatory, partner, privacy, UI, and revenue gate. Empty marketplace categories and simulated fulfilment are prohibited.

## 13. Stage 9 — Local-market expansion

**Purpose:** grow from international residents and investors into full local-market use.

Expansion order for any new city:

1. rights-cleared market overview;
2. local rules and cost model;
3. area-level intelligence;
4. property or project detail;
5. decision tools;
6. saved decisions and alerts;
7. verified fulfilment; and
8. lifecycle services.

A new city is not launched because its landing page is finished. It launches when its minimum evidence, limitation, support, and operating contracts pass.

## 14. Prioritized next backlog

### Now

1. Push the existing V2 branch and create a Draft PR.
2. Create and browser-verify the independent Vercel Preview.
3. Give Claude the live Preview and request the complete Stage 1 visual handoff.
4. Replace the temporary typographic wordmark when the approved signedprice asset package is attached.

### Next

1. Implement the approved shared UI system.
2. Produce the Korea rent-parity route and data migration specification.
3. Map existing KoreaHomeGuide URLs to V2 cohorts without deploying redirects.
4. Define source/methodology disclosure components required before indexing.

### Later

1. Korea sale and Decision OS.
2. Korean and Chinese locales.
3. Singapore and Dubai licensed data products.
4. Saved decisions, alerts, and accounts.
5. Verified marketplace and lifecycle services.

## 15. Phase workflow and release controls

Every stage follows the same process:

```text
roadmap slice
→ Claude UI handoff
→ user design approval
→ Codex technical specification and implementation plan
→ test-first implementation
→ independent review
→ Draft Preview
→ Claude visual QA + browser verification
→ user acceptance
→ merge and Production approval
```

Required release evidence:

- exact candidate commit;
- local, GitHub, Preview, and Production status separated;
- unit, type, lint, build, route, and browser results;
- Critical and Important review counts;
- data source, rights, methodology, and limitation state;
- observed Preview/Production 5xx;
- indexing, canonical, hreflang, sitemap, and redirect state; and
- explicit list of actions not yet performed.

## 16. Roadmap change control

- Claude may propose UI changes but cannot expand active data or service capability through presentation alone.
- Codex may propose technical or accessibility adjustments but does not change the approved visual direction without user approval.
- Rights, legal, privacy, and SEO gates override timeline estimates.
- Every roadmap stage receives a bounded design specification and implementation plan before coding.
- The roadmap is updated after each accepted Preview with actual evidence, not completion language copied from an earlier session.
