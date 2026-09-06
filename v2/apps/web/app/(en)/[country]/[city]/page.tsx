import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { MarketHero } from '@/components/market-hero';
import { MarketOverviewRows } from '@/components/market-overview-rows';
import { SiteFooter } from '@/components/site-footer';
import { SiteHeader } from '@/components/site-header';
import { PublicBreadcrumbJsonLd } from '@/components/public-json-ld';
import { MARKET_PHOTOS, MarketRepresentativePhoto } from '@/components/market-representative-photo';
import { koreaEvidenceRepositoriesFromEnvironment } from '@/lib/public-market/korea-evidence-repositories.server';
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
  const media = model.marketId === 'kr-seoul'
    ? <MarketRepresentativePhoto photo={MARKET_PHOTOS.seoul} eager />
    : model.marketId === 'ae-dubai'
      ? <MarketRepresentativePhoto photo={MARKET_PHOTOS.dubai} eager />
      : undefined;
  const seoul = model.marketId === 'kr-seoul' ? koreaEvidenceRepositoriesFromEnvironment() : null;
  const sale = seoul?.sale?.getArtifact();
  const rent = seoul?.rent?.getArtifact();
  const count = (value: number | undefined) => value === undefined ? 'Unavailable' : new Intl.NumberFormat('en-US').format(value);
  const summaryItems = seoul === null ? undefined : [
    { label: 'Reported sale contracts', value: count(sale?.stats.eligibleRecordCount), detail: sale?.period ?? 'No released sale dataset' },
    { label: 'Reported rental contracts', value: count(rent?.stats.eligibleRecordCount), detail: rent?.period ?? 'No released rental dataset' },
    { label: 'Sale coverage', value: 'All size bands', detail: 'Same released dataset as Explore; filter by housing type and area.' },
    { label: 'Rental coverage', value: 'Jeonse · Monthly', detail: 'Rent and sale samples have separate periods and are not added together.' },
  ];

  return (
    <div id="top">
      <SiteHeader copy={model.header} />
      <main>
        <MarketHero model={model.hero} media={media} />
        <MarketOverviewRows
          rows={model.overviewRows}
          actions={model.overviewActions}
          actionsLabel={model.limitations.actionsLabel}
          primaryAction={model.productDepth === 'full_product'}
          summaryItems={summaryItems}
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
