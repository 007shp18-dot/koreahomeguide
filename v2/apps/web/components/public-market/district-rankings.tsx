'use client';

import { useState } from 'react';
import Link from 'next/link';

import type {
  PublicAreaRankingsModel,
  PublicDistrictRankingRow,
} from '../../lib/public-market/area-route-types';
import {
  PUBLIC_MARKET_COPY,
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

function RankingRows({
  rows,
  locale,
  copy,
}: Readonly<{
  rows: readonly PublicDistrictRankingRow[];
  locale: ProductLocale;
  copy: PublicMarketCopy['rankings'];
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
              aria-label={`${locale === 'ko' ? row.nameKo : row.nameEn} ${copy.distribution}`}
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
}: Readonly<{
  id: string;
  eyebrow: string;
  title: string;
  definition: string;
  note: string;
  rows: readonly PublicDistrictRankingRow[];
  locale: ProductLocale;
  copy: PublicMarketCopy['rankings'];
}>) {
  return (
    <section className={styles.panel} aria-labelledby={id} data-ranking-section={id}>
      <header className={styles.panelHeader}>
        <p>{eyebrow}</p>
        <h2 id={id}>{title}</h2>
        <p>{definition}</p>
        <small>{note}</small>
      </header>
      <RankingRows rows={rows} locale={locale} copy={copy} />
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
  const [activeView, setActiveView] = useState<RankingView>('median');
  return (
    <section className={styles.rankings} aria-labelledby="district-rankings-heading">
      <div className={styles.frame} data-ranking-frame="contained">
        <header className={styles.hero}>
          <div className={styles.heroCopy}>
            <p>{copy.eyebrow}</p>
            <h1 id="district-rankings-heading">{copy.heading}</h1>
            <p>
              {copy.descriptionLead} {model.source.period}. {copy.descriptionMiddle}{' '}
              {model.source.publicationMinimum}{locale === 'en' ? ' ' : ''}{copy.descriptionTail}
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
              eyebrow={copy.lowerEyebrow}
              title={copy.lowerTitle}
              definition={copy.lowerDefinition}
              note={copy.lowerNote}
              rows={model.cheapest}
              locale={locale}
              copy={copy}
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
              definition={copy.spreadDefinition}
              note={copy.spreadNote}
              rows={model.spread}
              locale={locale}
              copy={copy}
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
        <PublicSourceBoundary model={model.source} locale={locale} />
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
        <h1 id="rankings-unavailable-heading">
          {locale === 'ko' ? copy.unavailableMessage : model.message}
        </h1>
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
