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
}>): Readonly<{ links: readonly NavigationLinkModel[]; marketSwitch: readonly NavigationLinkModel[] }> {
  const ko = input.locale === 'ko';
  const localizedSwitch = ko ? [{ label: '서울', href: '/ko/kr/seoul/' }, { label: '싱가포르', href: '/ko/sg/' }, { label: '두바이', href: '/ko/ae/dubai/' }] : marketSwitch;
  if (input.market === 'dubai') {
    return Object.freeze({
      links: withCurrent([
        { surface: 'home', label: ko ? '개요' : 'Overview', href: ko ? '/ko/ae/dubai/' : '/ae/dubai/' },
        ...(ko ? [
          { surface: 'explore' as const, label: '실거래가 탐색', href: '/ko/ae/dubai/explore/' },
          { surface: 'check' as const, label: '가격 확인', href: '/ko/ae/dubai/check/' },
          { surface: 'guide' as const, label: '가이드', href: '/ko/ae/dubai/guide/' },
        ] : [{ surface: 'compare' as const, label: 'Compare markets', href: '/compare/?market=dubai' }]),
      ], input.surface),
      marketSwitch: localizedSwitch,
    });
  }
  if (input.market === 'singapore') {
    return Object.freeze({
      links: withCurrent([
        { surface: 'home', label: ko ? '개요' : 'Overview', href: ko ? '/ko/sg/' : '/sg/' },
        { surface: 'check', label: ko ? '가격 확인' : 'Check', href: ko ? '/ko/sg/singapore/check/' : '/sg/singapore/check/' },
        { surface: 'explore', label: ko ? '실거래가 탐색' : 'Explore', href: ko ? '/ko/sg/singapore/explore/' : '/sg/singapore/explore/' },
        { surface: 'rankings', label: ko ? '지역 비교' : 'Rankings', href: ko ? '/ko/sg/singapore/rankings/' : '/sg/singapore/rankings/' },
        { surface: 'corrections', label: ko ? '정보 수정 요청' : 'Corrections', href: ko ? '/ko/sg/singapore/corrections/' : '/sg/singapore/corrections/' },
        { surface: 'guide', label: ko ? '가이드' : 'Trust', href: ko ? '/ko/guides/read-singapore-private-transactions/' : '/trust/' },
      ], input.surface),
      marketSwitch: localizedSwitch,
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
    marketSwitch: localizedSwitch,
  });
}
