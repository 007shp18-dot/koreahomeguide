import {
  PUBLIC_AREA_TEST_DISTRICTS,
  PUBLIC_AREA_WITHHELD_SLUG,
} from './public-area-summary-fixture';

export const publicRoutes = [
  { path: '/', heading: 'See what homes actually signed for.', indexing: 'index', canonical: '/' },
  { path: '/trust/', heading: 'How SignedPrice publishes evidence', indexing: 'index', canonical: '/trust/' },
  {
    path: '/kr/seoul/check/',
    heading: 'Check one asking price.',
    indexing: 'index',
    fixtureIndexing: 'noindex',
    fixtureCanonical: false,
    fixtureAlternates: false,
    canonical: '/kr/seoul/check/',
    alternates: true,
  },
  {
    path: '/kr/seoul/check/compare/',
    heading: 'Compare two offers',
    indexing: 'index',
    canonical: '/kr/seoul/check/compare/',
    alternates: true,
  },
  { path: '/kr/seoul/rent/', heading: 'Rent in Seoul', indexing: 'noindex' },
  {
    path: '/kr/seoul/tools/rent-check/',
    heading: 'Check the quote against reported contracts.',
    indexing: 'index',
    canonical: '/kr/seoul/tools/rent-check/',
  },
  { path: '/kr/seoul/buy/', heading: 'Buy in Seoul', indexing: 'noindex' },
  { path: '/kr/seoul/invest/', heading: 'Invest in Seoul', indexing: 'noindex' },
  {
    path: '/kr/seoul/explore/',
    heading: 'Compare refundable jeonse deposits by district.',
    indexing: 'index',
    canonical: '/kr/seoul/explore/',
    alternates: true,
  },
  {
    path: '/kr/seoul/rankings/',
    heading: 'Seoul district rankings',
    indexing: 'index',
    canonical: '/kr/seoul/rankings/',
    alternates: true,
  },
  {
    path: '/kr/seoul/corrections/',
    heading: 'Seoul evidence corrections',
    indexing: 'noindex',
  },
  {
    path: '/sg/',
    heading: 'Official sale evidence, separated by native market segment.',
    indexing: 'noindex',
  },
  {
    path: '/sg/singapore/explore/',
    heading: 'Compare private-sale evidence across CCR, RCR, and OCR.',
    indexing: 'noindex',
  },
  ...(['ccr', 'rcr', 'ocr'] as const).map((area) => ({
    path: `/sg/singapore/explore/${area}/`,
    heading: /median from 6 reported sale transactions\./,
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
