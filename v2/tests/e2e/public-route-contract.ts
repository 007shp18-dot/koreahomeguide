import {
  PUBLIC_AREA_TEST_DISTRICTS,
  PUBLIC_AREA_WITHHELD_SLUG,
} from './public-area-summary-fixture';

export const publicRoutes = [
  { path: '/', heading: 'Real prices. Better property decisions.', indexing: 'index', canonical: '/' },
  { path: '/trust/', heading: 'How SignedPrice publishes evidence', indexing: 'index', canonical: '/trust/' },
  {
    path: '/kr/',
    heading: 'Which rent offer actually costs less?',
    indexing: 'index',
    canonical: '/kr/',
  },
  { path: '/kr/check/seoul/', heading: 'Where does this refundable deposit sit?', indexing: 'index', canonical: '/kr/check/seoul/' },
  { path: '/kr/seoul/', heading: 'Reported refundable-deposit distribution.', indexing: 'index', canonical: '/kr/seoul/' },
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
    indexing: 'index',
    canonical: '/kr/seoul/explore/',
  },
  {
    path: '/kr/seoul/rankings/',
    heading: 'Seoul district rankings',
    indexing: 'index',
    canonical: '/kr/seoul/rankings/',
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
  { path: '/kr/seoul/guide/', heading: 'Use property evidence without losing its boundary.', indexing: 'index', canonical: '/kr/seoul/guide/' },
  { path: '/kr/seoul/guide/compare-two-contracts/', heading: 'Compare two rental contracts on one basis', indexing: 'index', canonical: '/kr/seoul/guide/compare-two-contracts/' },
  { path: '/kr/seoul/guide/read-district-evidence/', heading: 'Read Seoul district evidence without overclaiming', indexing: 'index', canonical: '/kr/seoul/guide/read-district-evidence/' },
  { path: '/kr/seoul/guide/understand-publication-limits/', heading: 'Understand publication limits and refusals', indexing: 'index', canonical: '/kr/seoul/guide/understand-publication-limits/' },
  ...PUBLIC_AREA_TEST_DISTRICTS.map((district) => ({
    path: `/kr/seoul/${district.slug}/`,
    heading: new RegExp(`${district.nameEn}:`),
    indexing: 'noindex' as const,
    ...(district.slug === PUBLIC_AREA_WITHHELD_SLUG
      ? {}
      : { canonical: `/kr/seoul/explore/${district.slug}/` }),
  })),
  ...PUBLIC_AREA_TEST_DISTRICTS.map((district) => ({
    path: `/kr/seoul/explore/${district.slug}/`,
    heading: new RegExp(`${district.nameEn}:`),
    indexing: district.slug === PUBLIC_AREA_WITHHELD_SLUG
      ? 'noindex' as const
      : 'index' as const,
    ...(district.slug === PUBLIC_AREA_WITHHELD_SLUG
      ? {}
      : { canonical: `/kr/seoul/explore/${district.slug}/` }),
  })),
  {
    path: '/kr/seoul/explore/jongno-gu/synthetic-test-building/',
    heading: 'Synthetic Test Building',
    indexing: 'noindex',
    fixtureOnly: true,
  },
  { path: '/compare/', heading: 'Compare what each market can support.', indexing: 'index', canonical: '/compare/' },
] as const;
