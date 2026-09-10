export type GuideLink = Readonly<{ label: string; href: string }>;
export type GuideStep = Readonly<{ title: string; body: string }>;

export type GuideDocument = Readonly<{
  slug:
    | 'compare-two-contracts'
    | 'read-district-evidence'
    | 'understand-publication-limits'
    | 'before-you-sign'
    | 'korea-rent-deposit-protection-foreigners'
    | 'korea-rental-contract-checklist'
    | 'korea-rental-scams'
    | 'rent-apartment-korea-foreigner'
    | 'seoul-brokerage-fees'
    | 'seoul-officetel-rent'
    | 'wolse-vs-jeonse'
    | 'read-seoul-apartment-sale-prices'
    | 'korea-apartment-buying-checklist'
    | 'compare-seoul-district-property-prices';
  title: string;
  summary: string;
  stage: 'Getting started' | 'Before signing' | 'Market research' | 'Evidence check';
  readMinutes: number;
  lastVerified: string;
  steps: readonly GuideStep[];
  evidenceBoundary: string;
  links: readonly GuideLink[];
}>;

function freezeGuide(guide: GuideDocument): GuideDocument {
  return Object.freeze({
    ...guide,
    steps: Object.freeze(guide.steps.map((step) => Object.freeze({ ...step }))),
    links: Object.freeze(guide.links.map((link) => Object.freeze({ ...link }))),
  });
}

export const GUIDES = Object.freeze([
  freezeGuide({
    slug: 'read-seoul-apartment-sale-prices',
    title: 'How to read Seoul apartment sale prices and actual transactions',
    summary: 'Use reported contracts, comparable floor area, transaction dates, and sample depth to judge an asking price without treating one sale as the market.',
    stage: 'Market research',
    readMinutes: 7,
    lastVerified: '2026-09-03',
    steps: [
      { title: 'Start with reported contracts, not asking prices', body: 'A listing is what a seller hopes to receive. A reported contract records an agreed transaction. Use listings to understand current choice and reported sales to understand completed deals, and keep the two labels separate.' },
      { title: 'Match the same building before widening the area', body: 'Compare the same apartment complex first. If its sample is too thin, widen carefully to nearby buildings with similar completion year, scale, access, and housing type instead of jumping straight to a district average.' },
      { title: 'Keep floor area comparable', body: 'A total price is not comparable when home sizes differ. Filter a consistent exclusive-area band and inspect price per square metre only when the price and area come from the same verified contract cohort.' },
      { title: 'Read the contract month and filing lag', body: 'Reported data can arrive after the agreement. Check the contract date, the declared evidence period, and whether the latest month is still collecting filings before calling a movement a trend.' },
      { title: 'Use median, range, and sample together', body: 'The median shows the middle contract; the middle half shows central spread; the full range exposes extremes. A number based on five contracts deserves less confidence than one supported by a deep, consistent cohort.' },
      { title: 'Investigate why a unit differs', body: 'Floor, view, orientation, renovation, tenancy, parking, building position, and unusual contract terms can explain a gap. Transaction data identifies the gap but does not explain every cause.' },
    ],
    evidenceBoundary: 'SignedPrice displays official reported-contract evidence for declared cohorts. It is not a live appraisal, an asking-price feed, or a prediction of the next transaction.',
    links: [
      { label: 'Explore Seoul sale evidence', href: '/kr/seoul/explore/?transaction=sale' },
      { label: 'Compare district rankings', href: '/kr/seoul/rankings/?transaction=sale' },
      { label: 'Understand publication limits', href: '/kr/seoul/guide/understand-publication-limits/' },
      { label: 'Read SignedPrice Trust', href: '/trust/' },
    ],
  }),
  freezeGuide({
    slug: 'korea-apartment-buying-checklist',
    title: 'Korea apartment buying checklist before you make an offer',
    summary: 'A practical sequence for identity, price evidence, financing, records, contract terms, and final payment checks.',
    stage: 'Before signing',
    readMinutes: 8,
    lastVerified: '2026-09-03',
    steps: [
      { title: 'Confirm the exact unit and registered identity', body: 'Match the apartment complex, building, unit, road and lot address, registered owner, and official building record. Resolve naming or address differences before discussing payment.' },
      { title: 'Build a comparable transaction set', body: 'Use the same complex, a similar exclusive-area band, recent completed contracts, and enough observations. Note meaningful differences in floor, direction, view, condition, and occupancy.' },
      { title: 'Set a complete cash requirement', body: 'Include the deposit and balance schedule, acquisition-related taxes and fees, brokerage, loan costs, moving, repairs, furnishings, and an emergency reserve. Do not base affordability on the headline price alone.' },
      { title: 'Check financing before committing', body: 'Confirm the amount, valuation basis, interest structure, repayment burden, documentation, and timing directly with the lender. A preliminary conversation is not a final lending decision.' },
      { title: 'Review current rights and restrictions', body: 'Obtain current records and understand ownership, mortgages, seizures, leases, redevelopment issues, land or transaction restrictions, and any occupancy obligations that may apply to the specific property.' },
      { title: 'Write conditions and deadlines clearly', body: 'Specify payment dates, included fixtures, vacancy and handover, defects, outstanding charges, document delivery, breach consequences, and any condition that must be satisfied before completion.' },
      { title: 'Recheck before the final balance', body: 'Review updated records, confirm the property and handover condition, verify the receiving account and signer, preserve documents and transfer evidence, and complete the required registration and reporting steps.' },
    ],
    evidenceBoundary: 'This is a general decision checklist, not legal, tax, lending, or investment advice. Rules and obligations depend on the buyer, property, location, financing, and transaction date.',
    links: [
      { label: 'Explore actual sale evidence', href: '/kr/seoul/explore/?transaction=sale' },
      { label: 'Read sale-price evidence', href: '/kr/seoul/guide/read-seoul-apartment-sale-prices/' },
      { label: 'Compare Seoul districts', href: '/kr/seoul/rankings/?transaction=sale' },
      { label: 'Read SignedPrice Trust', href: '/trust/' },
    ],
  }),
  freezeGuide({
    slug: 'compare-seoul-district-property-prices',
    title: 'How to compare Seoul district property prices correctly',
    summary: 'Compare districts without mixing home type, floor area, period, transaction type, or weak samples.',
    stage: 'Market research',
    readMinutes: 6,
    lastVerified: '2026-09-03',
    steps: [
      { title: 'Choose one transaction type', body: 'Sale, jeonse, and monthly rent answer different questions. Start with one and keep it fixed across every district in the comparison.' },
      { title: 'Hold housing type and size constant', body: 'A district with more large apartments will naturally show a different total-price distribution. Compare the same housing type and area cohort before interpreting the rank.' },
      { title: 'Use one evidence period', body: 'Districts must be compared over the same completed or clearly labelled collection period. Do not combine a current partial month in one district with an older complete period in another.' },
      { title: 'Read rank and distribution together', body: 'A median rank is only an ordering of the selected cohort. The middle-half spread and full range show whether contracts cluster tightly or cover very different properties.' },
      { title: 'Check the sample and withheld districts', body: 'Low-volume districts can move sharply when one contract enters the sample. Treat publication minimums and unavailable rows as information, not as zeros or missing-value invitations.' },
      { title: 'Move from district to building', body: 'A district comparison is a discovery tool. Open the district page, inspect neighbourhood and building evidence, then verify the exact apartment before making a price decision.' },
    ],
    evidenceBoundary: 'District rankings compare only the selected reported-contract cohort. They do not rank quality of life, schools, legal safety, liquidity, or future returns.',
    links: [
      { label: 'Open Seoul rankings', href: '/kr/seoul/rankings/?transaction=sale' },
      { label: 'Open the district map', href: '/kr/seoul/explore/?transaction=sale' },
      { label: 'Read sale-price evidence', href: '/kr/seoul/guide/read-seoul-apartment-sale-prices/' },
      { label: 'Read SignedPrice Trust', href: '/trust/' },
    ],
  }),
  freezeGuide({
    slug: 'rent-apartment-korea-foreigner',
    title: 'How to rent an apartment in Korea as a foreigner',
    summary: 'A practical path from budgeting and housing labels to verification, signing, and move-in protection.',
    stage: 'Getting started',
    readMinutes: 8,
    lastVerified: '2026-09-03',
    steps: [
      { title: 'Set a total housing budget', body: 'Compare the deposit, monthly rent, management fee, utilities, brokerage fee, moving cost, and furniture—not headline rent alone. Keep emergency cash separate from the deposit.' },
      { title: 'Choose the rental structure', body: 'Wolse normally combines a deposit with monthly rent. Jeonse uses a much larger deposit with little or no monthly rent. Choose based on cash, visa horizon, financing, and risk tolerance.' },
      { title: 'Confirm the registered housing type', body: 'Apartment, officetel, villa, and one-room are not interchangeable legal labels. Check the registered property type instead of relying on the listing description.' },
      { title: 'Compare the quote with reported contracts', body: 'Listing prices are asking prices. Compare the same district, housing type, floor area, deposit, and recent period, then investigate differences in condition, floor, furnishings, access, and fees.' },
      { title: 'Verify before paying', body: 'Confirm the exact address, owner identity, registry, secured debt, relevant taxes, deposit-protection options, and the bank account receiving the money. Urgency is not a substitute for verification.' },
      { title: 'Sign only what you understand', body: 'Check payment dates, management-fee items, repairs, special clauses, early termination, and deposit return. Record verbal promises and complete the applicable residence reporting and fixed-date steps promptly.' },
    ],
    evidenceBoundary: 'Procedures and eligibility vary by immigration status, property, contract, and current public rules. Confirm material decisions with the responsible public office or a qualified adviser.',
    links: [
      { label: 'Open Contract Check', href: '/kr/seoul/check/' },
      { label: 'Before-signing checklist', href: '/kr/seoul/guide/before-you-sign/' },
      { label: 'Compare Wolse and Jeonse', href: '/kr/seoul/guide/wolse-vs-jeonse/' },
      { label: 'Read SignedPrice Trust', href: '/trust/' },
    ],
  }),
  freezeGuide({
    slug: 'wolse-vs-jeonse',
    title: 'Wolse vs Jeonse: how Korean rental contracts work',
    summary: 'Understand how deposits and monthly rent trade off, then compare two offers on one basis.',
    stage: 'Getting started',
    readMinutes: 5,
    lastVerified: '2026-09-03',
    steps: [
      { title: 'Wolse: deposit plus monthly rent', body: 'Wolse usually requires a smaller refundable deposit and a recurring monthly payment. Management fees and utilities normally sit outside the headline rent.' },
      { title: 'Jeonse: a large refundable deposit', body: 'Jeonse usually has little or no monthly rent but locks up far more cash. The deposit-return risk and protection steps deserve the same attention as the price.' },
      { title: 'Compare one total burden', body: 'Do not compare monthly rent alone. Apply a transparent deposit-to-rent conversion rate, include fees and financing cost, and keep the assumed rate visible.' },
      { title: 'Check the property and contract', body: 'For either structure, verify the legal address, owner, rights, existing claims, receiving account, contract terms, and eligibility for the protection steps available to you.' },
    ],
    evidenceBoundary: 'A conversion is a comparison method, not a prediction of what a landlord must accept or a guarantee that a deposit will be returned.',
    links: [
      { label: 'Compare two contracts', href: '/kr/seoul/check/' },
      { label: 'Deposit protection guide', href: '/kr/seoul/guide/korea-rent-deposit-protection-foreigners/' },
      { label: 'Explore reported evidence', href: '/kr/seoul/explore/' },
      { label: 'Read SignedPrice Trust', href: '/trust/' },
    ],
  }),
  freezeGuide({
    slug: 'before-you-sign',
    title: 'Before you sign a rental contract in Korea',
    summary: 'Six checks to complete before transferring a material rental deposit.',
    stage: 'Before signing',
    readMinutes: 7,
    lastVerified: '2026-09-03',
    steps: [
      { title: 'Read a fresh property registry', body: 'Match the property and unit, registered owner, mortgages, seizures, leasehold rights, and other claims. Recheck near the final balance because the registry is only a snapshot.' },
      { title: 'Verify the signer and receiving account', body: 'The owner name, identification, contract signer, authority documents, and bank account should make sense together. Independently verify any proxy or company authority.' },
      { title: 'Plan immigration and tenant-protection timing', body: 'Foreign registration, residence or address reporting, possession, and the fixed date are distinct steps. Confirm the sequence that applies to your status before signing.' },
      { title: 'Check guarantee eligibility early', body: 'Do not assume a deposit is insured. Product, tenant, property, value, debt, documentation, and application-deadline rules differ by guarantee provider.' },
      { title: 'Read fees and special clauses line by line', body: 'Separate deposit, rent, management fees, utilities, brokerage, repairs, pets, parking, early termination, and deposit-return timing. Put material promises in writing.' },
      { title: 'Recheck before final payment', body: 'Obtain updated records, confirm the home and handover, preserve signed documents and transfer receipts, and use traceable payment methods.' },
    ],
    evidenceBoundary: 'This checklist is general decision support, not legal advice. High deposits, complex ownership, or unresolved records justify independent professional review.',
    links: [
      { label: 'Open Contract Check', href: '/kr/seoul/check/' },
      { label: 'Contract checklist', href: '/kr/seoul/guide/korea-rental-contract-checklist/' },
      { label: 'Rental scam red flags', href: '/kr/seoul/guide/korea-rental-scams/' },
      { label: 'Read SignedPrice Trust', href: '/trust/' },
    ],
  }),
  freezeGuide({
    slug: 'korea-rental-contract-checklist',
    title: 'Korea rental contract checklist for foreign tenants',
    summary: 'Use one file to verify the property, owner, money, clauses, and move-in protections.',
    stage: 'Before signing',
    readMinutes: 6,
    lastVerified: '2026-09-03',
    steps: [
      { title: 'Confirm the exact property', body: 'Match the viewed home, road and lot address, building and unit number, registry, building record, and contract. Resolve even small identity differences before paying.' },
      { title: 'Verify ownership and authority', body: 'Compare owner identity with current records. If another person signs, verify the power of attorney and supporting identification independently.' },
      { title: 'Separate every cost', body: 'Write down deposit, rent, management-fee components, utilities, parking, brokerage, VAT if applicable, and all payment dates.' },
      { title: 'Translate every material clause', body: 'Confirm repairs, restoration, furniture, pets, subletting, renewal, termination, handover, and deposit return. Do not sign a clause you cannot explain.' },
      { title: 'Prepare the move-in sequence', body: 'Plan possession, applicable residence reporting, fixed-date procedures, guarantee documents, and evidence storage before contract day.' },
    ],
    evidenceBoundary: 'A completed checklist reduces avoidable omissions but does not determine legal priority, guarantee eligibility, or the safety of a specific contract.',
    links: [
      { label: 'Before-signing guide', href: '/kr/seoul/guide/before-you-sign/' },
      { label: 'Deposit protection guide', href: '/kr/seoul/guide/korea-rent-deposit-protection-foreigners/' },
      { label: 'Open Contract Check', href: '/kr/seoul/check/' },
      { label: 'Read SignedPrice Trust', href: '/trust/' },
    ],
  }),
  freezeGuide({
    slug: 'korea-rent-deposit-protection-foreigners',
    title: 'How foreign renters can protect a Korea rental deposit',
    summary: 'Treat deposit protection as a sequence of identity, timing, priority, and guarantee checks.',
    stage: 'Before signing',
    readMinutes: 7,
    lastVerified: '2026-09-03',
    steps: [
      { title: 'Understand the protection stack', body: 'Possession, applicable residence or address reporting, a fixed date, contract evidence, and an optional guarantee serve different purposes. One step does not automatically replace another.' },
      { title: 'Check the exact property first', body: 'Review identity, ownership, secured claims, realistic value, housing registration, and contract amount before transferring a large deposit.' },
      { title: 'Confirm the foreign-tenant procedure', body: 'Immigration and residence records can affect the available process. Ask the responsible public office what filings and documents apply to your exact status.' },
      { title: 'Compare guarantee providers', body: 'HUG and HF products can have different tenant, loan, property, value, and filing requirements. Confirm the currently available product directly.' },
      { title: 'Prepare before the deadline', body: 'Gather the signed contract, payment proof, identity and residence documents, registry, building records, and any provider-specific forms early.' },
      { title: 'Protect the claim at lease end', body: 'Do not surrender possession or move registration without understanding the effect on your claim. If repayment is delayed, obtain qualified advice before changing status.' },
    ],
    evidenceBoundary: 'Guarantee and tenant-protection rules change and are fact-specific. SignedPrice does not determine eligibility or legal priority.',
    links: [
      { label: 'Before-signing guide', href: '/kr/seoul/guide/before-you-sign/' },
      { label: 'Rental scam red flags', href: '/kr/seoul/guide/korea-rental-scams/' },
      { label: 'Read SignedPrice Trust', href: '/trust/' },
    ],
  }),
  freezeGuide({
    slug: 'korea-rental-scams',
    title: 'Korea rental scams: seven red flags before you pay',
    summary: 'Recognize pressure, identity mismatch, hidden debt, misleading prices, and vague protection claims.',
    stage: 'Before signing',
    readMinutes: 7,
    lastVerified: '2026-09-03',
    steps: [
      { title: 'Pressure to transfer before verification', body: 'A small reservation payment can still be hard to recover. Require written terms and understand refund conditions before sending money.' },
      { title: 'The signer is not the registered owner', body: 'Names on identification, registry, contract, authority documents, and receiving account should agree. A screenshot alone is not proof.' },
      { title: 'The address or unit does not match', body: 'Differences in building name, road or lot address, unit, and registered housing type can signal a serious identity problem.' },
      { title: 'Existing debt is dismissed', body: 'A property can already secure loans and other claims. Use a recent registry and professional help if you cannot assess priority and total burden.' },
      { title: 'The price is unusually attractive', body: 'Low rent can hide a high deposit, management fee, poor condition, or risky terms. Compare similar reported contracts and investigate the difference.' },
      { title: 'Important promises stay verbal', body: 'Repairs, furniture, pets, parking, cleaning, and early termination belong in the written agreement with clear deadlines.' },
      { title: 'Deposit protection stays vague', body: 'Confirm the applicable reporting, fixed-date, possession, and guarantee requirements with the responsible institution—not only the agent or landlord.' },
    ],
    evidenceBoundary: 'A red flag calls for more verification; it does not by itself prove fraud. Preserve listings, messages, records, contracts, receipts, and photos.',
    links: [
      { label: 'Contract checklist', href: '/kr/seoul/guide/korea-rental-contract-checklist/' },
      { label: 'Open Contract Check', href: '/kr/seoul/check/' },
      { label: 'Deposit protection guide', href: '/kr/seoul/guide/korea-rent-deposit-protection-foreigners/' },
      { label: 'Read SignedPrice Trust', href: '/trust/' },
    ],
  }),
  freezeGuide({
    slug: 'seoul-officetel-rent',
    title: 'Seoul officetel rent: deposits, fees, and hidden costs',
    summary: 'Compare officetels using deposit, rent, management fees, usable space, and building rules.',
    stage: 'Market research',
    readMinutes: 6,
    lastVerified: '2026-09-03',
    steps: [
      { title: 'Confirm the registered use', body: 'Officetels are mixed-use buildings and individual use or registration can matter. Confirm the official record and whether the contract fits your intended residence and reporting needs.' },
      { title: 'Compare deposit and rent together', body: 'A lower monthly rent often comes with a larger deposit. Use the same conversion basis and keep financing or lost-interest cost visible.' },
      { title: 'Itemize management fees', body: 'Ask what the quoted fee includes, how utilities are metered, and how seasonal charges vary. A high fee can reverse a headline-price advantage.' },
      { title: 'Check usable space and condition', body: 'Advertising and official area labels can differ from the space you experience. Inspect storage, ventilation, noise, light, appliances, and common areas.' },
      { title: 'Read building rules', body: 'Confirm parking, pets, business use, waste disposal, moving hours, access, repairs, and any restrictions before signing.' },
      { title: 'Verify the contract and deposit', body: 'Follow the same identity, ownership, registry, debt, payment-account, written-clause, and deposit-protection checks used for other rental homes.' },
    ],
    evidenceBoundary: 'Reported contracts do not capture a unit’s condition, included furniture, management-fee package, or whether a particular use is permitted.',
    links: [
      { label: 'Explore officetel evidence', href: '/kr/seoul/explore/?housing=officetel' },
      { label: 'Brokerage fee guide', href: '/kr/seoul/guide/seoul-brokerage-fees/' },
      { label: 'Before-signing guide', href: '/kr/seoul/guide/before-you-sign/' },
      { label: 'Read SignedPrice Trust', href: '/trust/' },
    ],
  }),
  freezeGuide({
    slug: 'seoul-brokerage-fees',
    title: 'How Seoul rental brokerage fees are calculated',
    summary: 'Understand the transaction value, applicable ceiling, negotiation, VAT, and payment timing.',
    stage: 'Before signing',
    readMinutes: 5,
    lastVerified: '2026-09-03',
    steps: [
      { title: 'Calculate the statutory transaction value', body: 'For a pure deposit contract, start with the deposit. For deposit plus monthly rent, the legal conversion formula and any threshold rule determine the value used for the ceiling.' },
      { title: 'Apply the correct Seoul ceiling', body: 'Housing rental ceilings vary by transaction-value band. A qualifying residential officetel can use a different ceiling, so confirm classification before calculating.' },
      { title: 'Treat the maximum as a ceiling', body: 'The permitted amount is not automatically the agreed fee. Confirm the rate or amount in writing before signing and ask whether VAT is included.' },
      { title: 'Check the licensed office and receipt', body: 'Verify the brokerage office details on the contract, keep the explanation sheet and receipt, and clarify when payment becomes due.' },
    ],
    evidenceBoundary: 'Fee rules and classifications can change. Confirm the current ceiling and exact calculation with the Seoul or district authority and the licensed broker before payment.',
    links: [
      { label: 'Contract checklist', href: '/kr/seoul/guide/korea-rental-contract-checklist/' },
      { label: 'Officetel rent guide', href: '/kr/seoul/guide/seoul-officetel-rent/' },
      { label: 'Open Contract Check', href: '/kr/seoul/check/' },
      { label: 'Read SignedPrice Trust', href: '/trust/' },
    ],
  }),
  freezeGuide({
    slug: 'compare-two-contracts',
    title: 'Compare two rental contracts on one basis',
    summary: 'Use the same housing type and verified conversion evidence to compare deposit-and-rent offers.',
    stage: 'Before signing',
    readMinutes: 4,
    lastVerified: '2026-08-31',
    steps: [
      { title: 'Confirm like-for-like inputs', body: 'Enter both offers in the same currency and housing type. Keep optional labels descriptive.' },
      { title: 'Read the applied rate state', body: 'Check whether the rate is interpolated between verified anchors or held at an observed boundary.' },
      { title: 'Use the verdict as decision support', body: 'The result compares monthly burden under one evidence method. It does not replace contract, legal, or financing review.' },
    ],
    evidenceBoundary: 'The comparison uses a verified conversion curve from matched reported contracts. It is not a forecast, appraisal, or promise of an obtainable rate.',
    links: [
      { label: 'Open Contract Check', href: '/kr/seoul/check/' },
      { label: 'Explore district evidence', href: '/kr/seoul/explore/' },
      { label: 'Read SignedPrice Trust', href: '/trust/' },
    ],
  }),
  freezeGuide({
    slug: 'read-district-evidence',
    title: 'Read Seoul district evidence without overclaiming',
    summary: 'Interpret median, middle half, range, recent comparison, and sample depth within one fixed filter.',
    stage: 'Market research',
    readMinutes: 3,
    lastVerified: '2026-08-31',
    steps: [
      { title: 'Start with the fixed scope', body: 'Check the district, completed period, filed-area band, deal filter, and included contract states before comparing figures.' },
      { title: 'Separate position from quality', body: 'A median locates the middle reported contract. A wider middle half describes dispersion, not legal safety or home condition.' },
      { title: 'Use links to inspect context', body: 'Open the district document, nearby districts, rankings definitions, source boundary, and correction ledger together.' },
    ],
    evidenceBoundary: 'District summaries describe qualifying reported contracts in a completed period. They are not current listings, individual-home valuations, or neighbourhood quality scores.',
    links: [
      { label: 'Open District Explorer', href: '/kr/seoul/explore/' },
      { label: 'View district rankings', href: '/kr/seoul/rankings/' },
      { label: 'Read SignedPrice Trust', href: '/trust/' },
    ],
  }),
  freezeGuide({
    slug: 'understand-publication-limits',
    title: 'Understand publication limits and refusals',
    summary: 'Treat withheld, unavailable, not-loaded, and rights-blocked states as evidence about the boundary.',
    stage: 'Evidence check',
    readMinutes: 3,
    lastVerified: '2026-08-31',
    steps: [
      { title: 'Read the state before the figure', body: 'A published figure requires validated data, confirmed display rights, a completed period, and the stated minimum sample.' },
      { title: 'Do not substitute a broader number', body: 'When district or building evidence is unavailable, SignedPrice does not fill the gap with a city value or a UI fixture.' },
      { title: 'Check corrections and freshness', body: 'Use the generated time, method identifier, rights identifier, source boundary, and correction ledger to assess the evidence.' },
    ],
    evidenceBoundary: 'A refusal state explains why a value is absent. It does not imply that the market or property itself lacks activity, quality, or value.',
    links: [
      { label: 'Read SignedPrice Trust', href: '/trust/' },
      { label: 'Review Seoul corrections', href: '/kr/seoul/corrections/' },
      { label: 'Return to District Explorer', href: '/kr/seoul/explore/' },
    ],
  }),
] as const);

export type GuideGlossaryEntry = Readonly<{
  term: string;
  definition: string;
  whyItMatters: string;
}>;

export const GUIDE_GLOSSARY = Object.freeze([
  { term: 'reported contract', definition: 'A transaction or rental contract included by the named official dataset and fixed filters.', whyItMatters: 'It is evidence of a reported agreement, not an asking listing.' },
  { term: 'median', definition: 'The middle value after eligible observations are ordered.', whyItMatters: 'It is less dominated by extremes than an arithmetic average, but still depends on scope.' },
  { term: 'middle half', definition: 'The interval from the lower quartile to the upper quartile.', whyItMatters: 'It shows central dispersion without claiming a fair-price band.' },
  { term: 'publication minimum', definition: 'The smallest qualifying sample SignedPrice permits before showing monetary distribution fields.', whyItMatters: 'It prevents thin samples from appearing more precise than they are.' },
  { term: 'withheld', definition: 'A valid evidence record whose monetary fields are not published under the stated rule.', whyItMatters: 'The absence is intentional and must not be replaced with a broader value.' },
  { term: 'conversion curve', definition: 'Verified anchor rates used to place different deposit-and-rent offers on one comparison basis.', whyItMatters: 'The applied rate can be interpolated or held at an observed boundary.' },
  { term: 'completed period', definition: 'A closed reporting interval named by the artifact rather than a live listing window.', whyItMatters: 'The evidence describes that interval and should not be read as a real-time quote.' },
  { term: 'correction', definition: 'A published ledger entry that records a fixed or upheld challenge to evidence.', whyItMatters: 'It makes material evidence changes reviewable instead of silently rewriting history.' },
].map((entry) => Object.freeze(entry)));

export function getGuideBySlug(slug: string): GuideDocument | null {
  return GUIDES.find((guide) => guide.slug === slug) ?? null;
}
