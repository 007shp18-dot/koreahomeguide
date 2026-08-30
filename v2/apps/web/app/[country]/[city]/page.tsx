import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { CapabilityGrid } from '../../../components/capability-grid';
import { MarketHero } from '../../../components/market-hero';
import { MarketLimitations } from '../../../components/market-limitations';
import { SiteFooter } from '../../../components/site-footer';
import { SiteHeader } from '../../../components/site-header';
import {
  buildMarketPageModel,
  marketRouteParams,
} from '../../../lib/route-model';

type MarketPageProps = {
  readonly params: Promise<{
    readonly country: string;
    readonly city: string;
  }>;
};

export const dynamicParams = false;

export function generateStaticParams() {
  return marketRouteParams;
}

export async function generateMetadata({ params }: MarketPageProps): Promise<Metadata> {
  const { country, city } = await params;
  const model = buildMarketPageModel(country, city);

  if (!model) notFound();

  return model.metadata;
}

export default async function MarketOverviewPage({ params }: MarketPageProps) {
  const { country, city } = await params;
  const model = buildMarketPageModel(country, city);

  if (!model) notFound();

  return (
    <div id="top">
      <SiteHeader copy={model.header} />
      <main>
        <MarketHero model={model.hero} />
        <CapabilityGrid model={model.intentGrid} />
        <CapabilityGrid model={model.capabilityGrid} />
        <MarketLimitations model={model.limitations} />
      </main>
      <SiteFooter copy={model.footer} />
    </div>
  );
}
