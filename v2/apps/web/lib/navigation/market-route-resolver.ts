import type { NavigationLinkModel } from '../site-copy';

export type ProductMarket = 'seoul' | 'singapore' | 'dubai';
export type ProductSurface = 'home' | 'explore' | 'check' | 'rankings' | 'news' | 'community' | 'guide' | 'detail' | 'corrections' | 'compare';

const marketSwitch = Object.freeze([
  Object.freeze({ label: 'Seoul', href: '/kr/seoul/' }),
  Object.freeze({ label: 'Singapore', href: '/sg/' }),
  Object.freeze({ label: 'Dubai', href: '/ae/dubai/' }),
]);

function withCurrent(
  links: readonly Readonly<NavigationLinkModel & { surface: ProductSurface }>[],
  surface: ProductSurface,
): readonly NavigationLinkModel[] {
  const currentSurface = surface === 'detail' ? 'explore' : surface;
  return Object.freeze(links.map(({ surface: linkSurface, ...link }) => Object.freeze({
    ...link,
    ...(linkSurface === currentSurface ? { isCurrent: true } : {}),
  })));
}

export function resolveMarketNavigation(input: Readonly<{
  market: ProductMarket;
  locale: 'en' | 'ko';
  surface: ProductSurface;
}>): Readonly<{ links: readonly NavigationLinkModel[]; marketSwitch: typeof marketSwitch }> {
  if (input.market === 'dubai') {
    return Object.freeze({
      links: withCurrent([
        { surface: 'home', label: 'Overview', href: '/ae/dubai/' },
        { surface: 'compare', label: 'Compare markets', href: '/compare/?market=dubai' },
      ], input.surface),
      marketSwitch,
    });
  }
  if (input.market === 'singapore') {
    return Object.freeze({
      links: withCurrent([
        { surface: 'home', label: 'Overview', href: '/sg/' },
        { surface: 'check', label: 'Check', href: '/sg/singapore/check/' },
        { surface: 'explore', label: 'Explore', href: '/sg/singapore/explore/' },
        { surface: 'rankings', label: 'Rankings', href: '/sg/singapore/rankings/' },
        { surface: 'corrections', label: 'Corrections', href: '/sg/singapore/corrections/' },
        { surface: 'guide', label: 'Trust', href: '/trust/' },
      ], input.surface),
      marketSwitch,
    });
  }
  const prefix = input.locale === 'ko' ? '/ko/kr/seoul' : '/kr/seoul';
  const labels = input.locale === 'ko'
    ? { home: '개요', check: '계약 확인', explore: '탐색', rankings: '순위', news: '뉴스', community: '커뮤니티', guide: '가이드' }
    : { home: 'Overview', check: 'Check', explore: 'Explore', rankings: 'Rankings', news: 'News', community: 'Community', guide: 'Guide' };
  return Object.freeze({
    links: withCurrent([
      { surface: 'home', label: labels.home, href: `${prefix}/` },
      { surface: 'check', label: labels.check, href: `${prefix}/check/` },
      { surface: 'explore', label: labels.explore, href: `${prefix}/explore/` },
      { surface: 'rankings', label: labels.rankings, href: `${prefix}/rankings/` },
      { surface: 'news', label: labels.news, href: input.locale === 'ko' ? '/kr/news/' : `${prefix}/news/` },
      { surface: 'community', label: labels.community, href: '/kr/seoul/community/' },
      { surface: 'guide', label: labels.guide, href: input.locale === 'ko' ? '/kr/seoul/guide/' : `${prefix}/guide/` },
    ], input.surface),
    marketSwitch,
  });
}
