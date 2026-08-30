export const publicRoutes = [
  { path: '/', heading: 'Real prices. Better property decisions.', indexing: 'noindex' },
  { path: '/kr/', heading: 'Put a rent quote against reported contracts.', indexing: 'index' },
  { path: '/kr/check/seoul/', heading: 'Where does this monthly rent sit?', indexing: 'index' },
  { path: '/kr/seoul/', heading: 'Reported monthly-rent distribution.', indexing: 'index' },
  { path: '/kr/seoul/rent/', heading: 'Rent in Seoul', indexing: 'noindex' },
  {
    path: '/kr/seoul/tools/rent-check/',
    heading: 'Check the quote against reported contracts.',
    indexing: 'noindex',
  },
  { path: '/kr/seoul/buy/', heading: 'Buy in Seoul', indexing: 'noindex' },
  { path: '/kr/seoul/invest/', heading: 'Invest in Seoul', indexing: 'noindex' },
  { path: '/compare/', heading: 'Compare what each market can support.', indexing: 'noindex' },
] as const;
