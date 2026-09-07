
import { sgText } from '../../lib/locale/singapore-copy';
import { marketHref, type MarketLocale } from '../../lib/locale/market-localization';
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

export function SingaporeEntry({ locale = 'en', model, googleMapsBrowserKey = null }: Readonly<{ locale?: MarketLocale; model: SingaporeEntryModel; googleMapsBrowserKey?: string | null }>) {
  void googleMapsBrowserKey;
  if (model.status === 'unavailable') return (
    <SingaporePage locale={locale} currentHref={marketHref(locale, "/sg/")}><section className={styles.unavailable} data-singapore-entry="unavailable" data-product-intro="true">
      <p className={styles.eyebrow}>{sgText(locale, "Singapore · Release gate")}</p><h1>{sgText(locale, model.message)}</h1>
      <p>{sgText(locale, "Private-home transaction evidence is not available in this view yet. Use the market overview for the available sources and coverage.")}</p>
      <div className={styles.actions}><Link href={marketHref(locale, "/trust/")}>{sgText(locale, "Review Global Trust")}</Link><Link href={marketHref(locale, model.correctionHref)}>{sgText(locale, "Review corrections")}</Link></div>
    </section></SingaporePage>
  );
  const rows: readonly MarketOverviewRowModel[] = [
    {
      number: '01', title: sgText(locale, 'Current product depth'),
      description: sgText(locale, `Market intelligence in ${model.currency}.`),
      state: 'limited', stateLabel: sgText(locale, 'limited'), items: [],
    },
    {
      number: '02', title: sgText(locale, 'Available evidence'),
      description: sgText(locale, `${model.transactionLabel} across ${model.projectLabel}.`),
      state: 'available', stateLabel: sgText(locale, 'available'),
      items: [
        { label: sgText(locale, 'URA private residential sale transactions'), description: model.periodLabel },
        { label: sgText(locale, 'Native market segments'), description: sgText(locale, 'CCR, RCR and OCR remain separate.') },
      ],
    },
    {
      number: '03', title: sgText(locale, 'Supported decisions'),
      description: sgText(locale, 'Explore and comparison tools stay inside the verified Singapore evidence boundary.'),
      state: 'limited', stateLabel: sgText(locale, 'limited'),
      items: [
        { label: sgText(locale, 'Explore Singapore'), description: sgText(locale, 'Browse released segments and projects.'), href: marketHref(locale, model.exploreHref) },
        { label: sgText(locale, 'Check an offer'), description: sgText(locale, 'Compare against compatible released evidence.'), href: marketHref(locale, '/sg/singapore/check/') },
      ],
    },
    {
      number: '04', title: sgText(locale, 'Known limitations'),
      description: sgText(locale, 'These limits remain visible until the exact evidence and operating gates pass.'),
      state: 'limited', stateLabel: sgText(locale, 'limited'),
      items: model.evidence.limitations.map((limitation) => ({ label: limitation })),
    },
    {
      number: '05', title: sgText(locale, 'Listings and investment service'),
      description: sgText(locale, 'Active listings, inquiries and personalized investment recommendations are not offered yet.'),
      state: 'not_built', stateLabel: sgText(locale, 'planned'), items: [],
    },
  ];
  const actions: readonly NavigationActionModel[] = [
    { label: sgText(locale, 'Open Singapore Explore'), href: marketHref(locale, model.exploreHref), description: sgText(locale, 'Browse released segments and projects.'), external: false },
    { label: sgText(locale, 'Review Global Trust'), href: marketHref(locale, '/trust/'), description: sgText(locale, 'Read source, rights and publication rules.'), external: false },
  ];
  const transactionCount = Number(model.transactionLabel.match(/[\d,]+/)?.[0]?.replaceAll(',', '') ?? 0);
  const projectCount = Number(model.projectLabel.match(/[\d,]+/)?.[0]?.replaceAll(',', '') ?? 0);
  return (
    <SingaporePage locale={locale} currentHref={marketHref(locale, "/sg/")} unframed>
      <div data-singapore-entry="ready">
        <MarketHero media={<MarketRepresentativePhoto photo={MARKET_PHOTOS.singapore} eager />} model={{
          sectionLabel: sgText(locale, 'Singapore market overview'),
          eyebrow: sgText(locale, 'Singapore market'),
          heading: sgText(locale, 'Singapore Market Overview'),
          description: sgText(locale, `Official private residential sale evidence, separated by native market segment. ${model.transactionLabel} · ${model.periodLabel}.`),
          facts: [],
          layout: 'overview',
          tier: { state: 'limited', label: sgText(locale, 'Market intelligence') },
        }} />
        <MarketOverviewRows
          rows={rows}
          actions={actions}
          actionsLabel={sgText(locale, "Singapore next steps")}
          primaryAction
          summaryItems={[
            { label: sgText(locale, 'Transactions'), value: transactionCount.toLocaleString('en-SG'), detail: sgText(locale, `Private residential sales · ${model.periodLabel}`) },
            { label: sgText(locale, 'Projects'), value: projectCount.toLocaleString('en-SG'), detail: sgText(locale, 'Released URA evidence') },
            { label: sgText(locale, 'Currency'), value: model.currency, detail: sgText(locale, 'Native market currency') },
            { label: sgText(locale, 'Publication'), value: 'Verified', detail: sgText(locale, 'Minimum-sample rules enforced') },
          ]}
        />
      </div>
    </SingaporePage>
  );
}
