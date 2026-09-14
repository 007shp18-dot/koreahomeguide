import { ENGLISH_KOREA_ARTICLES } from './english-korea-articles';
import { OFFICIAL_PROPERTY_SOURCES as S } from './official-property-sources';

export type EditorialMarketKey = 'seoul' | 'singapore' | 'dubai' | 'tokyo' | null;
export type EditorialStatus = 'draft' | 'review' | 'published' | 'archived';

export type EditorialSource = Readonly<{
  publisher: string;
  label: string;
  href: string;
  checkedAt: string;
}>;

export type EditorialArticle = Readonly<{
  canonicalHref?: string;
  slug: string;
  marketKey: EditorialMarketKey;
  title: string;
  summary: string;
  bodyMarkdown: string;
  status: EditorialStatus;
  publishedAt: string;
  updatedAt: string;
  readMinutes: number;
  sources: readonly EditorialSource[];
}>;

export const editorialMarketLabels: Readonly<Record<Exclude<EditorialMarketKey, null>, string>> = Object.freeze({
  seoul: 'Seoul',
  singapore: 'Singapore',
  dubai: 'Dubai',
  tokyo: 'Tokyo',
});

export function editorialMarketLabel(marketKey: EditorialMarketKey): string {
  return marketKey === null ? 'Global' : editorialMarketLabels[marketKey];
}

export function estimateReadMinutes(body: string): number {
  const words = body.trim().split(/\s+/u).filter(Boolean).length;
  return Math.max(2, Math.ceil(words / 210));
}

const FOUNDATIONAL_EDITORIAL_ARTICLES: readonly EditorialArticle[] = Object.freeze([
  Object.freeze({
    slug: 'median-is-a-boundary-not-a-home-valuation',
    marketKey: null,
    title: "The median rose. Did the home become more expensive?",
    summary: "A changing mix of sales can move the middle price without any individual home gaining value. Start with what sold, then narrow the comparison.",
    status: 'published',
    publishedAt: '2026-09-04T00:00:00.000Z',
    updatedAt: '2026-09-14T00:00:00.000Z',
    readMinutes: 5,
    sources: Object.freeze([S.realTransactions, S.uraPropertyData]),
    bodyMarkdown: `## Five sales, no price rises

Imagine five hypothetical sales: three homes at 500,000 and two at 1 million, in the same currency. The median is 500,000. Next month, two homes sell at 500,000 and three at 1 million. The median doubles, although neither price level has moved.

The mean also rises, from 700,000 to 800,000. Neither statistic is wrong. More expensive homes simply make up a larger share of the second month. Reading either increase as the appreciation of one home would answer a question the figures were never designed to answer.

## What changed inside the sample?

Before following a headline, look at the transaction type, period, size band and properties included. A launch, a run of larger units or a small number of expensive sales can change the composition. A district label does not make those homes interchangeable.

The next step is to narrow the sample to homes that could genuinely compete with the one you are considering. Keep the total price and unit price together, and retain the contract dates. A nearby sale from another size band may provide context without being a useful comparable.

## The middle is not an offer price

A range of compatible contracts is more useful than a single median when the unit still needs inspection. Floor, condition, layout, outlook and possession terms can explain why an asking price sits away from the centre. They need property-specific evidence, not a guessed premium.

If there are too few compatible observations, say so. Broadening the period or adding another building can help, but label the change so the reader knows what made the sample larger.

A median can tell you where to look next. The offer still needs the actual home, its obligations and a price you can support without pretending the district statistic is a valuation.`,
  }),
  Object.freeze({
    slug: 'how-to-read-a-thin-building-sample-in-seoul',
    marketKey: 'seoul',
    title: "Only a few Seoul apartment sales? Read the contracts, not just the median.",
    summary: "A large complex can have very few sales comparable to the home you want. The useful response is to widen the search carefully and keep the mismatches visible.",
    status: 'published',
    publishedAt: '2026-09-03T00:00:00.000Z',
    updatedAt: '2026-09-14T00:00:00.000Z',
    readMinutes: 6,
    sources: Object.freeze([S.realTransactions, S.realTransactionDownload]),
    bodyMarkdown: `## A thousand homes can leave three useful contracts

A famous apartment complex may contain many homes, yet only a few reported sales may match the size and period you need. The number of households in the development is not the number of comparable contracts.

Start with the actual rows. Keep exclusive area, contract date, floor and cancellation status visible, then identify what is still unknown about condition or possession. Sale, jeonse and monthly rent belong in separate comparisons; adding them together makes a larger count but not a better purchase benchmark.

## One new row can move the middle

Consider three hypothetical compatible sales at ₩900 million, ₩950 million and ₩1 billion. The median is ₩950 million. Add a fourth at ₩1.1 billion and the median becomes ₩975 million. That change alone does not establish that the first three homes appreciated.

With a thin sample, the dates and individual observations deserve as much attention as the summary. Recent reporting can still change the list. A quiet-looking month may reflect an incomplete reporting window rather than an absence of transactions.

## Widen one boundary at a time

First try a longer period while keeping the building and size band stable. If you then add another building, note why it is comparable and which differences remain. Widening time, geography and size together can make a confident-looking distribution out of homes that do not compete.

Do not replace a missing value with a neighbourhood average. An unconfirmed identity, withheld statistic or absent fact marks the point where the evidence stops; it is not an invitation to complete the row by intuition.

For an offer discussion, keep a short list of included contracts and the reason each belongs. When another filing appears, that list can be updated. A rounded median without its supporting rows is much harder to challenge, or to trust.`,
  }),
  Object.freeze({
    slug: 'read-singapore-project-evidence-without-mixing-market-layers',
    marketKey: 'singapore',
    title: "A Singapore district median can hide the homes you are comparing",
    summary: "Private condos, HDB flats and new launches do not form one comparable pool. Separate the housing and sale types before using a regional number to judge a home.",
    status: 'published',
    publishedAt: '2026-09-02T00:00:00.000Z',
    updatedAt: '2026-09-14T00:00:00.000Z',
    readMinutes: 6,
    sources: Object.freeze([S.uraPropertyData, S.hdbResaleData]),
    bodyMarkdown: `## The region is not the property

CCR, RCR and OCR help organise Singapore's private residential market, but a regional median can combine different projects, unit sizes and sale types. A change in which homes sold can move the number without changing the price of a comparable unit.

HDB resale flats need a separate analysis. Their ownership and eligibility framework is not interchangeable with private residential property. Finding both in a search interface does not make their prices one valuation series.

## A project name needs an address

Check the exact development and location before attaching a transaction or photograph. Similar names and separate phases can create plausible-looking mistakes. A nearby streetscape is not evidence of the condition of the building being sold.

Then separate new sales, resales and subsales, retaining their periods and source definitions. Developer-issued options and lodged caveats observe different stages of a transaction. A larger mixed total is not necessarily a more complete answer to your question.

## The lower psf can need more cash

In a hypothetical comparison, a S$1.8 million, 900 sq ft home costs S$2,000 per sq ft. A S$2 million, 1,100 sq ft home costs about S$1,818 per sq ft. The lower unit price requires S$200,000 more before duties and other costs.

That may be worthwhile if the extra space is useful. It is not a bargain established by division. Layout, condition, tenure and the household's full acquisition budget still matter.

## Let the sample set the confidence

Read compatible observations and their dates before leaning on a polished chart. A handful of sales can be useful evidence when described honestly; a regional median cannot fill every gap at project level.

Keep asking prices and news commentary outside the completed-transaction series. Once those boundaries are clear, the numbers can help compare two real homes instead of giving a broad market label more authority than it deserves.`,
  }),
]);

export const STARTER_EDITORIAL_ARTICLES: readonly EditorialArticle[] = Object.freeze([
  ...FOUNDATIONAL_EDITORIAL_ARTICLES.map(article => ({ ...article, readMinutes: estimateReadMinutes(article.bodyMarkdown) })),
  ...ENGLISH_KOREA_ARTICLES,
]);

export function getStarterEditorialArticle(slug: string): EditorialArticle | null {
  return STARTER_EDITORIAL_ARTICLES.find((article) => article.slug === slug) ?? null;
}
