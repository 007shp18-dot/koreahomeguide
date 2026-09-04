export type EditorialMarketKey = 'seoul' | 'singapore' | 'dubai' | null;
export type EditorialStatus = 'draft' | 'review' | 'published' | 'archived';

export type EditorialArticle = Readonly<{
  slug: string;
  marketKey: EditorialMarketKey;
  title: string;
  summary: string;
  bodyMarkdown: string;
  status: EditorialStatus;
  publishedAt: string;
  updatedAt: string;
  readMinutes: number;
}>;

export const editorialMarketLabels: Readonly<Record<Exclude<EditorialMarketKey, null>, string>> = Object.freeze({
  seoul: 'Seoul',
  singapore: 'Singapore',
  dubai: 'Dubai',
});

export function editorialMarketLabel(marketKey: EditorialMarketKey): string {
  return marketKey === null ? 'Global' : editorialMarketLabels[marketKey];
}

export function estimateReadMinutes(body: string): number {
  const words = body.trim().split(/\s+/u).filter(Boolean).length;
  return Math.max(2, Math.ceil(words / 210));
}

export const STARTER_EDITORIAL_ARTICLES: readonly EditorialArticle[] = Object.freeze([
  Object.freeze({
    slug: 'median-is-a-boundary-not-a-home-valuation',
    marketKey: null,
    title: 'A median is a boundary, not a home valuation',
    summary: 'A district median is useful context, but it cannot price a specific home. Here is the evidence chain that should sit between the two.',
    status: 'published',
    publishedAt: '2026-09-04T00:00:00.000Z',
    updatedAt: '2026-09-04T00:00:00.000Z',
    readMinutes: 5,
    bodyMarkdown: `## Start with the cohort

A median only describes the middle observation inside a defined group. Before reading the number, identify the market, transaction type, property type, period, size range and publication threshold used to create that group. If any of those boundaries change, the median can change even when no individual home has become more or less valuable.

## Move from district to comparable buildings

District figures are a map, not a destination. The next comparison should use buildings with similar age, use, scale, access and unit sizes. A new tower near a station and an older low-rise property can share a district while participating in very different buyer pools.

## Read the distribution

The middle half of reported prices is often more useful than a single centre point. A wide range can signal mixed housing stock, unusually varied unit sizes or a thin sample. A narrow range can be reassuring, but it still does not explain renovation, floor, view or contract-specific conditions.

## Inspect the exact building

The building page should connect the official identity, address, reported transactions, size bands, nearby transport and building facts. Missing facts remain missing; they are not replaced with neighbourhood averages. That restraint is part of the valuation boundary.

## Finish with a property-level review

An asking price can be compared with reported evidence, but it should not be presented as a verified value. A property-level review still needs the exact unit, condition, floor, orientation, legal records, financing terms and current market competition. SignedPrice provides evidence for that review rather than a promise about the final price.`,
  }),
  Object.freeze({
    slug: 'how-to-read-a-thin-building-sample-in-seoul',
    marketKey: 'seoul',
    title: 'How to read a thin building sample in Seoul',
    summary: 'A familiar apartment name can still have very few compatible reported contracts. Thin samples need a different reading method, not a more confident headline.',
    status: 'published',
    publishedAt: '2026-09-03T00:00:00.000Z',
    updatedAt: '2026-09-04T00:00:00.000Z',
    readMinutes: 6,
    bodyMarkdown: `## The building name is not the sample

Large Seoul complexes may contain many buildings and unit types, but a useful comparison still narrows the evidence by transaction type, completed period and size. The name can be famous while the compatible sample remains small.

## Keep sale and rent evidence separate

Sale, jeonse and monthly rent answer different questions. Combining them creates a larger count but removes the meaning of the comparison. Start in sale mode when assessing completed purchase contracts, then switch to the relevant rent mode without carrying the sale median across.

## Look for concentration

When several contracts fall in a similar size band and period, their range can provide a reasonable reference. If the observations are scattered across very different sizes or dates, the apparent median may be a statistical centre without a true peer group around it.

## Expand carefully

If the exact building is thin, expand one boundary at a time. First review a longer completed period, then comparable nearby buildings, then the neighbourhood or district. Do not widen size, geography and time simultaneously; you will no longer know which change produced the new comparison.

## Treat missing as information

A withheld price, unattached official fact or unresolved address is not a blank to be filled with a guess. It tells the reader where verification stopped. The correct interface keeps the rest of the page usable while labeling that row as unconfirmed.

## Record the decision boundary

Before using the evidence in an offer discussion, write down which contracts were compatible and which were excluded. That small discipline makes it easier to update the comparison when a new filing arrives and harder to overstate what a thin sample proves.`,
  }),
  Object.freeze({
    slug: 'read-singapore-project-evidence-without-mixing-market-layers',
    marketKey: 'singapore',
    title: 'Read Singapore project evidence without mixing market layers',
    summary: 'Private projects, HDB blocks and regional labels belong to different comparison layers. Keeping them separate produces a more honest market view.',
    status: 'published',
    publishedAt: '2026-09-02T00:00:00.000Z',
    updatedAt: '2026-09-04T00:00:00.000Z',
    readMinutes: 6,
    bodyMarkdown: `## Choose the housing system first

Private residential projects and HDB blocks are not interchangeable inventory. They have different eligibility, tenure, transaction context and buyer pools. A global search can help a reader find both, but the evidence should separate them before prices are compared.

## Use regions as navigation

CCR, RCR and OCR labels are useful for moving across the map. They are broad market regions rather than a verdict on an individual project. A regional median can be influenced by the mix of new launches, resale projects, tenure and unit sizes included in the period.

## Compare project identity

Project-level evidence should attach to one verified name and location. Similar names, multiple phases and nearby developments can produce false matches if the address is not checked. This is also why a generic streetscape should never stand in for a confirmed project photograph.

## Read price and PSF together

The completed price shows the total contract amount. Price per square foot helps compare different unit sizes, but it can still move with floor, view, layout, condition and transaction mix. Neither number should be read without its filing count and completed period.

## Inspect sample depth

A project with many compatible filings can support a tighter distribution view. A project with few filings should show the observations and their dates directly. Hiding the sample depth behind a polished chart makes the product look more certain than the data.

## Keep the source boundary visible

SignedPrice can organize released transaction evidence and explain its limits. It does not convert external news, asking prices or unverified marketing material into completed transaction facts. The reader should always be able to tell which layer produced each statement.`,
  }),
]);

export function getStarterEditorialArticle(slug: string): EditorialArticle | null {
  return STARTER_EDITORIAL_ARTICLES.find((article) => article.slug === slug) ?? null;
}
