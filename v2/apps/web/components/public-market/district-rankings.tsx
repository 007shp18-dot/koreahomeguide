'use client';

import { useState } from 'react';
import Link from 'next/link';

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
import styles from './district-rankings.module.css';
import { BoxPlot } from './box-plot';
import { EvidencePeriodStrip } from './evidence-period-strip';
import { PublicSourceBoundary } from './public-source-boundary';

type ReadyModel = Extract<PublicAreaRankingsModel, { status: 'ready' }>;
type RankingView = 'median' | 'change' | 'spread' | 'sample';

const rankingViews = Object.freeze([
  { id: 'median', label: { en: 'Median', ko: '중앙값' } },
  { id: 'change', label: { en: '3-month change', ko: '3개월 변화' } },
  { id: 'spread', label: { en: 'Spread', ko: '분포 폭' } },
  { id: 'sample', label: { en: 'Sample', ko: '표본' } },
] as const satisfies readonly {
  id: RankingView;
  label: Readonly<Record<ProductLocale, string>>;
}[]);

const money = new Intl.NumberFormat('ko-KR', {
  style: 'currency', currency: 'KRW', currencyDisplay: 'narrowSymbol', maximumFractionDigits: 0,
});

const rankingAreaOptions = Object.freeze([
  ['all', 'All areas', '전체 면적'],
  ['under-40', 'Under 40㎡', '40㎡ 미만'],
  ['40-60', '40–60㎡', '40–60㎡'],
  ['60-85', '60–85㎡', '60–85㎡'],
  ['85-plus', '85㎡ and above', '85㎡ 이상'],
] as const);

const rankingHousingOptions = Object.freeze([
  ['all', 'All types', '전체 유형'],
  ['apartment', 'Apartment', '아파트'],
  ['officetel', 'Officetel', '오피스텔'],
  ['villa_multifamily', 'Villa / multifamily', '연립·다세대'],
  ['detached', 'Detached / multi-unit', '단독·다가구'],
] as const);

function selectedRankingCopy(
  transaction: ReadyModel['evidenceSelection']['transaction'],
  locale: ProductLocale,
) {
  if (locale === 'ko') {
    return {
      medianTitle: {
        jeonse: '전세보증금 중앙값',
        monthly: '신고 월세 중앙값',
        sale: '신고 매매가 중앙값',
      }[transaction],
      description: {
        jeonse: '국토교통부 신고 전세 계약',
        monthly: '국토교통부 신고 월세 계약',
        sale: '국토교통부 신고 매매 계약',
      }[transaction],
      lowerEyebrow: '01 / 낮은 신고 중앙값',
      lowerDefinition: '선택한 거래유형·면적·건물유형 조건에서 신고 중앙값이 낮은 순서입니다. 주거비 부담이나 주택 품질 순위가 아닙니다.',
      spreadDefinition: '선택한 신고 가격의 중간 절반(P75 − P25) 폭이 넓은 순서입니다. 변동성이나 위험도 순위가 아닙니다.',
      distribution: '신고 가격 분포',
    } as const;
  }
  return {
    medianTitle: {
      jeonse: 'Median refundable jeonse deposit',
      monthly: 'Median reported monthly rent',
      sale: 'Median reported sale price',
    }[transaction],
    description: {
      jeonse: 'MOLIT reported jeonse contracts',
      monthly: 'MOLIT reported monthly-rent contracts',
      sale: 'MOLIT reported sale contracts',
    }[transaction],
    lowerEyebrow: '01 / Lower reported medians',
    lowerDefinition: 'Lowest reported median first for the selected transaction, filed-area and building-type cohort. This is not an affordability or quality ranking.',
    spreadDefinition: 'Widest middle-half (P75 − P25) spread in the selected reported-price cohort. This is dispersion, not volatility or risk.',
    distribution: 'reported price distribution',
  } as const;
}

function RankingRows({
  rows,
  locale,
  copy,
  distributionLabel,
}: Readonly<{
  rows: readonly PublicDistrictRankingRow[];
  locale: ProductLocale;
  copy: PublicMarketCopy['rankings'];
  distributionLabel?: string;
}>) {
  if (rows.length === 0) {
    return <p className={styles.empty}>{copy.empty}</p>;
  }
  return (
    <ol className={styles.rows}>
      {rows.map((row) => (
        <li
          key={row.slug}
          className={`${styles.row} ${row.distribution === null ? '' : styles.rowWithDistribution}`}
          data-ranking-row={row.slug}
        >
          <span className={styles.rank} aria-label={`${copy.rank} ${row.rank}`}>{row.rank}</span>
          <Link className={styles.districtLink} href={row.href}>
            <strong>{locale === 'ko' ? row.nameKo : row.nameEn}</strong>
            <span lang={locale === 'ko' ? 'en' : 'ko'}>
              {locale === 'ko' ? row.nameEn : row.nameKo}
            </span>
          </Link>
          <strong className={styles.value}>{row.valueLabel}</strong>
          {row.distribution === null || row.plotAxis === null ? null : (
            <div
              className={styles.rankingDistribution}
              data-ranking-distribution={row.slug}
              role="group"
              aria-label={`${locale === 'ko' ? row.nameKo : row.nameEn} ${distributionLabel ?? copy.distribution}`}
            >
              <BoxPlot
                summary={row.distribution}
                axis={row.plotAxis}
                formatValue={(value) => money.format(value)}
                variant="compact"
                locale={locale}
              />
            </div>
          )}
        </li>
      ))}
    </ol>
  );
}

function StandardRanking({
  id,
  eyebrow,
  title,
  definition,
  note,
  rows,
  locale,
  copy,
  distributionLabel,
}: Readonly<{
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
  return (
    <section className={styles.panel} aria-labelledby={id} data-ranking-section={id}>
      <header className={styles.panelHeader}>
        <p>{eyebrow}</p>
        <h2 id={id}>{title}</h2>
        <p>{definition}</p>
        <small>{note}</small>
      </header>
      <RankingRows
        rows={rows}
        locale={locale}
        copy={copy}
        distributionLabel={distributionLabel}
      />
    </section>
  );
}

function ChangeRanking({
  model,
  locale,
  copy,
}: Readonly<{
  model: ReadyModel;
  locale: ProductLocale;
  copy: PublicMarketCopy['rankings'];
}>) {
  return (
    <section
      className={styles.panel}
      aria-labelledby="ranking-change-heading"
      data-ranking-section="change"
    >
      <header className={styles.panelHeader}>
        <p>{copy.changeEyebrow}</p>
        <h2 id="ranking-change-heading">
          {locale === 'ko' ? copy.changeTitle : model.changeInterpretation.title}
        </h2>
        <p>{locale === 'ko' ? copy.changeDefinition : model.changeInterpretation.definition}</p>
        <small>
          {locale === 'ko' ? copy.changeNote : model.changeInterpretation.note}{' '}
          {model.changeExcludedDistrictCount}{locale === 'en' ? ' ' : ''}{copy.excluded}
        </small>
        {model.change.length === 0 || model.hasNegativeChange ? null : (
          <strong className={styles.noFall}>{copy.noFall}</strong>
        )}
      </header>
      {model.change.length === 0 ? (
        <p className={styles.empty}>{copy.empty}</p>
      ) : (
        <>
          <div className={styles.axisLabels} aria-hidden="true">
            <span>{model.changeAxisLabel.minimum}</span>
            <span>0.0%</span>
            <span>{model.changeAxisLabel.maximum}</span>
          </div>
          <ol className={styles.changeRows}>
            {model.change.map((row) => {
              if (row.bar === null) throw new TypeError('Change ranking requires bar geometry.');
              return (
                <li key={row.slug} className={styles.changeRow} data-ranking-row={row.slug}>
                  <span className={styles.rank} aria-label={`${copy.rank} ${row.rank}`}>{row.rank}</span>
                  <Link className={styles.districtLink} href={row.href}>
                    <strong>{locale === 'ko' ? row.nameKo : row.nameEn}</strong>
                    <span lang={locale === 'ko' ? 'en' : 'ko'}>
                      {locale === 'ko' ? row.nameEn : row.nameKo}
                    </span>
                  </Link>
                  <div className={styles.signedTrack} aria-hidden="true">
                    <span className={styles.centre} data-change-centre="true" />
                    <span
                      className={
                        row.bar.direction === 'positive'
                          ? styles.positive
                          : row.bar.direction === 'negative'
                            ? styles.negative
                            : styles.zero
                      }
                      data-change-direction={row.bar.direction}
                      style={{
                        left: `${row.bar.startPct}%`,
                        width: `${row.bar.extentPct}%`,
                      }}
                    />
                  </div>
                  <strong className={styles.value}>{row.valueLabel}</strong>
                </li>
              );
            })}
          </ol>
        </>
      )}
    </section>
  );
}

function ReadyRankings({
  model,
  locale,
}: Readonly<{ model: ReadyModel; locale: ProductLocale }>) {
  const marketCopy = PUBLIC_MARKET_COPY[locale];
  const copy = marketCopy.rankings;
  const exact = model.evidenceSelection.areaBand !== 'legacy-45-55';
  const selectedCopy = selectedRankingCopy(model.evidenceSelection.transaction, locale);
  const [activeView, setActiveView] = useState<RankingView>('median');
  return (
    <section className={styles.rankings} aria-labelledby="district-rankings-heading">
      <div className={styles.frame} data-ranking-frame="contained">
        <header className={styles.hero}>
          <div className={styles.heroCopy}>
            <p>{copy.eyebrow}</p>
            <h1 id="district-rankings-heading">{copy.heading}</h1>
            <p>
              {exact
                ? `${selectedCopy.description} · ${model.source.band} · ${model.source.period}.`
                : `${copy.descriptionLead} ${model.source.period}.`}{' '}
              {copy.descriptionMiddle}{' '}{model.source.publicationMinimum}
              {locale === 'en' ? ' ' : ''}{copy.descriptionTail}
            </p>
            <p className={styles.exclusion}>
              {model.withheldDistrictCount}{locale === 'en' ? ' ' : ''}{copy.exclusionTail}
            </p>
          </div>
          <dl className={styles.heroMeta} data-ranking-method="published-context">
            <div><dt>{locale === 'ko' ? '기간' : 'Period'}</dt><dd>{model.source.period}</dd></div>
            <div><dt>{locale === 'ko' ? '게시 구' : 'Published districts'}</dt><dd>{25 - model.withheldDistrictCount} / 25</dd></div>
            <div><dt>{locale === 'ko' ? '최소 표본' : 'Minimum sample'}</dt><dd>{model.source.publicationMinimum}</dd></div>
          </dl>
        </header>

        {exact ? (
          <form
            className={styles.filters}
            action={localizedSeoulHref('/kr/seoul/rankings/', locale)}
            method="get"
            data-ranking-filters="exact-cohort"
          >
            <label>
              <span>{locale === 'ko' ? '거래유형' : 'Transaction'}</span>
              <select name="transaction" defaultValue={model.evidenceSelection.transaction}>
                <option value="sale" disabled={!model.transactionAvailability.sale}>{locale === 'ko' ? '매매' : 'Sale'}</option>
                <option value="jeonse" disabled={!model.transactionAvailability.jeonse}>{locale === 'ko' ? '전세' : 'Jeonse'}</option>
                <option value="monthly" disabled={!model.transactionAvailability.monthly}>{locale === 'ko' ? '월세' : 'Monthly rent'}</option>
              </select>
            </label>
            <label>
              <span>{locale === 'ko' ? '면적' : 'Area'}</span>
              <select name="area" defaultValue={model.evidenceSelection.areaBand}>
                {rankingAreaOptions.map(([value, en, ko]) => (
                  <option value={value} key={value}>{locale === 'ko' ? ko : en}</option>
                ))}
              </select>
            </label>
            <label>
              <span>{locale === 'ko' ? '건물유형' : 'Building type'}</span>
              <select name="propertyType" defaultValue={model.evidenceSelection.housingType}>
                {rankingHousingOptions.map(([value, en, ko]) => (
                  <option value={value} key={value}>{locale === 'ko' ? ko : en}</option>
                ))}
              </select>
            </label>
            {model.evidenceSelection.transaction === 'sale' ? null : (
              <label>
                <span>{locale === 'ko' ? '계약구분' : 'Contract group'}</span>
                <select name="contractType" defaultValue={model.evidenceSelection.contractGroup}>
                  <option value="all">{locale === 'ko' ? '전체' : 'All'}</option>
                  <option value="new">{locale === 'ko' ? '신규' : 'New'}</option>
                  <option value="renewal">{locale === 'ko' ? '갱신' : 'Renewal'}</option>
                </select>
              </label>
            )}
            <button type="submit">{locale === 'ko' ? '적용' : 'Apply'}</button>
          </form>
        ) : null}

        <EvidencePeriodStrip
          model={model.period}
          label={copy.periodLabel}
          locale={locale}
        />

        <div className={styles.viewWorkspace}>
        <div className={styles.viewTabs} role="tablist" aria-label="Ranking measure">
          {rankingViews.map((view) => (
            <button
              type="button"
              role="tab"
              id={`ranking-tab-${view.id}`}
              aria-controls={`ranking-view-${view.id}`}
              aria-selected={activeView === view.id}
              tabIndex={activeView === view.id ? 0 : -1}
              onClick={() => setActiveView(view.id)}
              key={view.id}
            >
              {view.label[locale]}
            </button>
          ))}
        </div>
        <div className={styles.grid}>
          <div
            className={styles.viewPanel}
            role="tabpanel"
            id="ranking-view-median"
            aria-labelledby="ranking-tab-median"
            hidden={activeView !== 'median'}
          >
            <StandardRanking
              id="ranking-cheapest-heading"
              eyebrow={exact ? selectedCopy.lowerEyebrow : copy.lowerEyebrow}
              title={exact ? selectedCopy.medianTitle : copy.lowerTitle}
              definition={exact ? selectedCopy.lowerDefinition : copy.lowerDefinition}
              note={copy.lowerNote}
              rows={model.cheapest}
              locale={locale}
              copy={copy}
              distributionLabel={exact ? selectedCopy.distribution : undefined}
            />
          </div>
          <div
            className={styles.viewPanel}
            role="tabpanel"
            id="ranking-view-change"
            aria-labelledby="ranking-tab-change"
            hidden={activeView !== 'change'}
          >
            <ChangeRanking model={model} locale={locale} copy={copy} />
          </div>
          <div
            className={styles.viewPanel}
            role="tabpanel"
            id="ranking-view-spread"
            aria-labelledby="ranking-tab-spread"
            hidden={activeView !== 'spread'}
          >
            <StandardRanking
              id="ranking-spread-heading"
              eyebrow={copy.spreadEyebrow}
              title={copy.spreadTitle}
              definition={exact ? selectedCopy.spreadDefinition : copy.spreadDefinition}
              note={copy.spreadNote}
              rows={model.spread}
              locale={locale}
              copy={copy}
              distributionLabel={exact ? selectedCopy.distribution : undefined}
            />
          </div>
          <div
            className={styles.viewPanel}
            role="tabpanel"
            id="ranking-view-sample"
            aria-labelledby="ranking-tab-sample"
            hidden={activeView !== 'sample'}
          >
            <StandardRanking
              id="ranking-sample-heading"
              eyebrow={copy.sampleEyebrow}
              title={copy.sampleTitle}
              definition={copy.sampleDefinition}
              note={copy.sampleNote}
              rows={model.sample}
              locale={locale}
              copy={copy}
            />
          </div>
        </div>
        </div>

        <aside className={styles.limit} aria-label={copy.limitationAria}>
          <p>{copy.limitation}</p>
        </aside>
        <PublicSourceBoundary
          model={model.source}
          locale={locale}
          transaction={exact ? model.evidenceSelection.transaction : undefined}
        />
      </div>
    </section>
  );
}

function UnavailableRankings({
  model,
  locale,
}: Readonly<{
  model: Extract<PublicAreaRankingsModel, { status: 'unavailable' }>;
  locale: ProductLocale;
}>) {
  const copy = PUBLIC_MARKET_COPY[locale].rankings;
  return (
    <section className={styles.rankings} aria-labelledby="rankings-unavailable-heading">
      <header className={styles.hero}>
        <p>{copy.unavailableEyebrow}</p>
        <h1 id="rankings-unavailable-heading">{copy.heading}</h1>
        <p>{locale === 'ko' ? copy.unavailableMessage : model.message}</p>
        <p>{copy.unavailableReason}</p>
      </header>
      <div className={styles.unavailable}>
        <p>{copy.unavailableReason}</p>
        <Link href="/kr/seoul/explore/">{copy.unavailableAction}</Link>
      </div>
      <PublicSourceBoundary model={model.source} locale={locale} />
    </section>
  );
}

export function DistrictRankings({
  model,
  locale = 'en',
}: Readonly<{ model: PublicAreaRankingsModel; locale?: ProductLocale }>) {
  return model.status === 'ready'
    ? <ReadyRankings model={model} locale={locale} />
    : <UnavailableRankings model={model} locale={locale} />;
}
