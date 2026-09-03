'use client';

import { useState } from 'react';
import Link from 'next/link';

import type {
  PublicAreaRankingsModel,
  PublicDistrictRankingRow,
  UnavailableRankingDistrict,
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
type RankingView = 'spread' | 'median' | 'psm' | 'sample' | 'completion' | 'change';

const rankingViews = Object.freeze([
  { id: 'spread', label: { en: 'Price spread', ko: '가격 분포 폭' } },
  { id: 'median', label: { en: 'Sale median', ko: '매매 중앙값' } },
  { id: 'psm', label: { en: 'Price / ㎡', ko: '㎡당 가격' } },
  { id: 'sample', label: { en: 'Filing volume', ko: '신고 거래량' } },
  { id: 'completion', label: { en: 'Completion', ko: '신고 완결률' } },
  { id: 'change', label: { en: 'QoQ change', ko: '전분기 대비 변화' } },
] as const satisfies readonly {
  id: RankingView;
  label: Readonly<Record<ProductLocale, string>>;
}[]);

const money = new Intl.NumberFormat('ko-KR', {
  style: 'currency', currency: 'KRW', currencyDisplay: 'narrowSymbol', maximumFractionDigits: 0,
});

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
      lowerDefinition: '선택한 거래유형·건물유형 조건에서 신고 중앙값이 낮은 순서입니다. 주거비 부담이나 주택 품질 순위가 아닙니다.',
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
    lowerDefinition: 'Lowest reported median first for the selected transaction and building-type cohort. This is not an affordability or quality ranking.',
    spreadDefinition: 'Widest middle-half (P75 − P25) spread in the selected reported-price cohort. This is dispersion, not volatility or risk.',
    distribution: 'reported price distribution',
  } as const;
}

function RankingRows({
  rows,
  locale,
  copy,
  distributionLabel,
  unavailable = Object.freeze([]),
}: Readonly<{
  rows: readonly PublicDistrictRankingRow[];
  locale: ProductLocale;
  copy: PublicMarketCopy['rankings'];
  distributionLabel?: string;
  unavailable?: readonly UnavailableRankingDistrict[];
}>) {
  if (rows.length === 0 && unavailable.length === 0) {
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
      {unavailable.map((district, index) => (
        <li className={`${styles.row} ${styles.unavailableRow}`} key={district.slug} data-ranking-row={district.slug}>
          <span className={styles.rank}>{rows.length + index + 1}</span>
          <Link className={styles.districtLink} href={district.href}>
            <strong>{locale === 'ko' ? district.nameKo : district.nameEn}</strong>
            <span lang={locale === 'ko' ? 'en' : 'ko'}>{locale === 'ko' ? district.nameEn : district.nameKo}</span>
          </Link>
          <strong className={styles.value}>{locale === 'ko' ? '미게시' : 'Not published'}</strong>
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
  unavailable,
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
  unavailable?: readonly UnavailableRankingDistrict[];
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
        unavailable={unavailable}
      />
    </section>
  );
}

function MetricSummary({ model, view, locale }: Readonly<{
  model: ReadyModel;
  view: RankingView;
  locale: ProductLocale;
}>) {
  const rows = view === 'median'
    ? model.cheapest
    : view === 'spread'
      ? model.spread
      : view === 'sample'
        ? model.sample
        : view === 'change'
          ? model.change
          : Object.freeze([]);
  const city = model.citySummary.published
    ? view === 'median'
      ? money.format(model.citySummary.med)
      : view === 'spread'
        ? money.format(model.citySummary.p75 - model.citySummary.p25)
        : view === 'sample'
          ? `${model.citySummary.n}`
          : view === 'change' && model.citySummary.chg3m !== null
            ? `${model.citySummary.chg3m > 0 ? '+' : ''}${model.citySummary.chg3m.toFixed(1)}%`
            : null
    : null;
  const maximum = rows.length === 0 ? undefined : rows.reduce((best, row) => row.metric > best.metric ? row : best);
  const minimum = rows.length === 0 ? undefined : rows.reduce((best, row) => row.metric < best.metric ? row : best);
  const missing = locale === 'ko' ? '산출 근거 미확인' : 'Source basis unverified';
  return (
    <dl className={styles.metricSummary} aria-label={locale === 'ko' ? '선택 지표 요약' : 'Selected ranking summary'}>
      <div><dt>{locale === 'ko' ? '서울 전체' : 'Seoul overall'}</dt><dd>{city ?? missing}</dd></div>
      <div><dt>{locale === 'ko' ? '최고' : 'Maximum'}</dt><dd>{maximum === undefined ? missing : `${locale === 'ko' ? maximum.nameKo : maximum.nameEn} · ${maximum.valueLabel}`}</dd></div>
      <div><dt>{locale === 'ko' ? '최저' : 'Minimum'}</dt><dd>{minimum === undefined ? missing : `${locale === 'ko' ? minimum.nameKo : minimum.nameEn} · ${minimum.valueLabel}`}</dd></div>
    </dl>
  );
}

function PreparingRanking({ kind, locale }: Readonly<{
  kind: 'psm' | 'completion';
  locale: ProductLocale;
}>) {
  const content = kind === 'psm'
    ? {
        en: ['Price per ㎡ is preparing', 'The current district snapshot does not retain verified floor area for every filing. No derived value is published until numerator and denominator belong to the same cohort.'],
        ko: ['㎡당 가격은 준비 중입니다', '현재 자치구 스냅샷에 모든 신고 건의 검증된 전용면적이 남아 있지 않습니다. 같은 표본의 가격과 면적이 확인되기 전에는 값을 만들지 않습니다.'],
      }
    : {
        en: ['Filing completion is preparing', 'A verified denominator for all expected transactions is not available. A completion percentage would therefore be misleading.'],
        ko: ['신고 완결률은 준비 중입니다', '전체 거래 추정치에 해당하는 검증된 분모가 없습니다. 오해를 만드는 완결률 숫자는 표시하지 않습니다.'],
      };
  return <section className={styles.preparing}><span>{locale === 'ko' ? '준비 중' : 'Preparing'}</span><h2>{content[locale][0]}</h2><p>{content[locale][1]}</p></section>;
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
        <p className={styles.empty}>{locale === 'ko' ? '비교 분기의 표본 수가 확인되지 않아 순위를 게시하지 않습니다.' : copy.empty}</p>
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
  const [activeView, setActiveView] = useState<RankingView>('spread');
  return (
    <section className={styles.rankings} aria-labelledby="district-rankings-heading">
      <div className={styles.frame} data-ranking-frame="contained">
        <header className={styles.hero}>
          <div className={styles.heroCopy}>
            <p>{copy.eyebrow}</p>
            <h1 id="district-rankings-heading">{copy.heading}</h1>
            <p>
              {exact
                ? `${selectedCopy.description} · ${model.source.period}.`
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
        <MetricSummary model={model} view={activeView} locale={locale} />
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
              unavailable={model.unavailableDistricts}
            />
          </div>
          <div className={styles.viewPanel} role="tabpanel" id="ranking-view-psm" aria-labelledby="ranking-tab-psm" hidden={activeView !== 'psm'}>
            <PreparingRanking kind="psm" locale={locale} />
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
              unavailable={model.unavailableDistricts}
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
              unavailable={model.unavailableDistricts}
            />
          </div>
          <div className={styles.viewPanel} role="tabpanel" id="ranking-view-completion" aria-labelledby="ranking-tab-completion" hidden={activeView !== 'completion'}>
            <PreparingRanking kind="completion" locale={locale} />
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
          compact
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
      <PublicSourceBoundary model={model.source} locale={locale} compact />
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
