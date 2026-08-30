import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { IntentDecisionRows } from '../../../../components/intent-decision-rows';
import { MarketHero } from '../../../../components/market-hero';
import { SiteFooter } from '../../../../components/site-footer';
import { SiteHeader } from '../../../../components/site-header';
import {
  buildIntentPageModel,
  intentRouteParams,
} from '../../../../lib/route-model';

type IntentPageProps = {
  readonly params: Promise<{
    readonly country: string;
    readonly city: string;
    readonly intent: string;
  }>;
};

export const dynamicParams = false;

export function generateStaticParams() {
  return intentRouteParams;
}

export async function generateMetadata({ params }: IntentPageProps): Promise<Metadata> {
  const { country, city, intent } = await params;
  const model = buildIntentPageModel(country, city, intent);

  if (!model) notFound();

  return model.metadata;
}

export default async function IntentPage({ params }: IntentPageProps) {
  const { country, city, intent } = await params;
  const model = buildIntentPageModel(country, city, intent);

  if (!model) notFound();

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
