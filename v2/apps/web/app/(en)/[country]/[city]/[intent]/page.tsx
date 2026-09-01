import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { DistrictDetailPage } from '@/components/public-market/district-detail-page';
import { IntentDecisionRows } from '@/components/intent-decision-rows';
import { MarketHero } from '@/components/market-hero';
import { SiteFooter } from '@/components/site-footer';
import { SiteHeader } from '@/components/site-header';
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

export const dynamicParams = false;

export function generateStaticParams() {
  return [...publicThirdSegmentRouteParams];
}

export async function generateMetadata({ params }: IntentPageProps): Promise<Metadata> {
  const { country, city, intent } = await params;
  const resolved = resolvePublicThirdSegment(country, city, intent);

  if (resolved === null) notFound();

  return resolved.kind === 'intent'
    ? resolved.model.metadata
    : buildDistrictMetadata(resolved.model);
}

export default async function IntentPage({ params }: IntentPageProps) {
  const { country, city, intent } = await params;
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
