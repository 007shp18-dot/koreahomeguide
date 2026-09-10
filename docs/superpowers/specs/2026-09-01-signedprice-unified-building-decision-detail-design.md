# SignedPrice Unified Building Decision Detail Design

**Date:** 2026-09-01
**Status:** Approved design direction; implementation pending written-spec review

## 1. Outcome

SignedPrice building detail becomes one canonical decision page for renting, buying, investing, and inspecting evidence. It is not a listing page and does not split one building into duplicate Rent, Buy, and Invest URLs.

The page has five decision modes:

1. `Overview` — building identity, evidence readiness, and the next useful decision.
2. `Rent` — deposit or monthly-rent comparison, with New, Renewal, and All cohorts kept distinct.
3. `Buy` — completed official sale comparisons, never asking-price claims presented as proof.
4. `Invest` — transparent scenarios built from published evidence plus explicit user assumptions, never forecasts.
5. `Evidence` — source, period, sample, coverage, missing reasons, and claim boundaries.

The first screen is deliberately sparse. It shows one verified or rights-safe building visual, a compact identity block, the five modes, one selected-mode decision brief, at most three supporting measures, and one primary action. Detailed records, cohort comparisons, methodology, and secondary adjustments remain below a disclosure boundary.

## 2. Authority and product position

This design extends the approved Evidence Operating System direction and the latest SignedPrice integrated refresh. The user's latest three-market and six-slot platform direction supersedes older navigation constraints. The detail page still compresses global navigation because repeating the full market bar, six product slots, breadcrumb, and five decision modes would create four competing navigation layers.

SignedPrice remains evidence-led:

- no invented building facts, coordinates, images, prices, yields, rights, or forecasts;
- no listing inventory or broker-lead behavior;
- no silent mixing of New, Renewal, unknown, rent, sale, or user-assumption data;
- every unavailable state includes a title, reason, and next valid action;
- fewer than five eligible contracts remain unpublished;
- integer KRW and square metres remain the internal Korea data units;
- display formatting happens only at the presentation boundary.

## 3. Canonical route and state

The existing full-detail route remains canonical:

`/kr/seoul/explore/[districtSlug]/[buildingId]/`

Decision mode is presentation state, not a new canonical page. A validated query value may preserve context:

`?mode=overview|rent|buy|invest|evidence&contract=new|renewal|all`

Rules:

- Direct first visits default to `mode=overview`.
- Explore passes the selected building and contract cohort.
- Contract Check may deep-link to `mode=rent` with the building identity and user quote carried through the approved non-sensitive state mechanism.
- Back, forward, and refresh restore the validated mode and cohort.
- Invalid query values fail to `overview` and `new` without producing duplicate URLs or errors.
- The building, data period, and source boundary stay fixed while the mode changes.

## 4. Information hierarchy

### 4.1 Compact application header

The detail page uses one 44-pixel global row:

- SignedPrice mark and wordmark;
- Seoul, Singapore, and Dubai market switch;
- current product label, `Explore`.

The six product slots do not repeat as a second full-width navigation row on the detail page. A back action in the building identity block returns to the exact Explore state. This reduces chrome without changing the homepage or market-hub information architecture.

### 4.2 Visual and identity hero

Desktop uses an approximately 54/46 split:

- left: building visual;
- right: back action, verified building name and address, up to three official facts, and compact evidence readiness.

The hero is informative, not promotional. It uses no oversized marketing headline, rounded card, shadow, carousel, or listing-style gallery.

Mobile order is visual, identity, readiness, then decision modes. The visual uses a stable landscape crop and never forces horizontal scrolling.

### 4.3 Decision modes

`Overview`, `Rent`, `Buy`, `Invest`, and `Evidence` remain one stable tablist. Each selected mode has the same above-the-fold grammar:

1. one decision question or conclusion;
2. zero to three supporting measures;
3. at most one primary comparison visual;
4. one primary action;
5. one disclosure for detailed records and methodology.

This progressive-disclosure rule prevents evidence completeness from becoming first-screen clutter.

## 5. Building visual policy

The production visual is chosen through a fail-closed provenance chain:

1. first-party or explicitly licensed building image with stored provenance and display rights;
2. live provider Street View only when the provider terms, key, domain, and current market permit the render;
3. live map preview only when map-display rights permit it;
4. an honest no-image state with building identity and a `View on map` action.

Generated, scraped, hot-linked, unattributed, or inferred building photographs are prohibited in Production. A provider render is not downloaded or cached unless its terms explicitly allow that use. The design mockup may use a clearly labeled illustrative image solely to verify composition.

The displayed visual always includes a visible source label. Visual failure must not hide the building identity, modes, or evidence.

## 6. Mode behavior

### 6.1 Overview

Overview answers: `What can SignedPrice reliably help me decide for this building?`

It publishes availability, not synthetic scores:

- Rent evidence: published, confirmed future, insufficient, or unavailable.
- Sale evidence: published, confirmed future, insufficient, or unavailable.
- Investment scenario: ready only when the minimum required evidence and user inputs exist.

The primary action selects the strongest currently supported decision. If Rent is live and Buy is gated, the action is `Check my contract`; it does not imply that Buy is live.

### 6.2 Rent

Rent reuses the existing verified rent artifact and calculation boundaries. The first screen shows:

- user deposit or monthly-rent input;
- area input or selected verified area band;
- one position verdict and one collision-safe range visual;
- the primary cohort, defaulting to New;
- a full Rent Check action.

New, Renewal, and All remain available together below the disclosure boundary. They are never silently merged. Rights, liens, or legal guarantees are not inferred from rent evidence.

### 6.3 Buy

Buy activates only when an official sale artifact is installed, provenance is verified, the period is disclosed, and the relevant comparison group meets publication minimums.

When live, the comparison order is:

1. same building and comparable area;
2. nearby verified buildings with explicit similarity rules;
3. district context.

Asking prices may be accepted as user input but are visually and semantically separated from completed official sales. Floor, orientation, condition, and timing adjustments are shown only when supported; otherwise they appear as explicit factors the user must confirm.

Before the sale gate passes, the Buy tab remains visible but renders `Official sale evidence is not ready`, the reason, and a valid next action. It publishes no placeholder price.

### 6.4 Invest

Invest is a scenario workspace, not a valuation or return-prediction engine. It separates three classes of value:

- published evidence: verified sale and rent observations;
- user assumptions: price, equity, financing, income, costs, and holding period;
- scenario outputs: yield, cash flow, break-even, and stress cases.

Each output states its evidence and assumption dependencies. Future price appreciation defaults to zero or remains unset; the product never inserts an optimistic rate. Tax, financing, ownership, or rights inputs that are not connected appear as incomplete with a reason and next action.

If the required sale or rent evidence is missing, the page may still collect explicit user inputs, but it must not present a market-backed investment conclusion.

### 6.5 Evidence

Evidence is the complete ledger for the current building and period. It includes:

- building identity source;
- rent and sale artifact versions;
- generated-at and completed-period values;
- publication minimum and eligible sample counts;
- rights policy identifiers;
- visual source and display-rights status;
- unavailable fields and exact missing reasons;
- methodology links.

Community evidence remains hidden below its approved verification threshold and is never merged with official evidence.

## 7. Component boundaries

The page is composed from isolated units with narrow inputs:

- `BuildingDecisionShell` — validates route state and composes the page.
- `BuildingVisual` — renders the provenance chain and independent failure state.
- `BuildingIdentitySummary` — renders only verified identity and official facts.
- `BuildingDecisionTabs` — owns validated mode selection and accessible tab behavior.
- `BuildingEvidenceReadiness` — derives factual availability states; it does not calculate prices.
- `RentDecisionView` — consumes the existing rent evidence and calculator contracts.
- `BuyDecisionView` — consumes only the future verified sale artifact contract.
- `InvestmentScenarioView` — combines immutable evidence with explicit user assumptions.
- `BuildingEvidenceLedger` — renders provenance, period, sample, rights, and missing reasons.
- `DecisionDetailDisclosure` — contains secondary rows and methodology without hiding the primary action.

No mode imports provider-only credentials or fetches unversioned source data in the browser. Provider access and artifact generation remain server-only.

## 8. Data contracts

The current building artifact remains the Rent source. The detail view may extend its presentation model with nullable, provenance-bearing fields; it must not mutate verified distributions.

The visual presentation model uses an explicit discriminated state:

```ts
type BuildingVisualState =
  | { kind: 'licensed_photo'; src: string; sourceLabel: string; rightsPolicyId: string }
  | { kind: 'live_street_view'; latitude: number; longitude: number; sourceLabel: string; rightsPolicyId: string }
  | { kind: 'live_map'; latitude: number; longitude: number; sourceLabel: string; rightsPolicyId: string }
  | { kind: 'unavailable'; reason: string; nextAction: { label: string; href: string } };
```

Decision readiness uses `published`, `confirmed_future`, `insufficient`, or `unavailable`. A generic boolean is insufficient because the UI must explain why a mode is gated.

The future sale artifact and investment scenario contract are separate implementation releases. Rent does not wait for them, and their absence does not lead to fabricated unified metrics.

## 9. Empty and error states

- Missing image: preserve identity and actions; show reason and `View on map` when coordinates are verified.
- Street View SDK failure: replace only the visual; never crash the detail page.
- Missing building artifact: publish no building distribution; return to the preserved district Explore state.
- Invalid or mismatched building identity: fail closed and do not substitute a district average.
- Insufficient cohort: show the cohort, publication minimum, reason, and another valid cohort only when it is independently published.
- Missing sale evidence: keep Buy visible but gated with no price.
- Missing investment dependency: identify the missing evidence or assumption; do not calculate a partial headline return.
- Provider or artifact error: retain the last verified artifact when allowed and label its completed period; never relabel stale evidence as current.

## 10. Accessibility and responsive behavior

- All interactive targets are at least 44 pixels in the mobile layout.
- Tabs use native buttons with `role=tab`, `aria-selected`, and matched tab panels.
- The hero image has meaningful alternative text only when it depicts the verified building; provider or decorative fallback labels remain concise.
- Evidence states pair color with fill, outline, hatch, and text.
- The page remains usable without the image, hover, or map SDK.
- At 320 pixels, the header and modes wrap without horizontal overflow.
- The DOM order matches mobile reading order.
- Details disclosure uses native `details` and `summary` and does not conceal the selected mode's essential result or action.

## 11. SEO and publication

The canonical building URL is indexable only when the installed artifact provides a stable verified building identity, at least one independently publishable decision mode, a disclosed completed period, and a server-rendered evidence boundary. A photograph is not required for indexing.

Mode queries remain canonical to the building URL. Gated Buy and Invest modes do not create thin indexable routes. Structured data includes only verified building facts; scenario outputs, community signals below threshold, and unavailable facts are excluded.

## 12. Verification

Implementation begins with failing tests and requires:

- route-state tests for valid, invalid, restored, and cross-entry modes;
- unit tests for visual provenance priority and every fallback state;
- readiness-state tests proving no generic boolean or invented values leak through;
- Rent regression tests for New, Renewal, All, unknown, insufficient, and published cohorts;
- Buy gate tests proving no price renders before an installed verified sale artifact;
- Invest tests separating evidence, assumptions, outputs, unset appreciation, and missing dependencies;
- server-rendered markup tests for identity, source, period, and evidence boundary;
- keyboard, tab, native disclosure, and accessible-name tests;
- layout checks at 390, 720, 1366, and 1440 pixels with no horizontal overflow;
- image, Street View, map, and no-image browser branches;
- typecheck, lint, full Vitest, production build, client-boundary scan, and prohibited-copy scan;
- exact-SHA Preview review before any Production promotion.

## 13. Release sequence

1. Refine the existing Rent-backed building detail shell, responsive hierarchy, and visual fallback contract.
2. Connect verified visual providers only after display-rights review.
3. Add the official sale artifact and activate Buy behind its evidence gate.
4. Add the transparent investment scenario model after its evidence and assumption contracts are tested.
5. Expand to Singapore and Dubai through the same modes only when each market's data and rights gates pass.

This sequence exposes the long-term product architecture now while keeping every current claim honest.
