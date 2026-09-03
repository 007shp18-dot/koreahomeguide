import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { MarketHero } from '@/components/market-hero';
import { MarketOverviewRows } from '@/components/market-overview-rows';
import { SiteFooter } from '@/components/site-footer';
import { SiteHeader } from '@/components/site-header';
import { PublicBreadcrumbJsonLd } from '@/components/public-json-ld';
import {
  buildMarketPageModel,
  publicMarketRouteParams,
} from '@/lib/route-model';

type MarketPageProps = {
  readonly params: Promise<{
    readonly country: string;
    readonly city: string;
  }>;
};

export const dynamicParams = false;

export function generateStaticParams() {
  return publicMarketRouteParams;
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
        <MarketOverviewRows
          rows={model.overviewRows}
          actions={model.overviewActions}
          actionsLabel={model.limitations.actionsLabel}
          primaryAction={model.productDepth === 'full_product'}
        />
      </main>
      <PublicBreadcrumbJsonLd items={[
        { name: 'Home', path: '/' },
        { name: model.hero.heading, path: `/${country}/${city}/` },
      ]} />
      <SiteFooter copy={model.footer} />
    </div>
  );
}
