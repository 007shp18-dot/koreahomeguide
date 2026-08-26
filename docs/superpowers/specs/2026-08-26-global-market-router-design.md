# Global Market Router Design

**Date:** 2026-08-26  
**Status:** Proposed; awaiting owner review before implementation planning  
**Roadmap position:** Track C design work only until the Seoul Phase-1 acquisition exit gate passes or the owner explicitly reallocates the roadmap

## 1. Decision

KoreaHomeGuide will not turn the current Seoul application into a public country switcher. The current Seoul URLs, canonicals, hreflang relationships, API payloads, and acquisition catalogue remain unchanged.

Future markets use separate deployments that share a domain-neutral market contract. A compatibility facade lets Seoul adopt that contract internally without a URL or response-shape migration. Singapore is the first private adapter candidate after data access and licence review. A synthetic non-production cross-market fixture may expose hidden Seoul assumptions; Dubai receives no named adapter or source-backed fixture until an approved source sample and use terms exist.

This approach is preferred over:

1. adding `/singapore/` and `/dubai/` to the current deployment, which couples new-market failures and SEO policy to the Seoul product; or
2. adding a `?market=` switch, which creates unclear canonicals, fragile caching, and a poor long-term route contract.

## 2. Goals

- Preserve the working Seoul product and its search equity.
- Define one normalized observation contract for markets with different rental systems.
- Keep source provenance, licence terms, coverage, and limitations visible through every layer.
- Permit private fixture testing before a public route exists.
- Avoid increasing the current Vercel function count of 11.
- Keep locale selection independent from market selection.

## 3. Non-goals

- No public Singapore or Dubai pages, sitemap entries, navigation items, or market switcher.
- No migration of existing Seoul URLs to `/kr/` or another symmetric prefix.
- No claim that Singapore private rentals, Singapore public housing, Seoul monthly rentals, and any future Dubai tenancy records are equivalent datasets.
- No scraping of consumer-facing search pages as a substitute for approved data access.
- No shared verdict thresholds across markets unless separate evidence proves they are defensible.
- No new per-market Vercel endpoint in the current deployment.

## 4. Current constraints

The current code has a partial provider boundary, but important modules still encode Seoul concepts directly: district codes, Korean property categories, deposit-plus-monthly-rent calculations, SEO routes, and all-Seoul aggregation. The English acquisition catalogue also has an intentional denominator of 37 Seoul entry pages. Treating these as globally generic would hide semantic differences and contaminate measurement.

The router therefore begins as an internal contract and registry, not a visible UI control.

## 5. Architecture

```text
Official or licensed source
  -> source adapter
  -> normalized rental observation + provenance
  -> market-specific comparison and aggregation policy
  -> compatibility facade
  -> market deployment API and renderer
```

Each deployment selects one `marketId` at build or environment configuration time. Browser input cannot select an arbitrary provider or source. Market configuration is server-owned and allow-listed.

### 5.1 Proposed modules

- `markets/market-contract.cjs`: validates normalized observations, money values, provenance, and capability declarations.
- `markets/market-registry.cjs`: returns an explicitly registered market configuration; unknown IDs fail closed.
- `markets/seoul/market-config.cjs`: wraps the existing Seoul provider and comparison behavior without changing public responses.
- `markets/singapore/*`: private adapter and fixtures only after access and terms are documented.
- `markets/fixtures/synthetic-cross-market/*`: synthetic contract fixtures labelled `fixtureKind: synthetic`; excluded from production registries, caches, readiness evidence, and public output.

The first implementation must reuse existing API functions through the compatibility facade. It must not create `api/singapore-*` or `api/dubai-*` files in the Seoul deployment.

## 6. Normalized rental observation

Every observation must carry enough information to prevent source or market semantics from being lost:

| Field | Requirement |
| --- | --- |
| `schemaVersion`, `adapterVersion` | Explicit versions used for validation, cache isolation, and migration |
| `marketId` | Stable internal market identifier, such as `seoul` or `singapore` |
| `providerId` | Stable source adapter identifier |
| `datasetId` | Exact upstream dataset or service identifier |
| `housingSector` | Explicit sector such as private residential or public housing |
| `sourceRecordId` | Upstream ID only when supplied; omitted otherwise |
| `observationKey`, `identityKind` | Internal transport key plus `source` or `surrogate`; a surrogate is never evidence that two upstream records are duplicates |
| `sourceAreaId`, `sourceAreaLabel` | Source-native top-level geography identity and label |
| `sourceLocalityId`, `sourceLocalityLabel` | Optional source-native finer geography identity and label |
| `displayAreaLabel`, `displayLocalityLabel` | Locale-owned presentation labels kept separate from source identity |
| `propertyCategory` | Canonical category used by the market comparison layer |
| `sourcePropertySubtype` | Original upstream subtype without forced global equivalence |
| `contractPeriod` | `{ start, end, precision, timezone, calendar }`; precision states exact-day, month, quarter, or another validated source granularity |
| `size` | `{ squareMetres, sourceValue, sourceUnit, basis, precision }`; basis distinguishes net, gross, exclusive, or unknown area |
| `deposit` | `{ amountMinor, currency, kind }`; omitted when unsupported; kind records security, key money, advance, or market-specific semantics |
| `rent` | `{ amountMinor, currency, billingPeriod, normalizationRule }`; omitted when unsupported |
| `recordStatus` | Optional source-defined active, cancelled, revised, or unknown status |
| `retrievedAt` | When KoreaHomeGuide obtained the record |
| `sourcePublishedAt`, `sourceUpdatedAt` | Upstream publication/update time when supplied, otherwise omitted |
| `coverageFrom`, `coverageTo` | Coverage represented by the source response |
| `attribution` | Required public source text and public documentation URL; never a credential-bearing request URL |
| `rightsPolicyId` | Dataset-and-sector rights policy controlling storage, cache, display, derived use, commercial use, indexing, TTL, and retention |
| `limitations` | Machine-readable flags plus user-facing limitation text |

`amountMinor` is a safe integer only when it fits JavaScript's safe range; otherwise it is a decimal string. `currency` is an ISO 4217 code, and each adapter declares the currency exponent and rounding rule. Money is never normalized through a display exchange rate for market comparison. Comparisons use the source market's native currency; currency conversion remains a presentation-only estimate.

## 7. Capability contract

Every provider declares exhaustive boolean capabilities per dataset and housing sector rather than synthesizing unsupported values:

- exact contract date;
- deposit amount;
- recurring rent amount;
- floor area;
- building identity;
- housing-sector identity;
- quote comparison;
- building-detail aggregation; and
- SEO-page eligibility.

Omitted capability fields are invalid; every field must be explicitly `true` or `false`, so validation fails closed. A renderer must hide or explain unsupported features; it may not display zero, an inferred date, or a generic confidence label as if the source supplied it.

Each dataset-and-sector configuration also resolves an executable rights policy. Undeclared permissions default to denied. The policy separately controls storage, caching, public display, derived analysis, commercial use, indexing, maximum cache TTL, and maximum retention. A provider-wide permission cannot automatically authorize every dataset or housing sector.

## 8. Market-specific policy

Normalization makes records transportable, not economically interchangeable. Each market owns:

- property-category mapping;
- comparable selection rules;
- minimum sample size;
- outlier handling;
- date lookback;
- recurring-rent and deposit treatment;
- confidence language;
- licence attribution; and
- indexability requirements.

Seoul keeps its current public verdict logic during the compatibility migration. Singapore private residential and HDB observations remain separate sectors through storage, analysis, presentation, and measurement.

## 9. Routing, SEO, and measurement

- `koreahomeguide.com` continues to represent the Seoul/Korea product.
- Current canonical URLs and EN/ZH hreflang pairs do not move.
- The 37-page English acquisition catalogue remains Seoul-only.
- Private market fixtures never enter a sitemap or analytics acquisition denominator.
- A future public market receives its own deployment and canonical host only after brand, legal, data, reliability, and content gates pass.
- Locale is a display/content dimension under a market; it is not inferred from country, currency, or browser language.
- Analytics events add `market_id` only when the value comes from trusted deployment configuration.

The final hostnames and umbrella brand are deliberately deferred. Choosing them before Singapore data access and product scope are known would create migration debt without improving validation.

## 10. Security, caching, and failure behavior

- Credentials remain server-side and are scoped per provider and deployment.
- Cache keys include schema version, adapter version, market, provider, dataset, housing sector, normalized query shape and granularity, area, property category, and coverage period.
- Cached objects retain source attribution, retrieval time, and coverage metadata.
- A rights policy that denies caching or storage prevents the object from entering that layer at all.
- Raw upstream fields outside the normalized allow-list are not stored, cached, logged, or returned.
- One market's stale or malformed response cannot satisfy another market's request.
- Unknown market IDs, provider IDs, or housing sectors fail closed.
- Logs exclude credentials, contact details, exact user quotes, and raw upstream payloads containing sensitive fields.
- Provider unavailability produces a market-specific transparent error state; it never silently falls back to another sector or country.

## 11. Delivery stages and gates

### Stage 0: contract and registry

Stage 0 implementation does not start until the existing 90-day roadmap's Phase-1 acquisition exit gate passes, unless the owner explicitly approves a documented effort reallocation. Until then, Track C is limited to this design, terms review, and implementation-plan preparation.

- Add the contract validator, registry, Seoul configuration shape, and fixtures.
- Add regression tests proving current URLs, payloads and error contracts, 11-function budget, and 37-page acquisition catalogue are unchanged.
- Ship no visible market UI and no new public route.

### Stage 1: Seoul compatibility migration

- Route one internal Seoul data path through the facade at a time.
- Preserve byte-compatible public fields where existing clients depend on them.
- Require full suite and production-like fixture tests before each path is migrated.
- Stop if success rate, cache behavior, or response latency regresses.

### Stage 2: private Singapore adapter

- Start only after the exact URA access product and its storage, caching, public-display, derived-use, commercial-use, attribution, and rate-limit terms are recorded.
- Model URA private residential and HDB rental data as separate sectors.
- Test with approved samples or fixtures; do not publish an empty shell.
- Use the labelled synthetic cross-market fixture to expose Seoul/Singapore assumptions. It cannot name a real Dubai dataset or count as Dubai readiness evidence. A source-backed Dubai fixture waits for an approved sample and terms.

### Stage 3: public-market decision

A separate market deployment may launch only when:

1. access and use rights are documented;
2. source coverage supports a defensible user promise;
3. valid requests succeed at least 95% over two weeks per provider, dataset, and housing sector without cross-sector fallback; the implementation plan defines a minimum probe/sample floor before the metric can pass;
4. source dates, provenance, and limitations are visible;
5. brand/domain and local legal wording are approved;
6. the market has substantive launch content rather than thin route symmetry; and
7. Seoul acquisition work is not being paused to maintain an unvalidated expansion.

## 12. Verification contract

The implementation plan must include tests for:

- schema rejection of missing provenance, currency, sector, or date precision;
- exhaustive, fail-closed capability and rights-policy declarations;
- rejection of unsafe money values, unclear date precision, unknown area basis, and surrogate identity used as deduplication evidence;
- cache namespace isolation;
- unknown-market and unknown-provider rejection;
- separation of Singapore public and private housing;
- unchanged Seoul endpoints, status codes, error bodies, payload fields, Cache-Control and X-Robots-Tag behavior;
- unchanged rewrite precedence, building-page 410/noindex behavior, canonicals, EN/ZH hreflang, sitemap eligibility, and analytics event/field semantics;
- unchanged 11-function deployment budget;
- unchanged 37-page Seoul acquisition denominator; and
- zero public Singapore/Dubai URLs during Stages 0-2; and
- synthetic fixtures excluded from production registries, caches, public output, and readiness metrics.

## 13. Review checkpoint

This document authorizes design review only. Owner approval of this contract is required before an implementation plan is written. That plan must identify exact files, test order, migration sequence, rollback points, and the roadmap gate that authorizes Stage 0. Singapore source-specific fields remain provisional until approved data samples and terms are available.
