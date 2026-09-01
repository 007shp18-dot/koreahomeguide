# SignedPrice Navigation and Data Normalization Design

**Date:** 2026-09-01

**Status:** Approved direction; implementation may begin after written-spec review

**Scope:** Korea Guide, shared navigation state, Korea transaction snapshots, and Contract Check activation

## 1. Decision

SignedPrice will use one navigation and data contract across Guide, Explore, Detail, Rankings, and Check.

- Guide receives the same two-tier market and product header as the decision tools.
- Explore, Detail, Rankings, and Check share one validated, URL-serializable market selection.
- Korea building identity, sale, jeonse, and monthly-rent data are activated as independent immutable snapshots.
- Explore, Detail, and Rankings update from those active snapshots.
- Check remains fail-closed until a separately produced and verified conversion-curve snapshot is active.
- Missing evidence is shown as unavailable; the product never substitutes fabricated values.

This document is an implementation addendum to:

- `2026-09-01-signedprice-korea-singapore-data-foundation-design.md`
- `2026-09-01-signedprice-unified-market-explorer-v2-design.md`
- `2026-09-01-signedprice-unified-building-decision-detail-design.md`
- `2026-09-01-signedprice-density-explore-check-design.md`

Where those documents differ, this addendum governs navigation continuity and Check artifact activation. The data-foundation design continues to govern collection, provenance, rights, completeness, and snapshot storage.

## 2. Current Production Gaps

1. Guide index and article routes render their content without the shared site header and footer, so users lose market and product navigation.
2. Explore, Detail, Rankings, and Check do not yet use one canonical state codec, so selected transaction type and location can be lost between pages.
3. Check reads a conversion artifact from environment configuration and fails closed when that artifact or its metadata is absent. Large data artifacts should instead be resolved through the snapshot registry and private object repository.
4. The currently visible building count represents the price-ready cohort, not the discoverable building inventory. Inventory coverage and transaction coverage must be reported separately.
5. Sale, jeonse, and monthly-rent coverage are not yet activated through a single route-model boundary, creating inconsistent labels and availability across surfaces.

## 3. Product Chrome

### 3.1 Shared header

Guide index and Guide document pages must render the existing `SiteHeader` with:

- market row: Korea, Singapore, Dubai;
- product row: Check, Explore, Rankings, Briefs, Guide;
- `Guide` marked active on Guide routes;
- the same responsive menu behavior, width tokens, typography, borders, and focus states used elsewhere.

Guide pages also receive the shared footer. Building-specific tabs such as Overview, Rent, Buy, Invest, and Evidence remain exclusive to a selected building Detail page and must not appear on Guide.

### 3.2 Page ownership

Route pages own global chrome. Feature components own only their page content. This prevents a feature component from accidentally omitting or duplicating navigation.

### 3.3 Density

Content pages keep a readable editorial measure inside the shared shell. Data workspaces may use the wider Explore measure, but descriptive copy and ranking tables use the established compact content tokens rather than full-viewport rows.

## 4. Canonical Market Selection

The application defines one `ExplorerSelection` model and one codec for parsing, validating, normalizing, and serializing its URL representation.

```ts
type ExplorerSelection = {
  market: "kr" | "sg" | "ae";
  transaction: "sale" | "jeonse" | "monthly" | "rent";
  propertyType?: string;
  district?: string;
  neighborhood?: string;
  buildingId?: string;
  contractType?: "new" | "renewal" | "all";
  sort?: string;
};
```

Rules:

- Market determines allowed transaction types. Korea supports sale, jeonse, and monthly; Singapore supports sale and rent; unsupported combinations are removed during normalization.
- IDs and enum values are allow-listed. Free-form search text is not forwarded between decision tools unless explicitly re-entered.
- Empty, invalid, or unknown fields fall back to the route's safe default and never cause a render failure.
- Canonical URLs omit default values and order query keys deterministically.
- No personal details, quote amounts, or secrets are stored in shared navigation URLs.

### 4.1 Navigation continuity

- Explore → Detail preserves transaction, district, neighborhood, and building selection.
- Detail → Explore returns to the prior selection and map context.
- Explore or Detail → Check may preselect market, transaction, and verified building identity; monetary inputs remain local to Check.
- Rankings → Explore carries the selected transaction and district.
- Guide uses clean canonical article URLs. Contextual article actions may link into Explore or Check with a validated market selection.
- Back, forward, refresh, copied URLs, and mobile navigation must restore the same normalized selection.

## 5. Snapshot Registry Normalization

The snapshot registry adds Korea conversion evidence as an independent dataset. The required Korea dataset IDs are:

| Dataset | Purpose | Primary consumers |
|---|---|---|
| `kr-building-registry` | Building identity, address, type, coordinates | Explore discovery, Detail identity |
| `kr-sale` | Official sale contracts | Explore, Detail, Rankings |
| `kr-rent` | Official jeonse and monthly-rent contracts | Explore, Detail, Rankings |
| `kr-conversion` | Verified deposit-to-monthly conversion curve | Check |

Each active snapshot record includes dataset, market, period, object key, SHA-256 digest, schema version, collected time, source metadata, rights status, completeness status, row counts, and activation state.

Large snapshots are stored in the private artifact repository. Runtime environment variables contain only repository and deployment configuration, never the serialized dataset itself. Route models resolve an active registry entry, fetch its object, verify its digest and schema, and only then expose a compact public view model.

### 5.1 Activation dependency matrix

| Surface | Required activation | Behavior when absent |
|---|---|---|
| Explore building discovery | `kr-building-registry` | Show an explicit inventory-unavailable state |
| Explore/Detail/Rankings sale | `kr-building-registry` + `kr-sale` | Disable Sale with coverage explanation |
| Explore/Detail/Rankings jeonse/monthly | `kr-building-registry` + `kr-rent` | Disable affected mode with coverage explanation |
| Check calculation | `kr-conversion` | Keep form calculation unavailable and show evidence status |

One dataset activation must not imply that unrelated data is ready. Activating sale data updates sale-capable Explore, Detail, and Rankings surfaces but does not activate Check.

### 5.2 Inventory and coverage counts

UI copy distinguishes:

- discoverable buildings: valid records in the active building registry;
- transaction-covered buildings: buildings matched to at least one active transaction snapshot;
- price-ready buildings: buildings meeting the surface's minimum evidence policy;
- visible results: the current filtered result count.

The product must never label a filtered or price-ready count as the total number of buildings.

## 6. Korea Transaction Model

All Korea transaction parsers normalize official source rows into a shared contract identity and keep raw provenance references server-side.

Required normalized fields include:

- market and dataset;
- stable building identity or an explicit unmatched reason;
- district, neighborhood, and normalized address;
- property type and area;
- contract date and contract type when available;
- sale price, or rent deposit and monthly rent as applicable;
- source period, source record identity, and snapshot digest.

Unmatched rows remain measurable in completeness reports but are not silently attached to a nearby building. Aggregations expose sample size, period, methodology, and evidence state next to any median, change, or ranking.

## 7. Check Conversion Evidence

The Check calculation is independent of the raw sale and rent browsing modes. Its conversion curve is produced by a server-side job from eligible, matched official rental contracts under the approved method:

```text
monthly equivalent = monthly rent + round(deposit × annual rate ÷ 12)
```

The entire deposit is normalized. The curve builder records period, included and excluded rows, grouping rules, sample thresholds, annual rate source, and output digest.

Before activation, the generated curve must pass:

- schema validation;
- digest verification;
- minimum sample and coverage thresholds;
- monotonicity and boundary tests where required by the method;
- comparison against fixed reference fixtures;
- human approval of the artifact and methodology summary.

Check continues to fail closed if any requirement is missing or invalid. The user sees a precise evidence-status message, never a guessed calculation.

## 8. Failure and Security Behavior

- Official-data collectors, object access, and third-party credentials run server-side only.
- Public route handlers return bounded view models, not raw provider payloads or private object keys.
- Stale snapshots may be displayed only when the registry marks them publishable and the UI labels their period and freshness.
- Digest, schema, rights, or completeness failures prevent activation.
- Map provider failure degrades the map panel without crashing result lists or navigation.
- Invalid URL state is normalized without reflecting unsafe text into HTML or logs.

## 9. Test Strategy

### 9.1 Contract and unit tests

- Guide index and document routes include one shared header and footer and mark Guide active.
- The selection codec round-trips every supported transaction and drops invalid combinations.
- Canonical serialization is deterministic.
- Snapshot repositories reject missing objects, digest mismatches, invalid schemas, and inactive entries.
- Route models expose the correct enabled modes for each activation combination.
- Inventory, covered, price-ready, and visible counts remain distinct.
- Check remains unavailable without an active valid conversion snapshot and calculates fixed fixtures correctly when one is active.

### 9.2 Integration and browser tests

- Explore → Detail → Explore preserves selection and map context.
- Rankings → Explore preserves transaction and district.
- Detail → Check preselects only permitted context.
- Guide navigation reaches all product surfaces on desktop and mobile.
- Sale, jeonse, and monthly modes render only after their dependency snapshots are active.
- Map SDK failure preserves the non-map experience.
- No page has horizontal overflow at supported mobile and desktop widths.

## 10. Release Sequence

1. **Navigation foundation:** add shared Guide chrome, `ExplorerSelection` codec, canonical links, and regression tests.
2. **Artifact normalization:** extend the snapshot registry and repository, migrate Check away from serialized environment artifacts, and preserve fail-closed behavior.
3. **Korea transaction activation:** connect building registry, sale, and rent snapshots to shared route models; expose sale, jeonse, and monthly modes with accurate coverage counts.
4. **Decision-surface completion:** wire Detail, Rankings, Guide contextual actions, and Check handoffs; complete responsive and browser verification.
5. **Production rollout:** activate only verified snapshots, deploy, run end-to-end production checks, and retain a reversible previous activation pointer.

Each release is independently buildable and testable. A later release must not be used to hide a broken earlier release.

## 11. Acceptance Criteria

- Guide has the same two-tier navigation and footer as the rest of SignedPrice.
- Explore, Detail, Rankings, Check, and Guide contextual actions use the canonical selection codec.
- Korea Explore supports sale, jeonse, and monthly only when their active data dependencies are valid.
- Building inventory and transaction coverage counts are truthful and separately labeled.
- Detail and Rankings update from the same active snapshots as Explore.
- Check consumes a verified registry-backed conversion artifact and remains unavailable otherwise.
- All data-derived values show evidence period, sample state, and source provenance at the appropriate level.
- Unit, integration, browser, build, and production smoke checks pass before promotion.
