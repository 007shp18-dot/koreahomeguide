export type SiteLocale = 'en' | 'ko' | 'zh-CN';

export const marketNavigation = [
  { id: 'kr-seoul', label: 'Seoul', href: '/kr/seoul/' },
  { id: 'sg-singapore', label: 'Singapore', href: '/sg/' },
  { id: 'ae-dubai', label: 'Dubai', href: '/ae/dubai/' },
] as const;

export function globalNavigation(locale: SiteLocale = 'en') {
  const zh = locale === 'zh-CN';
  if (locale === 'ko') return [
    { label: '시장', href: '/ko/markets/' },
    { label: '가격', href: '/ko/prices/' },
    { label: '도구', href: '/ko/tools/' },
    { label: '분석', href: '/ko/news/?type=analysis' },
    { label: '가이드', href: '/ko/guides/' },
  ];
  return [
    { label: zh ? '市场' : 'Markets', href: '/markets/' },
    { label: zh ? '价格' : 'Prices', href: '/prices/' },
    { label: zh ? '工具' : 'Tools', href: zh ? '/zh-cn/tools/' : '/tools/' },
    { label: zh ? '洞察' : 'Insights', href: zh ? '/zh-cn/news/' : '/news/?type=analysis' },
    { label: zh ? '指南' : 'Guides', href: zh ? '/zh-cn/guides/' : '/guides/' },
  ] as const;
}

/** Only actual translations qualify. Chinese Explore/Check are English redirects. */
export function languageDestinations(pathname: string, search = ''): Record<SiteLocale, string | null> {
  const path = pathname.replace(/\/+$/, '') || '/';
  const english = path === '/ko' ? '/' : path.replace(/^\/ko(?=\/)/, '').replace(/^\/zh-cn(?=\/)/, '');
  const destinations: Record<SiteLocale, string | null> = { en: null, ko: null, 'zh-CN': null };
  const withQuery = (value: string) => `${value === '/' ? '/' : `${value}/`}${search}`;
  if (/^\/kr\/seoul(?:\/(?:explore(?:\/[^/]+(?:\/[^/]+)?)?|check(?:\/compare)?|rankings|shortlist))?$/.test(english)) {
    destinations.en = withQuery(english);
    destinations.ko = withQuery(`/ko${english}`);
    if (english === '/kr/seoul') destinations['zh-CN'] = '/zh-cn/kr/seoul/';
  } else if (english === '/prices' || english === '/markets' || english === '/tools' || english === '/tools/property-scenario' || english === '/passport') {
    destinations.en = withQuery(english);
    destinations.ko = withQuery(`/ko${english}`);
    if (english === '/tools' || english === '/passport') destinations['zh-CN'] = withQuery(`/zh-cn${english}`);
  } else if (english === '/news' || english === '/guides') {
    destinations.ko = withQuery(`/ko${english}`);
    destinations.en = withQuery(english);
    destinations['zh-CN'] = withQuery(`/zh-cn${english}`);
  } else if (/^\/sg\/singapore\/(?:explore(?:\/[^/]+(?:\/[^/]+)?)?|hdb\/[^/]+(?:\/[^/]+)?|check|rankings|shortlist|corrections)$/.test(english) || /^\/ae\/dubai\/(?:explore(?:\/[^/]+)?|check|shortlist|guide)$/.test(english)) {
    destinations.en = withQuery(english);
    destinations.ko = withQuery(`/ko${english}`);
  } else if (['/sg', '/sg/singapore', '/ae/dubai', '/contact'].includes(english)) {
    const canonical = english === '/sg/singapore' ? '/sg' : english;
    destinations.en = withQuery(canonical);
    destinations.ko = withQuery(`/ko${canonical}`);
  } else if (english === '/') {
    destinations.en = '/';
    destinations.ko = '/ko/';
    destinations['zh-CN'] = '/zh-cn/kr/seoul/';
  } else {
    destinations[path.startsWith('/zh-cn/') ? 'zh-CN' : path.startsWith('/ko/') ? 'ko' : 'en'] = withQuery(path);
  }
  return destinations;
}
