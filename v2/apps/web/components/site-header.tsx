import {
  productNavigationLinks,
  type NavigationLinkModel,
  type SiteHeaderModel,
} from '../lib/site-copy';
import Link from 'next/link';

import { BrandWordmark } from './brand-mark';

type SiteHeaderProps = {
  copy: SiteHeaderModel;
};

export function SiteHeader({ copy }: SiteHeaderProps) {
  const currentHref = copy.links.find(({ isCurrent }) => isCurrent)?.href;
  const hasLocalLinks = copy.links.some((link) => (
    !productNavigationLinks.some((productLink) => productLink.href === link.href)
  ));
  const contextualLinks: readonly NavigationLinkModel[] = copy.navigationVariant === 'supplied' || hasLocalLinks
    ? copy.links
    : [];
  const isGlobalProduct = copy.marketLabel === undefined
    && currentHref !== undefined
    && productNavigationLinks.some(({ href }) => href === currentHref);
  const currentMarket = isGlobalProduct
    ? null
    : currentHref?.startsWith('/sg/') || copy.marketLabel === 'Singapore'
    ? 'singapore'
    : currentHref?.startsWith('/ae/') || copy.marketLabel === 'Dubai'
      ? 'dubai'
      : 'seoul';
  const navigationLinks: readonly NavigationLinkModel[] = productNavigationLinks;
  const markets = [
    { id: 'seoul', label: 'Seoul', href: '/kr/seoul/' },
    { id: 'singapore', label: 'Singapore', href: '/sg/' },
    { id: 'dubai', label: 'Dubai', href: '/ae/dubai/' },
  ] as const;

  function isCurrentLink(href: string): boolean {
    if (currentHref === href) return true;
    if (href === '/prices/' && (currentHref?.includes('/explore/') || currentHref?.includes('/check/') || currentHref?.includes('/rankings/'))) return true;
    if (href === '/insights/' && currentHref?.includes('/news/')) return true;
    if (href === '/guides/' && currentHref?.includes('/guide/')) return true;
    return false;
  }

  const isKorean = copy.languageLabel === 'KO';
  const switchLink = copy.languageSwitch === undefined ? null : (
    <Link
      href={copy.languageSwitch.href}
      hrefLang={copy.languageSwitch.hrefLang}
      aria-label={`Switch to ${copy.languageSwitch.hrefLang === 'ko' ? 'Korean' : 'English'}`}
    >
      {copy.languageSwitch.label}
    </Link>
  );

  return (
    <header className="site-header">
      <div className="site-shell site-header__inner">
        <Link className="wordmark" href={copy.homeHref ?? '/'} aria-label={copy.homeLabel}>
          <BrandWordmark />
        </Link>
        <div className="site-header__product-tier" data-navigation-tier="product">
          <nav aria-label={copy.navigationLabel} className="site-header__product-inner">
            <ul className="site-header__links">
              {navigationLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    className="site-header__product-link"
                    href={link.href}
                    aria-label={link.ariaLabel}
                    aria-current={isCurrentLink(link.href) ? 'page' : undefined}
                    data-product-index={link.index}
                  >
                    {link.index === undefined ? null : <span>{link.index}</span>}
                    <strong>{link.label}</strong>
                    {link.description === 'Service preparing' ? <small>Preparing</small> : null}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
        <div className="site-header__market-tier" data-navigation-tier="market">
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
          <div className="site-header__language" aria-label="Language navigation">
            {isKorean ? switchLink : <span aria-current="true">EN</span>}
            <span aria-hidden="true">/</span>
            {isKorean ? <span aria-current="true">KO</span> : switchLink ?? <span>KO</span>}
          </div>
        </div>
      </div>
      {contextualLinks.length === 0 ? null : (
        <nav className="site-header__context" aria-label={`${copy.marketLabel ?? 'Local'} navigation`}>
          <div className="site-shell site-header__context-inner">
            {contextualLinks.map((link) => (
              <Link href={link.href} aria-current={link.isCurrent ? 'page' : undefined} key={link.href}>
                {link.label}
              </Link>
            ))}
          </div>
        </nav>
      )}
    </header>
  );
}
