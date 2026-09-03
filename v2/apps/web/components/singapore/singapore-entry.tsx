import Link from 'next/link';

import type { SingaporeEntryModel } from '../../lib/singapore/route-types';
import type { MarketOverviewRowModel, NavigationActionModel } from '../../lib/route-model';
import { MarketHero } from '../market-hero';
import { MarketOverviewRows } from '../market-overview-rows';
import { MARKET_PHOTOS, MarketRepresentativePhoto } from '../market-representative-photo';
import {
  SingaporePage,
  singaporeStyles as styles,
} from './singapore-shell';

export function SingaporeEntry({ model, googleMapsBrowserKey = null }: Readonly<{ model: SingaporeEntryModel; googleMapsBrowserKey?: string | null }>) {
  void googleMapsBrowserKey;
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
        { label: 'URA private residential sale transactions', description: model.periodLabel },
        { label: 'Native market segments', description: 'CCR, RCR and OCR remain separate.' },
      ],
    },
    {
      number: '03', title: 'Supported decisions',
      description: 'Explore and comparison tools stay inside the verified Singapore evidence boundary.',
      state: 'limited', stateLabel: 'limited',
      items: [
        { label: 'Explore Singapore', description: 'Browse released segments and projects.', href: model.exploreHref },
        { label: 'Check an offer', description: 'Compare against compatible released evidence.', href: '/sg/singapore/check/' },
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
      state: 'not_built', stateLabel: 'planned', items: [],
    },
  ];
  const actions: readonly NavigationActionModel[] = [
    { label: 'Open Singapore Explore', href: model.exploreHref, description: 'Browse released segments and projects.', external: false },
    { label: 'Review Global Trust', href: '/trust/', description: 'Read source, rights and publication rules.', external: false },
  ];
  const transactionCount = Number(model.transactionLabel.match(/[\d,]+/)?.[0]?.replaceAll(',', '') ?? 0);
  const projectCount = Number(model.projectLabel.match(/[\d,]+/)?.[0]?.replaceAll(',', '') ?? 0);
  return (
    <SingaporePage currentHref="/sg/" unframed>
      <div data-singapore-entry="ready">
        <MarketHero media={<MarketRepresentativePhoto photo={MARKET_PHOTOS.singapore} eager />} model={{
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
            { label: 'Transactions', value: transactionCount.toLocaleString('en-SG'), detail: `Private residential sales · ${model.periodLabel}` },
            { label: 'Projects', value: projectCount.toLocaleString('en-SG'), detail: 'Released URA evidence' },
            { label: 'Currency', value: model.currency, detail: 'Native market currency' },
            { label: 'Publication', value: 'Verified', detail: 'Minimum-sample rules enforced' },
          ]}
        />
      </div>
    </SingaporePage>
  );
}
