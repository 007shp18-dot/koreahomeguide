import { PUBLIC_AREA_TEST_DISTRICTS } from './public-area-summary-fixture';

export const publicRoutes = [
  { path: '/', heading: 'Real prices. Better property decisions.', indexing: 'noindex' },
  { path: '/trust/', heading: 'How SignedPrice publishes evidence', indexing: 'noindex' },
  {
    path: '/kr/',
    heading: 'Which rent offer actually costs less?',
    indexing: 'noindex',
  },
  { path: '/kr/check/seoul/', heading: 'Where does this refundable deposit sit?', indexing: 'noindex' },
  { path: '/kr/seoul/', heading: 'Reported refundable-deposit distribution.', indexing: 'noindex' },
  { path: '/kr/seoul/rent/', heading: 'Rent in Seoul', indexing: 'noindex' },
  {
    path: '/kr/seoul/tools/rent-check/',
    heading: 'Check the quote against reported contracts.',
    indexing: 'noindex',
  },
  { path: '/kr/seoul/buy/', heading: 'Buy in Seoul', indexing: 'noindex' },
  { path: '/kr/seoul/invest/', heading: 'Invest in Seoul', indexing: 'noindex' },
  {
    path: '/kr/seoul/explore/',
    heading: 'Compare refundable jeonse deposits by district.',
    indexing: 'noindex',
  },
  {
    path: '/kr/seoul/rankings/',
    heading: 'Seoul district rankings',
    indexing: 'noindex',
  },
  {
    path: '/kr/seoul/corrections/',
    heading: 'Seoul evidence corrections',
    indexing: 'noindex',
  },
  {
    path: '/sg/',
    heading: 'Verified Singapore evidence unavailable',
    indexing: 'noindex',
  },
  {
    path: '/sg/singapore/explore/',
    heading: 'Verified Singapore evidence unavailable',
    indexing: 'noindex',
  },
  ...(['ccr', 'rcr', 'ocr'] as const).map((area) => ({
    path: `/sg/singapore/explore/${area}/`,
    heading: 'Verified Singapore evidence unavailable',
    indexing: 'noindex' as const,
  })),
  {
    path: '/sg/singapore/corrections/',
    heading: 'Singapore evidence corrections',
    indexing: 'noindex',
  },
  { path: '/kr/seoul/guide/', heading: 'Use property evidence without losing its boundary.', indexing: 'noindex' },
  { path: '/kr/seoul/guide/compare-two-contracts/', heading: 'Compare two rental contracts on one basis', indexing: 'noindex' },
  { path: '/kr/seoul/guide/read-district-evidence/', heading: 'Read Seoul district evidence without overclaiming', indexing: 'noindex' },
  { path: '/kr/seoul/guide/understand-publication-limits/', heading: 'Understand publication limits and refusals', indexing: 'noindex' },
  ...PUBLIC_AREA_TEST_DISTRICTS.map((district) => ({
    path: `/kr/seoul/${district.slug}/`,
    heading: new RegExp(`${district.nameEn}:`),
    indexing: 'noindex' as const,
  })),
  ...PUBLIC_AREA_TEST_DISTRICTS.map((district) => ({
    path: `/kr/seoul/explore/${district.slug}/`,
    heading: new RegExp(`${district.nameEn}:`),
    indexing: 'noindex' as const,
  })),
  {
    path: '/kr/seoul/explore/jongno-gu/synthetic-test-building/',
    heading: 'Synthetic Test Building',
    indexing: 'noindex',
    fixtureOnly: true,
  },
  { path: '/compare/', heading: 'Compare what each market can support.', indexing: 'noindex' },
] as const;
