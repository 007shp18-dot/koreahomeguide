'use client';

import { usePassportLocation, PassportLink } from '../passport/passport-journey';
import { createDubaiCheckHref } from '../../lib/dubai/check-model';
import type { DubaiAreaSegmentModel } from '../../lib/dubai/route-types';
import { marketText, marketHref, type MarketLocale } from '../../lib/locale/market-localization';
import styles from './dubai-research.module.css';

export function DubaiAreaSelection({ slug, segments, variant, locale = 'en' }: Readonly<{
  locale?: MarketLocale; slug: string; segments: readonly DubaiAreaSegmentModel[]; variant: 'price' | 'check';
}>) {
  const t = (value: string) => marketText(locale, value);
  const current = usePassportLocation();
  const query = new URL(current || '/', 'https://signedprice.invalid').searchParams;
  const segment = segments.find(item => item.housing === query.get('housing')) ?? segments[0]!;
  const requested = query.get('stage') === 'off-plan' ? 'off-plan' : 'ready';
  const stage = segment.sales[requested === 'ready' ? 'ready' : 'offPlan'] !== null ? requested
    : segment.sales.ready !== null ? 'ready' : 'off-plan';
  const sale = segment.sales[stage === 'ready' ? 'ready' : 'offPlan'];
  if (variant === 'price') return <div className={styles.heroMetric}>
    <small>{t(stage === 'ready' ? 'Ready' : 'Off-Plan')} · {t(segment.housing)}{t(' median sale price')}</small>
    <strong>{sale ? `AED ${Math.round(sale.medianPriceAed).toLocaleString('en')}` : t('Not published')}</strong>
    <span>{sale?.n.toLocaleString('en')}{t(' registered sales')}</span>
  </div>;
  return <PassportLink className={styles.primaryAction} href={marketHref(locale, createDubaiCheckHref({
    area: slug, housing: segment.housing, completion: stage, askingPriceAed: null,
    areaSqm: null, annualRentAed: null, returnTo: current || `/ae/dubai/explore/${slug}/`,
  }))}>{t('Check this asking price')}</PassportLink>;
}
