import type { EditorialPortfolioRecord } from '../portfolio-types';

export const KOREA_HELIO_RECORD_FOLLOW_UP: EditorialPortfolioRecord = Object.freeze<EditorialPortfolioRecord>({
  id: 'en:korea-helio-record-follow-up', slug: 'korea-helio-record-follow-up',
  locale: 'en', marketId: 'kr-seoul', type: 'market-brief',
  title: "After Helio City's record: five later sales do not make one price trend",
  deck: 'A KRW 3.14 billion headline was followed by sharply different reported sales. Their dates, floors and transaction context explain why neither a crash nor universal record-price acceptance follows from the sequence.',
  readerQuestion: "Did later transactions validate Helio City's January 2026 record price?",
  bodyMarkdown: `## Follow the record into the transactions that came later

On 2 January 2026, an approximately 84 sqm apartment at Helio City was reported sold for KRW 3.14 billion, or 31.4 eok. Reporting identified the eleventh floor. The question for another buyer is whether that price became repeatable across comparable homes.

We traced five later reported or publicly displayed sales. This is a selected case review, not the chronologically next five contracts or a complete transaction series. We could not verify that ordering from the available records. It would therefore be misleading to calculate a record-confirmation rate from these five cases.

The evidence instead reveals how easily different homes and transaction circumstances can be turned into a single price story. A low print, a new high and a later lower sale can all be genuine records without measuring the same property's change in value.

## Five follow-up observations, with their differences left visible

- 13 January: KRW 3.00 billion, twelfth floor, reported as an 84 sqm home by Chosun's real-estate desk. This was below the January headline despite a similar reported floor.
- 12 February: KRW 2.382 billion, ninth floor, 84.99 sqm according to Business Watch's report. Other reporting described the transaction as involving related parties, based on local brokers' accounts. We have not independently verified the parties or a tax determination.
- 19 February: KRW 3.15 billion, reported as an 84 sqm home by Financial News. Its report described a preferred high-floor unit near the station through broker comments; it did not establish the exact decimal area and floor in the text used here.
- 8 April: KRW 2.69 billion, first floor, 84.99 sqm, according to Korea Financial Times citing Asil. A first-floor sale cannot be treated as an unchanged version of the eleventh-floor January home.
- 15 August: KRW 2.90 billion, thirty-fifth floor, displayed in KB Land's 110D sqm supply-area category, whose exclusive area is 84.99 sqm, when checked on 6 September. This is a platform-displayed transaction, not a fresh registry verification by SignedPrice.

The five observations were chosen because their dates and prices could be documented and because they expose different comparison problems. They are not a representative sample. A later source update, correction or cancellation could change the record, and newspaper use of the rounded label 84 sqm does not establish an identical layout.

## The tempting crash-and-rebound calculation

Moving from KRW 3.14 billion to KRW 2.382 billion produces a 24.1% decline arithmetically. Moving from KRW 2.382 billion to KRW 3.15 billion then produces a 32.2% increase. The two February contract dates are seven days apart.

Those percentages describe differences between selected transaction amounts. They do not demonstrate a 24.1% market crash followed by a 32.2% recovery. The denominator changes, the homes differ, and the lower transaction has a reported related-party concern. Linking the points as if they were observations of one asset would add an assumption the sources do not support.

Nor does the higher February observation prove that every ordinary 84 sqm home could command KRW 3.15 billion. Financial News's on-site reporting specifically raised unit preference and timing questions. Those explanations remain reported interpretations, not adjustments we can quantify.

## Removing the unusual low sale does not validate the high

It is reasonable to investigate the February low before using it as an ordinary market comparable. But removing it from consideration does not establish the January record as the new representative price.

The January KRW 3.00 billion observation was approximately 4.5% below KRW 3.14 billion. The April first-floor sale was 14.3% below it. The August platform-displayed sale was 7.6% below it. These are differences from a reference amount, not estimates of market depreciation or discounts available to every buyer.

That distinction matters in both directions. A seller cannot dismiss one unusual low and then treat an exceptional high as universal. A buyer cannot point to a first-floor price and assume an equivalent discount for a different floor, building position and layout.

The record tells us that a reported buyer paid a particular amount for a particular home. Whether many other buyers accepted that level requires a broader set of comparable, independently screened transactions.

## The calendar needs two dates

A contract date and the date a transaction appears in an article are not interchangeable. The February 19 observation was discussed in a March 11 article. Someone reading only the publication sequence could interpret it as a new March rebound.

The same problem affects any proposal to track the next five transactions. Does next mean contract order or the order in which records became visible? A valid contract-order study must also account for late reports, corrections and cancellations, rather than treating the first five rows encountered online as the final sequence.

For this case we preserve the stated contract dates and the source publication dates separately. Where a report only describes an approximately 84 sqm home, we leave the exact type unresolved. This limits the conclusion, but prevents a more precise-looking result from resting on mismatched observations.

## What would count as genuine follow-through?

The stronger test would fix the exact area and relevant unit characteristics, retrieve all contracts over a defined interval, review cancellations and unusual transactions, and then inspect the next five eligible sales by contract date. Same-day ties would need a declared rule, because their within-day order may be unknown.

Even then, five sales would be an initial signal, not a valuation model. A repeated cluster around the old record would be more informative than another isolated high. A mix of lower ordinary transactions and occasional premium units would imply a different distribution, not one market-clearing price.

The available evidence here does not settle that stronger test. It does show why the record should start an investigation rather than finish it. The analytically honest outcome is an unresolved representative price, with specific comparison failures identified, rather than an invented confirmation percentage.

## Source boundaries

This article combines dated reporting and a public platform observation checked on 6 September 2026. It does not use SignedPrice's capped recent-sale building summaries to infer a complete contract history. We have not revalidated every underlying MOLIT record or its current cancellation status, and we do not assert a current asking price or a forward forecast.

Amounts are expressed in KRW; one eok is KRW 100 million. Calculations are simple differences between the disclosed amounts, rounded to one decimal percentage point. The companion Singapore study examines a different issue: how a newer project's price can increase while its premium over existing alternatives narrows.`,
  status: 'published', evidenceState: 'partial', authorName: 'SignedPrice Data Desk',
  reviewedAt: '2026-09-06T22:29:00.000Z', reviewedBy: 'SignedPrice AI-assisted source and calculation check',
  publishedAt: '2026-09-06T22:29:00.000Z', updatedAt: '2026-09-06T22:29:00.000Z',
  relatedHref: '/news/singapore-commodore-resale-premium/',
  sources: [
    { id: 'helio-january-context', kind: 'secondary', publisher: 'Chosun real estate', title: 'January record, January 13 sale and reported related-party context, 22 February 2026', href: 'https://realty.chosun.com/site/data/html_dir/2026/02/22/2026022201498.html', checkedAt: '2026-09-06', publishedAt: '2026-02-22' },
    { id: 'helio-february-low', kind: 'secondary', publisher: 'Business Watch via Daum', title: 'February 12 sale amount and exclusive area, 22 February 2026', href: 'https://v.daum.net/v/20260222090142258', checkedAt: '2026-09-06', publishedAt: '2026-02-22' },
    { id: 'helio-february-high', kind: 'secondary', publisher: 'Financial News via Nate', title: 'February 19 sale and comparison context, 11 March 2026', href: 'https://news.nate.com/view/20260311n27935', checkedAt: '2026-09-06', publishedAt: '2026-03-11' },
    { id: 'helio-april-sale', kind: 'secondary', publisher: 'Korea Financial Times via Daum', title: 'April 8 first-floor transaction, 10 April 2026', href: 'https://v.daum.net/v/20260410084210205', checkedAt: '2026-09-06', publishedAt: '2026-04-10' },
    { id: 'helio-kb-august', kind: 'secondary', publisher: 'KB Land', title: 'Helio City: 110D sqm category, August 15 transaction displayed at September 6 check', href: 'https://kbland.kr/c/32148', checkedAt: '2026-09-06', publishedAt: null },
  ],
  evidenceReleaseIds: ['helio-reported-follow-up-review-2026-09-06'],
  revisionNote: 'First publication. Five selected later observations, explicitly not the consecutive next five contracts; current cancellation status and exact type matching remain unverified.',
  canonicalHref: '/news/korea-helio-record-follow-up/', translationGroupId: null, infographic: null,
});
