import Link from 'next/link';

import { productNavigationLinks, type SiteHeaderModel } from '../lib/site-copy';
import { BrandWordmark } from './brand-mark';
import styles from './site-header.module.css';

type SiteHeaderProps = { copy: SiteHeaderModel };

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
          </nav>
        </details>
        <Link
          className={styles.language}
          href={languageSwitch.href}
          hrefLang={languageSwitch.hrefLang}
          lang={languageSwitch.hrefLang}
          aria-label={`Change language to ${languageSwitch.label}`}
        >{languageSwitch.hrefLang.toUpperCase()}</Link>
      </div>
    </header>
  );
}
