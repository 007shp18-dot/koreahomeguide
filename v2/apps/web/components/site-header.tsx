import { PassportBudgetContext } from './passport/passport-journey';
import { Suspense } from 'react';
import { editorialLanguageRoutes } from '../lib/navigation/editorial-language-routes';
import { globalNavigation, marketNavigation } from '../lib/navigation/site-navigation';
import { LanguageLinks, SiteLanguageNavigation } from './site-language-navigation';
import type { MarketId } from '@signedprice/market-core';
import Link from 'next/link';

import { type SiteHeaderModel } from '../lib/site-copy';
import { BrandWordmark } from './brand-mark';
import { MarketLocalNav, getMarketLocalNavigation } from './market-ui/market-local-nav';

type SiteHeaderProps = {
  copy: SiteHeaderModel;
};

const markets = marketNavigation;

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
  currentHref = currentHref.replace(/^\/(?:ko|zh-cn)(?=\/)/, '');
  if (href.startsWith('/news/')) return currentHref.includes('/news/') || currentHref.includes('/insights/');
  if (href === '/guides/') return currentHref.includes('/guide') || currentHref === '/guides/';
  if (href === '/tools/' || href === '/ko/tools/') return currentHref.includes('/tools/') || currentHref.includes('/check/') || currentHref.includes('/passport/') || currentHref.includes('/shortlist/');
  if (href === '/prices/') {
    return currentHref.includes('/explore/')
      || currentHref.includes('/rankings/')
      || currentHref === '/prices/';
  }
  return currentHref === '/markets/'
    || /^\/(?:kr\/seoul|sg|ae\/dubai)\/?$/.test(currentHref);
}

export function SiteHeader({ copy }: SiteHeaderProps) {
  const locale = copy.languageLabel === 'ZH' ? 'zh-CN' : copy.languageLabel === 'KO' ? 'ko' : 'en';
  const primaryLinks = globalNavigation(locale);
  const visibleMarkets = locale === 'ko' ? markets.map(market => ({ ...market, label: market.id === 'kr-seoul' ? '서울' : market.id === 'sg-singapore' ? '싱가포르' : '두바이', href: market.id === 'kr-seoul' ? '/ko/kr/seoul/' : market.id === 'sg-singapore' ? '/ko/sg/' : '/ko/ae/dubai/' })) : markets;
  const currentHref = copy.links.find(({ isCurrent }) => isCurrent)?.href;
  const marketId = marketIdFor(copy, currentHref);
  const marketLabel = copy.marketLabel
    ?? markets.find(({ id }) => id === marketId)?.label
    ?? 'Global';
  const isKorean = copy.languageLabel === 'KO';
  const fallbackPath = locale === 'zh-CN' ? (currentHref?.startsWith('/zh-cn/') ? currentHref : currentHref === '/news/' || currentHref === '/guides/' ? `/zh-cn${currentHref}` : '/zh-cn/kr/seoul/') : currentHref ?? (locale === 'en' && copy.languageSwitch?.hrefLang === 'ko' ? copy.languageSwitch.href.replace(/^\/ko/, '') : copy.homeHref) ?? '/';

  return (
    <><header className="site-header" data-market-context={marketId ?? 'global'}>
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
                  aria-current={isCurrentGlobalLink(link.href.replace('/zh-cn', ''), currentHref) ? 'page' : undefined}
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <nav className="site-header__markets" aria-label="Market navigation">
          {visibleMarkets.map((market) => (
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

        <Suspense fallback={<LanguageLinks pathname={fallbackPath} alternate={copy.languageSwitch} />}>
          <SiteLanguageNavigation fallbackPath={fallbackPath} translations={editorialLanguageRoutes()} alternate={copy.languageSwitch} />
        </Suspense>
        <details className="site-header__mobile-menu">
          <summary aria-label={isKorean ? '메뉴 열기' : 'Open menu'}>☰ <span>{isKorean ? '메뉴' : 'Menu'}</span></summary>
          <div className="site-header__mobile-panel">
            <nav aria-label={isKorean ? '전체 메뉴' : 'Site menu'}>{primaryLinks.map(link => <Link key={link.href} href={link.href}>{link.label}</Link>)}</nav>
            <nav aria-label={isKorean ? '도시 선택' : 'Choose a city'}>{visibleMarkets.map(market => <Link key={market.id} href={market.href} aria-current={marketId === market.id ? 'page' : undefined}>{market.label}</Link>)}</nav>
            {marketId && <nav aria-label={`${marketLabel} pages`}>{getMarketLocalNavigation(marketId, isKorean ? 'ko' : 'en').map(item => <Link key={item.href} href={item.href}>{item.label}</Link>)}</nav>}
            <Suspense fallback={<LanguageLinks pathname={fallbackPath} alternate={copy.languageSwitch} />}><SiteLanguageNavigation fallbackPath={fallbackPath} translations={editorialLanguageRoutes()} alternate={copy.languageSwitch} /></Suspense>
          </div>
        </details>
      </div>

      {marketId === null ? null : (
        <MarketLocalNav
          marketId={marketId}
          marketLabel={marketLabel}
          currentHref={currentHref}
          locale={isKorean ? 'ko' : 'en'}
        />
      )}
    </header><PassportBudgetContext /></>
  );
}
