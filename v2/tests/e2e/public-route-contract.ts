import {
  PUBLIC_AREA_TEST_DISTRICTS,
  PUBLIC_AREA_WITHHELD_SLUG,
} from './public-area-summary-fixture';

// Independently reviewed EN/zh-Hans pairs. Keep explicit destinations so a
// self-link, wrong translation, or missing reciprocal alternate fails the gate.
const editorialTranslationPairs = [
  ['/news/', '/zh-cn/news/'],
  ['/guides/', '/zh-cn/guides/'],
  ['/news/policy/singapore-absd-policy-status/', '/zh-cn/news/policy/sg-absd-policy-zh/'],
  ['/news/seoul-district-price-distribution/', '/zh-cn/news/seoul-district-price-distribution-zh/'],
  ['/guides/rent-an-apartment-in-korea/', '/zh-cn/guides/rent-in-korea-zh/'],
] as const;

export const editorialAlternates: Readonly<Record<string, Readonly<Record<string, string>>>> =
  Object.fromEntries(editorialTranslationPairs.flatMap(([en, chinese]) => {
    const languages = { en, 'zh-Hans': chinese, 'x-default': en };
    return [[en, languages], [chinese, languages]];
  }));

export const publicRoutes = [
  { path: '/', heading: 'Know the market before you buy.', indexing: 'index', canonical: '/' },
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
    heading: 'Singapore',
    indexing: 'index',
    canonical: '/sg/',
  },
  { path: '/ae/dubai/', heading: 'Dubai', indexing: 'noindex' },
  {
    path: '/sg/singapore/explore/',
    heading: 'Residential transaction evidence',
    indexing: 'index',
    canonical: '/sg/singapore/explore/',
  },
  ...(['ccr', 'rcr', 'ocr'] as const).map((area) => ({
    path: `/sg/singapore/explore/${area}/`,
    heading: area.toUpperCase(),
    indexing: 'index' as const,
    canonical: `/sg/singapore/explore/${area}/`,
  })),
  {
    path: '/sg/singapore/corrections/',
    heading: 'Singapore evidence corrections',
    indexing: 'noindex',
  },
  { path: '/news/', heading: 'Property change, checked against evidence.', indexing: 'index', canonical: '/news/' },
  { path: '/news/policy/singapore-absd-policy-status/', heading: 'Singapore ABSD: current buyer-profile check', indexing: 'index', canonical: '/news/policy/singapore-absd-policy-status/' },
  { path: '/news/seoul-district-price-distribution/', heading: 'Similar medians, different markets: read Seoul distributions', indexing: 'index', canonical: '/news/seoul-district-price-distribution/' },
  { path: '/guides/', heading: 'Understand the process before making a decision.', indexing: 'index', canonical: '/guides/' },
  { path: '/guides/rent-an-apartment-in-korea/', heading: 'Rent an apartment in Korea: search-to-move-in sequence', indexing: 'index', canonical: '/guides/rent-an-apartment-in-korea/' },
  { path: '/zh-cn/news/', heading: '政策变化与市场数据，都回到原始依据。', indexing: 'index', canonical: '/zh-cn/news/' },
  { path: '/zh-cn/guides/', heading: '先理解本地流程，再作跨境决定。', indexing: 'index', canonical: '/zh-cn/guides/' },
  { path: '/zh-cn/guides/rent-in-korea-zh/', heading: '外国人在韩国租房：从找房到入住', indexing: 'index', canonical: '/zh-cn/guides/rent-in-korea-zh/' },
  ...PUBLIC_AREA_TEST_DISTRICTS.map((district) => ({
    path: `/kr/seoul/${district.slug}/`,
    heading: district.nameEn,
    indexing: 'noindex' as const,
    ...(district.slug === PUBLIC_AREA_WITHHELD_SLUG
      ? {}
      : { canonical: `/kr/seoul/explore/${district.slug}/` }),
  })),
  ...PUBLIC_AREA_TEST_DISTRICTS.map((district) => ({
    path: `/kr/seoul/explore/${district.slug}/`,
    heading: district.nameEn,
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
