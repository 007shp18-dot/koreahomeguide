'use client';

import { useState } from 'react';
import { selectResearchPeriod, type ResearchMonth, type ResearchPeriod } from '../../lib/research/property-research';
import styles from './property-research.module.css';

const money = (value: number, currency: 'SGD' | 'KRW', compact = false) => new Intl.NumberFormat('en', {
  style: 'currency', currency, currencyDisplay: 'code', maximumFractionDigits: compact ? 1 : 0,
  notation: compact ? 'compact' : 'standard',
}).format(value);

export function MonthlyTransactionResearch({ months: releasedMonths, locale = 'en' }: Readonly<{ locale?: 'en' | 'ko'; months: readonly ResearchMonth[] }>) {
  const [period, setPeriod] = useState<ResearchPeriod>('all');
  const months = selectResearchPeriod(releasedMonths, period);
  const totalSales = months.reduce((sum, month) => sum + month.count, 0);
  const hasPrices = months.some((month) => month.median !== null);
  const maxPrice = Math.max(...months.map((month) => month.median ?? 0), 1);
  const maxCount = Math.max(...months.map((month) => month.count), 1);
  const baseline = hasPrices ? 224 : 90;
  const x = (i: number) => 96 + i * 600 / Math.max(months.length - 1, 1);
  const priceY = (value: number) => 146 - value / maxPrice * 116;
  return <section className={styles.section} aria-labelledby="project-history-heading" data-transaction-research="monthly">
    <h2 id="project-history-heading">{hasPrices ? (locale === 'ko' ? '신고 거래 가격과 거래량' : 'Reported price and activity') : (locale === 'ko' ? '신고 거래량' : 'Reported transaction activity')}</h2>
    <p>{hasPrices ? (locale === 'ko' ? '선택한 기간의 월별 매매가 중앙값과 신고 거래량입니다. 면적·주택 유형·거래 구성에 따라 중앙값이 달라질 수 있습니다. 가격은 월 5건 이상일 때 공개합니다.' : 'Monthly median sale price and reported transaction count in the selected reporting period. Changes in unit size, property type and sale mix can move the median. A price point requires at least five transactions.') : (locale === 'ko' ? '선택한 기간의 월별 거래 수입니다. 월 5건 이상인 달이 없어 월별 가격 중앙값은 공개하지 않습니다.' : 'Monthly transaction counts in the selected reporting period. No selected month has five transactions, so monthly median prices are not published.')}</p>
    <div className={styles.chartToolbar}>
      <div role="group" aria-label={locale === 'ko' ? '차트 조회 기간' : 'Chart reporting period'}>{([['12', '1Y'], ['36', '3Y'], ['all', 'All']] as const).map(([value, label]) => <button key={value} type="button" aria-pressed={period === value} onClick={() => setPeriod(value)}>{locale === 'ko' ? ({ '1Y': '1년', '3Y': '3년', All: '전체' }[label]) : label}</button>)}</div>
      <span aria-live="polite">{months.length ? `${months[0]!.month} – ${months.at(-1)!.month} · ${locale === 'ko' ? `신고 거래 ${totalSales.toLocaleString('ko')}건` : `${totalSales.toLocaleString('en')} reported ${totalSales === 1 ? 'sale' : 'sales'}`} ` : (locale === 'ko' ? '공개된 월별 자료가 없습니다' : 'No released months')}</span>
    </div>
    <p className={styles.chartHint}>{locale === 'ko' ? '좁은 화면에서는 그래프를 좌우로 스크롤하세요. 정확한 값은 아래 월별 수치에서 확인하세요.' : 'On narrow screens, scroll the chart horizontally. Open monthly figures below for exact values.'}</p>
    <div className={styles.chartWrap} role="region" aria-label={locale === 'ko' ? '월별 거래 차트 — 가로로 스크롤' : 'Monthly transactions chart — scroll horizontally'} tabIndex={0}>
    <svg className={styles.chart} viewBox={`0 0 720 ${baseline + 36}`} role="img" aria-label={hasPrices ? (locale === 'ko' ? '월별 매매가와 거래량 막대그래프입니다. 정확한 값은 아래 표에서 확인하세요.' : 'Monthly sale-price points and transaction-volume bars. Exact values are in the table below.') : (locale === 'ko' ? '월별 신고 거래량입니다. 정확한 값은 아래 표에서 확인하세요.' : 'Monthly reported transaction counts. Exact values are in the table below.')}>
      {hasPrices ? [0, .5, 1].map((fraction) => <g key={fraction}><line x1="90" y1={priceY(maxPrice * fraction)} x2="704" y2={priceY(maxPrice * fraction)} /><text x="0" y={priceY(maxPrice * fraction) + 4}>{money(maxPrice * fraction, 'SGD', true)}</text></g>) : null}
      <text x="0" y={baseline - 45}>{maxCount} {locale === 'ko' ? '건' : maxCount === 1 ? 'sale' : 'sales'}</text>
      <line x1="90" x2="704" y1={baseline} y2={baseline} />
      {months.map((month, i) => <g key={month.month}>
        {month.median === null ? null : <circle cx={x(i)} cy={priceY(month.median)} r="3.5" fill="currentColor"><title>{`${month.month}: ${money(month.median, 'SGD')} · ${month.count}${locale === 'ko' ? '건' : ' sales'}`}</title></circle>}
        <rect x={x(i) - 3} y={baseline - month.count / maxCount * 50} width={Math.min(10, 500 / Math.max(months.length, 1))} height={month.count / maxCount * 50} fill="currentColor" opacity=".5"><title>{`${month.month}: ${locale === 'ko' ? `신고 거래 ${month.count}건` : `${month.count} reported sales`}`}</title></rect>
        {i === 0 || i === months.length - 1 || (i === Math.floor(months.length / 2)) ? <text x={x(i)} y={baseline + 22} textAnchor={i === months.length - 1 ? 'end' : 'middle'}>{month.month}</text> : null}
      </g>)}
    </svg>
    </div>
    <p>{locale === 'ko' ? '출처: URA 공개 민간 주택 거래' : 'Source: URA released private residential transactions'}{hasPrices ? (locale === 'ko' ? ' · 총 매매가(SGD)' : ' · SGD total sale prices') : ''}. <a href="#detail-source">{locale === 'ko' ? '자료와 집계 기준' : 'Dataset and methodology'}</a>.</p>
    <details><summary>{locale === 'ko' ? '월별 수치와 거래 수' : 'Monthly figures and sample sizes'}</summary><div className={styles.tableWrap} role="region" aria-label={locale === 'ko' ? '월별 수치와 거래 수 — 가로로 스크롤' : 'Monthly figures and sample sizes — scroll horizontally'} tabIndex={0}><table className={styles.table}><thead><tr><th>{locale === 'ko' ? '계약월' : 'Month'}</th><th>{locale === 'ko' ? '신고 거래 수' : 'Reported sales'}</th><th>{locale === 'ko' ? '가격 중앙값' : 'Median price'}</th></tr></thead><tbody>{months.map((month) => <tr key={month.month}><td>{month.month}</td><td>{month.count}</td><td>{month.median === null ? (month.count === 0 ? (locale === 'ko' ? '거래 없음' : 'No transactions') : (locale === 'ko' ? '거래 5건 미만' : 'Below 5 transactions')) : money(month.median, 'SGD')}</td></tr>)}</tbody></table></div></details>
  </section>;
}
