import type { EditorialPortfolioRecord } from '../portfolio-types';

export const SINGAPORE_COMMODORE_PREMIUM: EditorialPortfolioRecord = Object.freeze<EditorialPortfolioRecord>({
  id: 'en:singapore-commodore-resale-premium',
  slug: 'singapore-commodore-resale-premium',
  locale: 'en', marketId: 'sg-singapore', type: 'market-brief',
  title: 'The Commodore rose 12.5%. Its premium over nearby resales still shrank.',
  deck: 'A small historical sample shows a new-launch premium narrowing from 53.3% to 36.0%. Wider size filters preserve the direction, but these are group medians, not owner profits.',
  readerQuestion: 'Can a new condo rise in price while losing part of its premium over nearby existing homes?',
  bodyMarkdown: `## A higher resale price can conceal a weaker relative result

The Commodore became more expensive in our historical sample. Its median price per square foot for 80–120 sqm homes rose from SGD 1,476 in first-year developer sales to SGD 1,661 in later resales: an increase of 12.5%.

Yet its premium over a fixed group of five nearby resale projects fell from 53.3% to 36.0%. The newer project remained more expensive, but the surrounding resale reference rose faster. A buyer looking only at the positive headline would miss that narrowing.

The later Commodore sample contains just six transactions. This is an early, descriptive comparison, not proof that its owners earned less than their neighbours or that new launches generally underperform. The useful finding is that an increase in nominal prices and preservation of a relative premium are separate tests.

## Begin with sales we can actually observe

The Commodore launched in November 2021. PropNex's contemporary December 2021 market review records 164 developer sales that November at a project-wide median of SGD 1,513 psf. That corroborates the launch timing; it is not the filtered price used in this study.

Our source snapshot begins in August 2021. Using a project launched earlier would risk treating its remaining inventory as the original launch cohort. Here, the first comparison window runs from November 2021 through October 2022, covering the first twelve months rather than only launch day.

The later window is September 2025 through August 2026. It includes resale transactions only, excluding developer sales and subsales. We use 99-year leasehold, single-unit strata apartments and condominiums of 80–120 sqm, with valid prices and project coordinates. Each project must have at least five transactions in each window.

The Commodore contributes 67 first-window developer sales and six later resales. Those six are observed from April through July 2026. They are not identified repeat sales of the same 67 homes: the dataset used here has no unit number suitable for matching purchase and resale pairs.

## Compare with the same five neighbours in both windows

We search within 1,500 metres of The Commodore's source project coordinate and retain every other project meeting the same size, tenure and minimum-count conditions. All five qualifying comparison projects happen to lie within approximately 346–474 metres. These are straight-line distances, not walking distances.

- Canberra Residences: 13 then six resales; median SGD psf 963 to 1,221.5, up 26.8%.
- Eight Courtyards: 25 then 13 resales; 1,097 to 1,394, up 27.1%.
- The Nautical: 15 then eight resales; 1,102 to 1,346.5, up 22.2%.
- Yishun Emerald: 12 then six resales; 863.5 to 1,067.5, up 23.6%.
- Yishun Sapphire: six then nine resales; 848 to 1,095, up 29.1%.

Together, the peers supply 71 earlier and 42 later transactions. The median of their five individual percentage changes is 26.8%. All five increases exceed The Commodore's 12.5% in this particular sample. That is a descriptive comparison of changing groups of sold homes, not a risk-adjusted ranking.

## Measure the premium separately from the price increase

For each window, we take the median of the five peer project medians, giving each project equal weight. This reference is SGD 963 psf initially and SGD 1,221.5 later. It is not the median of all pooled peer transactions.

The initial premium is 1,476 divided by 963, minus one: 53.3%. The later premium is 1,661 divided by 1,221.5, minus one: 36.0%. The difference is a decline of 17.3 percentage points. It is not a 17.3% fall in The Commodore's home values.

The absolute psf gap also narrowed, from SGD 513 to SGD 439.5. Both the newer project's price and the older-home reference rose; the reference simply covered more ground. This is how a buyer can see appreciation while part of the relative premium paid for the newer product erodes.

We have not isolated a pure novelty premium. Remaining lease, construction age, facilities, layout, location and the mix of homes sold all enter the observed price gap. Calling all 53.3% a charge for being new would overstate what the calculation identifies.

## Double the resale sample as a sensitivity check

Widening the range to 50–120 sqm increases The Commodore's sample to 150 developer sales and twelve resales. Its median rises from SGD 1,508.5 to SGD 1,714 psf, or 13.6%. The same five peer projects remain eligible, contributing 85 and 48 transactions.

Under this broader filter, the relative premium narrows from 55.5% to 39.4%, a decline of 16.1 percentage points. The direction therefore survives this one change in the size filter. The broader sample overlaps the main sample; it is not an independent replication.

Size composition still moves. In the main Commodore sample, median area changes from 95 to 101 sqm. In the broader sample it changes from 71 to 81.5 sqm. We use psf to improve size comparability, but psf itself can vary systematically with unit size. Floor, layout and condition are not held constant, and six or twelve resales cannot support a precise causal estimate.

## What this changes in the next purchase comparison

The historical question is not just whether a launch buyer could later point to a higher price. It is whether the extra amount paid over an existing alternative remained justified when the property entered the resale market.

This sample suggests testing premium compression alongside price appreciation. It does not show that buying any of these older condos would have produced a superior net investment return. Purchase dates, rental income, borrowing, taxes, maintenance and sale costs are not included, and the units are not matched.

For a future launch, an appreciation scenario should allow the surrounding market to rise too. Assuming the new project's price rises while its original relative premium automatically survives builds two favourable assumptions into one forecast. Here, the observed group price increased while that relative premium became smaller.

## Source and reproduction

Calculations use SignedPrice's existing URA-derived snapshot generated on 2 September 2026, digest e2bc92b0e75ffb7eaf17544e883a96e2986995f7db208f14b711cab8714a1e3c. This is a historical reanalysis, not a fresh live transaction download. The repository script v2/scripts/analyze-commodore-premium.mjs reproduces both samples, individual project figures and premium calculations, using unrounded values before publication rounding.

URA explains that new sales are based on developers' Options to Purchase, while resales and subsales use lodged caveats. Lodging a caveat is not mandatory, so coverage is not a census of every transaction. Subsequent source corrections are not incorporated. The five-transaction threshold is a disclosure rule for this study, not a guarantee of statistical reliability.`,
  status: 'published', evidenceState: 'partial', authorName: 'SignedPrice Data Desk',
  reviewedAt: '2026-09-06T22:29:00.000Z', reviewedBy: 'SignedPrice AI-assisted source and calculation check',
  publishedAt: '2026-09-06T22:29:00.000Z', updatedAt: '2026-09-06T22:29:00.000Z',
  relatedHref: '/news/korea-helio-record-follow-up/',
  sources: [
    { id: 'ura-sales-definition', kind: 'primary', publisher: 'Urban Redevelopment Authority', title: 'Private residential transactions: definitions and coverage', href: 'https://eservice.ura.gov.sg/property-market-information/pmiResidentialTransactionSearch', checkedAt: '2026-09-06', publishedAt: null },
    { id: 'commodore-launch', kind: 'secondary', publisher: 'PropNex Research', title: 'November 2021 new-home sales review, 15 December 2021', href: 'https://www.propnex.com/news-details/4692/new-home-sales-surged-in-november-private-residential-market-to-end-the-year-strongly-with-growth-momentum-projected-to-spill-into-2022', checkedAt: '2026-09-06', publishedAt: '2021-12-15' },
  ],
  evidenceReleaseIds: ['singapore-private-sale-e2bc92b0e75f', 'commodore-premium-study-2026-09-06'],
  revisionNote: 'First publication. Six-observation main resale sample and twelve-observation sensitivity disclosed; no matched-unit, causal or net-profit claim.',
  canonicalHref: '/news/singapore-commodore-resale-premium/', translationGroupId: null, infographic: null,
});
