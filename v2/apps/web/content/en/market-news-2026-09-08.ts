import type { ContentMarketId, ContentSource } from '../../lib/content/content-types';
import type { EditorialPortfolioRecord } from '../portfolio-types';

const publishedDate = '2026-09-08T03:00:00.000Z';

const bokRate: ContentSource = Object.freeze({
  id: 'bok-base-rate-2026-08-27',
  kind: 'primary',
  publisher: 'Bank of Korea',
  title: 'Monetary Policy Decision, 27 August 2026',
  href: 'https://www.bok.or.kr/portal/bbs/P0000559/view.do?depth=200690&menuNo=200690&nttId=11064191&programType=newsData&relate=Y',
  checkedAt: '2026-09-08',
  publishedAt: '2026-08-27',
});

const uraQ2: ContentSource = Object.freeze({
  id: 'ura-real-estate-statistics-q2-2026',
  kind: 'primary',
  publisher: 'Urban Redevelopment Authority',
  title: 'Release of 2nd Quarter 2026 real estate statistics',
  href: 'https://www.ura.gov.sg/news/media/pr26-57/',
  checkedAt: '2026-09-08',
  publishedAt: '2026-07-24',
});

const dldH1: ContentSource = Object.freeze({
  id: 'dld-h1-project-completions-2026',
  kind: 'primary',
  publisher: 'Dubai Land Department',
  title: 'Dubai Land Department at IPS 2026',
  href: 'https://dubailand.gov.ae/en/news-media/dubai-land-department-advances-investor-confidence-innovation-and-emirati-empowerment-at-ips-2026-expanding-real-estate-opportunities/',
  checkedAt: '2026-09-08',
  publishedAt: '2026-09-07',
});

const dldQ1: ContentSource = Object.freeze({
  id: 'dld-q1-transactions-2026',
  kind: 'primary',
  publisher: 'Dubai Land Department',
  title: 'Dubai real estate transactions in Q1 2026',
  href: 'https://dubailand.gov.ae/en/news-media/dubai-s-real-estate-transactions-surge-31-to-reach-aed-252-billion-in-q1-2026/',
  checkedAt: '2026-09-08',
  publishedAt: '2026-04-09',
});

function record(input: Readonly<{
  slug: string;
  marketId: ContentMarketId | null;
  type: 'news-brief' | 'market-brief';
  title: string;
  deck: string;
  readerQuestion: string;
  bodyMarkdown: string;
  sources: readonly ContentSource[];
  relatedHref: string;
  evidenceReleaseIds: readonly string[];
  publishedAt?: string;
}>): EditorialPortfolioRecord {
  return Object.freeze({
    id: `en:${input.slug}`,
    slug: input.slug,
    locale: 'en',
    marketId: input.marketId,
    type: input.type,
    title: input.title,
    deck: input.deck,
    readerQuestion: input.readerQuestion,
    bodyMarkdown: input.bodyMarkdown,
    status: 'published',
    evidenceState: 'verified',
    authorName: 'SignedPrice Data Desk',
    reviewedAt: publishedDate,
    reviewedBy: 'SignedPrice official-source and calculation checks',
    publishedAt: input.publishedAt ?? publishedDate,
    updatedAt: publishedDate,
    relatedHref: input.relatedHref,
    sources: Object.freeze([...input.sources]),
    evidenceReleaseIds: Object.freeze([...input.evidenceReleaseIds]),
    revisionNote: 'Initial publication based on the cited official releases; implications are separated from reported facts.',
    canonicalHref: `/news/${input.slug}/`,
    translationGroupId: null,
    infographic: null,
  });
}

export const LATEST_MARKET_NEWS = Object.freeze([
  record({
    slug: 'bank-of-korea-rate-rise-seoul-home-buyers-2026',
    marketId: 'kr-seoul',
    type: 'news-brief',
    title: 'Bank of Korea raised its base rate to 3.0%: the Seoul buyer question is monthly debt service',
    deck: 'The 27 August decision lifted the base rate by 0.25 percentage points; a buyer still needs a lender-specific mortgage quote before changing a home budget.',
    readerQuestion: 'What does the August 2026 Bank of Korea rate increase change for a Seoul home buyer?',
    bodyMarkdown: `## The official decision

On 27 August 2026, the Bank of Korea raised its base rate from 2.75% to 3.00%. The 0.25 percentage-point increase is a monetary-policy decision, not a direct instruction that every mortgage rate must rise by the same amount on the same day.

The Bank cited stronger-than-expected domestic growth, inflation expected to remain above target for a considerable period and the need to continue monitoring financial-stability risks. It also raised its 2026 and 2027 growth forecasts to 3.3% and 2.9% respectively, from 2.6% and 2.1% in its May outlook.

## What changes in a home search

The relevant buyer number is the lender's current annual percentage rate, repayment method, term, approved principal and stress-test treatment. A higher policy rate can affect market funding and loan pricing, but the transmission differs by product and borrower. SignedPrice therefore does not add 0.25 percentage points automatically to every mortgage.

A buyer comparing homes should rerun monthly debt service with a current written quote and keep taxes, brokerage, repairs and reserves outside the maximum loan. If the payment ceiling is fixed, a more expensive loan can reduce the safe purchase-price ceiling even when recent transaction prices are unchanged.

## The recent-sale data cannot yet show a mature response

Our Seoul 59 sqm screen uses contracts dated July through August 2026. The rate decision came on 27 August, four days before that window ended. Most observations therefore pre-date the decision, and later-reported August contracts may still be revised or cancelled.

It would be misleading to describe those transactions as evidence of the full price response to the rate increase. The cleaner follow-up is to compare compatible buildings and size bands over completed post-decision months once reporting has matured.

## What to watch next

Track three layers separately: the Bank of Korea's next decision, the borrower's actual loan quote and reported contracts for the intended building and size. A change in one layer does not prove an immediate or equal change in the others.

For an active search, first set the affordable monthly payment using confirmed loan terms. Then use [Seoul Explore](/kr/seoul/explore/?transaction=sale&propertyType=apartment) to check recent contracts and the [59 sqm shortlist](/news/seoul-59sqm-under-700-million-2026/) to see where repeated sub-KRW 700 million transactions appeared before and around the decision.

Source: Bank of Korea monetary-policy decision published 27 August 2026. The buyer implications above are SignedPrice analysis, not a mortgage offer or forecast.`,
    sources: [bokRate],
    relatedHref: '/news/seoul-59sqm-under-700-million-2026/',
    evidenceReleaseIds: ['bok-rate-decision-2026-08-27'],
    publishedAt: '2026-09-08T03:00:00.000Z',
  }),
  record({
    slug: 'singapore-q2-2026-private-housing-split',
    marketId: 'sg-singapore',
    type: 'news-brief',
    title: 'Singapore’s Q2 housing headline hid a split: overall prices rose 0.5%, non-landed prices fell 0.1%',
    deck: 'URA’s latest quarter shows why an overall private-home index cannot be used as a condominium project valuation.',
    readerQuestion: 'What did Singapore’s Q2 2026 private residential release mean for a condominium buyer?',
    bodyMarkdown: `## The top-line increase was not a condominium-wide increase

Singapore's overall private residential price index increased 0.5% in the second quarter of 2026, after a 0.9% increase in the first quarter. The first-half increase was 1.4%, below the 1.8% recorded in the first half of 2025.

Under that headline, landed-property prices increased 2.5% while non-landed prices decreased 0.1%. A buyer comparing condominium projects should not apply the 0.5% overall movement to an individual unit.

## The three non-landed regions moved differently

URA reported non-landed prices up 1.8% in the Core Central Region, down 1.2% in the Rest of Central Region and down 0.1% in the Outside Central Region. These are regional indices, not matched-project or matched-unit returns.

The different directions make the next step more important: hold project, tenure, sale type, unit area and period as stable as the data permits. A citywide or regional index provides context; it does not replace recent transactions in the intended project.

## Resale activity increased while the pipeline stayed large

URA recorded 3,813 private residential resales in Q2, up from 3,225 in Q1. That is an increase of about 18.2%, calculated from the reported counts. Resales represented 62.0% of all sale transactions, up from 59.6% in the previous quarter.

At quarter-end, 42,472 units including executive condominiums were in the planning-approved supply pipeline, and URA expected about 60,600 private residential units to be completed over the coming years. The vacancy rate for completed private residential units excluding ECs increased from 6.2% to 6.4%.

## What a buyer should do with the release

Use the official quarter to choose the market layer you need, then move down to project evidence. Check whether the intended home is new sale, subsale or resale; compare the same tenure and a narrow size band; and keep current availability and maintenance costs outside the transaction table.

[Singapore Explore](/sg/singapore/explore/) shows released project evidence. The quarterly numbers do not determine whether a particular asking price is fair, whether a unit is available or whether a buyer is eligible to purchase it.

Source: Urban Redevelopment Authority release dated 24 July 2026. The 18.2% resale increase is SignedPrice arithmetic from URA's published Q1 and Q2 counts.`,
    sources: [uraQ2],
    relatedHref: '/sg/singapore/explore/',
    evidenceReleaseIds: ['ura-real-estate-statistics-q2-2026'],
    publishedAt: '2026-09-08T02:58:00.000Z',
  }),
  record({
    slug: 'dubai-h1-2026-completions-and-transaction-growth',
    marketId: 'ae-dubai',
    type: 'news-brief',
    title: 'Dubai added 24,537 completed units in H1 2026: transaction growth is only half the buyer story',
    deck: 'DLD reported 104 completed projects in the first half, alongside strong first-quarter transaction growth; buyers still need area- and building-level checks.',
    readerQuestion: 'How should a Dubai buyer read strong transaction growth alongside a larger flow of completed units?',
    bodyMarkdown: `## The first-half completion number

Dubai Land Department reported that 104 real estate projects were completed in the first half of 2026, with investment value exceeding AED 111 billion and 24,537 new units added to the market. Compared with the same period of 2025, completed-project count increased 38.7%, investment value increased 52% and new-unit count rose by more than 36%.

This is a city-level completion statement. It does not say how many of those units compete with a particular apartment by area, building, bedroom count, quality or asking rent.

## Transactions were also growing

In a separate April release, DLD reported AED 252 billion of real estate transactions in Q1 2026, up 31% in value year on year. It reported 60,303 transactions, up 6% in count, and AED 173 billion of investments across 57,744 investments.

Value growing faster than count does not prove a citywide home-price increase. The totals cover a wider real-estate market than one buyer's ready-apartment search and can change with transaction mix, including high-value segments.

## More completions can change the building-level question

A larger flow of completed units can widen ready-home choice, increase rental competition in some locations or simply reflect handovers that were already absorbed. The city totals do not identify which outcome applies in an area.

For a ready apartment, compare recent completed-unit transactions, current rental contracts, vacancy evidence and the exact service charge. For an off-plan purchase, add completion progress, payment timing, escrow and handover risk. Combining the two segments hides different cash-flow timelines.

## What to watch next

The useful follow-up is not whether Dubai is “up” or “down.” It is where the new completed units are located, how many comparable ready apartments are reselling or renting, and whether net income survives service charges, vacancy and acquisition costs.

Use [Dubai Explore](/ae/dubai/explore/) to separate released area evidence and [Dubai Check](/ae/dubai/check/) to put a specific price in context. Neither citywide announcement validates an individual project, return forecast or current listing.

Sources: Dubai Land Department first-half completion figures and its separate Q1 transaction release. Promotional interpretations in the releases are not treated as independently verified investment conclusions.`,
    sources: [dldH1, dldQ1],
    relatedHref: '/ae/dubai/explore/',
    evidenceReleaseIds: ['dld-h1-completions-2026', 'dld-q1-transactions-2026'],
    publishedAt: '2026-09-08T02:56:00.000Z',
  }),
]);

export const THREE_CITY_BUYER_PULSE = record({
  slug: 'seoul-singapore-dubai-buyer-pulse-september-2026',
  marketId: null,
  type: 'market-brief',
  title: 'Three property headlines, three different buyer risks: Seoul rates, Singapore divergence and Dubai supply',
  deck: 'The latest official signals point to financing pressure in Seoul, mixed regional movement in Singapore and a larger completion flow in Dubai—not one global market direction.',
  readerQuestion: 'What do the latest official Seoul, Singapore and Dubai signals actually change for a buyer?',
  bodyMarkdown: `## The signals do not belong in one league table

Three recent official releases describe three different market mechanisms. The Bank of Korea raised its base rate to 3.00% on 27 August. Singapore's URA reported a 0.5% overall private residential price increase in Q2, while non-landed prices decreased 0.1%. Dubai Land Department reported 24,537 new units from 104 completed projects in H1 2026.

These figures cannot be ranked as though they measure the same thing. One is a financing signal, one is a quarterly price index split and one is a completion flow. Their value is in changing the next question a buyer asks.

| Market | Latest official signal | Buyer question |
|---|---|---|
| Seoul | Base rate raised 2.75% → 3.00% | What monthly payment follows from my current lender quote? |
| Singapore | Overall prices +0.5%; non-landed −0.1% in Q2 | Does my region and project follow the headline index? |
| Dubai | 24,537 new units completed in H1 | How much comparable ready supply is entering my area? |

## Seoul: affordability can move before transaction prices do

A policy-rate change can affect the cost and availability of credit before a clean post-decision transaction sample exists. The immediate task is therefore a financing stress test, not a claim that every Seoul apartment has repriced.

The July–August 59 sqm transaction screen mostly predates the 27 August decision. It remains useful evidence of where contracts occurred, but it cannot yet establish the rate increase's price effect. Recheck the same building and size cohorts after completed post-decision months become available.

## Singapore and Dubai: the headline can hide the relevant segment

Singapore's overall index rose while non-landed prices edged down, and CCR, RCR and OCR moved in different directions. A condominium buyer needs project and unit evidence below the regional layer. The increase from 3,225 to 3,813 resales also describes activity, not automatic appreciation.

Dubai's completion and transaction totals are broad. Ready and off-plan properties have different cash-flow timing, and new supply can be concentrated. The next check belongs at area and building level, with service charges and observed rents separated from advertised gross yield.

## A common decision sequence

Start with the household constraint that changed: monthly debt service in Seoul, relevant market segment in Singapore, or comparable incoming supply in Dubai. Then open the exact property evidence and record its period, sample, area definition and transaction status.

Finally, add buyer-specific costs and eligibility. No citywide rate, index or completion figure establishes a safe purchase price, current availability or future return. SignedPrice will revisit these signals when the next official release and a mature comparable transaction window are available.

Sources: Bank of Korea decision of 27 August 2026, URA Q2 2026 real estate statistics and Dubai Land Department H1 completion and Q1 transaction releases. SignedPrice's cross-market interpretation is an inference from those separate sources, not an official forecast.`,
  sources: [bokRate, uraQ2, dldH1, dldQ1],
  relatedHref: '/passport/',
  evidenceReleaseIds: ['bok-rate-decision-2026-08-27', 'ura-real-estate-statistics-q2-2026', 'dld-h1-completions-2026', 'dld-q1-transactions-2026'],
  publishedAt: '2026-09-08T03:02:00.000Z',
});
