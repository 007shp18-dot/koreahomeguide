# Additional property data: verified source inventory

Checked 2026-09-10 work session (UTC environment still reports 2026-09-09). This is source research and implementation input, not evidence that all collectors are running or all amounts are approved. Page monitoring creates internal review evidence; it does not make a cost calculator ready.

## Source registry and actual access

| Market / data | Official source | Cadence | Verified access / remaining gate |
|---|---|---|---|
| Seoul common management and repair costs | [MOLIT K-apt API catalog 15057937](https://www.data.go.kr/data/15057937/openapi.do) | Monthly, reread recent months for corrections | Official embedded Swagger recovered, current **V3**, 17 operations. Requires serviceKey and service subscription; no authenticated cost response verified in this task. Catalog says free, unrestricted license, development quota 5,000, automatic development/production approval. |
| Seoul building facts | Existing AptListService4, AptBasisInfoServiceV5, BldRgstHubService collectors | Weekly and on discovery | Reuse existing code and credentials. Existing facts availability does not prove building-register API authorization. Match K-apt code and legal address, or unambiguous ledger key; do not fuzzy-join similar names. |
| Seoul address / coordinate enrichment | [Official address API documentation](https://business.juso.go.kr/jst/jstRoadNmAddrApiSearch) | Weekly and on discovery | Requires separately scoped confmKey. Direct response returned a small HTML shell, not an address data sample. Store original coordinate CRS; never interpret projected coordinates as latitude/longitude. |
| Seoul broker fee policy | [Seoul current fee table](https://land.seoul.go.kr/land/broker/brokerageCommission.do), [effective-date announcement](https://news.seoul.go.kr/citybuild/archives/514396) | Weekly change check | Official readable pages. Fees are negotiated up to the cap and VAT is separate; not a mandatory flat fee. Rule applicability and effective date require review. |
| Singapore HDB buildings | [HDB property information](https://data.gov.sg/datasets/d_17f5382f26140b1fdae0ba2ef6239d2f/view) | Weekly | Actual API returned HTTP 200, success=true, total 13,357. First record: block 1 BEACH RD, max floor 16, completed 1970, 142 dwelling units. No coordinates in this record. |
| Singapore address / coordinates | [OneMap Search](https://www.onemap.gov.sg/apidocs/search), [authentication](https://www.onemap.gov.sg/apidocs/authentication) | On unresolved building, weekly retry | Actual no-token sample returned HTTP 200 and ION ORCHARD coordinates. Documentation explicitly requires token; provision documented authentication for production instead of assuming this unauthenticated behavior persists. |
| Singapore management tariff | [Ang Mo Kio Town Council S&CC](https://www.amktc.org.sg/service-and-conservancy-charges-scc/index.html) | Monthly | Actual HTTP 200 gzip HTML successfully decoded, contains residential and commercial monthly rates and historical tables. Requires council-boundary, flat type and eligibility matching. Not a Singapore-wide condo management fee. |
| Singapore acquisition tax | [IRAS BSD](https://www.iras.gov.sg/taxes/stamp-duty/for-property/buying-or-acquiring-property/buyer's-stamp-duty-(bsd)), [IRAS open dataset](https://data.gov.sg/datasets/d_611a3ae502e72fd1ce8adb4e54abfc64/view) | Weekly | Official page readable; actual dataset API 200, 63 rows including historical rules from 2003. Filter rule periods and transaction types before review; never use first row as current rate. |
| Dubai registration fees | [DLD sale registration](https://dubailand.gov.ae/en/eservices/property-sale-registration/) | Weekly | Readable official amounts and conditions, but no rule effective date on service page. Last-site-update date is not effective date. Pending policy review. |
| Dubai management charges | [DLD/RERA service charge index](https://dubailand.gov.ae/en/eservices/service-charge-index-overview/) | Monthly | Service description and lookup page accessible. No verified bulk API or building/year rate response obtained. Pending access and reuse review; no fabricated AED/sqft values. |
| Dubai building / project data | [DLD real estate data](https://dubailand.gov.ae/en/open-data/real-estate-data/) | Weekly after rights review | Existing project dataset has canUseCommercially=false. Preserve that block; government provenance does not override the dataset terms. |
| Asking listings, all markets | Authorized broker/developer feed or direct owner submission | Daily after agreement | No licensed feed or credentials verified. Keep disabled. PropertyGuru and Property Finder published terms restrict unauthorized automated collection; a third-party scraper does not confer permission. |
| Provider repair tariffs | Provider's own tariff or consented quotation | Monthly | No complete, permission-verified provider rate row obtained. Store service scope, minimum/call-out charges, materials, taxes, location and valid period before use. K-apt actual common-area repair expense is a different metric. |

K-apt also publishes a [weekly management download announcement](https://www.k-apt.go.kr/web/board/webReference/boardView.do?boardType=03&seq=21). The checked announcement states a 2026-09-09 extract, warns that records can be corrected, and prefers the API for current accuracy. Download links were not obtained; do not claim an Excel import succeeded. The K-apt homepage direct HTTP 200 was only a 97-byte script redirect: status 200 alone must not count as a successful data fetch.

## Concrete API contracts

### K-apt management / repairs

Official specification embedded in catalog 15057937 identifies:

```text
https://apis.data.go.kr/1613000/AptCmnuseManageCostServiceV3
GET /getHsmpRepairsCostInfoV3
GET /getHsmpCleaningCostInfoV3
GET /getHsmpGuardCostInfoV3
GET /getHsmpFacilityMntncCostInfoV3
GET /getHsmpElevatorMntncCostInfoV3
GET /getHsmpConsignManageFeeInfoV3
Query: serviceKey, kaptCode, searchDate (occurrence year/month)
```

Validate response.header.resultCode=00 and response.body.item.kaptCode against the requested complex. Preserve kaptName. The repair field is lrefCost1. The official field description only says repair cost; unit and denominator must be confirmed before converting this into a per-home monthly estimate. Preserve raw amount as review evidence without inventing KRW/sqm or per-unit semantics. Do not add both an aggregate management total and its component expenses into one calculator.

A no-serviceKey request to the repair operation returned HTTP 400 with INVALID_REQUEST_PARAMETER_ERROR (code 10). This proves only that the request was rejected, not whether the application's existing key has this subscription. No amount sample was returned.

### HDB building facts

```text
GET https://data.gov.sg/api/action/datastore_search
  ?resource_id=d_17f5382f26140b1fdae0ba2ef6239d2f&limit=1
```

Map blk_no+street to canonical HDB address identity, max_floor_lvl to maximum floor, year_completed to completion year, total_dwelling_units to dwelling count. Retain bldg_contract_town as source code, not an assumed current Town Council. Retain residential/commercial flags; do not infer a building is exclusively residential. Pagination must finish and totals must be validated before publishing a complete snapshot.

### OneMap observed sample

```text
GET https://www.onemap.gov.sg/api/common/elastic/search
  ?searchVal=ION%20ORCHARD&returnGeom=Y&getAddrDetails=Y&pageNum=1
```

Observed one result: address 2 ORCHARD TURN ION ORCHARD SINGAPORE 238801; latitude 1.303979741445055, longitude 103.832032328465. Use LATITUDE/LONGITUDE for geographic coordinates, not X/Y. A single successful lookup is not coverage proof or a substitute for documented authentication and usage terms.

## Six actual cost samples for pending review

Source for all six rows: [AMK Town Council S&CC page](https://www.amktc.org.sg/service-and-conservancy-charges-scc/index.html), **Tier 2 effective 2024-07-01**, SGD per flat per month. These are tariff evidence, not bills paid or estimates for every Singapore building.

| Sample key | Flat type | Rate class | Amount | Effective from |
|---|---|---|---:|---|
| amktc-scc-1room-normal-202407 | HDB 1-room | Normal | 61.10 | 2024-07-01 |
| amktc-scc-1room-reduced-202407 | HDB 1-room | Reduced | 23.10 | 2024-07-01 |
| amktc-scc-2room-normal-202407 | HDB 2-room | Normal | 64.90 | 2024-07-01 |
| amktc-scc-2room-reduced-202407 | HDB 2-room | Reduced | 34.10 | 2024-07-01 |
| amktc-scc-3room-normal-202407 | HDB 3-room | Normal | 75.10 | 2024-07-01 |
| amktc-scc-3room-reduced-202407 | HDB 3-room | Reduced | 53.20 | 2024-07-01 |

The normal-rate conditions include vacant or corporate-held flats, no Singapore-citizen owner/tenant/authorized occupier, and specified other-property interests. Store the complete eligibility reference and require a known classification before selecting reduced rates. Do not infer reduced eligibility from residence alone. The page also contains older 2023 rates; select by effective section. Jalan Kayu SMC moved payment contact to another council from 2025-08-01; confirm current council coverage before linking any address. Reuse permission for full page text is unverified: keep only bounded internal evidence and factual normalized rows pending review.

## Tax and fee evidence

IRAS residential BSD effective 2023-02-15: marginal rates 1%, 2%, 3%, 4%, 5%, 6% with cumulative SGD thresholds 180,000; 360,000; 1,000,000; 1,500,000; 3,000,000. Basis is the higher of consideration and market value; round down to dollars, minimum SGD 1. Store the entire schedule as one version; this is not total acquisition cost and excludes other applicable duties. [Official IRAS rules](https://www.iras.gov.sg/taxes/stamp-duty/for-property/buying-or-acquiring-property/buyer's-stamp-duty-(bsd)).

DLD currently displays seller 2% and buyer 2% of sale value; partner fee AED 4,000 plus VAT for sales at least AED 500,000 and AED 2,000 plus VAT below that threshold. The page also lists document/map fees. These are pending evidence because effective-date and exact applicable components require review; do not simply charge every listed fee or presume all seller-side fees belong to the buyer. [Official DLD service](https://dubailand.gov.ae/en/eservices/property-sale-registration/).

## Reuse and publication controls

[Singapore Open Data Licence](https://data.gov.sg/open-data-licence) permits commercial use subject to its conditions, including source and licence attribution. That permission applies to covered datasets; do not automatically extend it to every external website or third-party asset. [PropertyGuru acceptable use](https://www.propertyguru.com.sg/customer-service/acceptable-use) and [Property Finder user terms](https://www.propertyfinder.com/terms-and-conditions-users/) restrict automated retrieval. Asking-price ingestion remains agreement-gated.

Recommended evidence states: `sample_verified` (sample response only), `credential_required`, `subscription_unverified`, `page_monitor_only`, `unit_unverified`, `rights_review`, and `cost_ready` only after identity, currency, unit, period, applicability and approval are complete. An HTTP failure never means a cost is zero. Source retrieval time, rule effective time and public-release time are separate fields. These findings do not establish that any production jobs or public calculations have already been updated.
