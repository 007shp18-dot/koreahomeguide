import Link from 'next/link';

import { productNavigationLinks, type SiteHeaderModel } from '../lib/site-copy';
import { BrandWordmark } from './brand-mark';
import styles from './site-header.module.css';

type SiteHeaderProps = { copy: SiteHeaderModel };

export function SiteHeader({ copy }: SiteHeaderProps) {
  const currentHref = copy.links.find(({ isCurrent }) => isCurrent)?.href;
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
  const markets = [
    { id: 'seoul', label: 'Seoul', href: '/kr/seoul/' },
    { id: 'singapore', label: 'Singapore', href: '/sg/' },
    { id: 'dubai', label: 'Dubai', href: '/ae/dubai/' },
  ] as const;
  const selectedMarket = markets.find(({ id }) => id === currentMarket) ?? markets[0];
  const normalizedHref = (href: string) => href === '/' ? href : href.replace(/\/$/, '');
  const contextLinks = copy.links.filter(({ href }) => (
    href !== '/'
    && !markets.some((market) => normalizedHref(market.href) === normalizedHref(href))
    && !productNavigationLinks.some((product) => normalizedHref(product.href) === normalizedHref(href))
  ));

  function isCurrentLink(href: string): boolean {
    if (currentHref === href) return true;
    if (href === '/prices/' && (currentHref?.includes('/explore/') || currentHref?.includes('/check/') || currentHref?.includes('/rankings/'))) return true;
    if (href === '/insights/' && currentHref?.includes('/news/')) return true;
    if (href === '/guides/' && currentHref?.includes('/guide/')) return true;
    return false;
  }

  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <Link className={styles.brand} href={copy.homeHref ?? '/'} aria-label={copy.homeLabel}>
          <BrandWordmark />
        </Link>
        <nav aria-label={copy.navigationLabel} className={styles.nav} data-navigation-tier="product">
          {productNavigationLinks.map((link) => (
            <Link
              href={link.href}
              aria-label={link.label}
              aria-current={isCurrentLink(link.href) ? 'page' : undefined}
              data-product-index={link.index}
              key={link.href}
            >
              <strong>{link.label}</strong>
              {link.description === 'Service preparing' ? <small>Preparing</small> : null}
            </Link>
          ))}
        </nav>
        <details className={styles.market} data-navigation-tier="market">
          <summary>{selectedMarket.label}</summary>
          <nav className={styles.marketMenu} aria-label="Market navigation">
            {markets.map((market) => (
              <Link
                href={market.href}
                aria-current={currentMarket === market.id ? 'page' : undefined}
                key={market.id}
              >
                {market.label}
              </Link>
            ))}
            {contextLinks.map((link) => (
              <Link
                href={link.href}
                aria-current={link.isCurrent ? 'page' : undefined}
                key={`context-${link.href}`}
              >{link.label}</Link>
            ))}
            {copy.languageSwitch === undefined ? null : (
              <Link href={copy.languageSwitch.href} hrefLang={copy.languageSwitch.hrefLang} lang={copy.languageSwitch.hrefLang}>
                {copy.languageSwitch.label}
              </Link>
            )}
          </nav>
        </details>
      </div>
    </header>
  );
}
