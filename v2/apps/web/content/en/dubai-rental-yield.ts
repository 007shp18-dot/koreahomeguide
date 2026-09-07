import type { EditorialPortfolioRecord } from '../portfolio-types';

const checkedAt = '2026-09-07';
const timestamp = '2026-09-07T05:57:26.000Z';

export const DUBAI_RENTAL_YIELD: EditorialPortfolioRecord = Object.freeze({
  id: 'en:dubai-rental-yield-after-costs',
  slug: 'dubai-rental-yield-after-costs',
  locale: 'en',
  marketId: 'ae-dubai',
  type: 'market-brief',
  title: 'Dubai rental yield: what remains of a 7% headline return?',
  deck: 'An illustrative AED 1 million apartment turns a 7% gross yield into about 4.3% on total purchase cash after modeled vacancy and operating costs.',
  readerQuestion: 'How much of a quoted Dubai rental yield remains after vacancy, service charges and purchase costs?',
  bodyMarkdown: `## Start with what the percentage measures

An apartment priced at AED 1,000,000 with annual rent of AED 70,000 has a gross rental yield of 7%. That division says nothing about the cash its owner keeps. In the example below, the annual amount remaining after modeled operating costs is about AED 45,958, or 4.3% of total purchase cash.

This is a worked example for a completed apartment bought without a mortgage and rented on a long-term basis. The purchase price, rent and operating costs are assumptions, not observed transactions, a Dubai average or a forecast. The official sources below establish fee schedules and a way to check building service charges; they do not validate this apartment or its assumed rent.

## Follow the rent from contract to owner

Assume one month without a paying tenant each year. Spread the quoted annual rent evenly across twelve months for this calculation. Also assume annual service charges of AED 12,000, a management bill equal to 5% of collected rent, and AED 3,000 for repairs and other owner operating expenses. Treat these budgets as inclusive of any applicable charges; replace them with itemized quotes for an actual property.

- Potential annual rent: AED 70,000.
- One month of vacancy: subtract AED 5,833.33.
- Collected rent: AED 64,166.67.
- Annual service charges: subtract AED 12,000.
- Management at 5% of collected rent: subtract AED 3,208.33.
- Repairs and other owner operating expenses: subtract AED 3,000.
- Annual income after modeled operating costs: AED 45,958.33, before financing and tax.

Calculations use unrounded values, so displayed lines can differ by a cent. Management is charged on collected rent here, not on the full contractual amount. A real management contract may use a different basis or include minimum and renewal fees.

On the purchase price alone, the resulting operating yield is about 4.60%. A service-charge bill is especially important because the owner may still incur it during vacancy. Obtain the approved charge for the exact building and period through DLD's Service Charge Index, then reconcile the unit's payable amount with current statements. AED 12,000 here is only a modeling input.

## Include the cash needed to complete the purchase

DLD's Property Sale Registration page lists 2% of sale value for the seller and 2% for the buyer. It also lists a service-partner fee of AED 4,000 plus VAT for a sale of AED 500,000 or more, alongside additional document and administrative fees. Confirm the applicable transaction route and the agreed allocation of costs before signing.

For this example only, assume the buyer agrees to bear the combined 4% registration charge: AED 40,000. Add a separate illustrative AED 25,000 budget for all other acquisition costs, including service-partner charges, applicable VAT, brokerage and administrative items. That budget is not an official package price or a universal brokerage rate. Replace every component with an actual quote and add any furnishing or initial works separately.

Total modeled purchase cash is therefore AED 1,065,000. Divide AED 45,958.33 by that amount and the annual yield becomes about 4.32%. Acquisition costs enter the capital denominator once; they are not deducted again as recurring annual expenses. Any future sale costs belong in a separate holding-period return calculation.

## Stress-test vacancy before comparing properties

Keep the price, acquisition costs, service charges and repair budget fixed. Let management remain 5% of rent actually collected. The same apartment then produces these illustrative annual results:

- No vacancy: AED 51,500 after modeled operating costs; 4.84% on total purchase cash.
- One month vacant: AED 45,958; 4.32% on total purchase cash.
- Two months vacant: AED 40,417; 3.79% on total purchase cash.

One additional vacant month removes about AED 5,542 after the associated management-fee saving. Compare properties using the same vacancy and expense definitions. Otherwise a higher advertised percentage may simply reflect fewer costs being counted.

## What if the service-charge bill is higher?

Use the same AED 1,065,000 purchase-cash denominator, AED 70,000 potential rent, 5% management charge on collected rent and AED 3,000 repair budget. Change only vacant months and the annual service-charge assumption:

| Vacant months per year | AED 8,000 service charges | AED 12,000 service charges | AED 18,000 service charges |
| --- | --- | --- | --- |
| 0 | 5.21% | 4.84% | 4.27% |
| 1 | 4.69% | 4.32% | 3.75% |
| 2 | 4.17% | 3.79% | 3.23% |

Every cell is modeled annual income after these operating costs divided by total purchase cash. These are sensitivity inputs, not market estimates or alternative quotes for one building.

At one vacant month, raising service charges from AED 12,000 to AED 18,000 reduces the modeled yield from 4.32% to 3.75%. The extra AED 6,000 removes approximately 0.56 percentage points of annual yield on the same purchase cash, using unrounded values. A higher advertised gross yield can therefore be outweighed by a larger recurring bill.

Compare two properties in the same table only after substituting their actual purchase cash, collectable rent and approved unit-level charges. Shared assumptions help expose a cost difference; they do not make unlike properties equally risky.

## Turn the example into a property decision

Before using a seller's yield, request the current lease and rent-payment history, the approved service-charge information and latest unit statement, an itemized management proposal, and a written purchase-cost breakdown. Check whether the rent is already being paid or merely expected from the next tenant. Identify repair, insurance, letting and utility costs that fall to the owner and ensure the budget covers them.

A mortgage requires the separate cash-flow calculation below, with actual loan terms replacing the assumptions. An off-plan purchase also requires a construction and letting timeline before rental income can begin; the completed-apartment scenario does not supply that timeline.

## A positive operating yield can still leave a cash shortfall

Extend the same example with a hypothetical AED 700,000 mortgage, repaid in 300 equal monthly principal-and-interest payments over 25 years. The loan amount is a scenario input, not a statement of borrowing eligibility. Assume a nominal annual interest rate divided by 12 for monthly compounding, with no rate change during the modeled year. Neither rate below is a lender quote.

Keep the one-month vacancy case and its AED 45,958.33 annual income after operating costs. The payment formula is loan principal multiplied by the monthly rate, divided by one minus (one plus the monthly rate) raised to the power of minus 300.

| Assumed annual rate | Monthly loan payment | Annual cash after loan payments |
| --- | --- | --- |
| 5% | AED 4,092 | −AED 3,147 |
| 7% | AED 4,947 | −AED 13,411 |

Figures use unrounded payments before rounding to whole dirhams. Annual cash equals operating income less twelve loan payments, before investor-specific tax and any additional financing or insurance charges. Subtract the complete payment once; do not also deduct its interest component again.

At 5%, the modeled home requires about AED 3,147 of additional cash over the year despite its positive operating yield. Part of each payment reduces the loan balance, so a negative cash flow is not the same as a total investment loss. Principal repayment also cannot pay a service-charge bill: keep liquidity and changes in equity separate.

## How much rent would cover the modeled loan payments?

With one vacant month, 5% management on collected rent and AED 15,000 in annual service charges and repairs, operating income equals annual contractual rent multiplied by 11/12 and by 0.95, less AED 15,000. Set that result equal to twelve mortgage payments.

The required annual contractual rent is approximately AED 73,614 at the assumed 5% interest rate, or AED 85,400 at 7%. These are calculated break-even rents for the stated expenses, not evidence that tenants will pay those amounts. Additional owner costs raise the required rent. Compare the result with unit-level rental evidence before relying on the purchase to fund itself.

The assumed loan would leave AED 365,000 of the original AED 1,065,000 acquisition budget to fund from the buyer's own money. Mortgage registration, lender fees, insurance, furnishing and reserves may add to that amount; they have not been priced here. Prepare a dated cash schedule from the actual rent-payment and loan-payment terms because an annual total can conceal a shortfall earlier in the year.

## Continue with the Dubai evidence

Use [Dubai Explore](/ae/dubai/explore/) to examine the released area evidence, and [Dubai Check](/ae/dubai/check/) to put an asking price in context. Area figures cannot establish a particular unit's rent, service charge or condition. The [Dubai purchase guide](/ae/dubai/guide/) provides the next research steps.

Keep the price-comparison result separate from the income calculation: a price supported by area evidence can still produce a weak cash flow when vacancy and owner costs are included.

## Evidence boundary

This is an AI-assisted educational calculation. The original fee and service-charge source checks were performed on 6 September 2026; mortgage arithmetic was added and checked on 7 September 2026. It uses no live Dubai transaction dataset and makes no claim about current achievable rents. The operating-yield examples exclude financing; the separate mortgage scenarios include only the stated loan payments. Investor-specific taxes, exchange-rate changes, capital appreciation and exit costs remain excluded. These are annual income and cash-flow scenarios, not total investment returns. Confirm property-specific costs and relevant tax treatment with the responsible providers or qualified advisers before committing capital.`,
  status: 'published',
  evidenceState: 'verified',
  authorName: 'SignedPrice Data Desk',
  reviewedAt: timestamp,
  reviewedBy: 'SignedPrice AI-assisted source and calculation check',
  publishedAt: '2026-09-06T00:00:00.000Z',
  updatedAt: timestamp,
  relatedHref: '/ae/dubai/check/',
  sources: Object.freeze([
    { id: 'dld-sale-registration', kind: 'primary' as const, publisher: 'Dubai Land Department', title: 'Property Sale Registration: fees and service terms', href: 'https://dubailand.gov.ae/en/eservices/property-sale-registration/', checkedAt, publishedAt: null },
    { id: 'dld-service-charge-index', kind: 'primary' as const, publisher: 'Dubai Land Department', title: 'Service Charge Index: approved jointly owned property charges', href: 'https://dubailand.gov.ae/en/eservices/service-charge-index-overview/', checkedAt, publishedAt: null },
  ]),
  evidenceReleaseIds: Object.freeze(['dld-public-source-check-2026-09-06', 'illustrative-dubai-yield-calculation-2026-09-06']),
  revisionNote: 'Added amortizing-mortgage cash-flow and break-even-rent examples, with explicit hypothetical rates and excluded financing costs; retained the operating-yield sensitivity table and original publication date.',
  canonicalHref: '/news/dubai-rental-yield-after-costs/',
  translationGroupId: null,
  infographic: null,
});
