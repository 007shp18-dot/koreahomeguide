import type { ReactNode } from 'react';
import type { MarketLocale } from '../../lib/locale/market-localization';
import type { DecisionPriceContext } from '../../lib/research/property-decision-price';
import { areaDecisionProfile } from '../../lib/research/area-decision';
import { propertyReviewProfilesForMarket } from '../../lib/research/property-review-profile';
import { reviewLocation } from '../../lib/research/property-review-locations';
import { matchesTokyoLocality } from '../../lib/research/tokyo-locality';
import { PropertyDecisionWorkspace } from './property-decision-workspace';

/** Local examples retain their property identity inside an explicitly area-level report. */
export function AreaDecisionWorkspace({ market, areaKey, name, neighbourhood, priceContext, locale, children }: {
  market: 'jp-tokyo' | 'ae-dubai'; areaKey: string; name: string; neighbourhood?: string;
  priceContext?: DecisionPriceContext; locale: MarketLocale; children: ReactNode;
}) {
  const profiles = propertyReviewProfilesForMarket(market).filter(profile => {
    const location = reviewLocation(profile.id);
    if (!location) return false;
    if (market === 'jp-tokyo') return location.wardCode === areaKey && (!neighbourhood || matchesTokyoLocality(location.address, neighbourhood));
    return location.areaSlug === areaKey || (areaKey === 'wadi-al-safa-3' && location.areaSlug === 'majan');
  });
  const profile = areaDecisionProfile({ market, areaKey: neighbourhood ? `${areaKey}:${neighbourhood}` : areaKey, name: { ko: name, en: name }, profiles });
  if (!profile) return children;
  return <PropertyDecisionWorkspace profile={profile} analysisScope="area" priceContext={priceContext} locale={locale}>{children}</PropertyDecisionWorkspace>;
}
