import { PUBLIC_AREA_TEST_DISTRICTS } from './public-area-summary-fixture';

export const publicRoutes = [
  { path: '/', heading: 'Real prices. Better property decisions.', indexing: 'noindex' },
  {
    path: '/kr/',
    heading: 'Put a refundable deposit against reported contracts.',
    indexing: 'index',
  },
  { path: '/kr/check/seoul/', heading: 'Where does this refundable deposit sit?', indexing: 'index' },
  { path: '/kr/seoul/', heading: 'Reported refundable-deposit distribution.', indexing: 'index' },
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
  ...PUBLIC_AREA_TEST_DISTRICTS.map((district) => ({
    path: `/kr/seoul/${district.slug}/`,
    heading: new RegExp(`${district.nameEn}:`),
    indexing: 'noindex' as const,
  })),
  { path: '/compare/', heading: 'Compare what each market can support.', indexing: 'noindex' },
] as const;
