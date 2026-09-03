import Link from 'next/link';

import { productNavigationLinks, type SiteHeaderModel } from '../lib/site-copy';
import { BrandWordmark } from './brand-mark';

type SiteHeaderProps = {
  copy: SiteHeaderModel;
};

export function SiteHeader({ copy }: SiteHeaderProps) {
  const languageSwitch = copy.languageSwitch ?? {
    label: '한국어',
    href: '/ko/kr/seoul/',
    hrefLang: 'ko',
  } as const;
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
    { label: isKoreanMarket ? '개요' : 'Overview', href: currentMarket === 'singapore' ? '/sg/' : `${marketPrefix}/` },
    { label: isKoreanMarket ? '탐색' : 'Explore', href: `${marketPrefix}/explore/` },
    { label: isKoreanMarket ? '가격 확인' : 'Check', href: `${marketPrefix}/check/` },
    { label: isKoreanMarket ? '순위' : 'Rankings', href: `${marketPrefix}/rankings/` },
    { label: isKoreanMarket ? '뉴스' : 'News', href: isKoreanMarket ? '/kr/news/' : `${marketPrefix}/news/` },
    { label: isKoreanMarket ? '커뮤니티' : 'Community', href: isKoreanMarket ? '/kr/seoul/community/' : `${marketPrefix}/community/` },
    { label: isKoreanMarket ? '가이드' : 'Guide', href: isKoreanMarket ? '/kr/seoul/guide/' : `${marketPrefix}/guide/` },
  ];
  function isCurrentMarketLink(href: string): boolean {
    if (currentHref === href) return true;
    const segment = href.split('/').filter(Boolean).at(-1);
    return segment !== undefined && segment !== 'seoul' && segment !== 'singapore' && segment !== 'dubai'
      ? currentHref?.includes(`/${segment}/`) === true
      : false;
  }

  const isKorean = copy.languageLabel === 'KO';
  const switchLink = (
    <Link
      href={languageSwitch.href}
      hrefLang={languageSwitch.hrefLang}
      lang={languageSwitch.hrefLang}
      aria-label={`Change language to ${languageSwitch.label}`}
    >
      {languageSwitch.hrefLang.toUpperCase()}
    </Link>
  );

  return (
    <header className="site-header" data-market-context={currentMarket ?? 'global'}>
      <div className="site-header__inner" data-navigation-tier="primary">
        <Link className="wordmark" href={copy.homeHref ?? '/'} aria-label={copy.homeLabel}>
          <BrandWordmark compact />
        </Link>
        {copy.showMarketNavigation ? (
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
        ) : null}
        <nav className="site-header__product-nav" aria-label={copy.navigationLabel}>
          <ul className="site-header__links">
            {productNavigationLinks.map((link) => (
              <li key={link.href}>
                <Link
                  className="site-header__product-link"
                  href={link.href}
                  aria-current={isCurrentLink(link.href) ? 'page' : undefined}
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <span className="site-header__context">{marketLabel} · reported filings</span>
        <div className="site-header__language" aria-label="Language navigation">
          {isKorean ? switchLink : <span aria-current="true">EN</span>}
          <span aria-hidden="true">/</span>
          {isKorean ? <span aria-current="true">KO</span> : switchLink}
        </div>
      </div>
      {marketNavigation.length > 0 ? (
        <nav className="site-header__local" aria-label={`${marketLabel} product navigation`} data-local-navigation="true">
          <div>
            {marketNavigation.map((link) => (
              <Link
                href={link.href}
                aria-current={isCurrentMarketLink(link.href) ? 'page' : undefined}
                key={link.href}
              >{link.label}</Link>
            ))}
          </div>
        </nav>
      ) : null}
    </header>
  );
}
