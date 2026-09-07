import { listMarketCapabilities, type MarketId } from '@signedprice/market-core';
import Link from 'next/link';

export type MarketLocalNavItem = Readonly<{
  label: string;
  href: string;
  state: 'available' | 'limited';
}>;

const localFeatures = [
  ['market_overview', 'Overview'],
  ['explore', 'Explore'],
  ['check', 'Check'],
  ['rankings', 'Rankings'],
  ['corrections', 'Corrections'],
] as const;

export function getMarketLocalNavigation(
  marketId: MarketId,
  locale: 'en' | 'ko' = 'en',
): readonly MarketLocalNavItem[] {
  const capabilities = listMarketCapabilities(marketId);

  const items: MarketLocalNavItem[] = localFeatures.flatMap(([feature, label]) => {
    const capability = capabilities.find((item) =>
      item.feature === feature && item.housingSector === null,
    );
    if (capability?.publicHref === null || capability?.publicHref === undefined) return [];
    if (capability.state === 'rights_blocked') return [];

    const href = locale === 'ko'
      ? marketId === 'sg-singapore' && feature === 'market_overview' ? '/ko/sg/' : `/ko${capability.publicHref}`
      : capability.publicHref;
    return [{
      label: locale === 'ko' ? { Overview: '개요', Explore: '실거래가 탐색', Check: '가격 확인', Rankings: '지역 비교', Corrections: '정보 수정 요청' }[label] : label,
      href,
      state: capability.state,
    } satisfies MarketLocalNavItem];
  });
  return Object.freeze(items);
}

function isCurrentLocalHref(currentHref: string | undefined, href: string): boolean {
  const normalize = (value: string | undefined) => value?.replace(/\/+$/, '') || '/';
  if (normalize(currentHref) === normalize(href)) return true;
  if (href.endsWith('/explore/')) {
    return currentHref?.includes('/explore/') === true;
  }
  return false;
}

export function MarketLocalNav({
  marketId,
  marketLabel,
  currentHref,
  locale = 'en',
}: Readonly<{
  marketId: MarketId;
  marketLabel: string;
  currentHref?: string;
  locale?: 'en' | 'ko';
}>) {
  const items = getMarketLocalNavigation(marketId, locale);

  return (
    <nav
      className="market-local-nav"
      aria-label={locale === 'ko' ? `${marketLabel} 시장 메뉴` : `${marketLabel} market navigation`}
      data-navigation-tier="market-local"
    >
      <div className="market-local-nav__inner">
        {items.map((item) => (
          <Link
            className="market-local-nav__link"
            href={item.href}
            aria-current={isCurrentLocalHref(currentHref, item.href) ? 'page' : undefined}
            data-capability-state={item.state}
            key={item.label}
          >
            {item.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
