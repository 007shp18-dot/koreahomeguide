export type SiteLocale = 'en' | 'ko' | 'zh-CN';

export const marketNavigation = [
  { id: 'kr-seoul', label: 'Seoul', href: '/kr/seoul/' },
  { id: 'sg-singapore', label: 'Singapore', href: '/sg/' },
  { id: 'ae-dubai', label: 'Dubai', href: '/ae/dubai/' },
  { id: 'jp-tokyo', label: 'Tokyo', href: '/jp/tokyo/' },
] as const;

export type NavigationMarketId = (typeof marketNavigation)[number]['id'];

/** Switch the city, not the task. Never carry a building/filter into another market. */
export function marketDestination(marketId: NavigationMarketId, currentHref = '/', locale: SiteLocale = 'en'): string {
  const path = (currentHref.split('?')[0] ?? '/').replace(/^\/(?:ko|zh-cn)(?=\/)/, '');
  const prefix = locale === 'ko' ? '/ko' : '';
  const city = { 'kr-seoul': 'seoul', 'sg-singapore': 'singapore', 'ae-dubai': 'dubai', 'jp-tokyo': 'tokyo' }[marketId];
  if (marketId === 'jp-tokyo' && (/\/(?:guides|guide|tools)\//.test(path))) return '/jp/tokyo/';
  if (path.includes('/news/') || path.includes('/insights/')) return `${locale === 'zh-CN' ? '/zh-cn' : prefix}/news/?market=${city}`;
  if (path.includes('/guides/') || path.includes('/guide/')) return `${locale === 'zh-CN' ? '/zh-cn' : prefix}/guides/?market=${city}`;
  const base = { 'kr-seoul': '/kr/seoul', 'sg-singapore': '/sg/singapore', 'ae-dubai': '/ae/dubai', 'jp-tokyo': '/jp/tokyo' }[marketId];
  const section = ['explore', 'check', 'shortlist', 'rankings'].find(item => path.includes(`/${item}/`));
  if (marketId === 'jp-tokyo') return section || path === '/prices/' ? `${base}/explore/` : `${base}/`;
  if (section === 'rankings' && marketId === 'ae-dubai') return `${prefix}${base}/explore/`;
  if (section) return `${prefix}${base}/${section}/`;
  if (path === '/prices/') return `${prefix}${base}/explore/`;
  if (path === '/tools/') return `${prefix}${base}/check/`;
  return `${prefix}${marketId === 'sg-singapore' ? '/sg' : base}/`;
}

export function globalNavigation(locale: SiteLocale = 'en') {
  const zh = locale === 'zh-CN';
  if (locale === 'ko') return [
    { label: '둘러보기', href: '/ko/prices/' },
    { label: '순위', href: '/ko/rankings/' },
    { label: '도구', href: '/ko/tools/' },
    { label: '뉴스·인사이트', href: '/ko/news/' },
    { label: '가이드', href: '/ko/guides/' },
  ];
  return [
    { label: zh ? '探索' : 'Explore', href: '/prices/' },
    { label: zh ? '排名' : 'Rankings', href: '/rankings/' },
    { label: zh ? '工具' : 'Tools', href: zh ? '/zh-cn/tools/' : '/tools/' },
    { label: zh ? '新闻与洞察' : 'News & Insights', href: zh ? '/zh-cn/news/' : '/news/' },
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
  } else if (english === '/markets') {
    // `/ko/markets/` is a convenience redirect to the Korean home page, not
    // an independently canonical translation. Hreflang destinations must be
    // terminal pages, so expose only the published English route here.
    destinations.en = withQuery(english);
  } else if (english === '/rankings') {
    destinations.en = withQuery(english);
    destinations.ko = withQuery(`/ko${english}`);
  } else if (english === '/prices' || english === '/tools' || english === '/tools/property-scenario' || english === '/passport') {
    destinations.en = withQuery(english);
    destinations.ko = withQuery(`/ko${english}`);
    if (english === '/tools' || english === '/passport') destinations['zh-CN'] = withQuery(`/zh-cn${english}`);
  } else if (/^\/news\/city-stories\/(?:seoul|singapore|dubai|tokyo)$/.test(english)) {
    destinations.en = withQuery(english);
    destinations.ko = withQuery(`/ko${english}`);
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
