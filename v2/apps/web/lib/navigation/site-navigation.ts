export type SiteLocale = 'en' | 'ko' | 'zh-CN';

export const marketNavigation = [
  { id: 'kr-seoul', label: 'Seoul', href: '/kr/seoul/' },
  { id: 'sg-singapore', label: 'Singapore', href: '/sg/' },
  { id: 'ae-dubai', label: 'Dubai', href: '/ae/dubai/' },
] as const;

export function globalNavigation(locale: SiteLocale = 'en') {
  const zh = locale === 'zh-CN';
  return [
    { label: zh ? '市场' : 'Markets', href: '/markets/' },
    { label: zh ? '价格' : 'Prices', href: '/prices/' },
    { label: zh ? '新闻' : 'News', href: zh ? '/zh-cn/news/' : '/news/' },
    { label: zh ? '指南' : 'Guides', href: zh ? '/zh-cn/guides/' : '/guides/' },
  ] as const;
}

/** Only actual translations qualify. Chinese Explore/Check are English redirects. */
export function languageDestinations(pathname: string, search = ''): Record<SiteLocale, string | null> {
  const path = pathname.replace(/\/+$/, '') || '/';
  const english = path.replace(/^\/ko(?=\/)/, '').replace(/^\/zh-cn(?=\/)/, '');
  const destinations: Record<SiteLocale, string | null> = { en: null, ko: null, 'zh-CN': null };
  const withQuery = (value: string) => `${value === '/' ? '/' : `${value}/`}${search}`;
  if (/^\/kr\/seoul(?:\/(?:explore(?:\/[^/]+\/[^/]+)?|check(?:\/compare)?|rankings))?$/.test(english)) {
    destinations.en = withQuery(english);
    destinations.ko = withQuery(`/ko${english}`);
    if (english === '/kr/seoul') destinations['zh-CN'] = '/zh-cn/kr/seoul/';
  } else if (english === '/news' || english === '/guides') {
    destinations.en = withQuery(english);
    destinations['zh-CN'] = withQuery(`/zh-cn${english}`);
  } else if (path === '/') {
    destinations.en = '/';
    destinations.ko = '/ko/kr/seoul/';
    destinations['zh-CN'] = '/zh-cn/kr/seoul/';
  } else {
    destinations[path.startsWith('/zh-cn/') ? 'zh-CN' : path.startsWith('/ko/') ? 'ko' : 'en'] = withQuery(path);
  }
  return destinations;
}
