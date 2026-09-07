import type { EditorialPortfolioRecord } from '../portfolio-types';
import type { ContentSource } from '../../lib/content/content-types';

const source = (id: string, publisher: string, title: string, href: string): ContentSource => ({
  id, publisher, title, href, kind: 'primary', checkedAt: '2026-09-06', publishedAt: null,
});
export const RESEARCH_SOURCES = {
  bsd: source('sg-iras-bsd', 'IRAS', 'Buyer’s Stamp Duty rates and computation', 'https://www.iras.gov.sg/taxes/stamp-duty/for-property/buying-or-acquiring-property/buyer%27s-stamp-duty-%28bsd%29'),
  absd: source('sg-iras-absd', 'IRAS', 'Additional Buyer’s Stamp Duty', 'https://www.iras.gov.sg/taxes/stamp-duty/for-property/buying-or-acquiring-property/additional-buyer%27s-stamp-duty-%28absd%29'),
  fta: source('sg-iras-fta', 'IRAS', 'Foreigners eligible for ABSD remission under FTAs', 'https://www.iras.gov.sg/taxes/stamp-duty/for-property/appeals-refunds-reliefs-and-remissions/common-stamp-duty-remissions-and-reliefs-for-property/foreigners-eligible-for-absd-remission-under-free-trade-agreements-%28ftas%29'),
  acquisition: source('kr-acquisition', 'Invest KOREA / KOTRA', 'Real estate acquisition: related laws', 'https://www.investkorea.org/ik-en/cntnts/i-417/web.do'),
  lease: source('seoul-rental-structures', 'Seoul Metropolitan Government', 'Wolse and jeonse', 'https://english.seoul.go.kr/service/living/housing/1-wolse-jeonse/'),
  protection: source('kr-foreign-lease-protection', 'Ministry of Government Legislation / Easy Law', 'Lease agreements for foreign nationals', 'https://m.easylaw.go.kr/MOM/SubCsmOvRetrieve.laf?ccfNo=1&cciNo=1&cnpClsNo=1&csmSeq=2495&langCd=700101'),
  ura: source('sg-ura-q2-2026', 'Urban Redevelopment Authority', 'Q2 2026 real estate statistics, 24 July 2026', 'https://www.ura.gov.sg/news/media/pr26-57/'),
} as const;

type Expansion = Readonly<{ body: string; sources?: readonly ContentSource[]; updatedAt?: string; revisionNote?: string }>;
const expansions: Readonly<Record<string, Expansion>> = {
"seoul-district-price-distribution": { body: "## What the chart actually measures\n\nThe chart compares the median of published building medians in five selected Seoul districts. It is not the median of every contract in those districts. Each eligible building contributes one median, so a building with many more contracts does not automatically receive more weight.\n\nThe underlying public summary covers January through July 2026. Later raw records installed elsewhere on the site do not change this chart\u2019s period. Keep the release label with any comparison; a newer page date is not evidence of a newer dataset.\n\n## Read the gaps at the right scale\n\nIn this selected release, Yongsan\u2019s figure is KRW 547.5 million and Gangnam\u2019s is KRW 537.5 million. The KRW 10 million difference is small relative to the many characteristics that distinguish individual homes. It does not establish that a particular Yongsan apartment should command more rent than a particular Gangnam apartment.\n\nNowon\u2019s selected figure is KRW 260 million. Before interpreting the gap, inspect the represented buildings, size bands and housing types. Differences in what was observed can contribute to differences in the summary.\n\n## A similar middle can hide a different search experience\n\nA median gives the central observation after sorting. It leaves out how tightly the remaining observations cluster around that centre. Two districts can therefore share a similar median while offering very different numbers of homes close to your budget.\n\nThe next step is to inspect the distribution and the buildings behind it. Look for the range of usable observations and the sample count. When a cohort does not meet the publication minimum, leave it out of a price comparison rather than treating it as a zero.\n\n## Use the district to choose where to look\n\nOpen two candidate districts in Explore and keep the transaction type, area band and period fixed. Write down which buildings remain affordable, then investigate their condition, commute and actual contract terms. A district chart earns its place in the decision when it leads to comparable properties, not when it becomes a district investment score." },
"seoul-new-renewal-rent-gap": { body: "## The comparison is inside one cohort\n\nThis chart uses one published Dobong apartment cohort with an area band of 45\u201355 square metres. It separates 18 new contracts from 13 renewals over January through July 2026. Keeping the building and size band together makes the example more interpretable than comparing unrelated city-wide groups.\n\nThe published median deposit is KRW 225 million for new contracts and KRW 200 million for renewals. The difference is KRW 25 million, or 12.5% of the renewal median. That is a description of this sample, not the increase paid by every renewing tenant.\n\n## Two groups do not form a before-and-after study\n\nThese observations are not necessarily matched contracts for the same units. Differences in floors, condition, contract dates and the people negotiating can remain even within a building and area band. The comparison does not isolate the effect of renewal status alone.\n\nA stronger before-and-after question would require appropriately matched observations and a clear account of what changed. Without that evidence, use the two medians as a reason to examine contract groups separately.\n\n## Why a blended median can mislead a newcomer\n\nA person negotiating a new lease wants to understand the options available for a new contract. Mixing many renewals into that sample can move the middle without describing those options well. Conversely, a new-contract median is not automatically the relevant legal or negotiated basis for a renewal.\n\nKeep the contract-group filter visible. If changing the filter makes the sample too thin, widen the period explicitly or look for another compatible building. Do not silently add renewals just to produce a number.\n\n## Take the finding into a real comparison\n\nFor an actual offer, compare deposit, monthly rent and management fees together. Check the precise area and terms, then examine what is known about the unit. The cohort can support a pricing question; it cannot settle deposit protection, property condition or what a landlord must agree to." },
"korea-deposit-monthly-rent-cost-structure": { body: "## Three amounts belong in the same conversation\n\nThe worked example separates KRW 850,000 monthly rent, KRW 120,000 management fees and KRW 250,000 monthly deposit-capital cost. Added together, the simplified monthly burden is KRW 1,220,000. These are illustrative inputs, not an advertised home or a measured Seoul average.\n\nThe point is to make omitted costs visible. If a search sorts only the rent column, a home with a larger deposit or higher fee can appear cheaper even when the overall monthly commitment is greater.\n\n## Make the deposit assumption reproducible\n\nA monthly capital cost of KRW 250,000 could, for example, come from KRW 75 million multiplied by a 4% annual assumption and divided by 12. The 4% is a selected assumption for this example, not a quoted loan rate, a legal conversion rule or a guaranteed return.\n\nUse the cost of borrowing for the financed portion and a clearly stated opportunity-cost assumption for your own funds. Avoid adding a full-deposit capital cost on top of interest that already covers the same borrowed money.\n\n## Separate recurring bills from upfront cash\n\nManagement fees may cover different services across homes. Request the actual inclusions before placing two fees side by side. Utilities, insurance and repairs can require separate allowances. Brokerage and moving costs are paid on a different schedule and should remain visible in the cash budget.\n\nA monthly comparison is useful for screening, but it does not show whether you have enough money on the payment date. Keep an upfront cash schedule as well as the recurring-cost calculation.\n\n## Test a second scenario before choosing\n\nIncrease the capital-cost assumption and ask whether the preferred offer changes. Then consider the cash reserve remaining after the deposit and move. If a small change reverses the ranking, the decision depends heavily on that assumption and deserves closer attention.\n\nUse Check with the written offers and your selected basis. Keep the raw deposit and rent alongside the converted number so that the calculation stays open to inspection. A lower result does not establish the safety of the deposit or the suitability of the contract." },
"singapore-ccr-rcr-ocr-comparison": { body: "## A regional starting point, with a long observation window\n\nThe chart uses the median of published project median prices per square foot: S$2,167 in CCR, S$1,716 in RCR and S$1,462 in OCR. The underlying release spans August 2021 through August 2026. These are five-year project summaries, not current-quarter regional transaction medians.\n\nThe represented project counts are 614, 745 and 1,053 respectively. Each published project median contributes to the regional summary. A project with more transactions does not receive additional weight in this particular calculation.\n\n## Why this is different from the URA index\n\nA summary of project medians and an official price index answer different questions. The chart describes the level of the project observations retained in a release. URA\u2019s quarterly index tracks market movement under its own methodology. Do not join the two into a single unlabeled series.\n\nFor a timely market view, read the quarterly release alongside this chart. For a purchase comparison, move down to the project and examine transactions in a period appropriate to the decision.\n\n## A lower psf does not settle the budget\n\nAn apartment with a lower price per square foot can still cost more in total if it is larger. Likewise, the same psf does not mean equivalent tenure, layout or building condition. Record the total price, area and tenure before deciding which comparison matters.\n\nThe regions also contain different mixes of properties and sale types. A regional gap should prompt questions about the available stock rather than an assumption that every unit carries the same location premium.\n\n## Use the regions to organise the shortlist\n\nChoose a region in Explore and open a project with a usable sample. Start with compatible units and contract dates, then investigate differences at a viewing. If the evidence is sparse, say which dimension you widened to obtain a comparison.\n\nFinish with the acquisition budget, including the duties appropriate to the buyer, and a separate ownership-cost estimate. This chart does not include either. Its useful output is a more focused project search, not a regional return forecast." },

  'read-singapore-private-transactions': {
    sources: [RESEARCH_SOURCES.ura, RESEARCH_SOURCES.bsd, RESEARCH_SOURCES.absd, RESEARCH_SOURCES.fta],
    body: `## Start with the building, then the price

A project median is a useful first filter. It becomes much less useful when the apartment you want is a small resale unit and the comparison includes large developer sales. Open the project, check its street and tenure, and write down the unit size and contract period before looking at the centre of the price range.

Keep a short comparison sheet: project, contract date, area, total price, price per square foot, tenure and sale type. Mark missing fields as unknown. A blank tenure field is a reason to investigate; it does not make two properties comparable.

## The unit price can change the ranking

Consider two illustrative apartments: one costs S$1.8 million for 900 sq ft, the other S$2 million for 1,100 sq ft. Their unit prices are S$2,000 and about S$1,818 psf. The first is cheaper to purchase but more expensive per square foot. Neither result tells you which layout, lease or location better suits your plan.

This distinction matters when a search budget is tight. Compare the total cash commitment first, then use psf to examine whether the premium has an explanation. Inspect floor plans and the actual unit before attributing that premium to quality.

## Budget beyond the agreed price

For a hypothetical S$2 million residential purchase where the market value is no higher, the current IRAS BSD bands produce S$69,600: S$1,800 + S$3,600 + S$19,200 + S$20,000 + S$25,000. This is a marginal-band calculation, not 6% of the entire price.

A foreign individual subject to the standard 60% ABSD rate would add S$1.2 million. Price plus these two duties is therefore S$3,269,600, before legal fees, financing and other costs. This worked example assumes no remission and is not a quote for a particular buyer.

IRAS provides FTA treatment for qualifying nationals and permanent residents of Iceland, Liechtenstein, Norway and Switzerland, and US nationals. Confirm the applicable profile before using the example; citizenship, ownership and remission conditions can change the result.

## Keep the market index in its own column

URA’s quarterly series describes market movement. A project’s median describes the transactions included in that project sample. Applying an island-wide percentage increase to a single apartment assumes that it tracked the index, an assumption the transaction table cannot prove.

Start in Singapore Explore, choose CCR, RCR or OCR, then open a project with usable observations. If the sample is too thin, widen the date range explicitly and note what changed. Keep HDB comparisons separate because the housing system and buyer eligibility differ.

## Before making an offer

Turn the shortlist into three numbers: the acquisition budget, the annual ownership budget and the cash reserve. Obtain actual quotes for financing, legal work, maintenance and insurance. If rental income is part of the plan, examine achieved rents for comparable units and allow for vacancy; a sale-price chart alone cannot establish yield.`,
  },
  'buy-property-in-korea-as-foreigner': {
    sources: [RESEARCH_SOURCES.acquisition],
    body: `## Start with what you intend to do with the home

An apartment bought to live in and an apartment bought to rent out may require different checks. Write down the buyer’s residency status, the intended use, where the purchase money will come from and whether there is an existing tenant. These are questions to settle before negotiating a deposit.

Invest KOREA distinguishes real-estate transaction procedures, foreign-investment procedures and foreign-exchange reporting. They are separate routes with different triggers. Ask the receiving authority and your bank which applies to your situation; completing one form does not necessarily complete the others.

## Match the apartment across the records

A translated building name is not enough. Record the Korean address, lot number, building and unit, then match them to the title record and building register. Establish who owns the property, who will sign and whether a representative has authority. Note mortgages, restrictions and any occupancy arrangement for your adviser to assess.

Use Seoul Explore to inspect sale contracts for the same building and similar exclusive floor area. Keep the transaction month and sample size beside the price. A rental-deposit figure and a completed sale price should never occupy the same comparison column.

## Check the exact parcel for permission requirements

Seoul publishes designation notices and directs users to the official land-use service for an exact parcel check. A district name in a headline is too broad to settle the question. Save the applicable notice and ask the competent office how the planned use, buyer and contract date affect the transaction.

A proposed tenancy can matter to the intended use. Do not assume that an investment plan is permissible simply because similar apartments appear in a price database. Resolve this before entering a binding payment schedule.

## Separate purchase cost from money available on closing day

Prepare a cash schedule with price, taxes, brokerage, registration and legal costs on one side, and savings, confirmed borrowing and incoming transfers on the other. Put due dates beside each item. Money that will arrive after closing cannot fund the closing payment.

If you borrow or remit in another currency, test an adverse exchange-rate scenario as well as a higher financing cost. Keep the original currency in the research sheet so that a currency movement is not mistaken for a change in the apartment’s local price.

## Contract, completion and registration

Ask the professionals handling the purchase to set out conditions for finance, permissions, existing tenant deposits, document delivery and the release of registered charges. Decide how failed conditions affect payments before signing, rather than relying on a verbal assurance.

Recheck the relevant records near completion, preserve transfer receipts and obtain evidence of the filings and ownership registration. This guide organises the decision; the current rules and the responsible authorities determine the requirements for an individual acquisition.`,
  },
  'wolse-vs-jeonse': {
    sources: [RESEARCH_SOURCES.lease, RESEARCH_SOURCES.protection],
    body: `## A lower monthly bill can require much more cash

In wolse, the tenant generally provides a deposit and pays monthly rent. Jeonse generally replaces most or all monthly rent with a much larger refundable deposit. Seoul’s housing guidance describes these structures, but the actual contract determines the payment schedule and what is included.

Start by comparing homes you would actually accept: similar size, condition, commute and lease period. If one is a newer apartment near work and the other a smaller unit much farther away, a rental-structure calculation will not explain the whole difference.

## Put both offers on the same monthly basis

Here is an illustrative comparison, not a current listing. Offer A requires a KRW 300 million deposit and no monthly rent. Offer B requires KRW 50 million plus KRW 900,000 a month. Assume management fees are equal and use a 4% annual cost for the deposit capital.

Offer A’s monthly capital cost is KRW 1,000,000. Offer B’s is about KRW 166,667; including rent brings it to about KRW 1,066,667. The apparent KRW 900,000 monthly saving has narrowed to roughly KRW 66,667 once the extra tied-up cash is included.

## Find the assumption that changes the answer

The extra deposit is KRW 250 million and the annual rent saved is KRW 10.8 million. Dividing the latter by the former gives a break-even rate of 4.32%, before fee differences and transaction costs. Below that rate, A has the lower simplified monthly cost; above it, B does.

Use your actual borrowing cost for borrowed funds and a stated opportunity-cost assumption for your own funds. Do not count the same capital twice. If the deposit is funded partly by debt, separate the two portions rather than applying a blanket rate without explanation.

## Cost is only one part of the decision

A large deposit is money you need to recover. Ask who holds it, what registered claims affect the property and how repayment will be funded at the end of the lease. A mathematically cheaper offer may leave too little cash for an emergency or create a difficult gap before the next move.

Foreign residents should confirm the residence-reporting and protection steps applicable to their status. The official Easy Law guidance explains the relevance of alien registration and a reported change of residence. A price comparison does not establish legal priority or guarantee eligibility.

## Take the actual offers into Check

Enter the deposit and rent from the written offers, add the management fees and record your conversion assumption. Repeat with a higher rate and check how much accessible cash remains after moving. Keep the signed terms and the protection checks beside the cost result; both belong in the decision.`,
  },
  'rent-an-apartment-in-korea': {
    sources: [RESEARCH_SOURCES.lease, RESEARCH_SOURCES.protection,
      { id: 'ibs-housing-addresses', publisher: 'Institute for Basic Science', title: 'Living in Korea: dual address systems', href: 'https://centers.ibs.re.kr/html/living_en/housing/addy.html', kind: 'primary', checkedAt: '2026-09-07', publishedAt: null },
      { id: 'ibs-housing-measurements', publisher: 'Institute for Basic Science', title: 'Living in Korea: housing measurement standards', href: 'https://centers.ibs.re.kr/html/living_en/housing/measure.html', kind: 'primary', checkedAt: '2026-09-07', publishedAt: null },
    ],
    updatedAt: '2026-09-07T05:57:26.000Z',
    revisionNote: 'Added Korean listing vocabulary, a labeled rent example, address and area matching, and bilingual viewing questions. IBS address and measurement guidance checked on 7 September 2026; existing legal-source review dates preserved.',
    body: `## Set a deposit ceiling before booking viewings

Two homes with the same monthly rent can demand very different amounts of cash. Divide the budget into money paid upfront, money spent each month and money kept available. Allow for brokerage, moving, utilities and the period when an old deposit may not yet have been returned.

Seoul’s housing guidance distinguishes wolse and jeonse. Choose which structures your finances can support before sorting listings. A deposit is refundable under the contract, but it is unavailable for other spending while it is committed to the tenancy.

## Decode the price before comparing listings

Keep these Korean labels beside your search. Ask the agent to write every amount in full Korean won, including the unit used by the listing.

| Korean label | Meaning | What to record |
| --- | --- | --- |
| 보증금 | Deposit | Full amount and payment dates |
| 월세 | Monthly rent | Recurring rent, separate from fees |
| 전세 | Jeonse | Deposit and any other payments |
| 관리비 | Management fee | Amount, inclusions and extra bills |
| 전용면적 | Exclusive-use area | Square metres for the actual unit |
| 입주가능일 | Available move-in date | Date confirmed for this home |

For an illustrative advert explicitly labeled in 만원 (units of KRW 10,000), a deposit/rent pair of 1,000 / 80 means KRW 10,000,000 upfront and KRW 800,000 monthly rent. If management is another 10만원, rent plus management is KRW 900,000 per month, before utilities and the cost of deposit funds. The slash alone does not establish the units or what is included. Confirm both before entering the numbers in [Seoul Check](/kr/seoul/check/).

## Match the address, even when the building has no English name

The [IBS address guide](https://centers.ibs.re.kr/html/living_en/housing/addy.html) explains Korea's road-name and land-lot formats. Keep both when supplied. The district (gu), neighbourhood (dong), lot number, building and unit help distinguish homes with similar names. A lot number without its district and neighbourhood is incomplete.

The word dong also appears after a building number in an apartment complex. In the illustrative notation 102동 304호, 102 identifies the building and 304 the unit; this is different from a neighbourhood name ending in -dong. Ask for the full address rather than copying those two numbers alone.

In SignedPrice, a numeric or lot-based label can be the best available identity when no verified building name is present. Keep the Korean spelling and address when contacting an agent. An English display name helps navigation, but the address must still match the home you will view.

## Compare the same kind of floor area

The [IBS measurement guide](https://centers.ibs.re.kr/html/living_en/housing/measure.html) explains pyeong and the importance of exclusive-use area. One pyeong is approximately 3.31 sqm. A unit conversion alone cannot resolve whether an advert includes shared space.

Ask specifically for 전용면적 in square metres. If a listing supplies a larger total or supply-area figure, record it separately. Use the exclusive-use figure when selecting the Seoul evidence area band, then inspect the floor plan: equal recorded area does not guarantee equal room sizes, storage or layout.

## Use the search to build a small, comparable shortlist

Choose a commute you can live with, then narrow by housing type and usable area. In Explore, note whether the figure is a deposit, monthly rent or a sale price. Match the period and size band before comparing buildings, and inspect the sample count alongside the median.

Treat these records as context for a viewing. They do not show whether a home is available, whether the photographs are current or whether a landlord will accept your terms. Ask for the exact address and unit before deciding that a property in an advert matches the building in the data.

## Three questions to send before a viewing

- Is this exact home still available, and what is the full address and unit? / 이 매물은 아직 계약 가능한가요? 정확한 주소와 동·호수를 알려주세요.
- Please confirm the deposit, monthly rent, management fee and any separate charges. / 보증금, 월세, 관리비와 별도 비용을 각각 알려주세요.
- What is the exclusive-use area in square metres, and when can I move in? / 전용면적은 몇 제곱미터인가요? 입주 가능한 날짜는 언제인가요?

Keep the reply with the listing. If the agent proposes a different home, start a new comparison for that address rather than carrying over the original price evidence.

## Use the viewing to find costs the advert left out

Ask what the management fee includes and request recent bills where available. Check heating, cooling, water pressure, ventilation, noise and any visible damp. Record included appliances and repairs promised before move-in. A lower rent can be offset by recurring costs or an expensive move later.

Write down the answers while viewing. If a feature is essential, such as a working air conditioner or a particular move-in date, put the agreement into the contract rather than leaving it in a message thread.

## Verify the person receiving the money

Match the property record, owner, signer and receiving account. If someone signs for the owner, have the authority checked independently. Obtain current records and ask a qualified local professional to explain registered claims and the protection implications for your tenancy.

Before paying a material sum, agree the payment dates, termination terms and deposit-return arrangement in writing. If something cannot be verified, pause the payment decision until it can. A busy viewing schedule is not evidence that the documents are correct.

## Plan move-in as a sequence of tasks

Arrange possession, the reporting steps applicable to your residency status, the contract’s fixed-date process and any guarantee application with the relevant offices. These tasks serve different purposes; one receipt should not be treated as proof that every protection step is complete.

Photograph the handover condition, record meter readings and keep keys, receipts and the signed contract together. Revisit the cost comparison after the final fees are known so that the first month’s cash needs are not a surprise.`,
  },
  'korea-rental-contract-checklist': {
    sources: [RESEARCH_SOURCES.protection],
    body: `## Bring a record of the exact home

Before the contract meeting, write down the address, building and unit you viewed. Match that identity to the title record, building register and draft lease. Similar names or a shared street do not establish that two records describe the same dwelling.

Keep the listing, photographs and agreed terms together. Where a translated description differs from the Korean document, resolve the difference before signing. A translation is useful for understanding; it should not leave uncertainty over the actual premises or obligations.

## Establish who can sign and receive payment

Match the registered owner to the signer. If a representative is involved, arrange an independent check of their authority and the payment instructions. Ask your adviser to explain mortgages and other registered rights rather than relying on a reassuring description from the person arranging the deal.

Keep the documents used for that check and record when they were obtained. Recheck near a major payment because the facts relevant to the transaction may change between the viewing and completion.

## Write the complete payment schedule

List the initial payment, remaining deposit, monthly rent and management fee separately. Put dates and receiving-account details beside the sums. Record utilities, repairs, furnished items and any charges on early termination. Clarify which amounts are refundable and under what conditions.

For example, a promise to replace a faulty appliance should identify the appliance and completion date. A statement that the fee includes utilities should identify which utilities and whether there is a usage limit. Specific terms are easier to check at handover.

## Put the end of the tenancy into the discussion now

Ask when and how the deposit will be returned, what deductions may be made and how disputes will be handled. Consider whether your next move requires the money before it is due back. A cash gap between homes is a practical problem even where the paperwork looks orderly.

If a guarantee is part of your plan, check eligibility with the provider before relying on it. A guarantee application, a fixed date and residence reporting are distinct matters. Confirm the process appropriate to your status and property with the responsible office.

## Keep a closing file you can use later

Preserve the signed lease, identity checks, payment receipts, records of filings and the handover photographs. Note the actual condition of fixtures and meter readings. Store important dates in a place you will consult before renewal or departure.

This checklist helps identify missing information. It cannot establish the priority of a claim, the solvency of the landlord or entitlement under a guarantee. Ask for an explanation of unresolved issues before committing the deposit.`,
  },
  'read-seoul-sale-transactions': { body: `## A completed contract answers a narrow question

A transaction record tells you that a reported deal occurred under the source’s definitions. It does not tell you the asking price today, the seller’s motivation or the condition of the unit. Start with the reported contract date and property identity rather than the largest number in a search result.

On SignedPrice, select sale evidence before comparing purchase prices. Rental deposits describe a different obligation. Save the period used in the comparison so that a later update can be explained rather than mistaken for an unexplained price change.

## Build the smallest useful comparison

Start with the same building and similar exclusive floor area. Then examine contract dates, floors and the range of prices. If there are too few usable observations, widen the period or area band deliberately and note the change.

Suppose three illustrative sales of similar units are KRW 900 million, KRW 920 million and KRW 1.08 billion. The median is KRW 920 million; the mean is about KRW 966.7 million. That gap tells you to investigate the high observation. It does not, on its own, tell you to remove it.

## Read the outlier before explaining it

A higher floor, better view, substantial refurbishment or unusual transaction terms may explain a difference, but do not assign an explanation without evidence. Mark the question for the viewing or the professional handling the purchase. Data gaps should remain visible in the comparison sheet.

Also distinguish a correction or cancellation from a new market movement. Recent reported periods may be revised as filings arrive. A count observed early in a month is not directly comparable with a fully reported older month.

## Compare a purchase budget, not just a unit price

The apartment price is only the starting commitment. Add the taxes and fees that apply to your purchase, obtain financing terms and allow for any repairs or vacant period. Keep those inputs separate from the transaction evidence so that changing a loan assumption does not change what the records actually say.

If you plan to rent the home out, obtain compatible rental evidence. Subtract realistic operating costs and allow for vacancy before considering income. A sale-price discount is not proof of a high rental return.

## Record the reason for the shortlist

Write one sentence explaining why the property remains a candidate and one question that could rule it out. Attach the comparable contracts, source period and unresolved differences. Return to the building page after a new release; review the new observations instead of simply replacing yesterday’s median with today’s.`, },
  'compare-seoul-district-prices': { body: `## Decide what the ranking is supposed to help you do

A district ranking can narrow a search area. It cannot rank individual apartments, future returns or the quality of a commute. Begin with a budget and a housing type, then ask which districts contain homes worth inspecting under those constraints.

Set the same transaction type, floor-area band and period for every district. A table mixing large apartments in one district with small units in another mostly compares the composition of the records. It can look precise while answering the wrong question.

## Keep the definition beside the median

There is a difference between the median of all contracts and the median of building medians. The latter gives a published building one place in the calculation even if another building has many more transactions. SignedPrice’s selected-district data story uses published building medians; read that label before comparing it with an official district index.

Check how many buildings or contracts contribute to each number. An unpublished result is not zero, and a small sample does not become robust because it is displayed in a ranking.

## Similar centres can conceal different choices

Imagine one district where comparable homes cluster around a middle price and another containing both much cheaper and much dearer stock. Their medians could match, yet your shortlist could be very different. Inspect the spread and the building list before deciding that the districts offer equivalent options.

Look for changes in the sample as well as changes in price. A newly represented large development can shift a summary even if existing buildings have not moved by the same amount. Compare consistent groups before describing a trend.

## Take two or three districts into Explore

Open a candidate district and inspect specific buildings within the budget. Check the address, usable area, transaction period and count. Compare the actual commute and building condition separately; proximity to a station is not a complete description of the journey or the neighbourhood.

Keep one common set of assumptions for financing, recurring costs and any rental plan. If you change those assumptions by district, make the reason explicit so that the location comparison remains interpretable.

## Use the ranking as a starting point for questions

A useful output is a shortlist with comparable evidence and a list of missing facts. It is not a score claiming which district you should buy in. Revisit the shortlist when compatible new contracts appear, and keep the earlier selection saved so that you can see whether the evidence or your requirements changed.`, },
  'singapore-private-market-quarterly-brief': { sources: [RESEARCH_SOURCES.ura], body: `## The headline masks a split within private housing

URA’s 24 July release puts the overall private residential price increase at 0.5% for Q2 2026, after 0.9% in Q1. Non-landed homes moved differently by region: CCR rose 1.8%, while RCR fell 1.2% and OCR fell 0.1%. These are quarterly index changes, not changes in the value of every apartment.

For a buyer comparing condominiums, the regional breakdown is more useful than assuming the overall increase applies everywhere. Even then, a region contains different projects, tenures and unit sizes. The chart is a prompt to examine the shortlist, not a valuation adjustment to apply mechanically.

## Rental growth is not the same as rental yield

The same release reports private residential rents up 0.7% in the quarter and an overall vacancy rate of 6.4%, compared with 6.2% previously. A rent index can rise while some homes remain empty. Neither number establishes the income of a specific unit.

For an income scenario, obtain a realistic achievable rent, estimate an occupied period and subtract actual ownership costs. Keep these assumptions separate from URA’s observed indices. Do not label the resulting scenario as a measured project yield.

## What to inspect next

In Singapore Explore, start with a region and open a project. Compare transactions with similar size, tenure and sale type over a stated period. If the project evidence covers several years, do not present its median as a price for this quarter alone.

## Questions for a purchase decision

A falling regional index is not sufficient reason to call a project cheap. Identify the comparable units and investigate why the offered price differs. Likewise, a rising index does not settle whether acquisition costs or financing leave the purchase within budget.`, },
};

export function enrichEnglishRecord(record: EditorialPortfolioRecord): EditorialPortfolioRecord {
  const expansion = expansions[record.slug];
  if (!expansion) return record;
  const sources = new Map(record.sources.map((item) => [item.id, item]));
  for (const item of expansion.sources ?? []) sources.set(item.id, item);
  return Object.freeze({ ...record, bodyMarkdown: expansion.body, sources: Object.freeze([...sources.values()]),
    updatedAt: expansion.updatedAt ?? '2026-09-06T00:00:00.000Z',
    revisionNote: expansion.revisionNote ?? 'Expanded practical comparisons and source-linked examples; public-source checks recorded on 6 September 2026.',
  });
}
