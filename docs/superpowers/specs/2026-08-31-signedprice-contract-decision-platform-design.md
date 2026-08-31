# SignedPrice Contract Decision Platform Design

**Status:** Approved direction; implementation in progress

**Date:** 2026-08-31

**Scope:** Product architecture, evidence contracts, information architecture, brand system, Seoul P0–P2 roadmap, and later market expansion

## 1. Product decision

SignedPrice launches as a **signed-contract decision engine**, not as a general real-estate data portal.

The first job is to answer one renter question:

> Two homes have different deposits and monthly rents. After normalizing the deposit difference with observed market conversion rates, which contract costs less?

The existing one-quote-versus-market Rent Check remains supporting evidence. Explore, district pages, Rankings, and Guide explain and verify the answer instead of competing with it for the first screen.

The long-term direction remains a global real-estate decision platform. Seoul is the first evidence-complete market. Singapore and Dubai are expansion stages, not visible placeholders.

## 2. Sources of truth

When supplied materials conflict, apply this order:

1. Verified data artifacts, licenses and rights, and reproducible calculation tests.
2. The product thesis and corrected decision logic in this document.
3. `signedprice-build-spec.xlsx` for route inventory, component states, copy coverage, QA, and responsive requirements when that file is available.
4. The supplied SignedPrice logo package for brand geometry and production assets when the original bytes are available.
5. `signedprice-site-spec.md` for product intent and content not contradicted here.
6. Existing code where it conforms to these contracts.

The referenced `signedprice - Site.dc.html`, build workbook, and logo archive are not present in the current workspace. Pixel-level fidelity and official asset installation remain release dependencies; missing assets must not be recreated from memory.

## 3. Product surfaces and information architecture

Country-code routes are stable and market-specific. Seoul launches without a market switcher.

| Route | Role | Navigation |
| --- | --- | --- |
| `/kr/` | Primary two-offer Contract Check | Primary: Check |
| `/kr/check/[area]` | One quoted contract versus verified local distribution | Contextual |
| `/kr/seoul/explore` | Seoul evidence explorer | Primary: Explore |
| `/kr/[area]` | District evidence and recent contracts | Contextual |
| `/kr/seoul/rankings` | Cross-district comparison | Secondary |
| `/kr/news` and `/kr/news/[slug]` | Verified briefs, only after an editorial pipeline exists | Primary: News |
| `/kr/guide` and `/kr/guide/[slug]` | Decision education | Primary: Guide |
| `/kr/glossary` | Terminology | Secondary |

The global header has no more than four primary tabs: Check, Explore, News, and Guide. Rankings and Glossary are secondary. Saved, Timing, community, and marketplace features are deferred until their evidence, history, authentication, privacy, and moderation dependencies exist.

## 4. Core Contract Check

### 4.1 Inputs

Each offer contains:

- deposit in native market units;
- monthly rent in native market units;
- housing type;
- optional label such as a building or listing name.

Seoul uses safe-integer KRW values internally and formats 억/만원 only at the rendering boundary. Area remains square metres. Formatted strings are never calculation state.

The first release compares offers within one housing type. A cross-type comparison is invalid because empirical curves are not interchangeable.

### 4.2 Normalization

Let offer `i` have deposit `Dᵢ`, monthly rent `Rᵢ`, and an annual empirical conversion rate `r(type, Dᵢ)` expressed as a decimal.

The reference deposit is the lower of the two deposits:

```text
Dref = min(Da, Db)
normalizedMonthlyCostᵢ = Rᵢ + (Dᵢ - Dref) × r(type, Dᵢ) ÷ 12
```

This compares both offers against the cash requirement of the lower-deposit offer. Because `Dref` is an invariant lower bound, no asymmetric `max(0, ...)` branch is needed.

Each offer uses the empirical rate at its own filed deposit. Between verified anchors, the rate is linearly interpolated. Outside the observed range, the nearest verified anchor is held and the result is explicitly marked outside the observed range. Rates stored as percentages are divided by 100 before use.

The result exposes:

- the lower normalized monthly cost;
- the normalized monthly difference;
- each offer's applied rate, evidence period, and pair count;
- raw deposit and rent differences;
- a ranking-flipped explanation only when raw rent ordering and normalized ordering are non-zero and opposite;
- effectively equal when the rounded displayed difference is zero.

### 4.3 Secondary Rent Check

The existing single-offer check continues to expose verdict, P25/median/P75, contract count, latest month, evidence limitations, and differentiated failure states. It is linked from each offer and district evidence pages.

## 5. Evidence contracts

### 5.1 Separate artifacts

The product requires two independently versioned artifacts:

1. **Area summary artifact** for district distributions, counts, freshness, and publication rights.
2. **Conversion curve artifact** for observed deposit/rent pairs used by normalization.

One artifact cannot stand in for the other.

### 5.2 Conversion curve artifact

The artifact must include:

- schema version, generation instant, provider, source period, endpoint version, parser version, artifact digest, and rights policy;
- market and housing type;
- ordered deposit anchors, annual rates, pair counts, and observed range;
- total eligible pairs and explicit exclusion counts;
- freshness and readiness state.

Parsing fails closed when keys, types, digest, rights, ordering, ranges, counts, or cross-field mathematics are inconsistent. Provider URLs, credentials, and raw identifiers remain server-only.

Claims such as `72,291 pairs`, `29.4%`, fixed curve anchors, or universal sample thresholds are not publishable until reproduced by this artifact. Existing `signed-conversion.js` is historical candidate logic, not verified P0 evidence.

### 5.3 Thresholds

Publication/privacy floor, verdict-confidence threshold, curve-bin threshold, and building-summary threshold are separate configuration values. They must not be collapsed into one marketing constant.

## 6. UI and brand system

The visual baseline is Modernist:

- canvas `#f3f2f2`;
- ink `#201e1d`;
- action/data cobalt `#1d4ed8`;
- square geometry, connected frames, visible rules, and restrained shadows;
- Archivo for Latin and numerals with an approved Korean sans fallback.

The petrol/orange palette in the uploaded MD does not apply to the product shell.

Official logo assets must be installed from the supplied archive when its bytes are available. Until then the current lowercase text wordmark remains a temporary fallback and must not be presented as the final logo.

Desktop comparison uses Offer A, Offer B, and one result rail. Mobile stacks Offer A, Offer B, then result. Targets are at least 44 CSS pixels, focus is visible, errors are associated with fields, results receive programmatic focus after calculation, and dynamic chart labels are HTML.

## 7. State, failures, and privacy

Invalid input, missing curve evidence, stale evidence, rights blocked, rate limited, upstream unavailable, and malformed artifacts remain distinct states.

Analytics may record market, surface, state, and coarse outcome. They must not record raw addresses, deposits, rents, credentials, or user labels. Saved comparisons are deferred until a privacy and retention contract exists.

## 8. Existing implementation disposition

| Existing capability | Decision |
| --- | --- |
| Server-only environment handling, API security, abort/stale handling | Keep |
| Artifact schemas, repositories, rights/readiness boundaries | Keep and extend |
| Strict response and cross-field validation | Keep |
| SEO containment, route contracts, CI and release gates | Keep |
| Seoul 25-district summaries and detail | Recompose as evidence |
| Explorer data/state/geometry | Keep logic and re-skin only as needed |
| Rankings PR #25 | Preserve unmerged; integrate after P1 IA is in place |
| BoxPlot, QuoteInput, VerdictLine, SampleChip, stroke states | Reuse selectively |
| Current single-quote Rent Check | Keep as secondary flow |
| Homepage and navigation | Rebuild around Contract Check |
| Fake market, news, community, saved, timing surfaces | Do not ship |

## 9. Market expansion

### Seoul

Seoul is the only visible market until Contract Check and the evidence layer pass release gates.

### Singapore

Singapore gets its own adapter, terminology, SGD formatting, tenure/property-type model, evidence artifact, and rights review. The URA credential is server-only in Vercel and is never committed, logged, or client-bundled. A market switcher appears only after URA/HDB readiness checks pass.

Korean deposit logic is not copied mechanically into Singapore. Only evidence/provenance and component contracts are shared.

### Dubai and later markets

Dubai remains hidden until equivalent data, rights, terminology, and release requirements pass. Empty country routes are not indexed.

## 10. KoreaHomeGuide transition

KoreaHomeGuide remains live and unchanged while SignedPrice is incomplete. Migration is cohort-based:

1. Map each indexed intent to a ready SignedPrice destination or explicit retirement.
2. Preserve pages that still satisfy unique jobs.
3. Validate destination parity, metadata, structured data, and analytics.
4. Introduce canonical or 301 changes only after production readiness.
5. Monitor indexation, 404s, traffic, and conversion before the next cohort.

## 11. Delivery roadmap

### P0 — Evidence and system foundation

- executable normalization examples;
- strict conversion-curve contract and repository;
- verified curve generation and validation;
- distinct evidence thresholds;
- official logo and UI tokens;
- market adapter and native-money contracts.

**Exit:** no unverified public claims, credentials remain server-only, and formula/artifact validation passes.

### P1 — Seoul Contract Check

- two-offer input, normalization result, disclosures, responsive and accessibility states;
- links to the secondary area-distribution check;
- preserved request, cache, rate-limit, and strict-envelope behavior where server calls occur.

**Exit:** unit, boundary, tie, flip, stale, keyboard, mobile, privacy, bundle-secret, and live-Preview gates pass.

### P2 — Seoul evidence layer

- Explore, district detail, Rankings, and Guide under the new IA;
- compatible primitives re-skinned to the Modernist system;
- explanatory crosslinks back to Contract Check.

**Exit:** all 25 districts have deterministic coverage and evidence routes pass visual, data, SEO, and Preview gates.

### P3 — Retention and editorial evidence

Verified briefs, saved comparisons, and alerts only after editorial, identity, privacy, and retention contracts exist.

### P4 — Singapore

Validate URA/HDB sources, build the adapter and evidence artifacts, then expose the market.

### P5 onward

Korea buy/rent-versus-buy/investment decisions, Dubai, and later verified lifecycle services.

## 12. Verification and release policy

Every release must prove browser → route/API → repository → verified artifact → mathematically consistent response → rendered disclosure.

Required gates include focused tests, complete V2 regressions, typecheck, lint, production build, diff checks, desktop/720px/mobile browser verification, keyboard/accessibility checks, SEO containment, client-bundle secret scanning, and a live-data gate that cannot pass using fixture-only evidence.

Production promotion is a separate explicit action after Preview passes. A successful Preview never implies Production changed.

