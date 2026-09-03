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
  const navigationLinks: readonly NavigationLinkModel[] = copy.navigationVariant === 'supplied'
    ? copy.links
    : productNavigationLinks;
  const currentMarket = currentHref?.startsWith('/sg/') || copy.marketLabel === 'Singapore'
    ? 'singapore'
    : currentHref?.startsWith('/ae/') || copy.marketLabel === 'Dubai'
      ? 'dubai'
      : 'seoul';
  const markets = [
    { id: 'seoul', label: 'Seoul', href: '/kr/seoul/' },
    { id: 'singapore', label: 'Singapore', href: '/sg/' },
    { id: 'dubai', label: 'Dubai', href: '/compare/?market=dubai' },
  ] as const;

  function isCurrentLink(href: string): boolean {
    return currentHref === href;
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
      <div className="site-header__market-tier" data-navigation-tier="market">
        <div className="site-shell site-header__inner">
          <Link className="wordmark" href={copy.homeHref ?? '/'} aria-label={copy.homeLabel}>
            <BrandWordmark inverted />
          </Link>
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
      <div className="site-header__product-tier" data-navigation-tier="product">
        <nav aria-label={copy.navigationLabel} className="site-shell site-header__product-inner">
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
                  {link.description === undefined ? null : <small>{link.description}</small>}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </header>
  );
}
