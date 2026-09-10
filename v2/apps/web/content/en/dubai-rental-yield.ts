import type { EditorialPortfolioRecord } from '../portfolio-types';

const checkedAt = '2026-09-09';
const timestamp = '2026-09-09T00:00:00.000Z';

export const DUBAI_RENTAL_YIELD: EditorialPortfolioRecord = Object.freeze({
  id: 'en:dubai-rental-yield-after-costs',
  slug: 'dubai-rental-yield-after-costs',
  locale: 'en',
  marketId: 'ae-dubai',
  type: 'market-brief',
  title: "Dubai's 7% rental yield starts with a rent you can collect",
  deck: 'Dubai apartment rents declined in Q2 2026. Before accepting a headline yield, identify the lease behind the rent and follow one year of cash through the recurring bills.',
  readerQuestion: 'Can this Dubai apartment still collect the rent used in its advertised yield, and what remains after its documented costs?',
  bodyMarkdown: `## The rent deserves a fresh check

A 7% yield on an AED 1,000,000 apartment begins with AED 70,000 of annual rent. The urgent question is whether that is rent the owner can collect now. [CBRE reported](https://www.cbre.ae/insights/figures/uae-real-estate-market-review-q2-2026) that Dubai apartment rents fell 6.5% quarter on quarter and 2.4% year on year in Q2 2026. Those market-wide movements do not predict a particular lease, but they make an old asking-rent assumption unsafe.

A seller's figure may describe a current lease, a recently agreed renewal or an expectation for the next tenant. Each needs different evidence. The credible yield is the one rebuilt from the relevant lease evidence and the building's recurring bill.

## Identify the rent behind the brochure

[DLD recorded](https://dubailand.gov.ae/en/news-media/dubai-s-rental-market-charts-stable-trajectory-reflecting-integrated-regulatory-environment-and-sustained-public-confidence/) 118,385 new rental contracts and 135,607 renewals across Dubai in Q1 2026. These administrative counts include no residential-only breakdown and say nothing about one tenant's likelihood of renewing. They do show why “the rent” needs a label.

| Rent presented | Evidence to obtain | What it supports |
| --- | --- | --- |
| Existing lease | Tenancy/Ejari record, contract dates, payment schedule and receipts | Current contracted rent and cash received to date |
| Renewal | Executed renewal terms and subsequent payment evidence | The renewed amount for its stated period |
| Vacant unit or future tenant | Recent comparable signed leases and a dated letting proposal for like units | A supportable asking range, not guaranteed receipts |

Ejari registration documents a tenancy; it does not prove every payment arrived or that the next contract will repeat the amount. Reconcile the contract with bank or payment evidence, and keep the timing of receipts in the cash plan.

## Follow one year's money

Consider a completed apartment priced at AED 1,000,000 with assumed annual rent of AED 70,000. Assume one vacant month, AED 12,000 of annual service charges, management at 5% of collected rent, and AED 3,000 for repairs and other owner operating costs.

| One-year cash flow | AED |
| --- | ---: |
| Potential rent | 70,000 |
| Vacancy: one month | −5,833 |
| Collected rent | 64,167 |
| Service charges | −12,000 |
| Management | −3,208 |
| Repairs and other owner costs | −3,000 |
| Income after modeled operating costs | **45,958** |

The example assumes the buyer bears a negotiated combined 4% registration charge, AED 40,000, plus an illustrative AED 25,000 for all other acquisition costs. [DLD's completed-property sale service](https://dubailand.gov.ae/en/eservices/property-sale-registration/) lists 2% for the seller and 2% for the buyer, as well as service-partner, VAT and document charges; the allocation and AED 25,000 budget here are assumptions, not a universal buyer package. Total modeled purchase cash is AED 1,065,000.

The AED 45,958 operating income is 4.60% of price and 4.32% of total purchase cash. Acquisition costs belong in the denominator once. Replace the illustrative budget with an itemized completion statement before comparing homes.

## The recurring bill can reverse the ranking

Service charges can continue through a vacancy. Obtain the RERA-approved budget for the correct project, use and year, then reconcile it with the unit statement, billing basis and current arrears balance. [DLD's actual index form](https://dubailand.gov.ae/en/eservices/service-charge-index-overview/service-charge-index) states that arrears are excluded, so a published rate is not a clearance statement. [DLD's FAQ](https://dubailand.gov.ae/en/frequently-asked-questions/) identifies insurance, reserve and common-area costs among service-charge components; check what the unit's bill already covers before adding separate owner allowances.

Keeping AED 1,065,000 of purchase cash, AED 70,000 potential rent, 5% management on collected rent and AED 3,000 of other owner costs, change only vacancy and service charges:

| Vacant months | AED 8,000 charges | AED 12,000 charges | AED 18,000 charges |
| --- | ---: | ---: | ---: |
| 0 | 5.21% | 4.84% | 4.27% |
| 1 | 4.69% | 4.32% | 3.75% |
| 2 | 4.17% | 3.79% | 3.23% |

Each cell is annual income after the stated operating costs divided by total purchase cash. These are sensitivity inputs, not Dubai averages. With one vacant month, an extra AED 6,000 of service charges reduces the modeled yield from 4.32% to 3.75%, about 0.56 percentage points.

## Financing changes the cash result

A positive operating yield does not ensure that rent covers loan payments. If this example includes a hypothetical AED 700,000 loan amortized monthly over 25 years, a fixed 5% nominal annual rate produces a monthly payment of about AED 4,092 and annual cash after loan payments of about −AED 3,147. At 7%, the monthly payment is about AED 4,947 and annual cash is about −AED 13,411.

With one vacant month and the stated operating costs, the annual contractual rent needed to cover those modeled payments is about AED 73,614 at 5% or AED 85,400 at 7%. These rates are scenarios, not lender quotes, and the break-even rents are calculations, not evidence of tenant demand. Loan fees, mortgage registration, insurance and investor-specific tax are excluded. Use actual loan terms and a dated receipt/payment schedule.

## Make the purchase earn its place

Before relying on the yield, obtain four evidence sets: the tenancy/Ejari record with receipts; the approved service-charge budget and current unit statement; an itemized management or letting proposal; and an itemized transfer and finance statement. Recalculate with the rent those records can support, the bill the unit must actually pay and the full cash required at completion.

Proceed only if that evidence-based result clears your required return and leaves enough cash for vacancy, repairs and payment timing. If a cost or proposed rent remains unresolved, run it as a separate downside case rather than entering zero. An off-plan purchase needs a separate delivery and letting timeline because this completed-home example assumes rent can begin after purchase. Use [Dubai Explore](/ae/dubai/explore/) for released area evidence and [Dubai Check](/ae/dubai/check/) to put the asking price in context; neither establishes a unit's rent or bill.

## Method and evidence boundary

The CBRE and DLD observations are dated market context; the AED 1,000,000 property is a hypothetical calculation. The operating result excludes financing, while the loan paragraph includes only the stated repayments. Investor-specific tax, exchange rates, capital changes and exit costs are outside this annual cash-flow model. Confirm unit documents, transaction charges and tax treatment with the responsible providers or qualified advisers.`,
  status: 'published',
  evidenceState: 'verified',
  authorName: 'SignedPrice Data Desk',
  reviewedAt: timestamp,
  reviewedBy: 'SignedPrice AI-assisted source and calculation check',
  publishedAt: '2026-09-06T00:00:00.000Z',
  updatedAt: timestamp,
  relatedHref: '/ae/dubai/check/',
  sources: Object.freeze([
    { id: 'cbre-uae-q2-2026', kind: 'primary' as const, publisher: 'CBRE', title: 'UAE Real Estate Market Review Q2 2026', href: 'https://www.cbre.ae/insights/figures/uae-real-estate-market-review-q2-2026', checkedAt, publishedAt: '2026-07-28' },
    { id: 'dld-rental-q1-2026', kind: 'primary' as const, publisher: 'Dubai Land Department', title: 'Dubai rental market Q1 2026 contract activity', href: 'https://dubailand.gov.ae/en/news-media/dubai-s-rental-market-charts-stable-trajectory-reflecting-integrated-regulatory-environment-and-sustained-public-confidence/', checkedAt, publishedAt: '2026-04-19' },
    { id: 'dld-sale-registration', kind: 'primary' as const, publisher: 'Dubai Land Department', title: 'Property Sale Registration: fees and service terms', href: 'https://dubailand.gov.ae/en/eservices/property-sale-registration/', checkedAt, publishedAt: null },
    { id: 'dld-service-charge-index', kind: 'primary' as const, publisher: 'Dubai Land Department', title: 'Service Charge Index: approved jointly owned property charges', href: 'https://dubailand.gov.ae/en/eservices/service-charge-index-overview/', checkedAt, publishedAt: null },
    { id: 'dld-service-charge-form', kind: 'primary' as const, publisher: 'Dubai Land Department', title: 'Service Charge Index form: period, title deed and arrears scope', href: 'https://dubailand.gov.ae/en/eservices/service-charge-index-overview/service-charge-index', checkedAt, publishedAt: null },
    { id: 'dld-service-charge-faq', kind: 'primary' as const, publisher: 'Dubai Land Department', title: 'Frequently asked questions: service-charge components', href: 'https://dubailand.gov.ae/en/frequently-asked-questions/', checkedAt, publishedAt: null },
    { id: 'dld-ejari', kind: 'primary' as const, publisher: 'Dubai Land Department', title: 'Register or renew tenancy contract', href: 'https://dubailand.gov.ae/en/eservices/register-renew-ejari-contract/', checkedAt, publishedAt: null },
  ]),
  evidenceReleaseIds: Object.freeze(['cbre-uae-market-review-q2-2026', 'dld-rental-market-q1-2026', 'dld-public-source-check-2026-09-09', 'illustrative-dubai-yield-calculation-2026-09-09']),
  revisionNote: 'Reframed the analysis around collectible rent using CBRE Q2 2026 and DLD contract context; consolidated operating and sensitivity calculations, document checks and concise financing break-even results.',
  canonicalHref: '/news/dubai-rental-yield-after-costs/',
  translationGroupId: null,
  infographic: null,
});
