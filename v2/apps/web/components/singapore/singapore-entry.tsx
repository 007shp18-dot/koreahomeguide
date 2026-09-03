import Link from 'next/link';

import type { SingaporeEntryModel } from '../../lib/singapore/route-types';
import type { MarketOverviewRowModel, NavigationActionModel } from '../../lib/route-model';
import { MarketHero } from '../market-hero';
import { MarketOverviewRows } from '../market-overview-rows';
import { GoogleBuildingStreetView } from '../maps/google-building-street-view';
import {
  SingaporePage,
  singaporeStyles as styles,
} from './singapore-shell';

export function SingaporeEntry({ model, googleMapsBrowserKey = null }: Readonly<{ model: SingaporeEntryModel; googleMapsBrowserKey?: string | null }>) {
  if (model.status === 'unavailable') return (
    <SingaporePage currentHref="/sg/"><section className={styles.unavailable} data-singapore-entry="unavailable" data-product-intro="true">
      <p className={styles.eyebrow}>Singapore · Release gate</p><h1>{model.message}</h1>
      <p>Direct access remains claim-free until verified private-sale evidence is ready.</p>
      <div className={styles.actions}><Link href="/trust/">Review Global Trust</Link><Link href={model.correctionHref}>Review corrections</Link></div>
    </section></SingaporePage>
  );
  const rows: readonly MarketOverviewRowModel[] = [
    {
      number: '01', title: 'Current product depth',
      description: `Market intelligence in ${model.currency}.`,
      state: 'limited', stateLabel: 'limited', items: [],
    },
    {
      number: '02', title: 'Available evidence',
      description: `${model.transactionLabel} across ${model.projectLabel}.`,
      state: 'available', stateLabel: 'available',
      items: [
        { label: 'URA private residential sale transactions', description: model.periodLabel, state: 'available', stateLabel: 'available' },
        { label: 'Native market segments', description: 'CCR, RCR and OCR remain separate.', state: 'available', stateLabel: 'available' },
      ],
    },
    {
      number: '03', title: 'Supported decisions',
      description: 'Explore and comparison tools stay inside the verified Singapore evidence boundary.',
      state: 'limited', stateLabel: 'limited',
      items: [
        { label: 'Explore Singapore', description: 'Browse released segments and projects.', state: 'available', stateLabel: 'available', href: model.exploreHref },
        { label: 'Check an offer', description: 'Compare against compatible released evidence.', state: 'available', stateLabel: 'available', href: '/sg/singapore/check/' },
      ],
    },
    {
      number: '04', title: 'Known limitations',
      description: 'These limits remain visible until the exact evidence and operating gates pass.',
      state: 'limited', stateLabel: 'limited',
      items: model.evidence.limitations.map((limitation) => ({ label: limitation })),
    },
    {
      number: '05', title: 'Listings and investment service',
      description: 'Active listings, inquiries and personalized investment recommendations are not offered yet.',
      state: 'not_built', stateLabel: 'service preparing', items: [],
    },
    {
      number: '06', title: 'Source and methodology',
      description: `${model.evidence.provider} ${model.evidence.dataset} · ${model.evidence.period}.`,
      state: 'available', stateLabel: 'available',
      items: [
        { label: model.evidence.rightsPolicyId, description: `Publication minimum ${model.evidence.publicationMinimum}.` },
      ],
    },
  ];
  const actions: readonly NavigationActionModel[] = [
    { label: 'Open Singapore Explore', href: model.exploreHref, description: 'Browse released segments and projects.', external: false },
    { label: 'Review Global Trust', href: '/trust/', description: 'Read source, rights and publication rules.', external: false },
  ];
  return (
    <SingaporePage currentHref="/sg/" unframed>
      <div data-singapore-entry="ready">
        <MarketHero media={<GoogleBuildingStreetView
          browserKey={googleMapsBrowserKey}
          buildingName="The Sail @ Marina Bay"
          latitude={1.2807}
          longitude={103.8527}
          mapHref="https://www.google.com/maps/search/?api=1&query=The+Sail+at+Marina+Bay+Singapore"
        />} model={{
          sectionLabel: 'Singapore market overview',
          eyebrow: 'Singapore market',
          heading: 'Singapore Market Overview',
          description: `Official private residential sale evidence, separated by native market segment. ${model.transactionLabel} · ${model.periodLabel}.`,
          facts: [],
          layout: 'overview',
          tier: { state: 'limited', label: 'Market intelligence' },
        }} />
        <MarketOverviewRows
          rows={rows}
          actions={actions}
          actionsLabel="Singapore next steps"
          primaryAction
          summaryItems={[
            { label: 'Transactions', value: model.transactionLabel, detail: model.periodLabel },
            { label: 'Projects', value: model.projectLabel, detail: 'Released URA evidence' },
            { label: 'Currency', value: model.currency, detail: 'Native market currency' },
            { label: 'Publication', value: 'Verified', detail: 'Minimum-sample rules enforced' },
          ]}
        />
      </div>
    </SingaporePage>
  );
}
