# SignedPrice product roadmap

Updated 2026-09-09. The current priorities below supersede the older sequencing.
Historical release observations remain dated evidence; unresolved collection and
publication gates still require actual operational verification.

## Current checkpoint — 9 September: data coverage and accumulated evidence

Develop data collection alongside the shared UX and city content journeys. The
next source of lasting value is reliable regional coverage, verified links across
records for the same property, and a history of prices, conditions and ownership
costs that can be reproduced. Acquiring more public rows alone does not establish
that value.

The immediate Tokyo diagnosis is specific: the input accepts all 23 wards, but
the scheduled collection scope was fixed to Minato (`13103`). The 9 September
collector release now rotates through 23 wards and eight completed quarters,
one ward-quarter per hourly run. Verify actual publications before expanding
the visible filters. XIT001 contains anonymous
regional transactions; expanding ward coverage does not establish building-level
transaction identities.

See the [data collection roadmap](../superpowers/plans/2026-09-09-data-roadmap.md)
for city-specific fields, source boundaries, storage decisions and exit criteria.
The [user-contributed data roadmap](../superpowers/plans/2026-09-09-user-contributed-data.md)
adds optional buyer preferences, actual ownership costs and purchase experiences,
with explicit consent, review and deletion before collection is enabled.
The [9 September refresh review](../superpowers/plans/2026-09-09-refresh-review.md)
records the shared design and editorial scope; its dated verification notes are
not a substitute for current deployment or ingestion evidence.

| Priority | Work | Exit evidence |
| --- | --- | --- |
| P0 · coverage | Collect and validate all 23 Tokyo wards for a common officially available quarter, then extend reviewed historical coverage | Every ward has an explicit publication or source-status result; source/public counts agree; repeat collection adds no duplicates; failed batches preserve the prior publication |
| P0 · operations | Establish the actual four-city coverage and freshness baseline by region, period, housing type and transaction kind | Each public dataset has a target denominator, source period, successful retrieval time, publication version and source-specific delay threshold; deployed collectors are not assumed to be enabled |
| P1 · identity | Strengthen verified project/building IDs, aliases and cross-source links | Linked records retain their evidence and review status; sampled false matches and unresolved records are measured together; anonymous Tokyo rows remain regional |
| P1 · costs | Review an initial 10 property/project candidates per city for available management, repair, tenure or handover evidence | Each usable fact has its subject, unit, period, source and verification date; missing costs are not treated as zero; access and reuse conditions are checked before acquisition |
| P1 · history | Retain corrections and changing property facts; make compatible historical comparisons reproducible | Previous public results can be reconstructed from their evidence and calculation versions; source corrections and changing samples are distinguishable from market movements |
| Parallel · UX | Continue reducing the work needed to find and compare candidates within the shared Explore/detail design | Usable region/period choices, consistent controls and readable mobile layouts lead from search to evidence and cost comparison |
| Parallel · content | Extend the six-stage city journeys and five local issues per city using the collected evidence | Articles disclose periods, samples and assumptions, link to usable Explore/Check evidence, and generate aggregate evidence of actual downstream use |

Use the existing Neon/PostgreSQL foundation as the canonical store for collected
records, identity links, histories and publication versions. Google Sheets is an
optional operational surface for coverage summaries, review queues and editorial
status. Start with a one-way summary export if it is needed; spreadsheet edits
remain review proposals and do not directly publish prices. No Sheets integration
or four-city automatic ingestion is claimed complete by this roadmap.

Keep the collect → validate → publish → activate flow and retain the last good
version. The Seoul canary, later-market enablement, source rights, storage and
rollback gates recorded below remain open unless newer execution evidence closes
them. Updated UI, content or deployed collection code does not close those gates.

## Tools and photography implementation — 9 September

The Tools/media follow-up implements the first optional research submission
path: completed results expose the exact broad bands to be shared, explicit
consent precedes a first-party submission, and Neon retains them for 90 days with
browser-owned deletion and a daily expiry job. This is `user_scenario` product
research, separate from actual cost reports and official transactions. Cost
evidence uploads and public demand statistics remain later milestones.

The same follow-up repairs the photograph review queue and common detail layout.
The audit found 84 approvals, 40,451 pending rows, 40,430 unlicensed search links
and 26,568 duplicate URL uses. Candidate count is not usable coverage. Provider
candidates now coexist; source/license and visual review precede publication;
the review API supports source filters, oldest-first pagination, retraction and
audit events. See [photo review operations](../operations/building-photo-review.md)
and the [implementation plan](../superpowers/plans/2026-09-09-tools-media-polish.md).
Deployment and actual approved counts must be confirmed against the release.

## Historical audit checkpoint — 8 September

The three-city research journey is available and the production smoke check found
no unavailable states or HTTP 5xx responses on the sampled Home, Passport, Seoul,
Singapore, Dubai, Tools, News, Guides and Korean routes. Warm route transitions
were generally below two seconds. The first cold Home request took about fourteen
seconds and is the clearest current performance risk.

This release corrects reciprocal English/Korean/Chinese metadata, Korean social
images, and mobile navigation coverage. The mobile test contract now opens the
collapsed header before checking Home → Prices → Explore → Check, News → Guides,
Rankings and the Seoul/Singapore Explore journeys. Production verification still
requires the release browser suite; a local Chromium download was unavailable
during this audit.

The market refresh rollout remains deliberately bounded. Production allows only
`kr-seoul-sale`; its first canary safely recorded `configuration_missing` because
the runtime used the legacy MOLIT key name. The compatibility fix accepts either
key name. Do not enable Seoul rent, Singapore or Dubai jobs until the corrected
sale canary succeeds twice and the second run reconciles as unchanged.

### Priorities

| Priority | Work | Exit evidence |
| --- | --- | --- |
| P0 | Release the mobile navigation and SEO corrections | Mobile release projects pass; canonical, hreflang and social images are correct in production |
| P0 | Complete the Seoul sale refresh canary | First run receives and persists records; immediate repeat classifies exact records as unchanged |
| P0 | Reduce cold-start latency | Production cold-route samples are repeatable and the slowest path is explained or brought under the two-second target |
| P1 | Add validated publication from internal observations to versioned public snapshots | Validation, quarantine, last-good activation and rollback are exercised without removing current evidence |
| P1 | Roll out Seoul rent, then Singapore sale and rent one at a time | Each job passes first-run, idempotency, freshness and storage checks before the next is enabled |
| P1 | Automate daily official FX inputs for Passport | Source date is visible, stale data alerts, and the last valid rates remain available on provider failure |
| P2 | Connect Passport candidates to a compatible shortlist and comparison | Type, tenure, area, period and currency differences stay explicit; user assumptions can be saved |
| P2 | Add opt-in accounts and alerts | Consent, unsubscribe, retention and failure handling exist before notifications ship |
| P2 | Add verified professional handoff | Real partner identity, scope, consent and audit trail exist before any service claim is shown |

### Automatic update policy

Every automated dataset follows four separate gates:

1. Collect provider records into internal observations.
2. Validate schema, counts, freshness, duplicates and entity links; quarantine a
   failed batch without deleting prior evidence.
3. Build a versioned public projection with its source period and sample coverage.
4. Activate only a passing projection, retain the last-good version and provide a
   tested rollback.

Automate market refresh run/failure alerts, public-snapshot freshness, daily FX
freshness, broken internal links, sitemap/indexability drift, metadata reciprocity
and a small desktop/mobile journey suite. Keep Dubai ingestion disabled until its
storage and source-display gates are approved.

### Product simplification decisions

- Keep one user path: market or budget → evidence → Check/scenario → shortlist →
  compatible comparison. Prefer improving this path over adding more hubs.
- Remove user-visible links to unfinished property inventory, investment,
  brokerage, account or alert experiences. Preserve permanent redirects for any
  retired public URL with external value.
- Consolidate legacy duplicate entry pages and repeated explanatory cards only
  after their canonical destination and search traffic are checked.
- Do not restore the deprecated “Search this map” control or decorative legend
  without observed user demand.
- Never imply live listings, guaranteed returns, accounts, partners or licensed
  services before the corresponding system and real-world operation exist.

## Historical checkpoint — 7 September

- Tools, calculator and three-city Check design is merged in #181; typography
  follow-up is merged in #185. The latter records passing unit and browser CI.
- Long school, station and official-building facts were reflowed in #187.
- Seoul price articles link to building evidence/maps (#184), and Seoul/Singapore
  budget articles have deeper practical comparisons (#186).
- The exact user-reported broken-text symptom remains unconfirmed. Do not equate
  a readability improvement, merged code or an old screenshot with its resolution.
- Current continuation: preserve readable chart axes and tables on narrow screens,
  and verify the existing Explore accounting. See
  `docs/operations/2026-09-07-research-continuation.md` for scope and evidence.

Next bounded releases, in order:

1. Complete visual verification of charts, Tools, Check and long building facts;
   keep exact locations, approximate references and missing locations distinct.
2. Deepen source-backed evidence and make period/sample/coverage limits clear in
   each city. Dubai remains in scope; project evidence is still a separate task.
3. Connect Passport results through real candidate evidence to cost scenarios.
4. Save candidates and assumptions; compare compatible types, areas and periods.
5. Connect verified professional support and purchase workflows, then ownership
   and resale. Actual partner sourcing can proceed alongside product work.

Content and promotion support these steps: tie Seoul budget, Singapore buyer and
Dubai Ready/Off-Plan articles to existing tools; use observed discovery and tool
completion to judge progress. More edits alone do not establish user acquisition.

## Product direction

Build a property research service that can grow into cross-border investment support and licensed brokerage: research → shortlist → due diligence → professional connection → purchase → ownership and resale.

The operator reaffirmed that overseas investment and actual property buying/selling
are the destination, not an optional extension of a statistics or calculator site.
News, SEO and Guides are acquisition channels; Explore, Prices and Check establish
decision evidence; saved scenarios and candidate comparisons prepare an eventual
consented handoff into a real transaction. Current noncommercial operation does
not imply that brokerage, active listings or management are already offered.

Run two tracks in parallel: (1) the user journey from research to purchase and
resale, and (2) actual local partner sourcing, project/listing verification and
market-specific operating readiness. Do not postpone the second track until every
dataset is complete. Never invent partners, live inventory or professional services.

## Current sequence after the search-recovery release

This status supersedes the older release descriptions below. PR #176 is merged:
Dubai area comparisons and Check are live, Passport supports three-city budget
comparison, and the search-discovery fixes have shipped. Search Console
submission is complete according to the operator; actual indexing and traffic
recovery are not yet established. Leave the old-domain deployment unchanged.

1. Improve the existing three-city experience: readable copy, consistent cards,
   clear source periods and sample sizes, and complete links between Markets,
   Prices, Tools, Guides and News. Preserve the established brand.
2. Deepen Passport: connect budget results to useful area/project candidates and
   recorded transactions; distinguish buying-power estimates from current inventory.
3. Help readers evaluate a purchase: buyer eligibility, acquisition costs and
   operating scenarios, with Dubai Ready/Off-Plan area comparisons and Check.
4. Let readers retain a shortlist and compare compatible candidates, followed by
   account sync and alerts when those services are actually available.
5. Connect verified local professionals and purchase support, then ownership,
   rental management and resale. Begin real partner sourcing alongside product
   work; never imply a partner or brokerage service exists before it does.
6. Expand to Japan after the Dubai research journey and underlying data are stable.

Articles should answer concrete buying questions with adequate comparable samples
and link into this journey. Search eligibility thresholds are not sufficient
sample sizes for market-level analysis.

## Earlier implementation notes

The sections below preserve earlier decisions; statements about unreleased Dubai
area data describe earlier stages, not the current production status.

## Immediate quality and evidence-depth slice

- Keep the shared Explore frame and brand. Account for all matching results on the
  map, not only records with exact coordinates or the visible list page.
- Separate real-location clusters from explicitly approximate area-only groups.
  Use source-backed geographic membership; never save an area reference as a
  building coordinate or use it for distance, nearby amenities or valuation.
- Show total = located + area-only + no reliable map reference, with clickable
  district totals for records that cannot yet be placed. Counts are buildings or
  projects, not sale transactions or available listings.
- Review customer-facing wording, source periods and calculation formatting.
  Missing exact coordinates do not mean the underlying transaction evidence is
  invalid, and must not be described as a provider authentication failure.
- Dubai PR #167 includes a real 46-area/53-segment review aggregate. It remains
  draft/noindex and outside the installed runtime; source/unit review and actual
  production activation are not completed by committing the artifact.
- Next: finish Dubai evidence activation when its release record is ready, connect
  Check/scenario/share measurement, then compatible candidate comparison and saves.
  Project-level Dubai evidence precedes expansion to Japan.

## Release now: shared foundation, Seoul/Singapore and Dubai research

- Preserve the existing SignedPrice typography, white/navy surfaces, restrained blue actions, and common control sizes.
- One primary navigation order: Markets, Prices, Tools, News, Guides. Tools is the approved next release; keep five slots across languages. Market navigation stays separate. One footer with product, market and company columns.
- Explore uses a short page title and separate market/period context. Keep the same workspace frame across Seoul, Singapore and Dubai.
- EN/KO/中文 controls retain their positions. Link only actual translations or an explicitly available language destination; unavailable translations remain labelled. Preserve Seoul search/selection in available translated routes; use published translation groups for articles.
- Prices covers Seoul and Singapore transaction search, with Dubai clearly labelled area research. No fixed Seoul jeonse sample on the global page.
- Current News is the destination for local news links. External headlines cover all three markets with publisher and publication date.
- Prefer stored headlines for response speed; refresh collection after the response. Retain source freshness and explicit unavailable states.
- Dubai release: government annual/quarterly market releases, a selected-area directory/map, official project and service-charge checks, AED user-assumption calculator, news. It does not include individual transaction prices, active listings or brokerage.
- Verify desktop, mobile, tablet and wide layouts, navigation, selection, language links, price search and calculator before release.

Implementation and validation evidence: `docs/operations/2026-09-06-shared-navigation-dubai.md`. A commit or preview alone does not establish production completion.

## Sitewide benchmark, applied without changing the brand

Reference: Dubai Real Estate Data `/projects`, `/market`, `/areas`, `/compare` and `/methodology` (inspected 2026-09-06). Adopt its short headings, adjacent period/source context, aligned search and filters, result counts, compact comparison tables and chart-to-exact-data drill-down. Keep SignedPrice photography, typography and restrained blue links; do not copy its ticker, navigation sprawl, prose or datasets.

This release applies the shared heading to Markets, Prices, News, Guides and Dubai; flattens repeated hub cards; adds city-filtered Guides and monthly chart period controls; links home evidence to sources. Existing Explore list/map selection remains the central discovery flow. Later property comparison must use matching sale types, areas and periods, with currencies kept explicit.

## Next release: organic entry and decision tools

Approved: Tools hub, neutral standalone scenario routes, minimal Home/Prices entry links, verified building-to-tool context, localized return paths, completed Check link copying and privacy-safe completion measurement. Preserve the common design and all three market capabilities. Current implementation/verification record: docs/operations/2026-09-06-stable-home-fast-tools.md.

Measure discovery and tool completion before expanding article volume or adding accounts. Use observed demand to prioritize useful building/district content and cross-border buying questions. In parallel, deepen Seoul/Singapore evidence and acquire Dubai transaction data. Dubai precedes Japan. Saves/accounts follow a usable acquisition-to-decision flow.

## Next: deepen evidence and help readers keep a shortlist

1. Close remaining Seoul/Singapore address, coordinate and approved exact-building photo gaps. Extend Seoul monthly transaction history beyond the currently exposed recent observations. Track refresh dates and coverage explicitly.
2. Save properties, compare compatible properties side by side, retain user-entered cost scenarios. Start with a clearly described personal shortlist; add account sync and alerts only with corresponding controls.
3. Improve Korean/English/Chinese route coverage and substantive guides. Keep translated articles in matched groups. Measure search impressions, indexed useful pages, visits and successful detail journeys toward the user's monthly 100,000-PV goal.
4. Dubai transaction expansion requires an actual source agreement/display scope, source adapter, verified records, entity/coordinate mapping and sufficient comparable cohorts. A government press-release chart is not a substitute for property-level evidence.
5. Japan follows the current shared foundation and Dubai stage. Validate the initial city, official source coverage, currency/area conventions and foreign-buyer workflow before expanding routes.

## Professional services

- Verified partner profiles and scoped inquiry handoff, with the user's consent before sending property or personal information.
- Local brokerage, tax/legal and financing/remittance support connected to a documented due-diligence workflow.
- Purchase milestones, ownership costs, rental management and eventual resale support.
- Display actual people, qualifications and review history only when verified. Never fabricate authors, reviewers, inventory, returns or completion claims.

## Definition of done

A feature works from its public entry point through selection and detail, respects actual data availability, uses shared design rules, and has verified release evidence. Keep implemented, preview-verified and production-verified status distinct. Do not reopen the deprecated Search this map or decorative legend features without a demonstrated user need.
