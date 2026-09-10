import { infographic } from '../portfolio-builders';
import type { InfographicSpec } from '../../lib/infographics/infographic-types';

const quarter = infographic({
  id: 'ura-q2-2026-regional-changes', locale: 'en', template: 'district-comparison',
  title: 'Singapore condominium prices moved in different directions',
  summary: 'Q2 2026 change in URA non-landed private residential price indices: CCR +1.8%, RCR −1.2%, OCR −0.1%. Each bar starts at zero.',
  releases: ['official-ura-q2-2026'], period: { start: '2026-04-01', end: '2026-06-30' }, unit: '% q/q',
  source: 'URA, Q2 2026 real estate statistics, paragraph 4 (24 July 2026)', sample: 'Non-landed private residential price indices by region; not individual project returns', relatedHref: '/sg/singapore/explore/',
  series: [{ id: 'quarterly-change', label: 'Change from Q1 2026', values: [ { label: 'CCR', value: 1.8 }, { label: 'RCR', value: -1.2 }, { label: 'OCR', value: -0.1 } ] }],
});
const duties = infographic({
  id: 'singapore-foreign-buyer-duty-example', locale: 'en', template: 'district-comparison',
  title: 'Duties on an illustrative S$2 million purchase',
  summary: 'BSD is S$69,600. At the standard 60% foreign-individual ABSD rate with no remission, ABSD is S$1.2 million. Duties total S$1,269,600, additional to the price.',
  releases: ['iras-duty-example-2026-09-06'], period: { start: '2026-09-06', end: '2026-09-06' }, unit: 'SGD',
  source: 'SignedPrice calculation using IRAS BSD bands and ABSD table, checked 6 September 2026', sample: 'Illustration only: price S$2m, market value no higher, foreign individual, no remission; other costs excluded', relatedHref: '/news/policy/singapore-absd-policy-status/',
  series: [{ id: 'duties', label: 'Additional purchase duties', values: [{ label: 'BSD', value: 69600 }, { label: 'ABSD', value: 1200000 }] }],
});
const rental = infographic({
  id: 'jeonse-wolse-capital-cost-example', locale: 'en', template: 'district-comparison',
  title: 'The rental comparison changes with the cost of capital',
  summary: 'At a 4% annual capital cost, the illustrative jeonse offer costs KRW 1m a month and the wolse offer about KRW 1.067m. Equal management fees are excluded.',
  releases: ['rental-cost-example-2026-09-06'], period: { start: '2026-09-06', end: '2026-09-06' }, unit: 'KRW/month',
  source: 'SignedPrice worked example: deposit × 4% ÷ 12 + monthly rent', sample: 'Illustration, not listings: A deposit KRW 300m/rent 0; B deposit KRW 50m/rent KRW 900k; fees equal', relatedHref: '/kr/seoul/check/',
  series: [{ id: 'monthly-cost', label: 'Rent plus deposit capital cost', values: [{ label: 'Offer A · jeonse', value: 1000000 }, { label: 'Offer B · wolse', value: 1066667 }] }],
});

export const RESEARCH_FIGURES: Readonly<Record<string, InfographicSpec>> = Object.freeze({
  'singapore-private-market-quarterly-brief': quarter,
  'read-singapore-private-transactions': duties,
  'wolse-vs-jeonse': rental,
});
