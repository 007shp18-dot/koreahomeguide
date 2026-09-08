import { PassportBudgetContext } from './passport/passport-journey';
import { Suspense } from 'react';
import { editorialLanguageRoutes } from '../lib/navigation/editorial-language-routes';
import { globalNavigation, marketNavigation, marketDestination, type SiteLocale } from '../lib/navigation/site-navigation';
import { LanguageLinks, SiteLanguageNavigation } from './site-language-navigation';
import type { MarketId } from '@signedprice/market-core';
import Link from 'next/link';

import { type SiteHeaderModel } from '../lib/site-copy';
import { TokyoNavigation } from './japan/tokyo-navigation';
import { BrandWordmark } from './brand-mark';
import { MarketLocalNav, getMarketLocalNavigation } from './market-ui/market-local-nav';
import { SiteMobileMenu } from './site-mobile-menu';
import { SiteContextMenu } from './site-context-menu';

type SiteHeaderProps = {
  copy: SiteHeaderModel;
};

const markets = marketNavigation;

function marketIdFor(copy: SiteHeaderModel, currentHref: string | undefined): MarketId | null {
  const context = `${copy.marketLabel ?? ''} ${currentHref ?? ''}`.toLowerCase();
  if (context.includes('singapore') || context.includes('/sg/')) return 'sg-singapore';
  if (context.includes('dubai') || context.includes('/ae/')) return 'ae-dubai';
  if (context.includes('seoul') || context.includes('/kr/')) return 'kr-seoul';
  return null;
}

type HeaderMarketContext = (typeof markets)[number]['id'] | 'global';

function headerMarketContext(copy: SiteHeaderModel, currentHref: string | undefined): HeaderMarketContext {
  const context = `${copy.marketLabel ?? ''} ${currentHref ?? ''}`.toLowerCase();
  if (context.includes('tokyo') || context.includes('/jp/tokyo')) return 'jp-tokyo';
  if (context.includes('singapore') || context.includes('/sg/')) return 'sg-singapore';
  if (context.includes('dubai') || context.includes('/ae/')) return 'ae-dubai';
  if (context.includes('seoul') || context.includes('/kr/')) return 'kr-seoul';
  return 'global';
}

function contextualActions(context: HeaderMarketContext, locale: SiteLocale) {
  const ko = locale === 'ko';
  const prefix = ko ? '/ko' : '';
  switch (context) {
    case 'sg-singapore': return { saved: `${prefix}/sg/singapore/shortlist/`, offer: `${prefix}/sg/singapore/check/` };
    case 'ae-dubai': return { saved: `${prefix}/ae/dubai/shortlist/`, offer: `${prefix}/ae/dubai/check/` };
    case 'jp-tokyo': return null;
    case 'kr-seoul': return { saved: `${prefix}/kr/seoul/shortlist/`, offer: `${prefix}/kr/seoul/check/` };
    default: return { saved: `${prefix}/kr/seoul/shortlist/`, offer: `${prefix}/tools/` };
  }
}

function isCurrentGlobalLink(href: string, currentHref: string | undefined): boolean {
  if (currentHref === undefined) return false;
  href = href.replace(/^\/(?:ko|zh-cn)(?=\/)/, '');
  currentHref = currentHref.replace(/^\/(?:ko|zh-cn)(?=\/)/, '');
  if (href.startsWith('/news/')) return currentHref.includes('/news/') || currentHref.includes('/insights/');
  if (href === '/guides/') return currentHref.includes('/guide') || currentHref === '/guides/';
  if (href === '/tools/' || href === '/ko/tools/') return currentHref.includes('/tools/') || currentHref.includes('/check/') || currentHref.includes('/passport/') || currentHref.includes('/shortlist/');
  if (href.includes('/rankings/')) return currentHref.includes('/rankings/');
  if (href === '/prices/') {
    return currentHref.includes('/explore/') || currentHref === '/prices/';
  }
  return currentHref === '/markets/'
    || /^\/(?:kr\/seoul|sg|ae\/dubai|jp\/tokyo)\/?$/.test(currentHref);
}

export function SiteHeader({ copy }: SiteHeaderProps) {
  const locale = copy.languageLabel === 'ZH' ? 'zh-CN' : copy.languageLabel === 'KO' ? 'ko' : 'en';
  const primaryLinks = globalNavigation(locale);
  const currentHref = copy.links.find(({ isCurrent }) => isCurrent)?.href;
  const context = headerMarketContext(copy, currentHref);
  const visibleMarkets = markets.map(market => ({
    ...market,
    label: locale === 'ko'
      ? ({ 'kr-seoul': '서울', 'sg-singapore': '싱가포르', 'ae-dubai': '두바이', 'jp-tokyo': '도쿄' } as const)[market.id]
      : locale === 'zh-CN'
        ? ({ 'kr-seoul': '首尔', 'sg-singapore': '新加坡', 'ae-dubai': '迪拜', 'jp-tokyo': '东京' } as const)[market.id]
        : market.label,
    href: marketDestination(market.id, currentHref, locale),
  }));
  const marketId = marketIdFor(copy, currentHref);
  const marketLabel = copy.marketLabel
    ?? markets.find(({ id }) => id === marketId)?.label
    ?? 'Global';
  const isKorean = copy.languageLabel === 'KO';
  const actionLinks = contextualActions(context, locale);
  const currentMarketLabel = visibleMarkets.find(({ id }) => id === context)?.label;
  const cityMenuLabel = currentMarketLabel ?? (isKorean ? '도시' : locale === 'zh-CN' ? '城市' : 'Cities');
  const chooseCityLabel = isKorean ? '도시 선택' : locale === 'zh-CN' ? '选择城市' : 'Choose a city';
  const chooseLanguageLabel = isKorean ? '언어 선택' : locale === 'zh-CN' ? '选择语言' : 'Choose language';
  const currentLanguageLabel = locale === 'zh-CN' ? '中文' : locale.toUpperCase();
  const fallbackPath = locale === 'zh-CN' ? (currentHref?.startsWith('/zh-cn/') ? currentHref : currentHref === '/news/' || currentHref === '/guides/' ? `/zh-cn${currentHref}` : '/zh-cn/kr/seoul/') : currentHref ?? (locale === 'en' && copy.languageSwitch?.hrefLang === 'ko' ? copy.languageSwitch.href.replace(/^\/ko/, '') : copy.homeHref) ?? '/';

  return (
    <><header className="site-header" data-market-context={context}>
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
                  aria-current={isCurrentGlobalLink(link.href, currentHref) ? 'page' : undefined}
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="site-header__actions">
          <SiteContextMenu className="site-header__context-menu site-header__context-menu--market">
            <summary aria-label={chooseCityLabel}>
              <span>{cityMenuLabel}</span><span aria-hidden="true">⌄</span>
            </summary>
            <div className="site-header__context-panel site-header__context-panel--market">
              <nav className="site-header__markets" aria-label="Market navigation">
                {visibleMarkets.map((market) => (
                  <Link
                    className="site-header__market-link"
                    href={market.href}
                    aria-current={context === market.id ? 'page' : undefined}
                    key={market.id}
                  >
                    {market.label}
                  </Link>
                ))}
              </nav>
              {context === 'jp-tokyo' ? <TokyoNavigation current={currentHref?.includes('/explore/') ? 'explore' : 'overview'} /> : marketId === null ? null : (
                <MarketLocalNav
                  marketId={marketId}
                  marketLabel={marketLabel}
                  currentHref={currentHref}
                  locale={isKorean ? 'ko' : 'en'}
                />
              )}
            </div>
          </SiteContextMenu>
          {actionLinks && <Link className="site-header__action site-header__action--saved" href={actionLinks.saved}>{isKorean ? '관심 목록' : locale === 'zh-CN' ? '已保存' : 'Saved'}</Link>}
          <SiteContextMenu className="site-header__context-menu site-header__context-menu--language">
            <summary aria-label={chooseLanguageLabel}>
              <span>{currentLanguageLabel}</span><span aria-hidden="true">⌄</span>
            </summary>
            <div className="site-header__context-panel site-header__context-panel--language">
              <Suspense fallback={<LanguageLinks pathname={fallbackPath} alternate={copy.languageSwitch} />}>
                <SiteLanguageNavigation fallbackPath={fallbackPath} translations={editorialLanguageRoutes()} alternate={copy.languageSwitch} />
              </Suspense>
            </div>
          </SiteContextMenu>
          {actionLinks && <Link className="site-header__action site-header__action--offer" href={actionLinks.offer}>{isKorean ? '제안 가격 확인' : locale === 'zh-CN' ? '核对报价' : 'Check an offer'}</Link>}
        </div>
        <SiteMobileMenu
          summaryLabel={isKorean ? '메뉴 열기' : 'Open menu'}
          summaryText={isKorean ? '메뉴' : 'Menu'}
        >
          <nav aria-label={isKorean ? '전체 메뉴' : 'Site menu'}>
            {primaryLinks.map(link => (
              <Link
                key={link.href}
                href={link.href}
                aria-current={isCurrentGlobalLink(link.href, currentHref) ? 'page' : undefined}
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <nav aria-label={isKorean ? '도시 선택' : 'Choose a city'}>{visibleMarkets.map(market => <Link key={market.id} href={market.href} aria-current={context === market.id ? 'page' : undefined}>{market.label}</Link>)}</nav>
          {marketId && <nav aria-label={`${marketLabel} pages`}>{getMarketLocalNavigation(marketId, isKorean ? 'ko' : 'en').map(item => <Link key={item.href} href={item.href}>{item.label}</Link>)}</nav>}
          {actionLinks && <nav aria-label={isKorean ? '빠른 작업' : 'Quick actions'}><Link href={actionLinks.saved}>{isKorean ? '관심 목록' : locale === 'zh-CN' ? '已保存' : 'Saved'}</Link><Link href={actionLinks.offer}>{isKorean ? '제안 가격 확인' : locale === 'zh-CN' ? '核对报价' : 'Check an offer'}</Link></nav>}
          <Suspense fallback={<LanguageLinks pathname={fallbackPath} alternate={copy.languageSwitch} />}><SiteLanguageNavigation fallbackPath={fallbackPath} translations={editorialLanguageRoutes()} alternate={copy.languageSwitch} /></Suspense>
        </SiteMobileMenu>
      </div>
    </header><PassportBudgetContext /></>
  );
}
