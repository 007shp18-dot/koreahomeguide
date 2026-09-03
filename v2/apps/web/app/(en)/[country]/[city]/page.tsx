import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { MarketHero } from '@/components/market-hero';
import { MarketOverviewRows } from '@/components/market-overview-rows';
import { SiteFooter } from '@/components/site-footer';
import { SiteHeader } from '@/components/site-header';
import { PublicBreadcrumbJsonLd } from '@/components/public-json-ld';
import { NaverBuildingStreetView } from '@/components/maps/naver-building-street-view';
import { GoogleBuildingStreetView } from '@/components/maps/google-building-street-view';
import { GooglePlacePhoto } from '@/components/maps/google-place-photo';
import { buildHomeFeaturedBuildings } from '@/lib/public-market/home-featured-buildings.server';
import { buildSeoulLiveModel } from '@/lib/public-market/seoul-live-model.server';
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
  const featured = model.marketId === 'kr-seoul' ? buildHomeFeaturedBuildings()[0] : undefined;
  const googleMapsBrowserKey = process.env.GOOGLE_MAPS_API_KEY?.trim() || null;
  const media = model.marketId === 'ae-dubai' ? (
    <GooglePlacePhoto
      browserKey={googleMapsBrowserKey}
      buildingName="Burj Khalifa"
      address="Downtown Dubai, UAE"
      fallback={<GoogleBuildingStreetView
        browserKey={googleMapsBrowserKey}
        buildingName="Burj Khalifa"
        latitude={25.1972}
        longitude={55.2744}
        mapHref="https://www.google.com/maps/search/?api=1&query=Burj+Khalifa+Dubai"
      />}
    />
  ) : featured === undefined ? undefined : (
    <NaverBuildingStreetView
      clientId={process.env.NAVER_MAP_CLIENT_ID?.trim() || null}
      buildingName={featured.name}
      latitude={featured.latitude}
      longitude={featured.longitude}
      addressQuery={featured.addressQuery}
      mapHref={featured.href}
    />
  );
  const seoul = model.marketId === 'kr-seoul' ? buildSeoulLiveModel() : null;
  const summaryItems = seoul?.status === 'ready' ? [
    { label: 'Eligible contracts', value: new Intl.NumberFormat('en-US').format(seoul.totalCount), detail: seoul.period },
    { label: 'New contracts', value: new Intl.NumberFormat('en-US').format(seoul.newCount), detail: 'Official reported evidence' },
    { label: 'Renewal contracts', value: new Intl.NumberFormat('en-US').format(seoul.renewalCount), detail: 'Kept separate from new contracts' },
    { label: 'Unclassified', value: new Intl.NumberFormat('en-US').format(seoul.unknownCount), detail: 'Shown, never silently reassigned' },
  ] : undefined;

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
