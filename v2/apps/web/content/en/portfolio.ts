import { infographic, portfolioRecord, RELEASES, SOURCES } from '../portfolio-builders';

const seoulDistrictChart = infographic({
  id: 'seoul-district-price-distribution-chart', locale: 'en', template: 'district-comparison',
  title: 'Selected Seoul district rental-deposit medians',
  summary: 'Published building-level medians differ across five selected districts; the chart is context, not a valuation of an individual home.',
  releases: [RELEASES.publicBuildingSummary], period: { start: '2026-01-01', end: '2026-07-31' }, unit: 'KRW 100m', source: 'MOLIT reported rental contracts via SignedPrice public building summary',
  sample: 'Published building cohorts meeting the minimum sample, selected districts', relatedHref: '/kr/seoul/explore/',
  series: [{ id: 'median', label: 'Median of published building medians', values: [
    { label: 'Gangnam-gu', value: 5.375 }, { label: 'Yongsan-gu', value: 5.475 },
    { label: 'Gangdong-gu', value: 4.8 }, { label: 'Mapo-gu', value: 4.5 }, { label: 'Nowon-gu', value: 2.6 },
  ] }],
});

const seoulRenewalChart = infographic({
  id: 'seoul-new-renewal-rent-gap-chart', locale: 'en', template: 'district-comparison',
  title: 'New and renewal deposits in one published cohort',
  summary: 'The selected Dobong apartment cohort shows different new and renewal medians, which should not be generalized to every building.',
  releases: [RELEASES.publicBuildingSummary], period: { start: '2026-01-01', end: '2026-07-31' }, unit: 'KRW 100m', source: 'MOLIT reported rental contracts via SignedPrice public building summary',
  sample: 'One 45–55 sqm apartment cohort, 18 new and 13 renewal contracts', relatedHref: '/kr/seoul/explore/?district=dobong-gu',
  series: [
    { id: 'new', label: 'New contracts', values: [{ label: 'Published cohort', value: 2.25 }] },
    { id: 'renewal', label: 'Renewal contracts', values: [{ label: 'Published cohort', value: 2 }] },
  ],
});

const koreaCostChart = infographic({
  id: 'korea-deposit-monthly-rent-cost-chart', locale: 'en', template: 'cost-structure',
  title: 'One-basis rental cost comparison',
  summary: 'A comparable monthly cost keeps rent, management fee and the disclosed monthly cost of tied-up deposit capital separate.',
  releases: [RELEASES.conversion], period: { start: '2026-02-01', end: '2026-08-31' }, unit: 'KRW 10k/month', source: 'Illustrative cost inputs; comparison method supported by the SignedPrice conversion release',
  sample: 'Illustrative structure; enter the exact contract and selected conversion assumption in Check', relatedHref: '/kr/seoul/check/',
  series: [{ id: 'components', label: 'Comparable monthly burden', values: [
    { label: 'Monthly rent', value: 85 }, { label: 'Management fee', value: 12 }, { label: 'Deposit capital cost', value: 25 },
  ] }],
});

const singaporeRegionChart = infographic({
  id: 'singapore-region-comparison-chart', locale: 'en', template: 'district-comparison',
  title: 'Published private-project median PSF by market segment',
  summary: 'The median of published project medians is highest in CCR in this release, but project mix and tenure still differ by region.',
  releases: [RELEASES.singapore], period: { start: '2021-08-01', end: '2026-08-31' }, unit: 'SGD psf', source: 'URA private residential transactions via SignedPrice public release',
  sample: '614 CCR, 745 RCR and 1,053 OCR published project summaries', relatedHref: '/sg/singapore/explore/',
  series: [{ id: 'project-median-psf', label: 'Median of published project medians', values: [
    { label: 'CCR', value: 2167 }, { label: 'RCR', value: 1716 }, { label: 'OCR', value: 1462 },
  ] }],
});

export const ENGLISH_PORTFOLIO = Object.freeze([
  portfolioRecord({
    slug: 'korea-rental-deposit-protection-status', locale: 'en', type: 'policy-update', marketId: 'kr-seoul',
    title: 'Korea rental-deposit protection: current verification status',
    deck: 'A practical status record for possession, resident reporting, fixed-date and guarantee checks—kept separate because each serves a different purpose.',
    question: 'Which deposit-protection rules apply now, and when did they take effect?',
    points: [
      ['What applies', 'Protection depends on the exact home, current registry, possession and the reporting steps available to the tenant. A fixed date and a guarantee are separate checks, not interchangeable labels.'],
      ['What to verify', 'Match the registered property and owner before payment, then confirm the sequence and eligibility with the responsible public office or guarantee provider for the tenant’s status.'],
      ['What changed', 'This launch record replaces broad deposit-safety language with a source-led checklist and a dated status boundary.'],
    ], boundary: 'This record explains a verification sequence and does not decide legal priority, guarantee eligibility or the safety of a specific deposit.',
    sources: [SOURCES.koreaLeaseLaw], evidenceReleaseIds: [RELEASES.policyKorea], relatedHref: '/kr/seoul/check/', translationGroupId: 'kr-rental-deposit-protection',
  }),
  portfolioRecord({
    slug: 'korea-foreign-property-reporting-status', locale: 'en', type: 'policy-update', marketId: 'kr-seoul',
    title: 'Korea foreign-buyer reporting: what changed in February 2026',
    deck: 'Foreign-buyer transaction reports now request expanded identity, residence and overseas-funding details; the exact filing still depends on the transaction.',
    question: 'What must a foreign buyer report before and after a Korean purchase?',
    points: [
      ['Effective date', 'MOLIT announced the expanded reporting fields on 9 February 2026 and stated that they apply from 10 February 2026.'],
      ['Information scope', 'The official notice identifies visa or stay status, domestic address and overseas funding information among the expanded fields for foreign transactions.'],
      ['Before filing', 'Use the current official form and confirm whether a separate permit, foreign-exchange report or local filing applies to the buyer, property and funding path.'],
    ], boundary: 'This is a change record, not a completed filing form or legal opinion for an individual transaction.',
    sources: [SOURCES.koreaForeignReporting], evidenceReleaseIds: [RELEASES.policyKorea], relatedHref: '/kr/seoul/check/',
  }),
  portfolioRecord({
    slug: 'seoul-land-transaction-permit-status', locale: 'en', type: 'policy-update', marketId: 'kr-seoul',
    title: 'Seoul land-transaction permission: verify the parcel, use and date',
    deck: 'A designation headline is not enough: current applicability must be checked against Seoul’s registry and the exact parcel before contracting.',
    question: 'Which Seoul purchases are currently affected by land-transaction permission rules?',
    points: [
      ['Start with the registry', 'Seoul publishes current designation notices, boundaries and periods. Search the exact parcel and current notice instead of relying on a district-wide summary.'],
      ['Check the transaction', 'Thresholds and obligations can differ by designated area, land use, size, buyer purpose and contract date. A nearby parcel may have a different result.'],
      ['Record the date', 'Keep the notice, lookup date and authority response with the decision file because designations can be extended, amended or lifted.'],
    ], boundary: 'SignedPrice does not determine permit eligibility; the competent authority and current official designation control.',
    sources: [SOURCES.seoulPermit], evidenceReleaseIds: [RELEASES.policyKorea], relatedHref: '/kr/seoul/explore/',
  }),
  portfolioRecord({
    slug: 'korea-housing-finance-rules-status', locale: 'en', type: 'policy-update', marketId: 'kr-seoul',
    title: 'Korea housing-finance rules: avoid one blanket lending ratio',
    deck: 'Current limits vary by regulated area, borrower, home count, product and effective date, so affordability needs a lender-confirmed case review.',
    question: 'Which current lending limits materially change a home budget?',
    points: [
      ['Rules are conditional', 'The Financial Services Commission’s 2026 measures show why a national headline ratio is unsafe: regulated-area treatment and exceptions depend on the exact case.'],
      ['Build the budget', 'Separate cash, taxes and fees from the maximum loan, then test rate, repayment and valuation changes before signing.'],
      ['Confirm in writing', 'Ask the lender which rule set, property value, borrower profile and documentation date produced the quoted amount.'],
    ], boundary: 'This status page is not a credit decision, loan offer or statement that one ratio applies to every Seoul buyer.',
    sources: [SOURCES.koreaFinance], evidenceReleaseIds: [RELEASES.policyKorea], relatedHref: '/kr/seoul/check/',
  }),
  portfolioRecord({
    slug: 'singapore-absd-policy-status', locale: 'en', type: 'policy-update', marketId: 'sg-singapore',
    title: 'Singapore ABSD: check buyer profile before calculating duty',
    deck: 'Additional Buyer’s Stamp Duty is profile- and property-dependent; IRAS is the controlling rate and remission source.',
    question: 'Which Additional Buyer’s Stamp Duty rules apply by buyer profile?',
    points: [
      ['Classify the buyer', 'Citizenship or residency, entity status and the number of residential properties owned can change the applicable ABSD treatment.'],
      ['Classify the acquisition', 'Property interest, acquisition date, manner of acquisition and possible remission conditions also matter.'],
      ['Use the current table', 'Calculate only after checking the current IRAS rates and definitions, then preserve the page and date used in the transaction file.'],
    ], boundary: 'SignedPrice does not calculate final stamp duty or determine eligibility for a remission.',
    sources: [SOURCES.singaporeAbsd], evidenceReleaseIds: [RELEASES.policySingapore], relatedHref: '/sg/singapore/check/', translationGroupId: 'sg-absd',
  }),
  portfolioRecord({
    slug: 'singapore-hdb-private-owner-waitout-status', locale: 'en', type: 'policy-update', marketId: 'sg-singapore',
    title: 'HDB removed the 15-month wait-out period in July 2026',
    deck: 'The removal concerns private residential property owners buying non-subsidised resale HDB flats; other eligibility conditions still require checking.',
    question: 'What changed in the HDB wait-out rule for private-home owners?',
    points: [
      ['The change', 'HDB announced on 27 July 2026 that the temporary 15-month wait-out period would be removed for private residential property owners buying non-subsidised resale flats.'],
      ['What remains', 'The removal does not erase the other eligibility, ownership-disposal, financing or flat-specific conditions that can affect a purchase.'],
      ['How to use it', 'Check the current HDB eligibility page for the household and intended flat before treating the policy headline as an approval.'],
    ], boundary: 'This tracker describes the announced rule change and does not establish household eligibility.',
    sources: [SOURCES.singaporeHdb], evidenceReleaseIds: [RELEASES.policySingapore], relatedHref: '/sg/singapore/explore/',
  }),

  portfolioRecord({
    slug: 'seoul-sale-market-monthly-brief', locale: 'en', type: 'market-brief', marketId: 'kr-seoul',
    title: 'Seoul sale evidence: August 2026 release brief', deck: 'Read 22,850 installed reported-sale records by completed period, district, building and size before describing movement.',
    question: 'What changed in Seoul apartment sale evidence this month?',
    points: [['Release first', 'The installed sale release covers February through August 2026 and contains 22,850 eligible records after the declared parser and rights checks.'], ['Avoid the partial-month trap', 'Recent filing counts can grow after the first release. Compare like-for-like completed periods and keep cancellations separate.'], ['Next comparison', 'Move from district context to the same building and size band; a city total does not price an exact unit.']],
    boundary: 'This brief describes the installed evidence release, not a forecast or a live appraisal.', sources: [SOURCES.koreaTransactions], evidenceReleaseIds: [RELEASES.sale], relatedHref: '/kr/seoul/explore/?transaction=sale',
  }),
  portfolioRecord({
    slug: 'seoul-jeonse-market-monthly-brief', locale: 'en', type: 'market-brief', marketId: 'kr-seoul',
    title: 'Seoul jeonse evidence: August 2026 release brief', deck: 'The current rent release contains 49,129 eligible contracts across rental structures; jeonse should be filtered before comparison.',
    question: 'What changed in Seoul jeonse evidence this month?',
    points: [['Choose one structure', 'Filter jeonse observations from monthly-rent contracts before comparing district or building medians.'], ['Hold the cohort', 'Keep property type, exclusive area, period and publication minimum constant across every comparison.'], ['Inspect the range', 'Use the median with the middle half and sample count; one unusually large deposit is not the market.']],
    boundary: 'Reported contracts do not prove deposit safety, current availability or the condition of a specific home.', sources: [SOURCES.koreaTransactions], evidenceReleaseIds: [RELEASES.rent], relatedHref: '/kr/seoul/explore/',
  }),
  portfolioRecord({
    slug: 'seoul-monthly-rent-market-brief', locale: 'en', type: 'market-brief', marketId: 'kr-seoul',
    title: 'Seoul monthly-rent evidence: compare deposit and rent together', deck: 'A lower monthly payment can conceal a larger deposit, so every market comparison needs one disclosed conversion basis.',
    question: 'How did deposit and monthly rent combinations move this month?',
    points: [['Two moving parts', 'Monthly-rent contracts contain both a deposit and a recurring payment. Sorting one while ignoring the other changes the conclusion.'], ['Use one conversion', 'Select a disclosed comparison assumption and apply it consistently; changing the rate changes the comparable monthly burden.'], ['Return to raw contracts', 'After screening with a converted figure, inspect the actual deposit, rent, area, property and contract month.']],
    boundary: 'A conversion is a comparison tool, not a required landlord rate or a prediction.', sources: [SOURCES.koreaTransactions], evidenceReleaseIds: [RELEASES.rent, RELEASES.conversion], relatedHref: '/kr/seoul/check/',
  }),
  portfolioRecord({
    slug: 'singapore-private-market-quarterly-brief', locale: 'en', type: 'market-brief', marketId: 'sg-singapore',
    title: 'Singapore private residential: Q2 2026 release brief', deck: 'URA reported a 0.5% quarterly increase in the overall private residential price index, while regional movements differed.',
    question: 'What changed across CCR, RCR, and OCR in the latest released quarter?',
    points: [['Overall movement', 'URA’s Q2 2026 release reported overall private residential prices up 0.5% quarter on quarter.'], ['Regions diverged', 'The release reported CCR prices up 1.8%, RCR down 1.2% and OCR down 0.1%; those indices are not project valuations.'], ['Use project evidence', 'After reading the official index, compare the intended project, tenure, sale type, unit size and transaction dates.']],
    boundary: 'Official quarterly indices and SignedPrice project transactions describe different cohorts and must not be merged into one unlabeled number.', sources: [SOURCES.singaporeUra], evidenceReleaseIds: [RELEASES.singapore], relatedHref: '/sg/singapore/explore/',
  }),

  portfolioRecord({
    slug: 'seoul-district-price-distribution', locale: 'en', type: 'data-story', marketId: 'kr-seoul',
    title: 'Similar medians, different markets: read Seoul distributions', deck: 'District medians are entry points; spreads, property mix and building-level evidence explain why the same middle number can mask different choices.',
    question: 'Why can two Seoul districts with similar medians still feel very different?',
    points: [['A median removes shape', 'The centre does not reveal whether most observations cluster tightly or span very different property types and sizes.'], ['Mix changes the result', 'Building age, size bands, housing type and filing depth can produce different distributions even when two medians match.'], ['Move down one level', 'Use the district chart to choose where to inspect, then compare published buildings and exact transactions.']],
    boundary: 'Chart values are medians of selected published building cohorts, not district-wide appraisals.', sources: [SOURCES.koreaTransactions], evidenceReleaseIds: [RELEASES.publicBuildingSummary], relatedHref: '/kr/seoul/explore/', infographic: seoulDistrictChart, translationGroupId: 'seoul-district-distribution',
  }),
  portfolioRecord({
    slug: 'seoul-new-renewal-rent-gap', locale: 'en', type: 'data-story', marketId: 'kr-seoul',
    title: 'New and renewal rent evidence should not be blended', deck: 'One published cohort shows how new and renewed contracts can occupy different centres even inside the same building and size band.',
    question: 'How different are new and renewal rental contracts by district?',
    points: [['Labels matter', 'A renewal contract is not a fresh market quote, while a new contract can reflect current choice and negotiation conditions.'], ['One cohort, two centres', 'The chart keeps the same building and size band while separating 18 new from 13 renewal contracts.'], ['Do not generalize', 'Repeat the comparison building by building and publish only cohorts meeting the minimum sample.']],
    boundary: 'The selected cohort demonstrates the method; it is not a claim about every district or future contract.', sources: [SOURCES.koreaTransactions], evidenceReleaseIds: [RELEASES.publicBuildingSummary], relatedHref: '/kr/seoul/explore/?district=dobong-gu', infographic: seoulRenewalChart,
  }),
  portfolioRecord({
    slug: 'korea-deposit-monthly-rent-cost-structure', locale: 'en', type: 'data-story', marketId: 'kr-seoul',
    title: 'Turn deposit and monthly rent into one transparent comparison', deck: 'Separate recurring rent, management fees and the chosen cost of tied-up deposit capital before comparing two Korean rental offers.',
    question: 'How does changing the deposit alter the comparable monthly cost?',
    points: [['Keep inputs visible', 'Record the deposit, monthly rent, fee items, period and chosen conversion assumption instead of publishing only the output.'], ['Compare, do not predict', 'The converted burden helps compare offers on one basis; it does not say what the landlord will accept.'], ['Stress-test the rate', 'Recalculate at more than one capital-cost assumption when the deposit is material to the household budget.']],
    boundary: 'The chart is an illustrative cost structure. Contract Check applies the selected inputs and shows its conversion provenance.', sources: [SOURCES.koreaTransactions], evidenceReleaseIds: [RELEASES.conversion], relatedHref: '/kr/seoul/check/', infographic: koreaCostChart,
  }),
  portfolioRecord({
    slug: 'singapore-ccr-rcr-ocr-comparison', locale: 'en', type: 'data-story', marketId: 'sg-singapore',
    title: 'CCR, RCR and OCR: compare distributions, not labels alone', deck: 'Published private-project median PSF differs by region, but project mix, tenure, sale type and unit size remain essential context.',
    question: 'What do CCR, RCR, and OCR transaction distributions actually show?',
    points: [['Regions are navigation', 'CCR, RCR and OCR organize geography; they do not make every project inside a region comparable.'], ['The release has depth', 'The chart uses the median of published project-level median PSF values across 614 CCR, 745 RCR and 1,053 OCR summaries.'], ['Open the project', 'Inspect the exact project distribution, tenure, sale type and dates before using the regional layer in a decision.']],
    boundary: 'A median of project medians is a discovery statistic and is not the same as URA’s official price index.', sources: [SOURCES.singaporeUra], evidenceReleaseIds: [RELEASES.singapore], relatedHref: '/sg/singapore/explore/', infographic: singaporeRegionChart, translationGroupId: 'singapore-region-distribution',
  }),

  portfolioRecord({ slug: 'rent-an-apartment-in-korea', locale: 'en', type: 'guide', marketId: 'kr-seoul', title: 'Rent an apartment in Korea: search-to-move-in sequence', deck: 'A foreign resident’s practical route through budget, evidence, identity, contract and protection checks.', question: 'How does a foreign resident rent a home in Korea from search to move-in?', points: [['Set the full budget', 'Compare deposit, rent, management fees, utilities, brokerage, moving costs and emergency cash—not headline rent alone.'], ['Verify before paying', 'Match the exact address, registered owner, current rights, receiving account and written terms before transferring a material deposit.'], ['Complete the sequence', 'Plan possession, applicable residence reporting, fixed-date and guarantee steps before contract day, then preserve every record.']], boundary: 'Procedures depend on status, property and current rules; confirm material steps with the responsible office or qualified adviser.', sources: [SOURCES.koreaLeaseLaw, SOURCES.koreaTransactions], evidenceReleaseIds: [RELEASES.policyKorea, RELEASES.rent], relatedHref: '/kr/seoul/check/', translationGroupId: 'rent-korea' }),
  portfolioRecord({ slug: 'wolse-vs-jeonse', locale: 'en', type: 'guide', marketId: 'kr-seoul', title: 'Wolse vs jeonse: compare both on one cost basis', deck: 'Make deposit capital, monthly rent, fees and deposit-return risk visible before choosing a rental structure.', question: 'How should a renter compare wolse and jeonse on one basis?', points: [['Separate the structures', 'Wolse normally combines deposit and rent; jeonse normally commits much more refundable deposit with little or no monthly rent.'], ['Convert transparently', 'Apply one disclosed conversion assumption, include management fees and financing cost, and test how the answer changes with the rate.'], ['Check protection', 'Price comparison does not replace property, owner, rights, payment and deposit-protection verification.']], boundary: 'Conversion is decision support, not a guaranteed market rate or deposit outcome.', sources: [SOURCES.koreaLeaseLaw, SOURCES.koreaTransactions], evidenceReleaseIds: [RELEASES.rent, RELEASES.conversion], relatedHref: '/kr/seoul/check/', translationGroupId: 'wolse-jeonse' }),
  portfolioRecord({ slug: 'korea-rental-contract-checklist', locale: 'en', type: 'guide', marketId: 'kr-seoul', title: 'Korea rental contract checklist before a large deposit', deck: 'Keep property identity, owner authority, every cost, clauses and move-in protection in one decision file.', question: 'What should be checked before transferring a material rental deposit?', points: [['Identity', 'Match the viewed unit, road and lot address, registry, building record, owner and signer; verify any proxy independently.'], ['Money and terms', 'Itemize deposit, rent, fee components, utilities, repairs, termination and deposit-return timing in writing.'], ['Final recheck', 'Obtain current records near final payment and preserve the signed contract, transfer evidence and public filings.']], boundary: 'A completed checklist reduces omissions but cannot establish legal priority or guarantee eligibility.', sources: [SOURCES.koreaLeaseLaw], evidenceReleaseIds: [RELEASES.policyKorea], relatedHref: '/kr/seoul/check/' }),
  portfolioRecord({ slug: 'read-seoul-sale-transactions', locale: 'en', type: 'guide', marketId: 'kr-seoul', title: 'Read Seoul sale transactions without pricing from one deal', deck: 'Start with completed reported contracts, then hold building, area and period stable while reading the range and sample.', question: 'How should reported Seoul sale transactions be read without overpricing one sale?', points: [['Start with contracts', 'Keep asking prices and reported completed contracts as separate evidence layers.'], ['Build the cohort', 'Use the same building, similar exclusive area and completed period before widening to comparable nearby buildings.'], ['Explain the difference', 'Floor, view, condition, occupancy and unusual terms can explain a gap that the transaction table alone cannot.']], boundary: 'Reported evidence is not a live appraisal or prediction of the next contract.', sources: [SOURCES.koreaTransactions], evidenceReleaseIds: [RELEASES.sale], relatedHref: '/kr/seoul/explore/?transaction=sale' }),
  portfolioRecord({ slug: 'compare-seoul-district-prices', locale: 'en', type: 'guide', marketId: 'kr-seoul', title: 'Compare Seoul district prices without mixing cohorts', deck: 'Hold transaction type, property type, area, period and publication threshold constant before reading rank.', question: 'How can districts be compared without mixing period, type, and area?', points: [['Choose one cohort', 'Fix sale or rent, housing type, size band and evidence period across every district.'], ['Read distribution and count', 'The median alone hides spread and thin samples; unavailable rows are not zero-priced markets.'], ['Move to buildings', 'District rank is discovery. Verify the exact building and recent compatible contracts next.']], boundary: 'District rankings do not rank quality of life, legal safety, liquidity or future returns.', sources: [SOURCES.koreaTransactions], evidenceReleaseIds: [RELEASES.sale, RELEASES.rent], relatedHref: '/kr/seoul/rankings/' }),
  portfolioRecord({ slug: 'buy-property-in-korea-as-foreigner', locale: 'en', type: 'guide', marketId: 'kr-seoul', title: 'Buy property in Korea as a foreigner: verified sequence', deck: 'Coordinate identity, transaction evidence, funding, restrictions, reporting, contract and registration before committing.', question: 'What is the verified sequence for a foreign buyer purchasing in Korea?', points: [['Verify the asset', 'Match the exact unit, owner, registry, building record and current restrictions before discussing payment.'], ['Verify money and reports', 'Confirm lender terms, cash path, taxes, fees and the foreign-buyer reports that apply to the date and funding source.'], ['Close with current records', 'Write conditions clearly, recheck records before final payment and complete reporting and registration with traceable evidence.']], boundary: 'This is a decision sequence, not legal, tax, lending or investment advice.', sources: [SOURCES.koreaForeignReporting, SOURCES.seoulPermit], evidenceReleaseIds: [RELEASES.policyKorea, RELEASES.sale], relatedHref: '/kr/seoul/explore/?transaction=sale', translationGroupId: 'buy-korea' }),
  portfolioRecord({ slug: 'read-singapore-private-transactions', locale: 'en', type: 'guide', marketId: 'sg-singapore', title: 'Read Singapore private-property transaction evidence', deck: 'Keep region, project, tenure, sale type, unit size and official index layers separate.', question: 'How should a buyer read project and regional transaction evidence in Singapore?', points: [['Choose the housing system', 'Private residential and HDB evidence have different eligibility, tenure and source boundaries and should not be pooled.'], ['Open the project', 'Confirm identity and compare compatible project transactions by tenure, sale type, size and date.'], ['Use the index separately', 'URA’s quarterly index describes a market series; project transaction distributions answer a different question.']], boundary: 'Released transaction evidence is not an asking-price feed, appraisal or recommendation.', sources: [SOURCES.singaporeUra], evidenceReleaseIds: [RELEASES.singapore], relatedHref: '/sg/singapore/explore/' }),
] as const);
