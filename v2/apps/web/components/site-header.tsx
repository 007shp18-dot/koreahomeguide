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
  const isGlobalProduct = copy.marketLabel === undefined
    && currentHref !== undefined
    && productNavigationLinks.some(({ href }) => href === currentHref);
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
    if (href === '/insights/' && currentHref?.includes('/news/')) return true;
    if (href === '/guides/' && currentHref?.includes('/guide/')) return true;
    return false;
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
    <header className="site-header">
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
    </header>
  );
}
