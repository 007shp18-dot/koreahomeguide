import {
  PUBLIC_AREA_TEST_DISTRICTS,
  PUBLIC_AREA_WITHHELD_SLUG,
} from './public-area-summary-fixture';

// Independently reviewed EN/KO/zh-Hans groups. Keep explicit destinations so a
// self-link, wrong translation, or missing reciprocal alternate fails the gate.
const editorialTranslationPairs = [
  ['/', '/ko/', '/zh-cn/kr/seoul/'],
  ['/news/', '/ko/news/', '/zh-cn/news/'],
  ['/guides/', '/ko/guides/', '/zh-cn/guides/'],
  ['/news/policy/singapore-absd-policy-status/', '/ko/news/singapore-absd-policy-status/', '/zh-cn/news/policy/sg-absd-policy-zh/'],
  ['/news/seoul-district-price-distribution/', '/ko/news/seoul-district-price-distribution/', '/zh-cn/news/seoul-district-price-distribution-zh/'],
  ['/guides/rent-an-apartment-in-korea/', '/ko/guides/rent-an-apartment-in-korea/', '/zh-cn/guides/rent-in-korea-zh/'],
] as const;

export const editorialAlternates: Readonly<Record<string, Readonly<Record<string, string>>>> =
  Object.fromEntries(editorialTranslationPairs.flatMap(([en, ko, chinese]) => {
    const languages = { en, ko, 'zh-Hans': chinese, 'x-default': en };
    return [[en, languages], [ko, languages], [chinese, languages]];
  }));

export const publicRoutes = [
  { path: '/', heading: /Four cities\.\s*Many ways to live\./, indexing: 'index', canonical: '/' },
  { path: '/trust/', heading: 'Data & sources', indexing: 'index', canonical: '/trust/' },
  {
    path: '/kr/seoul/check/',
    heading: 'Compare an asking price',
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
    heading: 'Check a Seoul rent quote',
    indexing: 'index',
    canonical: '/kr/seoul/tools/rent-check/',
  },
  { path: '/kr/seoul/buy/', heading: 'Buy in Seoul', indexing: 'noindex' },
  { path: '/kr/seoul/invest/', heading: 'Invest in Seoul', indexing: 'noindex' },
  {
    path: '/kr/seoul/explore/',
    heading: 'Explore',
    indexing: 'index',
    canonical: '/kr/seoul/explore/',
    alternates: true,
  },
  {
    path: '/kr/seoul/rankings/',
    heading: 'Seoul building price rankings',
    indexing: 'index',
    canonical: '/kr/seoul/rankings/',
    alternates: true,
  },
  {
    path: '/kr/seoul/corrections/',
    heading: 'Corrections',
    indexing: 'noindex',
  },
  {
    path: '/sg/',
    heading: 'Singapore',
    indexing: 'index',
    canonical: '/sg/',
    alternates: true,
  },
  { path: '/ae/dubai/', heading: 'Dubai', indexing: 'index', canonical: '/ae/dubai/', alternates: true },
  {
    path: '/sg/singapore/explore/',
    heading: 'Explore',
    indexing: 'index',
    canonical: '/sg/singapore/explore/',
    alternates: true,
  },
  ...(['ccr', 'rcr', 'ocr'] as const).map((area) => ({
    path: `/sg/singapore/explore/${area}/`,
    heading: area.toUpperCase(),
    indexing: 'index' as const,
    canonical: `/sg/singapore/explore/${area}/`,
    alternates: true,
  })),
  {
    path: '/sg/singapore/corrections/',
    heading: 'Corrections',
    indexing: 'noindex',
  },
  { path: '/sg/singapore/rent/', heading: 'Rent in Singapore', indexing: 'noindex' },
  { path: '/sg/singapore/buy/', heading: 'Buy in Singapore', indexing: 'noindex' },
  { path: '/sg/singapore/invest/', heading: 'Invest in Singapore', indexing: 'noindex' },
  { path: '/ae/dubai/rent/', heading: 'Rent in Dubai', indexing: 'noindex' },
  { path: '/ae/dubai/buy/', heading: 'Buy in Dubai', indexing: 'noindex' },
  { path: '/ae/dubai/invest/', heading: 'Invest in Dubai', indexing: 'noindex' },
  { path: '/news/', heading: 'Insights', indexing: 'index', canonical: '/news/' },
  { path: '/news/policy/singapore-absd-policy-status/', heading: 'Singapore ABSD: the tax that can change your home budget', indexing: 'index', canonical: '/news/policy/singapore-absd-policy-status/' },
  { path: '/news/seoul-district-price-distribution/', heading: 'Seoul rental deposits by district: what a median price hides', indexing: 'index', canonical: '/news/seoul-district-price-distribution/' },
  { path: '/guides/', heading: 'Guides', indexing: 'index', canonical: '/guides/' },
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
      : { canonical: `/kr/seoul/explore/${district.slug}/`, alternates: true as const }),
  })),
  {
    path: '/kr/seoul/explore/jongno-gu/synthetic-test-building/',
    heading: 'Synthetic Test Building',
    indexing: 'noindex',
    fixtureOnly: true,
  },
  { path: '/compare/', heading: 'Compare what each market can support.', indexing: 'index', canonical: '/compare/' },
] as const;
