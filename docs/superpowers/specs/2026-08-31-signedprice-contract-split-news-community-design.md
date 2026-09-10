# SignedPrice Contract Split, News, and Community Design

**Status:** Product direction approved; implementation plan pending review

**Date:** 2026-08-31

**Scope:** Seoul new/renewal evidence, verified News, and structured community responses, expressed as reusable global-platform contracts

## 1. Product decision

SignedPrice is a global real-estate decision platform. Seoul rent is the first evidence-complete market, not the platform boundary. New/renewal evidence, News, and Community are part of the product and must remain visible in the information architecture. They may show an honest unavailable or collecting state, but they must not be silently removed merely because a backend dependency is unfinished.

The initial community product is **structured evidence feedback**, not a free-form forum. A user answers whether SignedPrice's evidence looks higher than, similar to, or lower than what they are seeing, and may select one bounded reason. Individual submissions are never published. Aggregates appear only at the privacy threshold.

This document amends these older constraints:

- `2026-08-31-signedprice-contract-decision-platform-design.md` section 8 no longer treats all News and Community surfaces as fake surfaces to omit.
- `2026-08-31-signedprice-global-trust-detail-singapore-design.md` section 6 no longer defers structured aggregate feedback; only free-form community remains deferred.
- `2026-08-31-signedprice-ui-handoff.md` is paused where it says to omit split, News, and Community UI. Its artifact-safe district summary work remains reusable.

No unavailable number is invented. Visibility means a truthful product surface, not placeholder claims.

## 2. Shared global architecture

The three capabilities share platform contracts but keep market-native evidence and vocabulary.

```text
official market source -> strict market adapter -> versioned evidence artifact
                                                -> route model -> decision UI

official publication -> verified News record ----^

bounded user response -> protected write API -> durable aggregate repository
                                               -> thresholded community signal
```

Country adapters own source parsing, rights, local terminology, currency, and market-specific reason taxonomies. `@signedprice/market-core` may own generic evidence status, content provenance, and thresholded aggregate types. Korean jeonse and 신규/갱신 semantics must not leak into Singapore.

Every public value must identify one of three origins:

1. verified official-source artifact;
2. SignedPrice calculation from identified artifacts;
3. thresholded community aggregate.

The UI never visually blends these origins without a label.

## 3. New and renewal contract evidence

### 3.1 Existing data and corrected boundary

The MOLIT parser already records `contractType` as `new`, `renewal`, or `unknown`. The current public area artifact serializes only the combined distribution, even though the public summary job already counts contract types for the city finalization. The missing UI is therefore an artifact-boundary issue, not a missing-source issue.

The public area artifact advances from `signedprice-public-area-summary-v1` to a new exact-key version. The v1 repository remains readable during one deployment transition; v1 renders `All` with an explicit `New/renewal split not available in this snapshot` state. A v1 artifact is never relabeled as new-only.

### 3.2 Artifact v2

The v2 payload has three independently computed summary groups and explicit unknown counts:

```ts
type ContractGroup = 'all' | 'new' | 'renewal';

type PublicAreaSummaryGroup = Readonly<{
  citySummary: PublicMarketSummary;
  districtSummaries: readonly PublicMarketSummary[]; // exact Seoul district order
}>;

type PublicAreaSummaryArtifactV2 = Readonly<{
  artifactVersion: 'signedprice-public-area-summary-v2';
  generatedAt: string;
  provenance: PublicAreaProvenance;
  groups: Readonly<{
    all: PublicAreaSummaryGroup;
    new: PublicAreaSummaryGroup;
    renewal: PublicAreaSummaryGroup;
  }>;
  unknownContractCounts: Readonly<{
    city: number;
    districts: readonly number[]; // exact Seoul district order
  }>;
}>;
```

`all` contains every eligible non-cancelled contract, including records whose contract type is unknown. `new` and `renewal` contain only their exact source values. Unknown records are never assigned to either split.

The finalization job computes each group directly from source records. It does not derive split medians from the combined distribution.

### 3.3 Validation invariants

The parser fails closed unless all of the following are true:

- root, provenance, group, summary, and unknown-count keys are exact;
- artifact, parser, endpoint, rights, market, period, and generated time are valid;
- all three groups contain one city and exactly 25 district summaries in canonical order;
- every summary has the correct group-independent identity, band, deal, parent, and period;
- each group's city count equals the sum of its district counts;
- for city and every district, `all.n === new.n + renewal.n + unknownCount`;
- counts are non-negative safe integers;
- a split distribution publishes only when that split independently reaches the existing publication minimum;
- all published five-number summaries are ordered and three-month changes are valid;
- digest and source-completeness checks pass where the artifact transport requires them.

Publication threshold and contract type are separate concepts. Five combined contracts do not authorize a two-record renewal distribution.

### 3.4 User interface

District and building evidence modules expose a three-way control: `All`, `New`, `Renewal`.

- `All` is the district/explorer default and always means the combined eligible population.
- `New` and `Renewal` recompute every displayed count, median, middle half, range, and change from their own summary.
- An under-threshold split stays selectable and renders its count plus the publication rule, with no money values.
- A v1 snapshot shows disabled split choices with the precise snapshot limitation; it never hides that the product supports the split.
- Unknown contract count is disclosed beside the control. It is not a fourth price-distribution tab.
- The distribution scale may use the `All` range as a stable comparison axis, but labels and values always come from the selected group.
- URL state uses a validated query such as `?contract=all|new|renewal`; invalid values resolve to `all`.

Contract Check keeps its existing calculation policy: it may prefer new-contract comparables only when the policy's evidence threshold is met, and must disclose any fallback to the broader pool. That behavior is distinct from the Explore default.

## 4. Verified News

### 4.1 Role

News is not a generic scraped property feed. It translates official market publications and SignedPrice artifacts into evidence-backed briefs that help users make a decision.

The primary Seoul route is `/kr/seoul/news/`, with `/kr/seoul/news/[slug]/` for a brief. While Seoul is the only Korean market, `/kr/news/` may permanently redirect to the Seoul index. The global header has four primary destinations: Check, Explore, News, and Guide.

### 4.2 Record contract

```ts
type VerifiedNewsRecord = Readonly<{
  schemaVersion: 1;
  id: string;
  slug: string;
  marketId: string;
  language: 'en';
  category: 'official-update' | 'data-brief' | 'methodology' | 'correction';
  title: string;
  summary: string;
  publishedAt: string;
  updatedAt: string | null;
  source: Readonly<{
    publisher: string;
    title: string;
    url: string;
    publishedAt: string | null;
  }>;
  evidence: Readonly<{
    status: 'verified' | 'not-confirmed' | 'not-applicable';
    line: string; // rendered after the fixed label `Our data:`
    artifactIds: readonly string[];
  }>;
  body: readonly NewsBlock[];
}>;
```

Records are strict, server-rendered, version-controlled content at first. They store a source citation and original SignedPrice prose, not copied article bodies. Every record renders a visible `Our data:` line.

- `verified` requires each numeric statement to reconcile with an exact artifact.
- `not-confirmed` renders `No completed-period comparison is available` or another precise reason; it cannot contain an unverified number.
- `not-applicable` is reserved for methodology or correction items where a market comparison is irrelevant.

An automated weekly brief is allowed only after two completed-period artifacts are retained and validated. It compares like-for-like bands and contract groups. Missing previous snapshots, source incompleteness, or a schema transition produces no automated numeric brief.

### 4.3 Editorial and correction rules

- No scraped portal content or third-party asking-price claim becomes SignedPrice evidence.
- No LLM-generated number is published without artifact reconciliation.
- A changed claim updates `updatedAt` and links to a correction record when material.
- Source access failure never rewrites an already published historical brief; it affects only new ingestion.
- The feed can launch with a small set of official-source and methodology briefs. It does not require a CMS or database for P1.

## 5. Structured community evidence

### 5.1 Product interaction

The component is called `Community signal`, not `Forum` or `Reviews`. On a district or verified building evidence view it asks:

> Compared with SignedPrice's evidence, what are you seeing now?

The first answer is one of:

- `HIGHER`
- `SIMILAR`
- `LOWER`

The optional reason is one of:

- `LINE`
- `ASPECT`
- `FLOOR`
- `REMODEL`
- `VIEW`
- `NOISE`
- `OTHER`
- `null`

There is no free text, user name, email, exact address, asking price, signed price, image, link, or direct message. These constraints sharply reduce privacy and moderation risk while producing a comparable local signal.

### 5.2 Submission contract

```ts
type EvidenceResponseInput = Readonly<{
  schemaVersion: 1;
  marketId: 'kr-seoul';
  scopeType: 'district' | 'building';
  scopeId: string;
  evidenceId: string;
  direction: 'HIGHER' | 'SIMILAR' | 'LOWER';
  reason: 'LINE' | 'ASPECT' | 'FLOOR' | 'REMODEL' | 'VIEW' | 'NOISE' | 'OTHER' | null;
}>;
```

The server supplies `createdAt`, `updatedAt`, and a rotating pseudonymous respondent key. The client cannot submit aggregate counts, timestamps, publication state, or identity fields. Exact keys and enums are validated before storage.

`evidenceId` binds a response to the artifact period and selected contract group the user saw. A new completed-period artifact starts a new aggregate rather than silently carrying stale sentiment forward.

### 5.3 Identity, replacement, and abuse controls

- A first-party, `HttpOnly`, `Secure`, `SameSite=Lax` opaque cookie identifies one browser installation.
- The stored respondent key is an HMAC-derived value using a server-only rotating secret. Raw cookie values and IP addresses are not stored in the response row.
- One respondent has at most one active response per `marketId + scopeType + scopeId + evidenceId`.
- A later submission is an upsert that replaces that respondent's earlier direction/reason. It does not increment the public sample twice.
- POST verifies origin, content type, payload size, exact schema, route scope, and current evidence identity.
- Per-respondent and coarse network rate limits protect writes. Network data is used ephemerally for abuse control and is not exposed as community evidence.
- Enumerated content needs no public text moderation queue. Operational metrics still track rejected writes, abnormal replacement rates, and coordinated spikes.

### 5.4 Storage and API boundary

Community writes require transactional durable storage. A portable PostgreSQL repository is the initial contract; an in-memory map, environment variable, filesystem, browser storage, or append-only object is not an acceptable Production substitute.

The implementation exposes a server-only repository interface and SQL migration. Provider provisioning is a separate operational action because it may create an external billable resource. Until a compatible database and secrets are configured:

- the `Community signal` module remains visible;
- it renders `Community responses are not open yet` and the precise storage/configuration reason;
- its form is not interactive;
- it never claims a response was saved.

The initial endpoint is `/api/community/evidence-response`:

- `GET` returns only the thresholded aggregate for an allowlisted current evidence scope;
- `POST` performs the protected upsert and returns the caller's selection plus either a published aggregate or the collecting state;
- `DELETE` removes the caller's active response for that evidence scope;
- raw rows and respondent keys have no public endpoint.

Page Server Components may read the same aggregate repository directly. Browser responses use `Cache-Control: private, no-store` when they include the caller's selection. Anonymous published aggregates may use bounded revalidation keyed by scope and evidence ID.

### 5.5 Publication and display

The publication minimum is five distinct active respondents for one exact evidence scope.

- Below five, the UI says `Responses are being collected` and reveals neither the exact count nor direction/reason breakdown.
- At five or more, the UI shows total response count, Higher/Similar/Lower percentages and counts, and reason counts only when each displayed reason independently meets five.
- Suppressed reason counts are combined into `Other responses`; subtraction must not make a suppressed count inferable.
- Percentages are derived from integer counts, use a documented rounding rule, and display a total of 100% after deterministic remainder allocation.
- Community signal is labeled `Community response`, never `reported contract`, `official`, `valuation`, or `market price`.
- It does not change the official median, ranking, Contract Check calculation, or News evidence line.
- A short caveat states that the response is self-selected and not a representative survey.

## 6. UI composition

### Explore

The map remains the primary surface. Selecting a district opens the 460px evidence panel rather than immediately navigating away. The panel contains:

1. district identity and period;
2. All/New/Renewal control;
3. count, median, middle half, range, and change for the selected group;
4. explicit unknown-contract disclosure;
5. detail action.

News and Community do not compete with map selection in the compact panel.

### District detail

The main column contains the selected split evidence, Quote/Contract Check entry, verified buildings, methodology, and source boundary. The contextual rail contains:

1. latest relevant verified News items;
2. Community signal for the same district and evidence ID;
3. Rankings and nearby-district navigation;
4. corrections and evidence freshness.

### Building detail

The same composition is used only when the building artifact is verified. Community scope uses the stable building ID, never a display name. Unsupported physical facts remain absent rather than being inferred from community reasons.

### Responsive behavior

At narrow widths the rail becomes a document section after official evidence and before nearby navigation. The split control remains keyboard-operable and scroll-free at 390px. All actions are at least 44 CSS pixels, focus is visible, and no community response is required to use the official evidence.

## 7. SEO, indexing, and migration

- Evidence-complete Seoul Explore, district, Rankings, News index, and verified News articles may be indexable after their content and metadata gates pass.
- Query variants for `contract` are not separate canonical pages; canonical points to the clean route.
- Community aggregate content is supplementary and never the sole reason a route becomes indexable.
- Submission APIs, collecting states, unavailable market routes, and private caller state are never indexed.
- KoreaHomeGuide migration remains cohort-based. A SignedPrice destination must be indexable, content-complete, canonical-correct, and monitored before its matching KoreaHomeGuide URL redirects.
- Singapore routes remain contained until their URA artifact and rights gates pass. These shared News and Community contracts may later support Singapore without copying Korean labels.

## 8. Delivery sequence

Implementation is split into reviewable releases; one unfinished dependency must not block all product progress.

### Release A — Correct the evidence UI foundation

- preserve the current artifact-safe district summary work;
- amend tests that require split, News, and Community to be absent;
- finish the 460px Explore panel and responsive district/detail composition;
- render explicit v1 snapshot states for split and Community storage readiness.

### Release B — Public area artifact v2 and split UI

- add RED/GREEN source-finalization, builder, parser, repository, route-model, UI, and migration tests;
- generate All/New/Renewal groups and unknown counts from raw records;
- install the verified v2 Preview/Production artifact without removing v1 rollback support;
- verify city/district reconciliation and live split behavior.

### Release C — Verified News

- add strict News records, index/detail routes, four-tab navigation, source/evidence blocks, sitemap and metadata policy;
- launch with verified official-source/methodology briefs;
- add snapshot-history automation only after two completed artifacts exist.

### Release D — Structured Community

- add schema, repository interface, SQL migration, protected API, threshold aggregation, unavailable/collecting/published UI, and privacy tests;
- verify the disabled state without a store;
- provision and connect a durable PostgreSQL provider only with explicit operational authorization;
- run live upsert/replacement/delete/threshold tests before enabling Production writes.

### Release E — Singapore evidence

- continue the existing server-only URA adapter and strict artifact plan;
- reuse global Trust, News provenance, and structured Community contracts only after Singapore-native schema and rights review;
- expose no empty global market tab.

The official logo package remains an independent blocked asset task until the original archive bytes are reattached. It is installed exactly and is never redrawn from memory.

## 9. Verification gates

### Contract split

- source parser preserves all three types;
- each split distribution is computed from only its own records;
- all/new/renewal/unknown counts reconcile at city and every district;
- under-threshold splits expose count but no money;
- v1 fallback never mislabels combined evidence;
- URL, keyboard, reload, mobile, and stable-axis behavior pass.

### News

- exact-key parsing rejects unknown or incomplete records;
- every item contains a valid source and visible `Our data:` line;
- every numeric claim reconciles with declared artifacts;
- no copied article body, unverified number, or client secret is present;
- metadata, canonical, sitemap, structured data, and correction links pass.

### Community

- exact schema, origin, cookie, HMAC, rate, and scope/evidence validation pass;
- one respondent cannot create duplicate active rows;
- replacement and deletion produce correct aggregates transactionally;
- four responses reveal no exact count or breakdown; five publish;
- reason suppression cannot be reverse-engineered from rendered totals;
- disabled storage never accepts or claims a saved response;
- no raw response, respondent key, IP, or private cookie reaches public HTML, analytics, logs, or client bundles.

### Full release

- focused TDD for each task, all V2 regressions, lint, typecheck, production build, and boundary scans;
- 390/720/1366/1440 browser verification, keyboard order, 44px targets, overflow, console, and 5xx checks;
- exact-SHA Vercel Preview with live artifacts;
- runtime error review, SEO/indexing checks, and KoreaHomeGuide preservation;
- Production promotion remains a separate action after Preview passes.
