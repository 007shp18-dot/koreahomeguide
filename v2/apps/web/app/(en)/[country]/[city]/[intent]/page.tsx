import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { DistrictDetailPage } from '@/components/public-market/district-detail-page';
import { IntentDecisionRows } from '@/components/intent-decision-rows';
import { MarketHero } from '@/components/market-hero';
import { SiteFooter } from '@/components/site-footer';
import { SiteHeader } from '@/components/site-header';
import { MarketFeaturePage, type MarketFeature } from '@/components/market-ui/market-feature-page';
import { buildDistrictMetadata } from '@/lib/public-market/district-metadata';
import {
  publicThirdSegmentRouteParams,
  resolvePublicThirdSegment,
} from '@/lib/public-market/public-third-segment.server';

type IntentPageProps = {
  readonly params: Promise<{
    readonly country: string;
    readonly city: string;
    readonly intent: string;
  }>;
};

export const dynamicParams = true;

function marketFeature(country: string, city: string, feature: string) {
  const isFeature = ['explore', 'check', 'rankings', 'news', 'community', 'guide'].includes(feature);
  if (!isFeature) return null;
  if (country === 'sg' && city === 'singapore') return { city: 'Singapore' as const, code: 'SG' as const, overviewHref: '/sg/' };
  if (country === 'ae' && city === 'dubai') return { city: 'Dubai' as const, code: 'AE' as const, overviewHref: '/ae/dubai/' };
  return null;
}

export function generateStaticParams() {
  return [...publicThirdSegmentRouteParams];
}

export async function generateMetadata({ params }: IntentPageProps): Promise<Metadata> {
  const { country, city, intent } = await params;
  const featureMarket = marketFeature(country, city, intent);
  if (featureMarket !== null) return {
    title: `${featureMarket.city} ${intent} | signedprice`,
    description: `${featureMarket.city} ${intent} uses the shared SignedPrice market structure and explicit availability states.`,
    robots: { index: false, follow: true },
  };
  const resolved = resolvePublicThirdSegment(country, city, intent);

  if (resolved === null) notFound();

  return resolved.kind === 'intent'
    ? resolved.model.metadata
    : buildDistrictMetadata(resolved.model);
}

export default async function IntentPage({ params }: IntentPageProps) {
  const { country, city, intent } = await params;
  const featureMarket = marketFeature(country, city, intent);
  if (featureMarket !== null) return <MarketFeaturePage
    {...featureMarket}
    feature={intent as MarketFeature}
    href={`/${country}/${city}/${intent}/`}
  />;
  const resolved = resolvePublicThirdSegment(country, city, intent);

  if (resolved === null) notFound();

  if (resolved.kind === 'district') {
    return <DistrictDetailPage model={resolved.model} />;
  }
  const { model } = resolved;

  return (
    <div id="top">
      <SiteHeader copy={model.header} />
      <main>
        <MarketHero model={model.hero} />
        <IntentDecisionRows
          rows={model.decisionRows}
          actions={model.overviewActions}
          actionsLabel={model.limitations.actionsLabel}
        />
      </main>
      <SiteFooter copy={model.footer} />
    </div>
  );
}
