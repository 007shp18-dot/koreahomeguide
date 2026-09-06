import type { MarketId } from '@signedprice/market-core';
import Link from 'next/link';

import { productNavigationLinks, type SiteHeaderModel } from '../lib/site-copy';
import { BrandWordmark } from './brand-mark';
import { MarketLocalNav } from './market-ui/market-local-nav';

type SiteHeaderProps = {
  copy: SiteHeaderModel;
  primaryLinks?: readonly Readonly<{ label: string; href: string; isCurrent?: boolean }>[];
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

export function SiteHeader({ copy, primaryLinks = productNavigationLinks }: SiteHeaderProps) {
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
            {primaryLinks.map((link) => (
              <li key={link.href}>
                <Link
                  className="site-header__product-link"
                  href={link.href}
                  aria-current={('isCurrent' in link && link.isCurrent) || isCurrentGlobalLink(link.href, currentHref) ? 'page' : undefined}
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

        <nav className="site-header__languages" aria-label="Language navigation">
          {marketId === null ? <>
            <Link className="site-header__language" href={copy.languageLabel === 'ZH' ? (languageSwitch?.href ?? '/') : (currentHref ?? '/')} hrefLang="en" aria-current={copy.languageLabel !== 'ZH' ? 'page' : undefined}>EN</Link>
            <Link className="site-header__language" href={currentHref?.includes('/guides') ? '/zh-cn/guides/' : currentHref?.includes('/news') ? '/zh-cn/news/' : '/zh-cn/kr/seoul/'} hrefLang="zh-CN" lang="zh-CN" aria-current={copy.languageLabel === 'ZH' ? 'page' : undefined}>中文</Link>
          </> : null}
          {languageSwitch === undefined || copy.languageLabel === 'ZH' ? null : <Link
            className="site-header__language"
            href={languageSwitch.href}
            hrefLang={languageSwitch.hrefLang}
            lang={languageSwitch.hrefLang}
            aria-label={`Change language to ${languageSwitch.label}`}
          >{languageSwitch.hrefLang === 'en' ? 'EN' : languageSwitch.hrefLang === 'zh-CN' ? '中文' : 'KO'}</Link>}
        </nav>
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
