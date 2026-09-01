import {
  productNavigationLinks,
  type SiteHeaderModel,
} from '../lib/site-copy';
import Link from 'next/link';

import { BrandWordmark } from './brand-mark';

type SiteHeaderProps = {
  copy: SiteHeaderModel;
};

export function SiteHeader({ copy }: SiteHeaderProps) {
  const currentHref = copy.links.find(({ isCurrent }) => isCurrent)?.href;
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

  function isCurrentProduct(href: string): boolean {
    if (currentHref === href) return true;
    if (href === '/kr/seoul/check/' && (
      currentHref?.startsWith('/kr/seoul/check/')
      || currentHref?.startsWith('/kr/seoul/same-cash/')
      || currentHref?.startsWith('/kr/seoul/tools/rent-check/')
    )) return true;
    if (href === '/kr/seoul/explore/' && currentHref?.startsWith('/kr/seoul/explore/')) return true;
    if (href === '/kr/seoul/rankings/' && currentHref?.startsWith('/kr/seoul/rankings/')) return true;
    if (href === '/kr/seoul/news/' && currentHref?.startsWith('/kr/seoul/news/')) return true;
    if (href === '/kr/seoul/guide/' && currentHref?.startsWith('/kr/seoul/guide/')) return true;
    return false;
  }

  return (
    <header className="site-header">
      <div className="site-header__market-tier" data-navigation-tier="market">
        <div className="site-shell site-header__inner">
          <Link className="wordmark" href="/" aria-label={copy.homeLabel}>
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
            <span aria-current={(copy.languageLabel ?? 'EN') === 'EN' ? 'true' : undefined}>EN</span>
            <span aria-hidden="true">/</span>
            <span aria-current={copy.languageLabel === 'KO' ? 'true' : undefined}>KO</span>
          </div>
        </div>
      </div>
      <div className="site-header__product-tier" data-navigation-tier="product">
        <nav aria-label={copy.navigationLabel}>
          <ul className="site-header__links">
            {productNavigationLinks.map((link) => (
              <li key={link.href}>
                <Link
                  className="site-header__product-link"
                  href={link.href}
                  aria-current={isCurrentProduct(link.href) ? 'page' : undefined}
                  data-product-index={link.index}
                >
                  <span>{link.index}</span>
                  <strong>{link.label}</strong>
                  <small>{link.description}</small>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </header>
  );
}
