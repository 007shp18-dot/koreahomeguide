# SignedPrice Density, Explore, Rankings, and Check Design

## Authority

This design records the user's approval on 2026-09-01. It supersedes older layout and Check rules where they conflict. In particular, Check no longer normalizes only the deposit difference against the lower offer: each offer is converted independently from its full refundable deposit. The supplied specification frame remains authoritative for parsing, evidence boundaries, held ranges, and integer-won arithmetic; this release implements the approved public subset rather than every future community or localization surface in that frame.

## Outcome

SignedPrice should read as one compact global property decision product, not a collection of edge-to-edge dashboards. Copy pages use a centered 1,240px content frame. Dense analytical workspaces may expand to 1,440px, but their controls and evidence columns must use the same spacing, typography, and rule hierarchy as the rest of the site.

The release includes:

- a unified width, typography, spacing, and border system;
- the five-product navigation directly below the market navigation;
- a compact, map-first Explore workspace with one real transaction-type filter;
- a contained Rankings workspace with denser headers and rows;
- a redesigned Check workspace with corrected full-deposit monthly-equivalent arithmetic.

## Visual system

The existing warm paper, deep ink, petrol, and burnt-orange palette remains. Geometry remains square with no shadow. Structural emphasis is made consistent through named tokens:

- `--rule-strong: 2px solid var(--ink)` for page, workspace, and section boundaries;
- `--rule-default: 1px solid var(--divider)` for panels and control groups;
- `--rule-subtle: 1px solid var(--line)` for rows and local subdivisions.

No component chooses an arbitrary two-pixel or one-pixel black border when one of those three roles applies.

Latin UI and headings use Inter. Korean text uses Pretendard first. Numeric values remain tabular. Display headings use restrained tracking no tighter than `-0.03em`; body copy uses normal tracking and `1.55–1.65` line-height. Long text is held to 60–68 characters. The display scale is capped below the previous 80px poster treatment on product pages.

## Header

The header remains two-tiered:

1. brand, Seoul/Singapore/Dubai, and language context;
2. `01 Check`, `02 Explore`, `03 Rankings`, `04 Briefs`, `05 Guide`.

Both tiers share the 1,240px content frame. The product row sits directly beneath the market row, uses one consistent strong bottom boundary, and scrolls horizontally on small screens. The active product is ink-filled; inactive products use the paper ground and default internal dividers.

## Explore

The temporary Jeonse-only product strip is removed. A single toolbar owns transaction context:

- `All`, `Sale`, `Jeonse`, `Monthly rent`;
- district;
- building type;
- one search field matching district, neighborhood, building name, or housing type.

The filter renders a mode as interactive only when its dataset is actually available. Unavailable modes remain explicit and cannot inherit Jeonse figures. When all approved datasets are installed, `All` becomes the default. Until then, the available mode remains selected without describing the published building count as Seoul's total building inventory.

Desktop uses a maximum 1,440px workspace: compact district rail, flexible Naver map, and 360–400px evidence panel. The map remains the primary surface. District selection, building selection, incremental loading, geocode failure reporting, and canonical detail links remain one state flow. Mobile uses the map first with a scrollable result/evidence sheet.

## Rankings

Rankings uses the 1,180–1,240px content frame rather than full viewport width. The large empty hero is replaced by a compact page header containing period, cohort, and method. Metric tabs sit directly below it. Rows use consistent columns and local subtle rules; the enclosing section alone uses strong rules.

The page continues to fail closed for missing change evidence. Distribution, change, spread, and sample views remain distinct. The first view emphasizes the most decision-useful rows before the complete list, without inventing a recommendation or hiding an eligible district.

## Check calculation contract

Each offer is parsed and calculated independently:

```text
monthlyEquivalent = monthlyRent + round(deposit * annualRate / 12)
```

`annualRate` is stored as a decimal fraction (`0.05` means five percent). Deposit and monthly rent are integer won. Refundable principal is never added directly to spend; only its annual opportunity cost divided by twelve is used.

Required behavior:

- monthly rent may be empty or zero, enabling Jeonse comparisons;
- a rejected deposit or monthly value produces no downstream figure for that offer;
- a deposit outside the verified curve's measured range is `held` and produces no extrapolated monthly equivalent;
- the winner is derived only when both offers resolve;
- the trace shows filed deposit, filed monthly rent, applied rate and source, and monthly equivalent;
- a user-entered annual rate, when enabled, is always labelled `user-supplied · not evidence` and is not persisted;
- all formatting occurs after calculation.

The Check screen has two modes in the information architecture: `My budget` and `Compare two offers`. This release makes `Compare two offers` complete and correct first. `My budget` may be exposed only when its district-distribution dependencies and privacy tests are installed; no placeholder budget claim is shipped.

## Check UI

Check uses a centered 1,120px working frame. The hero is compact. Offer A and B use equal columns with deposit and monthly rent in one row per offer. Results update live. The result begins with both monthly equivalents and the difference, followed by the four-row trace and measured conversion curve. Evidence and boundary copy are visually secondary but remain present.

The page does not show a submit-dependent result, an appraisal label, an affordability claim, or a recommendation.

## Safety and verification

- No invented buildings, counts, coordinates, transaction modes, prices, or evidence periods.
- No fallback from one transaction type or housing type into another.
- Money remains integer KRW internally.
- Existing publication minimum and rights gates remain.
- Every behavior change starts with a failing test.
- Required gates: focused Vitest, full Vitest, typecheck, lint, production build, desktop/mobile browser verification, `git diff --check`, and Production runtime verification.

