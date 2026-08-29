# signedprice V2.1 Intelligence Marketplace Design

**Date:** 2026-08-29

**Status:** Approved product, brand, and architecture design; implementation planning authorized

**Product brand:** `signedprice`, styled lowercase

**Primary domain:** `signedprice.com`, founder-confirmed as purchasable; registration and DNS changes remain separate actions

**Base specification:** `docs/superpowers/specs/2026-08-29-dwellspan-v2-global-rebuild-design.md`

**Input memo:** `market-dealtype-axes.md`

## 1. Decision

signedprice V2.1 combines two complementary product engines:

1. a Hogangnono-style market-truth and repeat-use engine built on official transactions, map exploration, comparisons, saved decisions, alerts, and clearly sourced local information; and
2. a Juwai IQI-style cross-border transaction engine built on multilingual property distribution, verified partners, qualified enquiries, transaction support, and partner operating tools.

The platform is not a listings portal with market data added as decoration. Official and licensed market intelligence is the trust engine that qualifies user intent and makes marketplace enquiries more useful. Marketplace revenue must not change the official-data ranking or methodology.

The strategic shorthand is:

> Market truth creates trust; decision tools create intent; verified partners complete transactions.

## 2. Relationship to the V2 design and plans

This document extends the V2 global rebuild specification and replaces conflicting decisions in these areas:

- the initial product is no longer permanently account-free;
- the common model expands beyond market events to listings, projects, partners, enquiries, referrals, consent, and service orders;
- `market` no longer implies one data source or one rule set;
- `dealType` remains a user-facing route facet but is not the persistent event model;
- the cost model becomes component-based rather than four fixed monetary fields;
- data rights are enforced per source, dataset, capability, and consumer;
- Singapore and Dubai intelligence may include verified projects and partner-interest flows when advertising, licensing, and data rights permit them; and
- the long-term product includes a partner operating system, introduced only after lead quality and partner demand are demonstrated.

All other V2 constraints remain in force, including the new repository, independent deployments, versioned publication, exact URL migration, market isolation, no premature indexing, and explicit production approval.

The five implementation plans dated 2026-08-29 remain useful decomposition references but are not executable until revised against this specification.

### 2.1 Brand and visual identity decision

`DwellSpan` is retired as the working name. The approved product brand is `signedprice`, presented lowercase in public UI and wordmarks. Code identifiers may use `SignedPrice` where language conventions require PascalCase.

The founder-provided logo package is the canonical visual source. Its signature-line mark, small-size mark, inverse mark, mono mark, favicon, Apple touch icon, and color system are approved.

```text
ink       #0f172a
white     #ffffff
accent    #2563eb
accent-lt #60a5fa
muted     #64748b
```

The site wordmark is rendered as HTML using Geist rather than relying on SVG `<text>`. The mark is decorative when adjacent to the visible wordmark. The 16px-specific asset is used below 24px.

Approved brand descriptors:

- `Real prices. Local rules. Trusted experts.`
- `Real prices. Better property decisions.`
- `Global property intelligence and transaction network.`

The default OG card must not claim official Singapore or Dubai contract coverage before the relevant data-rights and publication gates pass. The approved neutral descriptor is `Property intelligence for Seoul, Singapore and Dubai`; market-specific cards identify only activated and sourced capabilities.

Public launch remains gated by trademark and English, Chinese, Korean, and Arabic adverse-meaning review. Domain purchase availability does not replace those checks.

## 3. Model basis

Juwai IQI publicly describes an online-to-offline platform combining international property distribution, multilingual marketing, real-estate professionals, lead handling, and agent technology. Its Atlas product combines CRM, lead tracking, listing tools, and training.

Hogangnono's current public product combines actual transactions, market prices, listings, building information, filters, saved-property management, alerts, resident conversations, broker price proposals, and enquiry flows.

signedprice adopts the underlying system logic rather than copying either interface or organization:

| Borrowed system logic | signedprice implementation |
| --- | --- |
| Official-data map creates repeat use | Market Truth with provenance and methodology |
| Saved homes and alerts build user history | Decision Account and Watchlists |
| Local information qualifies intent | Market rules, costs, and transaction readiness |
| Cross-border distribution creates demand | Multilingual verified project and listing surfaces |
| Professionals close complex transactions | Verified Partner Network |
| CRM improves response and conversion | Partner OS after product-market evidence |

Reference material:

- Juwai IQI: <https://juwaiiqi.com/>
- IQI Atlas: <https://iqiglobal.com/blog/iqi-atlas-ai-tools-faq/>
- Hogangnono: <https://hogangnono.com/>
- Korean residential monthly-rent conversion law: <https://www.law.go.kr/LSW/lsInfoP.do?lsiSeq=276291>

## 4. Product flywheel

```text
official or licensed data
→ map, market, area, and property intelligence
→ save, compare, alert, and scenario
→ verified listing or project enquiry
→ partner qualification and transaction support
→ settlement, ownership, and resale services
→ verified outcomes and better intent signals
```

Transaction outcomes may improve partner quality and user workflow, but they do not overwrite or fabricate official transaction records.

## 5. Product layers

### 5.1 Market Truth

- Official reported rent and sale contracts.
- Clearly separated asking prices, developer prices, valuations, and indices.
- Map-based market, area, building, and project exploration.
- Data period, correction, cancellation, source, methodology, and rights disclosure.
- Local place hierarchy and native terminology.
- Market-specific price, rent, area, and ownership-cost context.

### 5.2 Decision OS

- Rent Check and price-position checks.
- Rent-versus-buy scenarios.
- Initial cash, recurring housing cost, acquisition cost, and ownership cost.
- Compatible cross-city comparisons.
- Gross yield and verified or partial net-yield calculations.
- Foreign-buyer rules, transaction checklists, and required professional steps.
- Saved properties, saved areas, watchlists, alerts, and comparison sets.

### 5.3 Verified Marketplace

- Partner listings and developer projects.
- Multilingual presentation with source and advertiser identity.
- Official-contract and market context beside asking or developer price.
- Enquiry, viewing, video-tour, financing, tax, legal, moving, and management requests.
- `Sponsored`, `Partner listing`, and `Official transaction` labels that cannot be removed by advertisers.

### 5.4 Partner and Transaction Network

- Partner identity, license, market, languages, service scope, and verification state.
- Consent-aware lead qualification and matching.
- Response-time, acceptance, appointment, progress, complaint, and outcome tracking.
- Referral-agreement and attribution records.
- Partner CRM and listing distribution only after the lightweight network proves demand.

### 5.5 Ownership and Lifecycle Services

- Settlement and move-in services.
- Insurance, financing, tax, legal, telecommunications, and remittance referrals.
- Ownership cost and yield tracking.
- Rental management, sale, and reinvestment flows.

Unbuilt services remain visibly unavailable or waitlisted. They are never presented as active fulfilment.

## 6. Independent axes

No single `dealType` field may represent user intent, listing type, and observed market event.

### 6.1 Market

```ts
type MarketId = string & { readonly __brand: 'MarketId' };
type CurrencyCode = string & { readonly __brand: 'ISO4217' };
type LocaleCode = string & { readonly __brand: 'BCP47' };

type Market = {
  marketId: MarketId;
  countryCode: string;
  cityCode: string;
  nativeCurrency: CurrencyCode;
  timezone: string;
  supportedLocales: LocaleCode[];
};
```

Runtime schemas validate `marketId` against the market registry, country codes against ISO 3166-1, currency against ISO 4217, locale against BCP 47, and timezone against IANA identifiers. Adding Paris or London adds a market package and registry entry without editing a shared union.

A market is a product and geographic jurisdiction, not a data source. It can contain several sectors, sources, methodologies, and rights policies.

### 6.2 User intent

```ts
type UserIntent = 'rent' | 'buy' | 'sell' | 'invest';
```

User intent controls navigation and decision workflow. It does not change the identity of source data.

### 6.3 Listing type

```ts
type ListingType = 'rent' | 'sale';
```

Listing type applies only to advertised availability. It must not be used to label a reported transaction.

### 6.4 Market event type

```ts
type MarketEventType =
  | 'rent_contract'
  | 'sale_contract'
  | 'developer_sale'
  | 'asking_rent'
  | 'asking_sale'
  | 'valuation'
  | 'price_index'
  | 'rental_index'
  | 'service_charge'
  | 'mortgage_rate';
```

### 6.5 Housing sector

```ts
type HousingSectorCode = string & { readonly __brand: 'HousingSectorCode' };

type TenureCode = string & { readonly __brand: 'TenureCode' };
```

Sector values retain market meaning through the market registry. Initial examples include `private_residential`, `public_housing`, `hdb`, `executive_condominium`, and `officetel`. `freehold` and `leasehold` belong to `TenureCode`, not housing sector. Cross-sector or cross-tenure aggregation requires an explicit compatible methodology.

### 6.6 Asset type

```ts
type AssetType = 'development' | 'project' | 'building' | 'unit_type' | 'unit';
```

Individual-unit publication is disabled unless source rights and privacy rules explicitly permit it.

## 7. Place and area model

Callers use stable `GeoAreaId` values and do not construct market-specific source paths.

```ts
type GeoArea = {
  id: string;
  marketId: MarketId;
  parentId: string | null;
  level: 'city' | 'district' | 'neighborhood' | 'planning_area' | 'community';
  localizedNames: Record<string, string>;
  sourceRefs: Array<{ sourceId: string; sourceAreaId: string }>;
  geometryRef: string | null;
};
```

Seoul district and legal-dong codes, Singapore planning areas, and Dubai communities remain source-specific references behind the shared ID.

## 8. Source and rights model

```ts
type DataSource = {
  sourceId: string;
  marketId: MarketId;
  publisher: string;
  datasetName: string;
  rightsPolicyId: string;
  methodologyId: string;
};

type RightsPolicy = {
  id: string;
  canFetch: boolean;
  canStore: boolean;
  canCache: boolean;
  canDisplay: boolean;
  canCreateDerived: boolean;
  canUseCommercially: boolean;
  canIndex: boolean;
  retention: string;
  cacheTtl: string;
  attribution: string[];
  evidenceRef: string;
};
```

An undeclared right is false. A market can publish allowed HDB aggregates while blocking unrelated private Singapore detail. Rights are evaluated for ingestion, storage, publication, API, UI, derivation, export, and sitemap independently.

## 9. Money and area

### 9.1 Money

```ts
type Money = {
  amountMinor: bigint;
  currency: CurrencyCode;
};
```

Money is stored in integer minor units. Database storage uses `BIGINT` or exact `NUMERIC`; floating-point money is forbidden. API serialization uses decimal strings where JSON cannot carry `bigint` safely.

Exchange conversion produces a separate display value with rate, rate date, source, and rounding policy. It never overwrites native money.

### 9.2 Area

```ts
type AreaMeasure = {
  sourceValue: string;
  sourceUnit: 'sqm' | 'pyeong' | 'sqft';
  squareMetres: string;
  basis: 'exclusive' | 'net' | 'gross' | 'built_up' | 'transaction' | 'unknown';
  precision: string;
};
```

Area uses exact decimal storage. Price-per-area comparison is blocked for incompatible bases.

## 10. Component-based cost model

Four fixed fields such as `upfrontRefundable`, `upfrontSunk`, `recurringMonthly`, and `oneOffTotal` are insufficient for global transactions. Costs are represented as components.

```ts
type CostComponent = {
  id: string;
  kind:
    | 'deposit'
    | 'rent'
    | 'purchase_price'
    | 'agent_fee'
    | 'stamp_duty'
    | 'tax'
    | 'service_charge'
    | 'insurance'
    | 'mortgage_payment'
    | 'other';
  money: Money;
  timing: 'upfront' | 'at_closing' | 'recurring';
  recurrence: 'once' | 'month' | 'quarter' | 'year' | null;
  refundable: true | false | 'conditional';
  payer: 'tenant' | 'buyer' | 'owner' | 'seller';
  certainty: 'reported' | 'quoted' | 'estimated' | 'unknown';
  sourceId: string;
  sourcePeriod: string;
};

type CostScenario = {
  id: string;
  marketId: MarketId;
  intent: UserIntent;
  components: CostComponent[];
  nativeTerms: Record<string, unknown>;
  methodologyVersion: string;
  assumptions: string[];
  excludedCosts: string[];
};
```

The product derives initial cash, monthly recurring cost, annual ownership cost, and acquisition cost from compatible components. Missing components remain excluded or unknown, never zero.

## 11. Restatement policies

Restating a cost at a different deposit, payment schedule, or financing assumption is an optional market policy.

```ts
type RestatementResult =
  | { supported: true; scenario: CostScenario; assumptions: string[] }
  | { supported: false; reason: string };
```

- Korea rent can support a versioned comparison assumption.
- Singapore rent returns unsupported when no defensible conversion exists.
- Dubai cheque-count restatement remains unsupported until a licensed dataset and methodology demonstrate the relationship.
- Sale price does not use a rent-deposit lever.

No caller assumes a restatement is available.

## 12. Korea five-percent methodology correction

The existing 5% formula remains a useful signedprice comparison method:

```text
deposit-adjusted monthly cost = monthly rent + deposit × 5% ÷ 12
```

It is not labelled the current statutory conversion rate. Korean residential law uses the lower of the statutory alternatives defined by law, including a Bank of Korea base-rate-linked calculation; it is not a permanently fixed 5% value.

V2 uses:

```ts
{
  policyId: 'kr-deposit-adjusted-cost-v1',
  annualRate: '0.05',
  basis: 'signedprice comparison assumption',
  legalRate: false,
  methodologyVersion: '1'
}
```

The legacy `deposit-conversion.js` label is tracked for correction before any release that repeats the statutory claim. Legal-compliance tools and price-comparison tools remain separate.

## 13. Market event, listing, and project separation

### 13.1 MarketEvent

Represents reported or observed market evidence with source, event type, period, money, area, asset, status, methodology, rights, and limitations.

### 13.2 Listing

```ts
type Listing = {
  id: string;
  marketId: MarketId;
  assetId: string;
  listingType: ListingType;
  askingTerms: CostComponent[];
  advertiserPartnerId: string;
  sourceId: string;
  publishedAt: string;
  expiresAt: string;
  verificationState: 'unverified' | 'source_verified' | 'partner_verified' | 'expired' | 'withdrawn';
  sponsorship: 'organic' | 'sponsored';
};
```

### 13.3 DevelopmentProject

Represents a developer project, available unit types, price terms, tenure, completion stage, foreign-buyer eligibility evidence, developer, authorized marketing partner, and required disclosures.

A project page never converts developer price into a reported sale contract.

## 14. Trust separation

Every property price is visibly classified as one of:

- `Official transaction`;
- `Partner listing`;
- `Developer price`;
- `Valuation or estimate`;
- `Market index`; or
- `Sponsored project`.

Rules:

- sponsorship cannot alter official-data rank, median, comparison, or recommendation methodology;
- official and sponsored surfaces use distinct visual tokens and accessible text labels;
- a listing cannot inherit official status because it is near an official contract;
- partner verification is not property-condition or legal-title certification;
- expired and withdrawn listings cannot appear available;
- advertiser identity and data source are retained in audit history; and
- complaint and correction paths are present on marketplace detail pages.

## 15. Decision Account

V2.1 introduces a lightweight account earlier than the original V2 plan.

Initial authenticated capabilities:

- saved properties, projects, and areas;
- watchlists and price or contract alerts;
- saved comparison sets;
- saved rent, buy, and investment scenarios;
- enquiry history and partner conversation state; and
- consent and marketing preferences.

Browsing official data remains available without an account. An account is requested only when the user saves, subscribes, or contacts a partner.

## 16. Enquiry and consent model

```ts
type Inquiry = {
  id: string;
  userId: string;
  marketId: MarketId;
  intent: UserIntent;
  listingId: string | null;
  projectId: string | null;
  serviceType: 'property' | 'viewing' | 'video_tour' | 'financing' | 'tax' | 'legal' | 'moving' | 'management';
  qualification: LeadQualification;
  consentRecordId: string;
  state: 'draft' | 'submitted' | 'matched' | 'accepted' | 'contacted' | 'appointment' | 'closed' | 'lost' | 'withdrawn';
};

type LeadQualification = {
  budgetBand: string;
  targetAreas: string[];
  targetTiming: string;
  financingState: 'cash' | 'preapproved' | 'needed' | 'unknown';
  preferredLanguages: string[];
  residencyOrBuyerStatus: string;
  userConfirmedAt: string;
};

type ConsentRecord = {
  id: string;
  userId: string;
  purpose: string;
  recipientCategories: string[];
  marketId: MarketId;
  fieldsShared: string[];
  privacyPolicyVersion: string;
  crossBorderTransferBasis: string | null;
  grantedAt: string;
  withdrawnAt: string | null;
};
```

Consent records contain purpose, recipient category, market, fields shared, privacy-policy version, timestamp, withdrawal state, and cross-border-transfer basis where applicable.

Submitting an enquiry does not subscribe the user to unrelated marketing.

## 17. Partner model

```ts
type Partner = {
  id: string;
  legalName: string;
  markets: MarketId[];
  partnerType: 'brokerage' | 'agent' | 'developer' | 'lender' | 'insurer' | 'law_firm' | 'tax_adviser' | 'moving' | 'management';
  languages: string[];
  verificationState: 'pending' | 'verified' | 'suspended' | 'rejected' | 'expired';
};

type PartnerLicense = {
  partnerId: string;
  jurisdiction: string;
  licenseType: string;
  licenseNumberRef: string;
  verifiedAt: string;
  expiresAt: string | null;
  evidenceRef: string;
};
```

Matching uses market, service, language, property type, budget band, availability, verification, conflicts, and response performance. Paid placement does not bypass licensing or suitability filters.

```ts
type PartnerMatch = {
  id: string;
  inquiryId: string;
  partnerId: string;
  matchReasons: string[];
  state: 'proposed' | 'accepted' | 'rejected' | 'expired' | 'cancelled';
  proposedAt: string;
  respondedAt: string | null;
};

type ServiceOrder = {
  id: string;
  inquiryId: string;
  partnerId: string;
  serviceType: Inquiry['serviceType'];
  state: 'requested' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'disputed';
  commercialTermsRef: string;
  createdAt: string;
};
```

## 18. Referral and attribution

`TransactionReferral` records inquiry, matched partner, agreement, permitted fee basis, milestones, attribution window, state, and audit timestamps. It does not claim a closed transaction without partner evidence and internal review.

`ReferralAgreement` records jurisdiction, licensed entity, allowed activity, fee basis, effective dates, data-sharing terms, and approval evidence.

```ts
type AttributionRecord = {
  id: string;
  inquiryId: string;
  partnerId: string;
  agreementId: string;
  firstQualifiedAt: string;
  attributionExpiresAt: string;
  evidenceRefs: string[];
};
```

No referral revenue is enabled in a market before legal and tax review confirms the permitted structure.

## 19. Public URLs

The approved country and city hierarchy remains canonical. User intent becomes an optional product segment.

```text
/kr/seoul/rent/
/kr/seoul/buy/
/kr/seoul/invest/
/sg/singapore/rent/
/sg/singapore/buy/
/sg/singapore/invest/
/ae/dubai/rent/
/ae/dubai/buy/
/ae/dubai/invest/
```

Representative detail paths:

```text
/kr/seoul/rent/officetel/dongjak-gu/noryangjin-dong/
/kr/seoul/buy/apartment/gangnam-gu/yeoksam-dong/
/sg/singapore/rent/hdb/ang-mo-kio/
/ae/dubai/buy/projects/downtown-dubai/{project-slug}/
```

`marketId` remains internal. Locale remains independent:

```text
/zh/kr/seoul/buy/
/zh/ae/dubai/invest/
```

All existing indexed KoreaHomeGuide URLs remain under the exact cohort migration contract. The migration table is written before route changes.

## 20. Repository additions

The V2 monorepo retains the existing architecture and adds:

```text
packages/
├─ marketplace/
├─ partner-network/
├─ lead-routing/
├─ identity/
├─ consent/
├─ trust-labels/
└─ attribution/

apps/
├─ web/
├─ data-jobs/
└─ partner-console/       # created only after the Partner OS gate
```

The first marketplace release does not create `partner-console`. Partners are operated through a minimal internal workflow until enquiry volume, response load, and partner retention justify a dedicated application.

## 21. Market rollout

### 21.1 Korea

- Full official rent and sale intelligence.
- Explorer with rent, buy, and compatible investment contexts.
- Rent Check and price-position checks.
- Saved decisions and alerts.
- Verified rental and purchase partner pilot after license and workflow review.

### 21.2 Singapore

- HDB public market intelligence with sector-specific limitations.
- Private residential intelligence only when commercial rights permit it.
- Foreign-buyer rules and dated tax information.
- Verified partner or developer-project interest flow after advertising and referral review.

### 21.3 Dubai

- Rights-cleared area, project, transaction, rent, and ownership-cost intelligence.
- Annual-rent and cheque terms preserved natively.
- Verified project interest and partner flow after DLD, RERA, advertising, referral, and data-rights gates.

No market receives synthetic detail from another sector or an unlicensed source.

## 22. Monetization sequence

### Stage 1: Intent and partner validation

- Qualified partner enquiries.
- Clearly labelled developer campaigns.
- Limited service referrals where permitted.
- Paid market reports for professional or investor users.

### Stage 2: Partner software and distribution

- Partner subscription.
- Listing and project distribution.
- Lead qualification and routing tools.
- Response, pipeline, and campaign analytics.

### Stage 3: Transaction and ownership network

- Permitted referral or brokerage economics.
- Financing, insurance, legal, tax, moving, remittance, and management services.
- Ownership, rental management, sale, and reinvestment services.

Revenue recognition and user-facing claims follow actual contractual evidence. A submitted lead is not transaction revenue.

## 23. Regulatory and trust gates

Before a partner or revenue capability is enabled in a market, record:

- brokerage, property advertising, developer marketing, and referral requirements;
- the licensed entity responsible for regulated activity;
- permitted compensation structure;
- consumer disclosures and complaint owner;
- data-sharing purpose and cross-border-transfer basis;
- required listing, project, agent, or license identifiers;
- tax treatment and invoicing owner; and
- suspension and takedown procedure.

Platform language avoids claiming signedprice is the broker, appraiser, lawyer, tax adviser, lender, or insurer unless the operating entity is actually licensed for that role.

## 24. Initial operating model

Start with one to three verified partners per market and service category. Measure quality before increasing supply.

Partner pilot requirements:

- current license or registration evidence;
- written service and referral agreement;
- language and market coverage;
- response-time commitment;
- consent-compliant contact workflow;
- listing and project correction process;
- complaint and escalation contact;
- outcome reporting; and
- suspension criteria.

The network is not described as a marketplace category when no verified partner can fulfil it.

## 25. Core metrics

### Trust and product

- market-to-property exploration rate;
- save and alert activation rate;
- comparison completion rate;
- methodology and source disclosure engagement;
- incorrect-data reports and resolution time;
- official-versus-asking price coverage; and
- stale, insufficient, unavailable, and rights-blocked surface counts.

### Marketplace

- property or project view to enquiry;
- completed qualification rate;
- partner match and acceptance rate;
- first-response time;
- appointment rate;
- enquiry withdrawal and complaint rate;
- verified close rate; and
- revenue per qualified enquiry and verified transaction.

### Partner

- active verified partners;
- response SLA compliance;
- listing freshness;
- correction rate;
- lead acceptance and rejection reasons;
- partner retention; and
- complaint and suspension rate.

Raw enquiry volume is not a success metric without qualification and response quality.

## 26. Verification contract

### 26.1 Axis separation

- A reported sale cannot parse as an asking sale.
- A user `buy` intent can consume sale contracts, asking-sale listings, developer prices, taxes, and financing without changing their event types.
- A rent listing cannot become a rent contract until an official source reports it.
- HDB and private residential events remain separate.

### 26.2 Money and cost

- No floating-point money storage.
- Native money survives FX display conversion.
- Annual Dubai rent is converted to monthly exactly once.
- Missing costs stay unknown or excluded.
- Refundable deposits do not become sunk costs.
- Payer, timing, recurrence, and certainty survive aggregation.
- Incompatible area bases block unit-price comparison.

### 26.3 Rights and trust

- Missing rights deny ingestion and publication actions.
- Sponsored state cannot modify official rank or median.
- Blocked sources produce no indexable detail routes.
- Expired listings cannot accept enquiries.
- Partner suspension removes matching eligibility without deleting audit history.

### 26.4 Identity, consent, and referral

- Anonymous browsing does not require an account.
- Enquiry submission records purpose-specific consent.
- Consent withdrawal blocks new sharing.
- Partner access is limited to matched and consented enquiries.
- Referral status cannot become closed without evidence.

### 26.5 Migration

- Legacy URLs redirect in one exact hop only after V2 route readiness.
- V2 self-canonical, hreflang, sitemap, internal link, and redirect release atomically by cohort.
- A marketplace route cannot become indexable from a rights-blocked market dataset.

## 27. Delivery sequence

1. Correct and lock the V2.1 axes, money, area, cost, and rights contracts.
2. Use Seoul rent and Seoul sale fixtures to prove the market-event model.
3. Build the Market Truth and Decision OS foundation.
4. Add lightweight identity, saves, alerts, scenarios, and consent.
5. Add listing, project, trust-label, and enquiry contracts with fixture partners.
6. Add Singapore HDB and rights-gated private capability.
7. Add Dubai through a licensed-provider boundary.
8. Run one-to-three-partner pilots with internal operations.
9. Add Partner OS only after the operating gate passes.
10. Migrate legacy URL cohorts after Korea parity and private beta.

## 28. Decision gates

### Market Kernel gate

Seoul rent and sale work without adding Seoul-specific fields to shared packages, while native contract terms remain available.

### Identity gate

Save and alert value justifies account friction; anonymous access remains complete for public intelligence.

### Marketplace gate

Listing, project, advertiser, sponsorship, expiry, source, and price class are visible and tested before public enquiries.

### Partner pilot gate

The partner has valid evidence, an agreement, response ownership, complaint handling, and a consent-compliant workflow.

### Partner OS gate

A dedicated partner application is justified only when internal operations show recurring lead volume, repeated partner use, measurable response burden, and partner willingness to adopt the tool.

### Revenue gate

Legal, tax, licensing, data-sharing, attribution, and agreement evidence exists for the exact revenue type and market.

## 29. Authorization boundary

Approval of this specification authorizes revision of the implementation plans. It does not authorize:

- production changes to the legacy 5% copy;
- public launch before the signedprice trademark and adverse-meaning review is recorded;
- account or partner data collection;
- partner outreach or contracting;
- listing or project publication;
- referral-fee collection;
- remote repository or Vercel production creation;
- GitHub `main` changes;
- redirect deployment; or
- legacy retirement.

Each implementation, partner, data-rights, and production boundary retains its existing approval requirement.
