'use client';

import type { PublicMarketSummary } from '@signedprice/market-core';
import Link from 'next/link';
import { useId, useState } from 'react';

import type {
  PublicAreaRankingsModel,
  PublicDistrictRankingRow,
} from '../../lib/public-market/area-route-types';
import {
  PUBLIC_MARKET_COPY,
  localizedSeoulHref,
  type ProductLocale,
  type PublicMarketCopy,
} from '../../lib/locale/product-copy';
import { EvidencePeriodStrip } from './evidence-period-strip';
import { PublicSourceBoundary } from './public-source-boundary';
import { buildingDisplayName, neighborhoodDisplayName } from '../../lib/public-market/seoul-display-names';
import styles from './district-rankings.module.css';

type ReadyModel = Extract<PublicAreaRankingsModel, { status: 'ready' }>;
type RankingView = 'median' | 'spread' | 'sample';

const rankingViews = Object.freeze([
  { id: 'median', label: { en: 'Median price', ko: '중앙값' } },
  { id: 'spread', label: { en: 'Price spread', ko: '가격 분포 폭' } },
  { id: 'sample', label: { en: 'Filing volume', ko: '신고 거래량' } },
] as const satisfies readonly {
  id: RankingView;
  label: Readonly<Record<ProductLocale, string>>;
}[]);

const money = new Intl.NumberFormat('ko-KR', {
  style: 'currency', currency: 'KRW', currencyDisplay: 'narrowSymbol', maximumFractionDigits: 0,
});

function selectedRankingCopy(
  transaction: ReadyModel['evidenceSelection']['transaction'],
  locale: ProductLocale,
) {
  const medianTitle = locale === 'ko' ? {
    jeonse: '전세보증금 중앙값',
    monthly: '신고 월세 중앙값',
    sale: '신고 매매가 중앙값',
  }[transaction] : {
    jeonse: 'Median refundable jeonse deposit',
    monthly: 'Median reported monthly rent',
    sale: 'Median reported sale price',
  }[transaction];
  const description = locale === 'ko' ? {
    jeonse: '국토교통부 신고 전세 계약',
    monthly: '국토교통부 신고 월세 계약',
    sale: '국토교통부 신고 매매 계약',
  }[transaction] : {
    jeonse: 'MOLIT reported jeonse contracts',
    monthly: 'MOLIT reported monthly-rent contracts',
    sale: 'MOLIT reported sale contracts',
  }[transaction];
  return locale === 'ko' ? {
    medianTitle,
    description,
    medianEyebrow: '01 / 높은 신고 중앙값',
    medianDefinition: '선택한 거래유형·건물유형 조건에서 신고 중앙값이 높은 순서입니다. 주택 품질이나 미래 가격 순위가 아닙니다.',
    spreadDefinition: '선택한 신고 가격의 중간 절반(P75 − P25) 폭이 넓은 순서입니다. 변동성이나 위험도 순위가 아닙니다.',
    distribution: '신고 가격 분포',
  } as const : {
    medianTitle,
    description,
    medianEyebrow: '01 / Higher reported medians',
    medianDefinition: 'Highest reported median first for the selected transaction and building-type cohort. This is not a quality or future-price ranking.',
    spreadDefinition: 'Widest middle-half (P75 − P25) spread in the selected reported-price cohort. This is dispersion, not volatility or risk.',
    distribution: 'reported price distribution',
  } as const;
}

function DistributionRange({ summary, locale }: Readonly<{
  summary: Extract<PublicMarketSummary, { published: true }>;
  locale: ProductLocale;
}>) {
  const descriptionId = useId();
  const width = summary.p75 - summary.p25;
  const medianPct = width > 0
    ? Math.min(100, Math.max(0, ((summary.med - summary.p25) / width) * 100))
    : 50;
  const labels = locale === 'ko' ? ['하위 25%', '중앙값', '상위 25%'] : ['P25', 'Median', 'P75'];
  return <div className={styles.rangeCard} data-plot-variant="compact" aria-describedby={descriptionId}>
    <div className={styles.rangeTrack} aria-hidden="true"><span style={{ left: `${medianPct}%` }} /></div>
    <dl>{[summary.p25, summary.med, summary.p75].map((value, index) => (
      <div key={labels[index]}><dt>{labels[index]}</dt><dd>{money.format(value)}</dd></div>
    ))}</dl>
    <span id={descriptionId} className={styles.rangeDescription}>
      {locale === 'ko'
        ? `신고 가격의 중간 50% 범위. 최솟값 ${money.format(summary.min)}, 최댓값 ${money.format(summary.max)}.`
        : `Middle 50% of reported prices. Minimum ${money.format(summary.min)}, maximum ${money.format(summary.max)}.`}
    </span>
  </div>;
}

const rankingHousingOptions = Object.freeze([
  ['all', 'All types', '전체 유형'],
  ['apartment', 'Apartment', '아파트'],
  ['officetel', 'Officetel', '오피스텔'],
  ['villa_multifamily', 'Villa / multifamily', '연립·다세대'],
  ['detached', 'Detached / multi-unit', '단독·다가구'],
] as const);

const rankingAreaOptions = Object.freeze([
  ['all', 'All areas', '전체 면적'],
  ['under-40', 'Under 40㎡', '40㎡ 미만'],
  ['40-60', '40–60㎡', '40–60㎡'],
  ['60-85', '60–85㎡', '60–85㎡'],
  ['85-plus', '85㎡ and over', '85㎡ 이상'],
] as const);

function RankingRows({ rows, locale, copy, distributionLabel }: Readonly<{
  rows: readonly PublicDistrictRankingRow[];
  locale: ProductLocale;
  copy: PublicMarketCopy['rankings'];
  distributionLabel?: string;
}>) {
  if (rows.length === 0) return <p className={styles.empty}>{copy.empty}</p>;
  return <ol className={styles.rows} start={rows[0]?.rank}>
    {rows.map((row) => <li key={row.lawdCd} className={`${styles.row} ${row.distribution === null ? '' : styles.rowWithDistribution}`} data-ranking-row={row.slug}>
      <span className={styles.rank} aria-label={`${copy.rank} ${row.rank}`}>{row.rank}</span>
      <Link className={styles.districtLink} href={localizedSeoulHref(row.href, locale)}>
        <strong>{locale === 'ko' ? row.nameKo : row.nameEn}</strong>
        <span lang={locale === 'ko' ? 'en' : 'ko'}>{locale === 'ko' ? row.nameEn : row.nameKo}</span>
      </Link>
      <strong className={styles.value}>{row.valueLabel}</strong>
      {row.distribution === null || row.plotAxis === null ? null : <div
        className={styles.rankingDistribution}
        data-ranking-distribution={row.slug}
        role="group"
        aria-label={`${locale === 'ko' ? row.nameKo : row.nameEn} ${distributionLabel ?? copy.distribution}`}
      ><DistributionRange summary={row.distribution} locale={locale} /></div>}
    </li>)}
  </ol>;
}

function StandardRanking({ id, eyebrow, title, definition, note, rows, locale, copy, distributionLabel }: Readonly<{
  id: string;
  eyebrow: string;
  title: string;
  definition: string;
  note: string;
  rows: readonly PublicDistrictRankingRow[];
  locale: ProductLocale;
  copy: PublicMarketCopy['rankings'];
  distributionLabel?: string;
}>) {
  return <section className={styles.panel} aria-labelledby={id} data-ranking-section={id}>
    <header className={styles.panelHeader}><p>{eyebrow}</p><h2 id={id}>{title}</h2><p>{definition}</p><small>{note}</small></header>
    <RankingRows rows={rows} locale={locale} copy={copy} distributionLabel={distributionLabel} />
  </section>;
}

function MetricSummary({ model, view, locale }: Readonly<{ model: ReadyModel; view: RankingView; locale: ProductLocale }>) {
  const city = model.citySummary.published
    ? view === 'median' ? money.format(model.citySummary.med)
      : view === 'spread' ? money.format(model.citySummary.p75 - model.citySummary.p25)
        : `${model.citySummary.n}`
    : null;
  const missing = locale === 'ko' ? '집계 기준 확인 불가' : 'Source basis unverified';
  return <dl className={styles.metricSummary} aria-label={locale === 'ko' ? '선택 지표 요약' : 'Selected ranking summary'}>
    <div><dt>{locale === 'ko' ? '서울 전체' : 'Seoul overall'}</dt><dd>{city ?? missing}</dd></div>
    <div><dt>{locale === 'ko' ? '게시 구' : 'Published districts'}</dt><dd>{model.pagination.total}</dd></div>
    <div><dt>{locale === 'ko' ? '페이지' : 'Page'}</dt><dd>{model.pagination.page} / {model.pagination.pageCount}</dd></div>
  </dl>;
}

function rankingPageHref(model: ReadyModel, page: number, locale: ProductLocale) {
  const query = new URLSearchParams();
  if (model.evidenceSelection.areaBand !== 'legacy-45-55') {
    query.set('transaction', model.evidenceSelection.transaction);
    query.set('area', model.evidenceSelection.areaBand);
    if (model.evidenceSelection.housingType !== 'all') query.set('propertyType', model.evidenceSelection.housingType);
    if (!['all', 'unknown', 'not-applicable'].includes(model.evidenceSelection.contractGroup)) {
      query.set('contractType', model.evidenceSelection.contractGroup);
    }
  }
  if (page > 1) query.set('page', String(page));
  if (model.buildingRankings.status === 'ready' && model.buildingRankings.pagination.page > 1) {
    query.set('buildingPage', String(model.buildingRankings.pagination.page));
  }
  const suffix = query.size === 0 ? '' : `?${query.toString()}`;
  return localizedSeoulHref(`/kr/seoul/rankings/${suffix}`, locale);
}

function buildingRankingPageHref(model: ReadyModel, page: number, locale: ProductLocale) {
  const query = new URLSearchParams();
  if (model.evidenceSelection.areaBand !== 'legacy-45-55') {
    query.set('transaction', model.evidenceSelection.transaction);
    query.set('area', model.evidenceSelection.areaBand);
    if (model.evidenceSelection.housingType !== 'all') query.set('propertyType', model.evidenceSelection.housingType);
    if (!['all', 'unknown', 'not-applicable'].includes(model.evidenceSelection.contractGroup)) {
      query.set('contractType', model.evidenceSelection.contractGroup);
    }
  }
  if (page > 1) query.set('buildingPage', String(page));
  if (model.pagination.page > 1) query.set('page', String(model.pagination.page));
  const suffix = query.size === 0 ? '' : `?${query.toString()}`;
  return localizedSeoulHref(`/kr/seoul/rankings/${suffix}`, locale);
}

function BuildingRankings({ model, locale }: Readonly<{ model: ReadyModel; locale: ProductLocale }>) {
  const ranking = model.buildingRankings;
  const transactionLabel = locale === 'ko' ? {
    sale: '신고 매매', jeonse: '신고 전세', monthly: '신고 월세',
  }[model.evidenceSelection.transaction] : {
    sale: 'reported sales', jeonse: 'reported jeonse contracts', monthly: 'reported monthly rents',
  }[model.evidenceSelection.transaction];
  return <section className={styles.buildingRanking} aria-labelledby="building-ranking-heading">
    <header className={styles.buildingRankingHeader}>
      <div><p>{locale === 'ko' ? '건물 순위' : 'Building rankings'}</p><h2 id="building-ranking-heading">{locale === 'ko' ? '중앙값이 높은 건물' : 'Buildings with the highest medians'}</h2></div>
      <p>{ranking.status === 'ready'
        ? locale === 'ko'
          ? `${ranking.pagination.total.toLocaleString('ko-KR')}개 건물 · 최소 ${model.source.publicationMinimum}건`
          : `${ranking.pagination.total.toLocaleString('en-US')} ${ranking.pagination.total === 1 ? 'building' : 'buildings'} · minimum ${model.source.publicationMinimum} filings`
        : locale === 'ko' ? '현재 건물 단위 자료를 불러올 수 없습니다.' : 'Building-level evidence is unavailable for this snapshot.'}</p>
    </header>
    {ranking.status === 'unavailable' || ranking.rows.length === 0
      ? <p className={styles.empty}>{ranking.status === 'ready'
        ? locale === 'ko' ? '이 조건에서 공개 기준을 충족한 건물이 없습니다.' : 'No building meets the publication minimum for these filters.'
        : locale === 'ko' ? '아래에서 구별 비교를 확인하세요.' : 'Use the district comparison below.'}</p>
      : <ol className={styles.buildingRows} start={ranking.rows[0]?.rank}>
        {ranking.rows.map((row) => <li key={`${row.districtSlug}/${row.buildingId}`} data-building-ranking-row={row.buildingId}>
          <span className={styles.buildingRank} aria-label={`${locale === 'ko' ? '순위' : 'Rank'} ${row.rank}`}>{row.rank}</span>
          <Link className={styles.buildingLink} href={localizedSeoulHref(row.href, locale)}>
            <strong>{buildingDisplayName(row.officialName, locale)}</strong>
            <span>{neighborhoodDisplayName(row.neighborhoodName, locale)} · {locale === 'ko' ? row.districtNameKo : row.districtNameEn}</span>
          </Link>
          <div className={styles.buildingValue}><strong>{row.medianLabel}</strong><span>{row.sampleCount.toLocaleString(locale === 'ko' ? 'ko-KR' : 'en-US')} {transactionLabel}</span></div>
        </li>)}
      </ol>}
    {ranking.status === 'ready' && ranking.pagination.pageCount > 1 ? <nav className={styles.pagination} aria-label={locale === 'ko' ? '건물 순위 페이지' : 'Building ranking pages'}>
      {ranking.pagination.previousPage === null ? <span /> : <Link href={buildingRankingPageHref(model, ranking.pagination.previousPage, locale)}>{locale === 'ko' ? '이전' : 'Previous'}</Link>}
      <span>{ranking.pagination.page} / {ranking.pagination.pageCount}</span>
      {ranking.pagination.nextPage === null ? <span /> : <Link href={buildingRankingPageHref(model, ranking.pagination.nextPage, locale)}>{locale === 'ko' ? '다음' : 'Next'}</Link>}
    </nav> : null}
  </section>;
}

function ReadyRankings({ model, locale }: Readonly<{ model: ReadyModel; locale: ProductLocale }>) {
  const copy = PUBLIC_MARKET_COPY[locale].rankings;
  const exact = model.evidenceSelection.areaBand !== 'legacy-45-55';
  const selected = selectedRankingCopy(model.evidenceSelection.transaction, locale);
  const [activeView, setActiveView] = useState<RankingView>('median');
  return <section className={styles.rankings} aria-labelledby="district-rankings-heading">
    <div className={styles.frame} data-ranking-frame="contained">
      <header className={styles.hero} data-ranking-method="published-context">
        <div className={styles.heroCopy}>
          <p>{locale === 'ko' ? '신고 건물 가격' : 'Reported building prices'}</p>
          <h1 id="district-rankings-heading">{locale === 'ko' ? '서울 건물 가격 순위' : 'Seoul building price rankings'}</h1>
          <p>{locale === 'ko' ? '선택 조건의 공개 가능한 건물을 신고 중앙값이 높은 순서로 비교합니다.' : 'Compare publishable buildings for these filters, ordered by reported median price.'}</p>
          <p className={styles.exclusion}>{selected.description} · {model.source.period} · {locale === 'ko' ? `최소 ${model.source.publicationMinimum}건` : `minimum ${model.source.publicationMinimum} filings`}</p>
        </div>
      </header>
      {exact ? <form className={styles.filters} action={localizedSeoulHref('/kr/seoul/rankings/', locale)} method="get" data-ranking-filters="exact-cohort">
        <label><span>{locale === 'ko' ? '거래유형' : 'Transaction'}</span><select name="transaction" defaultValue={model.evidenceSelection.transaction}>
          <option value="sale" disabled={!model.transactionAvailability.sale}>{locale === 'ko' ? '매매' : 'Sale'}</option>
          <option value="jeonse" disabled={!model.transactionAvailability.jeonse}>{locale === 'ko' ? '전세' : 'Jeonse'}</option>
          <option value="monthly" disabled={!model.transactionAvailability.monthly}>{locale === 'ko' ? '월세' : 'Monthly rent'}</option>
        </select></label>
        <label><span>{locale === 'ko' ? '면적' : 'Area'}</span><select name="area" defaultValue={model.evidenceSelection.areaBand}>
          {rankingAreaOptions.map(([value, en, ko]) => <option value={value} key={value}>{locale === 'ko' ? ko : en}</option>)}
        </select></label>
        <label><span>{locale === 'ko' ? '건물유형' : 'Building type'}</span><select name="propertyType" defaultValue={model.evidenceSelection.housingType}>
          {rankingHousingOptions.map(([value, en, ko]) => <option value={value} key={value}>{locale === 'ko' ? ko : en}</option>)}
        </select></label>
        {model.evidenceSelection.transaction === 'sale' ? null : <label><span>{locale === 'ko' ? '계약구분' : 'Contract group'}</span><select name="contractType" defaultValue={model.evidenceSelection.contractGroup}>
          <option value="all">{locale === 'ko' ? '전체' : 'All'}</option><option value="new">{locale === 'ko' ? '신규' : 'New'}</option><option value="renewal">{locale === 'ko' ? '갱신' : 'Renewal'}</option>
        </select></label>}
        <button type="submit">{locale === 'ko' ? '적용' : 'Apply'}</button>
      </form> : null}
      <BuildingRankings model={model} locale={locale} />
      <section className={styles.districtComparison} aria-labelledby="district-comparison-heading">
        <header className={styles.districtComparisonHeader}><p>{locale === 'ko' ? '지역 비교' : 'Area context'}</p><h2 id="district-comparison-heading">{locale === 'ko' ? '구별 가격과 신고 건수' : 'District prices and filing volume'}</h2></header>
        <div className={styles.viewWorkspace}>
        <div className={styles.viewTabs} role="tablist" aria-label={locale === 'ko' ? '순위 지표' : 'Ranking measure'}>
          {rankingViews.map((view) => <button type="button" role="tab" id={`ranking-tab-${view.id}`} aria-controls={`ranking-view-${view.id}`} aria-selected={activeView === view.id} tabIndex={activeView === view.id ? 0 : -1} onClick={() => setActiveView(view.id)} key={view.id}>{view.label[locale]}</button>)}
        </div>
        <MetricSummary model={model} view={activeView} locale={locale} />
        <div className={styles.grid}>
          <div className={styles.viewPanel} role="tabpanel" id="ranking-view-median" aria-labelledby="ranking-tab-median" hidden={activeView !== 'median'}>
            <StandardRanking id="ranking-median-heading" eyebrow={selected.medianEyebrow} title={selected.medianTitle} definition={selected.medianDefinition} note={copy.lowerNote} rows={model.median} locale={locale} copy={copy} />
          </div>
          <div className={styles.viewPanel} role="tabpanel" id="ranking-view-spread" aria-labelledby="ranking-tab-spread" hidden={activeView !== 'spread'}>
            <StandardRanking id="ranking-spread-heading" eyebrow={copy.spreadEyebrow} title={copy.spreadTitle} definition={selected.spreadDefinition} note={copy.spreadNote} rows={model.spread} locale={locale} copy={copy} distributionLabel={selected.distribution} />
          </div>
          <div className={styles.viewPanel} role="tabpanel" id="ranking-view-sample" aria-labelledby="ranking-tab-sample" hidden={activeView !== 'sample'}>
            <StandardRanking id="ranking-sample-heading" eyebrow={copy.sampleEyebrow} title={copy.sampleTitle} definition={copy.sampleDefinition} note={copy.sampleNote} rows={model.sample} locale={locale} copy={copy} />
          </div>
        </div>
        {model.pagination.pageCount > 1 ? <nav className={styles.pagination} aria-label={locale === 'ko' ? '순위 페이지' : 'Ranking pages'}>
          {model.pagination.previousPage === null ? <span /> : <Link href={rankingPageHref(model, model.pagination.previousPage, locale)}>{locale === 'ko' ? '이전' : 'Previous'}</Link>}
          <span>{model.pagination.page} / {model.pagination.pageCount}</span>
          {model.pagination.nextPage === null ? <span /> : <Link href={rankingPageHref(model, model.pagination.nextPage, locale)}>{locale === 'ko' ? '다음' : 'Next'}</Link>}
        </nav> : null}
        </div>
      </section>
      <EvidencePeriodStrip model={model.period} label={copy.periodLabel} locale={locale} />
      <aside className={styles.limit} aria-label={copy.limitationAria}><p>{copy.limitation}</p></aside>
      <PublicSourceBoundary model={model.source} locale={locale} transaction={exact ? model.evidenceSelection.transaction : undefined} compact />
    </div>
  </section>;
}

function UnavailableRankings({ model, locale }: Readonly<{
  model: Extract<PublicAreaRankingsModel, { status: 'unavailable' }>;
  locale: ProductLocale;
}>) {
  const copy = PUBLIC_MARKET_COPY[locale].rankings;
  return <section className={styles.rankings} aria-labelledby="rankings-unavailable-heading">
    <header className={styles.hero}><p>{copy.unavailableEyebrow}</p><h1 id="rankings-unavailable-heading">{locale === 'ko' ? '서울 건물 가격 순위' : 'Seoul building price rankings'}</h1><p>{locale === 'ko' ? copy.unavailableMessage : model.message}</p><p>{copy.unavailableReason}</p></header>
    <div className={styles.unavailable}><p>{copy.unavailableReason}</p><Link href={localizedSeoulHref('/kr/seoul/explore/', locale)}>{copy.unavailableAction}</Link></div>
    <PublicSourceBoundary model={model.source} locale={locale} compact />
  </section>;
}

export function DistrictRankings({ model, locale = 'en' }: Readonly<{ model: PublicAreaRankingsModel; locale?: ProductLocale }>) {
  return model.status === 'ready' ? <ReadyRankings model={model} locale={locale} /> : <UnavailableRankings model={model} locale={locale} />;
}
