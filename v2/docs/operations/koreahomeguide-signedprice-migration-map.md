# KoreaHomeGuide → SignedPrice migration map

**Status:** inventory and release gates approved; no redirect cohort is active

**Inventory checked:** 2026-08-31

## Decision

KoreaHomeGuide will move into SignedPrice, but the domains do not switch as one redirect. Every source URL must keep its user intent, public evidence, language, and search value. A SignedPrice page is an eligible redirect target only after it reaches content and feature parity, returns `200`, is indexable with one self-canonical, and appears in the SignedPrice sitemap.

Until those gates pass, KoreaHomeGuide remains canonical and available. Do not redirect a working evidence page to a SignedPrice placeholder, global market matrix, broader district page, or `404`.

## Route cohorts

| Cohort | KoreaHomeGuide source | Planned SignedPrice target | Current state | Redirect gate |
| --- | --- | --- | --- | --- |
| Brand home | `/` | `/kr/` | Hold | Preserve quote check, comparable records, next actions, and language behavior before moving. |
| Rent Check | `/tools/seoul-rent-check/` | `/kr/check/seoul/` | Hold | SignedPrice must support the same quote inputs, official comparable records, confidence disclosure, and result boundary. |
| Explorer | `/explore/` and query variants | `/kr/seoul/explore/` | Hold | Preserve district, neighborhood, housing-type, budget, metric, map, table, and reload/back state. Query parameters need an explicit translation table. |
| Market compare | `/compare/` | New Seoul district-comparison route, not current `/compare/` | Hold | Current SignedPrice `/compare/` compares global market capability and is not an equivalent destination. |
| Buy or rent | `/buy-or-rent/` | `/kr/seoul/buy/` or a dedicated decision route | Hold | Calculation assumptions, editable inputs, sensitivity results, and disclosures must be ported and independently verified. |
| Salary tool | `/tools/salary-to-housing/` | New Korean affordability route | Hold | Do not map to Contract Check; the user intent and inputs differ. |
| Method | `/about/` | `/trust/` plus Seoul method detail | Hold | Port KoreaHomeGuide source method, commercial separation policy, limitations, correction channel, and update date. |
| Guides index | `/guides/` | `/kr/seoul/guide/` | Hold | All eight guide intents and internal links must exist on SignedPrice first. |
| Legal | `/privacy/`, `/terms/` | Equivalent SignedPrice legal routes | Hold | Policies must cover migrated email/help/saved/analytics data before redirects. |
| Dynamic evidence | `/seoul/{district}/{dong}/{type}/...` | Stable SignedPrice district, neighborhood, and building routes | Hold | Complete ID mapping, same-or-better evidence depth, zero orphan pages, and sample URL QA are required. |
| Saved state | saved-home and browser-state entry points | Future SignedPrice saved workspace | Hold | Define data portability and consent behavior; never redirect a saved deep link to a generic home page. |

There is intentionally no “redirect now” cohort in this release. SignedPrice's verified Seoul Explore, district, Rankings, News, Guide, and Trust surfaces can be indexed on their own domain now without changing KoreaHomeGuide canonicals.

## Guide inventory

Each guide needs a same-intent SignedPrice document rather than a nearest-title redirect.

| KoreaHomeGuide guide | SignedPrice state |
| --- | --- |
| `/guides/wolse-vs-jeonse/` | New same-intent guide required. |
| `/guides/korea-rental-contract-checklist/` | New same-intent guide required. |
| `/guides/seoul-brokerage-fees/` | Guide and verified calculator parity required. |
| `/guides/before-you-sign/` | New same-intent guide required. |
| `/guides/rent-apartment-korea-foreigner/` | New same-intent guide required. |
| `/guides/korea-rental-scams/` | New same-intent guide required. |
| `/guides/seoul-officetel-rent/` | New same-intent guide required. |
| `/guides/korea-rent-deposit-protection-foreigners/` | Re-verify every time-sensitive official claim before porting. |

The three current SignedPrice guides remain valid SignedPrice content, but they are not substitutes for the eight documents above.

## Dynamic evidence inventory

Before the dynamic cohort is scheduled, export the complete KoreaHomeGuide canonical sitemap and produce a checked mapping file with these fields:

```text
source_url,target_url,route_type,language,stable_source_id,stable_target_id,
source_status,target_status,canonical_ok,content_parity,evidence_parity,redirect_ready
```

Required route types include district, neighborhood/housing type, building, tools, guide, legal, and localized variants. Query-only Explore states are mapped separately from canonical documents.

## Redirect release gate

For each cohort:

1. Freeze and archive the complete source URL inventory and current response/canonical state.
2. Verify every target returns `200`, `index, follow`, one self-canonical, correct language metadata, and the expected body without client-only dependency.
3. Confirm official evidence period, filters, unit semantics, privacy thresholds, and source disclosures are equal or stronger.
4. Add direct permanent redirects with no chain, loop, pattern overreach, or query loss.
5. Keep the source domain verified in search tooling and retain its sitemap for redirect discovery during migration.
6. Test representative and edge URLs before rollout, then crawl the entire mapping after rollout.
7. Monitor `404`, `5xx`, redirect loops, canonical drift, indexed-source decay, and target discovery. Roll back the cohort if material failures appear.

Community response counts never determine whether an official page is indexable. New/renewal official evidence and verified News remain separate from self-selected Community aggregates.

## Rollback

Redirect rules are deployed per cohort and reversible without reverting SignedPrice content. If a target loses its artifact, rights state, or required content, stop that cohort's redirect and restore the KoreaHomeGuide response while the evidence issue is corrected.
