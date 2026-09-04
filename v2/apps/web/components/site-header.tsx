import Link from 'next/link';

import { productNavigationLinks, type NavigationLinkModel, type SiteHeaderModel } from '../lib/site-copy';
import { BrandWordmark } from './brand-mark';

type SiteHeaderProps = {
  copy: SiteHeaderModel;
};

export function SiteHeader({ copy }: SiteHeaderProps) {
  const currentHref = copy.links.find(({ isCurrent }) => isCurrent)?.href;
  const globalProductHrefs = ['/markets/', '/prices/', '/news/', '/community/', '/guides/', '/properties/', '/invest/', '/insights/'];
  const isGlobalProduct = copy.marketLabel === undefined
    && (currentHref === undefined || globalProductHrefs.includes(currentHref));
  const marketLabel = isGlobalProduct
    ? 'Global'
    : copy.marketLabel
      ?? (currentHref?.startsWith('/sg/') ? 'Singapore'
        : currentHref?.startsWith('/ae/') ? 'Dubai'
          : 'Seoul');
  const currentMarket = isGlobalProduct
    ? null
    : marketLabel === 'Singapore'
      ? 'singapore'
      : marketLabel === 'Dubai'
        ? 'dubai'
        : 'seoul';
  const markets = [
    { id: 'seoul', label: 'Seoul', href: '/kr/seoul/' },
    { id: 'singapore', label: 'Singapore', href: '/sg/' },
    { id: 'dubai', label: 'Dubai', href: '/ae/dubai/' },
  ] as const;
  function isCurrentLink(href: string): boolean {
    if (currentHref === href) return true;
    if (href === '/prices/' && (
      currentHref?.includes('/explore/')
      || currentHref?.includes('/check/')
      || currentHref?.includes('/rankings/')
    )) return true;
    if (href === '/news/' && (currentHref?.includes('/news/') || currentHref === '/insights/')) return true;
    if (href === '/community/' && currentHref?.includes('/community/')) return true;
    if (href === '/guides/' && currentHref?.includes('/guide/')) return true;
    return false;
  }

  const marketPrefix = currentMarket === 'seoul'
    ? (copy.languageLabel === 'KO' ? '/ko/kr/seoul' : '/kr/seoul')
    : currentMarket === 'singapore'
      ? '/sg/singapore'
      : currentMarket === 'dubai'
        ? '/ae/dubai'
        : null;
  const isKoreanMarket = currentMarket === 'seoul' && copy.languageLabel === 'KO';
  const marketNavigation = marketPrefix === null ? [] : [
    { index: '00', label: isKoreanMarket ? '개요' : 'Overview', description: isKoreanMarket ? '시장 요약' : 'Market view', href: currentMarket === 'singapore' ? '/sg/' : `${marketPrefix}/` },
    { index: '01', label: isKoreanMarket ? '가격 확인' : 'Check', description: isKoreanMarket ? '계약 비교' : 'Compare price', href: `${marketPrefix}/check/` },
    { index: '02', label: isKoreanMarket ? '탐색' : 'Explore', description: isKoreanMarket ? '지역과 건물' : 'Area & building', href: `${marketPrefix}/explore/` },
    { index: '03', label: isKoreanMarket ? '순위' : 'Rankings', description: isKoreanMarket ? '지역 비교' : 'Compare areas', href: `${marketPrefix}/rankings/` },
    { index: '04', label: isKoreanMarket ? '뉴스' : 'News', description: isKoreanMarket ? '시장 브리핑' : 'Market briefs', href: isKoreanMarket ? '/kr/news/' : `${marketPrefix}/news/` },
    { index: '05', label: isKoreanMarket ? '커뮤니티' : 'Community', description: isKoreanMarket ? '지역 대화' : 'Local voices', href: isKoreanMarket ? '/kr/seoul/community/' : `${marketPrefix}/community/` },
    { index: '06', label: isKoreanMarket ? '가이드' : 'Guide', description: isKoreanMarket ? '현지 절차' : 'Local process', href: isKoreanMarket ? '/kr/seoul/guide/' : `${marketPrefix}/guide/` },
  ];
  function isCurrentMarketLink(href: string): boolean {
    const normalize = (value: string | undefined) => value?.replace(/\/+$/, '') || '/';
    if (normalize(currentHref) === normalize(href)) return true;
    if (href === '/sg/' || href === `${marketPrefix}/`) return false;
    const segment = href.split('/').filter(Boolean).at(-1);
    if (segment === 'guide' && normalize(currentHref) === '/guides') return true;
    return segment !== undefined && segment !== 'seoul' && segment !== 'singapore' && segment !== 'dubai'
      ? currentHref?.includes(`/${segment}/`) === true
      : false;
  }

  const isKorean = copy.languageLabel === 'KO';
  const languageSwitch = copy.languageSwitch ?? (
    currentMarket === null || currentMarket === 'seoul'
      ? { label: '한국어', href: '/ko/kr/seoul/', hrefLang: 'ko' as const }
      : undefined
  );
  const switchLink = languageSwitch === undefined ? null : (
    <Link
      href={languageSwitch.href}
      hrefLang={languageSwitch.hrefLang}
      lang={languageSwitch.hrefLang}
      aria-label={`Change language to ${languageSwitch.label}`}
    >
      {languageSwitch.hrefLang.toUpperCase()}
    </Link>
  );
  const navigationLinks: readonly NavigationLinkModel[] = copy.navigationVariant === 'supplied'
    ? copy.links
    : marketNavigation.length > 0
      ? marketNavigation
      : productNavigationLinks;
  const primaryAction = currentMarket === 'dubai'
    ? { href: '/compare/?market=dubai', label: 'Compare markets' }
    : marketPrefix === null
      ? { href: '/prices/', label: 'Explore prices' }
      : { href: `${marketPrefix}/check/`, label: isKoreanMarket ? '가격 확인' : 'Run a check' };

  return (
    <header className="site-header" data-market-context={currentMarket ?? 'global'}>
      <div className="site-header__market-tier">
        <div>
          <span className="site-header__market-title">Markets</span>
          <nav className="site-header__markets" aria-label="Market navigation">
            {markets.map((market) => (
              <Link
                className="site-header__market-link"
                href={market.href}
                aria-current={currentMarket === market.id ? 'page' : undefined}
                key={market.id}
              >
                {market.label}
              </Link>
            ))}
          </nav>
          <span className="site-header__context">{marketLabel} · reported filings</span>
          <div className="site-header__language" aria-label="Language navigation">
            {isKorean ? switchLink : <span aria-current="true">EN</span>}
            {languageSwitch === undefined ? null : <span aria-hidden="true">/</span>}
            {languageSwitch === undefined ? null : isKorean ? <span aria-current="true">KO</span> : switchLink}
          </div>
        </div>
      </div>
      <div className="site-header__inner" data-navigation-tier="product">
        <Link className="wordmark" href={copy.homeHref ?? '/'} aria-label={copy.homeLabel}>
          <BrandWordmark compact />
        </Link>
        <nav className="site-header__product-nav" aria-label={copy.navigationLabel}>
          <ul className="site-header__links">
            {navigationLinks.map((link, index) => (
              <li key={link.href}>
                <Link
                  className="site-header__product-link"
                  href={link.href}
                  aria-current={(copy.navigationVariant === 'supplied'
                    ? link.isCurrent === true
                    : marketNavigation.length > 0
                      ? isCurrentMarketLink(link.href)
                      : isCurrentLink(link.href)) ? 'page' : undefined}
                >
                  <span>{link.index ?? String(index).padStart(2, '0')}</span>
                  <strong>{link.label}</strong>
                  {link.description === undefined ? null : <small>{link.description}</small>}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <Link className="site-header__cta" href={primaryAction.href}>
          {primaryAction.label}
        </Link>
      </div>
    </header>
  );
}
