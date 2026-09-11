import type { ContentSource } from '../../lib/content/content-types';
import type { EditorialPortfolioRecord } from '../portfolio-types';

const checkedAt = '2026-09-11';
const source = (id: string, publisher: string, title: string, href: string): ContentSource =>
  Object.freeze({ id, kind: 'primary', publisher, title, href, checkedAt, publishedAt: null });

const singaporeSources = Object.freeze([
  source('sp-sg-ura-transactions-20260911', 'Urban Redevelopment Authority', 'Private Residential Property Transactions (caveats lodged)', 'https://www.ura.gov.sg/Corporate/Property/Property-Data/Private-Residential-Properties'),
  source('sp-sg-ura-q2-20260911', 'Urban Redevelopment Authority', 'Release of 2nd Quarter 2026 real estate statistics', 'https://www.ura.gov.sg/news/media/pr26-57/'),
  source('sp-sg-iras-bsd-20260911', 'Inland Revenue Authority of Singapore', 'Buyer’s Stamp Duty', 'https://www.iras.gov.sg/taxes/stamp-duty/for-property/buying-or-acquiring-property/buyer%27s-stamp-duty-%28bsd%29'),
  source('sp-sg-iras-absd-20260911', 'Inland Revenue Authority of Singapore', 'Additional Buyer’s Stamp Duty', 'https://www.iras.gov.sg/taxes/stamp-duty/for-property/buying-or-acquiring-property/additional-buyer%27s-stamp-duty-%28absd%29'),
  source('sp-sg-iras-fta-20260911', 'Inland Revenue Authority of Singapore', 'Foreigners eligible for ABSD remission under Free Trade Agreements', 'https://www.iras.gov.sg/taxes/stamp-duty/for-property/appeals-refunds-reliefs-and-remissions/common-stamp-duty-remissions-and-reliefs-for-property/foreigners-eligible-for-absd-remission-under-free-trade-agreements-%28ftas%29'),
]);

const tokyoSources = Object.freeze([
  source('sp-jp-reins-tokyo-20260911', 'REINS', 'Tokyo metropolitan condominium market report, July 2026', 'https://www.reins.or.jp/library/'),
  source('sp-jp-mlit-library-20260911', 'Ministry of Land, Infrastructure, Transport and Tourism', 'Real Estate Information Library', 'https://www.reinfolib.mlit.go.jp/'),
  source('sp-jp-reins-kinki-20260911', 'Kinki Real Estate Information Network System', 'Kinki condominium market report, July 2026', 'https://www.kinkireins.or.jp/'),
]);

const base = {
  status: 'published' as const,
  // Copy repair does not upgrade the original publication's evidence review.
  evidenceState: 'partial' as const,
  authorName: 'SignedPrice Data Desk',
  reviewedAt: '2026-09-11T00:00:00.000Z',
  reviewedBy: 'SignedPrice Research Editor',
  publishedAt: '2026-09-11T00:00:00.000Z',
  updatedAt: '2026-09-11T00:00:00.000Z',
  infographic: null,
};

export const PROPERTY_INSIGHTS_2026_09_11: readonly EditorialPortfolioRecord[] = Object.freeze([
  Object.freeze({
    ...base,
    id: 'en:singapore-condo-prices-2026-by-project',
    slug: 'singapore-condo-prices-2026-by-project',
    locale: 'en',
    marketId: 'sg-singapore',
    type: 'market-brief',
    title: 'Singapore condo prices in 2026: why the project matters more than S$1,680 psf',
    deck: 'URA caveat records show why a single average is not enough: project, unit size, sale type and buyer duties can change the answer.',
    readerQuestion: 'What should a buyer read in Singapore condo transaction records before comparing projects?',
    bodyMarkdown: `## One headline number is not one typical home

SignedPrice’s five-year URA transaction release contains 1,744 private residential projects with at least one lodged caveat from August 2021 through August 2026. The median of project-level median unit prices is about S$18,000 per square metre, or roughly S$1,680 per square foot.

That is a useful discovery statistic, not the price of a typical home available today. A project with two compact resales and a large project with many different unit types can each contribute one median. Project, size band and sale type still determine what the number means.

## Regional indices can hide project-level reversals

URA reported that its overall private residential price index rose 0.5% quarter on quarter in Q2 2026. CCR rose 1.8%, while RCR fell 1.2% and OCR fell 0.1%.

Those are market indices, not returns for every condominium. New sales, resales, tenure, unit size and project mix can move differently within the same region. Region names should start a search, not end the comparison.

## Fixing size and budget produces a more useful screen

In SignedPrice’s H1 2026 screen for 80–100 m² private-condominium resales at or below S$1.5 million, 18 projects met the publication rules. The qualifying cohort contained 138 resales, of which 135 were at or below the price ceiling.

These are historical lodged caveats, not homes currently offered for sale. A project appearing in the screen does not guarantee that a comparable unit is available now.

## Keep new sales and resales separate

URA records identify the sale type. New sales, subsales and resales answer different questions, so they should be separated before comparing price levels. A monthly median can move because the mix of launched projects or transacted units changed, even when a comparable existing home did not move by the same amount.

If you are buying a resale, begin with resale records. Hold project, tenure, unit size and period steady, then widen one condition at a time.

## Buyer duties can matter as much as the purchase price

For a foreign individual subject to the standard 60% ABSD rate, a S$1.5 million residential purchase produces S$900,000 of ABSD. Under the current BSD bands, BSD is about S$44,600, bringing price plus those two duties to about S$2,444,600 before legal, financing and holding costs.

This is one buyer-profile example, not a universal tax calculation. Citizens, permanent residents and qualifying nationals covered by specific free-trade-agreement remissions can receive different treatment. Confirm the rules for the actual buyer before comparing budgets.

## Read the project, not only the region

Check the number of comparable transactions, the tenure and the sale type beside every price. A thin sample still has a median, an older 99-year lease is not the same asset as a nearby freehold project, and a new sale should not be treated as a resale comparable.

Open a project in [Singapore Explore](/sg/singapore/explore/) and use [Check a price](/sg/singapore/check/) to place an asking price beside relevant lodged caveats.

## Sources and scope

The transaction period is August 2021 through August 2026, using the SignedPrice URA private-sale release reviewed on 11 September 2026. Duty examples use IRAS guidance checked on the same date. S$18,000 per square metre is a SignedPrice summary of project-level medians, not an official national average or forecast.`,
    relatedHref: '/sg/singapore/explore/',
    sources: singaporeSources,
    evidenceReleaseIds: Object.freeze(['installed-sg-private-sale-2026-09-02']),
    revisionNote: 'Removed draft placeholders and reconciled regional movements, sample counts, links and duty examples against the cited sources.',
    canonicalHref: '/news/singapore-condo-prices-2026-by-project/',
    translationGroupId: 'singapore-condo-prices-2026-by-project',
  }),
  Object.freeze({
    ...base,
    id: 'en:tokyo-asking-price-vs-contracted-price-2026',
    slug: 'tokyo-asking-price-vs-contracted-price-2026',
    locale: 'en',
    marketId: null,
    type: 'market-brief',
    title: 'Tokyo resale condo prices rose while completed deals fell',
    deck: 'July 2026 data point in different directions: contracted prices rose across the 23 wards while completed contracts declined.',
    readerQuestion: 'Why should a Tokyo buyer compare asking prices with completed contract prices before making an offer?',
    bodyMarkdown: `## July’s price and volume signals diverged

REINS reported a July 2026 median contracted price of ¥1.358 million per square metre for resale condominiums across Tokyo’s 23 wards. That was 2.7% higher than a year earlier and the 75th consecutive year-on-year monthly increase.

The number of contracts moved the other way, falling 17.2% year on year for a seventh consecutive monthly decline. Rising prices alongside fewer completed deals should not be read as a simple measure of market strength.

## The three central wards moved differently

Chiyoda, Chuo and Minato recorded contracted prices 5.9% below July 2025 while active listings increased 50.5%. More listings, fewer contracts and lower completed prices describe a different environment from the aggregate 23-ward figure.

A statement that “Tokyo prices keep rising” is therefore too broad for a buyer choosing a particular ward.

## Asking and contracted prices are different evidence

REINS reports contracted prices collected through brokerage activity. MLIT’s Real Estate Information Library publishes transaction and contract-price evidence. A portal asking price is the seller’s starting point, not a completed transaction.

The useful comparison keeps neighbourhood, floor area, building age and transaction period as consistent as possible. A gap between asking and contracted evidence is a question for negotiation, not a universal discount rate.

## Foreign buyers must include financing and holding costs

Ownership is generally open to foreign buyers, but financing can be the practical constraint. Non-residents may need cash or financing arranged outside Japan when domestic lenders require residence, local income or a Japanese credit history.

Add brokerage, registration and acquisition taxes to the purchase budget, then include annual fixed-asset tax, management charges and repair-reserve contributions in the holding budget. Exact amounts depend on the buyer and property.

## Compare completed evidence before making an offer

Use [Tokyo Explore](/jp/tokyo/explore/) to identify the neighbourhood and building-age band, then compare recent contracted prices per square metre with the listing under consideration. Keep size, tenure, age and transaction type aligned, and treat a thin sample as a prompt for more evidence rather than a precise valuation.

## Sources and scope

Sources are the REINS Tokyo and Kinki monthly reports for July 2026 and MLIT’s Real Estate Information Library, reviewed on 11 September 2026. The datasets use different collection methods and should not be merged into one index. Asking prices are not completed transactions, and SignedPrice does not forecast prices or recommend purchases.`,
    relatedHref: '/jp/tokyo/explore/',
    sources: tokyoSources,
    evidenceReleaseIds: Object.freeze(['sp-jp-reins-tokyo-20260911']),
    revisionNote: 'Removed draft placeholders and clarified the distinction between asking prices, completed contracts and aggregate ward data.',
    canonicalHref: '/news/tokyo-asking-price-vs-contracted-price-2026/',
    translationGroupId: 'tokyo-asking-price-vs-contracted-price-2026',
  }),
]);
