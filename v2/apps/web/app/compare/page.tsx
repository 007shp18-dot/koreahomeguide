import { ComparisonMatrix } from '../../components/comparison-matrix';
import { MarketHero } from '../../components/market-hero';
import { MarketLimitations } from '../../components/market-limitations';
import { SiteFooter } from '../../components/site-footer';
import { SiteHeader } from '../../components/site-header';
import { buildComparisonPageModel } from '../../lib/route-model';
import type { Metadata } from 'next';

export const metadata: Metadata = buildComparisonPageModel().metadata;

export default function ComparePage() {
  const model = buildComparisonPageModel();

  return (
    <div id="top">
      <SiteHeader copy={model.header} />
      <main>
        <MarketHero model={model.hero} />
        <ComparisonMatrix model={model.matrix} />
        <MarketLimitations model={model.limitations} />
      </main>
      <SiteFooter copy={model.footer} />
    </div>
  );
}
