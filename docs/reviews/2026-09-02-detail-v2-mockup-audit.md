# Detail V2 Mockup Audit

**Date:** 2026-09-02
**Input:** `Korea Home Guide UI Mockups.zip`
**Decision:** Adopt the information architecture and visual grammar, not the prototype's sample data or runtime assumptions.

## 1. Release contract

The supplied District Detail and Building Detail mockups are the visual and composition reference for SignedPrice Detail V2. They do not replace the current canonical routes, installed evidence schemas, publication thresholds, mobile requirements, or provider decisions in the approved completion-program design.

All literal prices, counts, dates, building facts, coordinates, news, community threads, corrections, supply figures, population figures, school assignments, transit times, and trend values in the HTML prototypes are fixtures. None may be copied into Production.

## 2. Adopt, adapt, or reject

| Mockup element | Decision | Production treatment |
|---|---|---|
| Strong rules, square controls, dense editorial grid | Adopt | Recreate in the existing SignedPrice CSS architecture; do not import the prototype design-system bundle wholesale. |
| Transaction tabs and new/renewal split | Adopt | Bind to installed `sale`, `jeonse`, and `monthly` evidence and URL state. Show split only where the source supports it. |
| Median, P25–P75, sample, period, source | Adopt | Calculate from the exact selected cohort; require the installed publication threshold. |
| District dong/building tables and deviation bars | Adopt | Bind to real district, dong, and building evidence. A zero deviation remains visually distinct from missing data. |
| Recent contract ledger and correction status | Adopt | Use actual evidence rows, including cancellations/corrections when present. |
| Evidence coverage, sources, and correction history | Adopt | Render from snapshot provenance and an auditable editorial correction log. |
| News and Community rail | Adopt | Keep both modules. Populate News with verified SignedPrice briefs and approved NAVER link cards; keep Community truthful and closed/collecting until durable storage is live. |
| 4-photo building hero | Replace | Use a lazy-loaded nearby NAVER Panorama in Korea and Google Street View in Singapore; fall back to the same provider's live map, then an honest unavailable state. |
| `min-width: 1440px` | Reject | Detail V2 must work at 320px and pass the required 390×844 check without horizontal overflow. |
| React 18 and prototype runtime instructions | Reject | Keep the repository's Next.js 16, React 19, TypeScript, Server/Client Component, and testing conventions. |
| Prototype token file and inline-style architecture | Reject | Translate only the approved visual principles into existing tokens and CSS Modules. |
| Prototype thresholds of district 120, dong 30, building 8 | Reject | Use SignedPrice's exact-cohort rule: publish distributions at five or more eligible observations unless a source-specific contract explicitly requires more. |
| Apartment-only and recent-six-month assumptions | Adapt | Support the installed housing types and completed evidence period. Never relabel a seven-month snapshot as six months. |
| Alert/email controls | Defer | Hide or show a truthful unavailable state until subscription storage, delivery, consent, and unsubscribe flows exist. |
| Forecasts, rankings, scores, and causal claims | Reject | No forecast or causal wording without an approved method and verified source. |

## 3. District Detail V2

### Ship now from installed evidence

- market and contract-type navigation;
- headline distribution with sample, period, and source;
- trend only for completed, comparable cohorts;
- dong and building tables with evidence-aware empty states;
- area-band distributions;
- recent contracts, provenance, coverage, and corrections;
- synchronized navigation into Explore and Building Detail;
- News and Community modules in truthful states.

### Gate on additional verified datasets

- population inflow/outflow;
- housing-stock composition;
- future supply pipeline;
- school assignment and walking-time claims;
- peer-district similarity labels.

The prototype sentence claiming future supply is roughly three times filed jeonse and will increase supply is not a factual rendering contract. It must not ship until both the ratio and the causal interpretation have an approved methodology.

## 4. Building Detail V2

### Ship now from installed evidence

- stable building identity and address;
- transaction-type and area-band evidence;
- decision states, distribution, sample, period, and comparable rows;
- actual recent contracts and cancellation/correction markers;
- source table, coverage state, and correction history;
- nearby street panorama with provider attribution and explicit non-listing-photo label;
- map, Explore, District Detail, and Check navigation preserving relevant URL state.

### Add through official Korea building snapshots

Facts from 공동주택 기본정보서비스 and 건축물대장정보서비스 may publish only after a deterministic join using legal-dong code, lot numbers, road address, PNU/building-management identity, and official name. Name-only fuzzy matching is insufficient.

Eligible facts include official use, approval date, structure, floors, units/households, building/land areas, parking, elevators, and official addresses when provided by the selected source. Every field retains source and observation time. Conflicts remain source-labelled rather than silently merged.

### Do not ship from the prototype fixtures

- submitted photo counts;
- school assignment or walk minutes;
- subway/bus walk minutes;
- parking, floors, units, approval date, or orientation without an official join;
- floor/orientation price adjustments without a documented cohort method;
- fabricated News or Community activity.

## 5. Responsive composition

Desktop may use the mockup's wide main-plus-rail composition. At tablet and mobile widths:

1. primary identity, price evidence, and transaction controls remain first;
2. wide tables switch to cards or deliberate horizontal regions contained within the component;
3. the panorama uses a bounded aspect ratio and loads only for the selected building;
4. the side rail moves below the decision content;
5. controls remain keyboard reachable and retain visible focus;
6. the document itself never overflows horizontally.

## 6. Empty and failure states

Each unavailable module states what is absent, why, and what remains usable. Hatching is reserved for insufficient or incomplete evidence. Provider SDK failure never removes building identity, contracts, or source disclosure. Unsupported datasets are omitted or shown as explicitly unavailable; no prototype fixture fills the gap.

## 7. Implementation impact

This audit changes the completion program in four concrete ways:

1. Street View replaces the prototype photo band as the Detail hero.
2. Mobile reflow is a release requirement despite the prototype's fixed 1440px canvas.
3. Official Korea building facts get a dedicated provenance-bearing snapshot and deterministic join before display.
4. News and Community remain in District and Building Detail, but only verified or truthful closed states may render.
