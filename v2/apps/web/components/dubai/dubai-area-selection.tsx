'use client';
import { localizedMarketCopy } from '../../lib/locale/market-localization';


import { usePassportLocation, PassportLink } from '../passport/passport-journey';
import { createDubaiCheckHref } from '../../lib/dubai/check-model';
import type { DubaiAreaModel, DubaiAreaSegmentModel } from '../../lib/dubai/route-types';
import { marketText, marketHref, type MarketLocale } from '../../lib/locale/market-localization';
import { MarketSummary } from '../market-ui/market-summary';
import styles from './dubai-research.module.css';
import { RecordPlaceVisit } from '../discovery/recent-places';

function selectedSale(segments: readonly DubaiAreaSegmentModel[], current: string) {
  const query = new URL(current || '/', 'https://signedprice.invalid').searchParams;
  const segment = segments.find(item => item.housing === query.get('housing')) ?? segments[0]!;
  const requested = query.get('stage') === 'off-plan' ? 'off-plan' : 'ready';
  const stage = segment.sales[requested === 'ready' ? 'ready' : 'offPlan'] !== null ? requested
    : segment.sales.ready !== null ? 'ready' : 'off-plan';
  const sale = segment.sales[stage === 'ready' ? 'ready' : 'offPlan'];
  return { segment, stage, sale } as const;
}

export function DubaiAreaSelection({ slug, segments, variant, locale = 'en' }: Readonly<{
  locale?: MarketLocale; slug: string; segments: readonly DubaiAreaSegmentModel[]; variant: 'price' | 'check';
}>) {
  const t = (value: string) => marketText(locale, value);
  const current = usePassportLocation();
  const { segment, stage, sale } = selectedSale(segments, current);
  if (variant === 'price') return <div className={styles.heroMetric}>
    <small>{t(stage === 'ready' ? 'Ready' : 'Off-Plan')} · {t(segment.housing)}{t(' median sale price')}</small>
    <strong>{sale ? `AED ${Math.round(sale.medianPriceAed).toLocaleString('en')}` : t('Not published')}</strong>
    <span>{sale?.n.toLocaleString('en')}{t(' registered sales')}</span>
  </div>;
  return <PassportLink className={styles.primaryAction} href={marketHref(locale, createDubaiCheckHref({
    area: slug, housing: segment.housing, completion: stage, askingPriceAed: null,
    areaSqm: null, annualRentAed: null, returnTo: current || `/ae/dubai/explore/${slug}/`,
  }))}>{t('Compare an asking price')}</PassportLink>;
}

export function DubaiAreaSummary({ model, locale = 'en' }: Readonly<{ model: DubaiAreaModel; locale?: MarketLocale }>) {
  const current = usePassportLocation();
  const { segment, stage, sale } = selectedSale(model.segments, current);
  const t = (value: string) => marketText(locale, value);
  const money = (value: number) => `AED\u00a0${Math.round(value).toLocaleString('en')}`;
  const period = `${model.context.comparisonPeriod.from}–${model.context.comparisonPeriod.to}`;
  const housing = t(segment.housing === 'apartment' ? 'Apartment' : 'Villa');
  const stageLabel = t(stage === 'ready' ? 'Ready' : 'Off-Plan');
  return <><RecordPlaceVisit place={{ market: 'dubai', key: model.identity.slug, name: t(model.identity.name), href: `/ae/dubai/explore/${model.identity.slug}/?housing=${segment.housing}&stage=${stage}` }} /><MarketSummary locale={locale} kind="area"
    title={t(model.identity.name)}
    location={localizedMarketCopy(locale, "Area-level statistics, not a price for a specific home.", "지역별 통계이며 개별 주택의 가격이 아닙니다.")}
    context={t('Dubai · Area evidence')}
    metric={{
      label: `${housing} · ${stageLabel} · ${t('median sale price')}`,
      value: sale ? money(sale.medianPriceAed) : t('Not published'),
      note: `${t('Comparison window')} · ${period}`,
    }}
    facts={[
      ...(sale ? [
        { label: t('Sample'), value: `${sale.n.toLocaleString('en')}${t(' registered sales')}` },
        { label: t('Median AED/m²'), value: `${money(sale.medianPricePerSqmAed)}/m²` },
      ] : []),
      { label: localizedMarketCopy(locale, "As of", "자료 기준일"), value: model.context.asOfDate },
    ]}
    actions={<DubaiAreaSelection locale={locale} slug={model.identity.slug} segments={model.segments} variant="check" />}
  /></>;
}
