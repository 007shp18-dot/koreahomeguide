import type { MarketId } from '@signedprice/market-core';
import Link from 'next/link';

import { productNavigationLinks, type SiteHeaderModel } from '../lib/site-copy';
import { BrandWordmark } from './brand-mark';
import { MarketLocalNav } from './market-ui/market-local-nav';

type SiteHeaderProps = {
  copy: SiteHeaderModel;
};

const markets = [
  { id: 'kr-seoul', label: 'Seoul', href: '/kr/seoul/' },
  { id: 'sg-singapore', label: 'Singapore', href: '/sg/' },
  { id: 'ae-dubai', label: 'Dubai', href: '/ae/dubai/' },
] as const satisfies readonly { id: MarketId; label: string; href: string }[];

function marketIdFor(copy: SiteHeaderModel, currentHref: string | undefined): MarketId | null {
  const context = `${copy.marketLabel ?? ''} ${currentHref ?? ''}`.toLowerCase();
  if (context.includes('singapore') || context.includes('/sg/')) return 'sg-singapore';
  if (context.includes('dubai') || context.includes('/ae/')) return 'ae-dubai';
  if (copy.marketLabel !== undefined || context.includes('seoul') || context.includes('/kr/')) {
    return 'kr-seoul';
  }
  return null;
}

function isCurrentGlobalLink(href: string, currentHref: string | undefined): boolean {
  if (currentHref === undefined) return false;
  if (href === '/news/') return currentHref.includes('/news/') || currentHref.includes('/insights/');
  if (href === '/guides/') return currentHref.includes('/guide') || currentHref === '/guides/';
  if (href === '/prices/') {
    return currentHref.includes('/explore/')
      || currentHref.includes('/check/')
      || currentHref.includes('/rankings/')
      || currentHref === '/prices/';
  }
  return currentHref === '/markets/'
    || /^\/(?:kr\/seoul|sg|ae\/dubai)\/?$/.test(currentHref);
}

export function SiteHeader({ copy }: SiteHeaderProps) {
  const currentHref = copy.links.find(({ isCurrent }) => isCurrent)?.href;
  const marketId = marketIdFor(copy, currentHref);
  const marketLabel = copy.marketLabel
    ?? markets.find(({ id }) => id === marketId)?.label
    ?? 'Global';
  const isKorean = copy.languageLabel === 'KO';
  const languageSwitch = copy.languageSwitch ?? (
    marketId === null || marketId === 'kr-seoul'
      ? { label: '한국어', href: '/ko/kr/seoul/', hrefLang: 'ko' as const }
      : undefined
  );

  return (
    <header className="site-header" data-market-context={marketId ?? 'global'}>
      <div className="site-header__inner" data-navigation-tier="global">
        <Link className="wordmark" href={copy.homeHref ?? '/'} aria-label={copy.homeLabel}>
          <BrandWordmark compact />
        </Link>

        <nav className="site-header__product-nav" aria-label="Primary navigation">
          <ul className="site-header__links">
            {productNavigationLinks.map((link) => (
              <li key={link.href}>
                <Link
                  className="site-header__product-link"
                  href={link.href}
                  aria-current={isCurrentGlobalLink(link.href, currentHref) ? 'page' : undefined}
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <nav className="site-header__markets" aria-label="Market navigation">
          {markets.map((market) => (
            <Link
              className="site-header__market-link"
              href={market.href}
              aria-current={marketId === market.id ? 'page' : undefined}
              key={market.id}
            >
              {market.label}
            </Link>
          ))}
        </nav>

        {languageSwitch === undefined ? null : (
          <Link
            className="site-header__language"
            href={languageSwitch.href}
            hrefLang={languageSwitch.hrefLang}
            lang={languageSwitch.hrefLang}
            aria-label={`Change language to ${languageSwitch.label}`}
          >
            {isKorean ? 'EN' : 'KO'}
          </Link>
        )}
      </div>

      {marketId === null ? null : (
        <MarketLocalNav
          marketId={marketId}
          marketLabel={marketLabel}
          currentHref={currentHref}
          locale={isKorean ? 'ko' : 'en'}
        />
      )}
    </header>
  );
}
