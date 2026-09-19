'use client';
import { localizedMarketCopy } from '../../lib/locale/market-localization';


import { ChartInsight, chartCopy } from './chart-insight';
import { consecutiveChartPeriods } from '../../lib/research/chart-insights';
import { useState } from 'react';
import { useChartWidth } from './use-chart-width';
import { monthlyPriceSegments, selectResearchPeriod, type ResearchMonth, type ResearchPeriod } from '../../lib/research/property-research';
import styles from './property-research.module.css';

const money = (value: number, currency: 'SGD' | 'KRW', compact = false) => new Intl.NumberFormat('en', {
  style: 'currency', currency, currencyDisplay: 'code', maximumFractionDigits: compact ? 1 : 0,
  notation: compact ? 'compact' : 'standard',
}).format(value);

export function MonthlyTransactionResearch({ months: releasedMonths, locale = 'en' }: Readonly<{ locale?: 'en' | 'ko' | 'zh-CN'; months: readonly ResearchMonth[] }>) {
  const { ref, width } = useChartWidth();
  const [period, setPeriod] = useState<ResearchPeriod>('all');
  const months = selectResearchPeriod(releasedMonths, period);
  const latest = months.at(-1);
  const previous = months.at(-2);
  const currentMonth = new Date().toISOString().slice(0, 7);
  const isPartial = latest?.month === currentMonth;
  const comparable = !!latest && !!previous && !isPartial && consecutiveChartPeriods(previous.month, latest.month);
  const published = (month: ResearchMonth | undefined) => month && month.count >= 5 && month.median !== null && Number.isFinite(month.median) && month.median > 0 ? month.median : null;
  const monthLabel = (month: string) => new Intl.DateTimeFormat(locale, { year: 'numeric', month: 'short', timeZone: 'UTC' }).format(new Date(`${month}-01T00:00:00Z`));
  const totalSales = months.reduce((sum, month) => sum + month.count, 0);
  const priceSegments = monthlyPriceSegments(months);
  const priced = new Set(priceSegments.flat());
  const hasPrices = priced.size > 0;
  const maxPrice = Math.max(...months.flatMap((month, index) => priced.has(index) ? [month.median!] : []), 1);
  const maxCount = Math.max(...months.map((month) => month.count), 1);
  const baseline = hasPrices ? 224 : 90;
  const x = (i: number) => months.length === 1 ? (82 + width - 22) / 2 : 82 + i * (width - 104) / Math.max(months.length - 1, 1);
  const priceY = (value: number) => 146 - value / maxPrice * 116;
  return <section className={styles.section} aria-labelledby="project-history-heading" data-transaction-research="monthly">
    <h2 id="project-history-heading">{hasPrices ? chartCopy(locale, 'How have recorded sale prices changed?', '신고 매매가는 어떻게 달라졌을까요?', '已申报成交价格有何变化？') : chartCopy(locale, 'How many sales were reported each month?', '매달 신고된 거래는 몇 건일까요?', '每月申报了多少笔成交？')}</h2>
    <p>{hasPrices ? (localizedMarketCopy(locale, "Monthly median sale price and reported transaction count in the selected reporting period. Changes in unit size, property type and sale mix can move the median. A price point requires at least five transactions.", "선택한 기간의 월별 매매가 중앙값과 신고 거래량입니다. 면적·주택 유형·거래 구성에 따라 중앙값이 달라질 수 있습니다. 가격은 월 5건 이상일 때 공개합니다.")) : (localizedMarketCopy(locale, "Monthly transaction counts in the selected reporting period. No selected month has five transactions, so monthly median prices are not published.", "선택한 기간의 월별 거래 수입니다. 월 5건 이상인 달이 없어 월별 가격 중앙값은 공개하지 않습니다."))}</p>
    <div className={styles.chartToolbar}>
      <div role="group" aria-label={localizedMarketCopy(locale, "Chart reporting period", "차트 조회 기간")}>{([['12', '1Y'], ['36', '3Y'], ['all', 'All']] as const).map(([value, label]) => <button key={value} type="button" aria-pressed={period === value} onClick={() => setPeriod(value)}>{locale === 'ko' ? ({ '1Y': '1년', '3Y': '3년', All: '전체' }[label]) : locale === 'zh-CN' ? ({ '1Y': '1年', '3Y': '3年', All: '全部' }[label]) : label}</button>)}</div>
      <span aria-live="polite">{months.length ? `${months[0]!.month} – ${months.at(-1)!.month} · ${locale === 'ko' ? `신고 거래 ${totalSales.toLocaleString('ko')}건` : locale === 'zh-CN' ? `${totalSales.toLocaleString('zh-CN')} 笔申报交易` : `${totalSales.toLocaleString('en')} reported ${totalSales === 1 ? 'sale' : 'sales'}`} ` : (localizedMarketCopy(locale, "No released months", "공개된 월별 자료가 없습니다"))}</span>
    </div>
    {latest && <><ChartInsight locale={locale} latest={hasPrices ? published(latest) : latest.count} previous={hasPrices ? published(previous) : previous?.count} latestLabel={`${monthLabel(latest.month)}${isPartial ? chartCopy(locale, ' · partial month', ' · 진행 중인 월', ' · 未完整月份') : ''}`} previousLabel={previous ? monthLabel(previous.month) : chartCopy(locale, 'Previous month', '전월', '上月')} format={value => hasPrices ? money(value, 'SGD') : value.toLocaleString(locale)} comparisonAllowed={comparable} /><p className={styles.chartHint}>{chartCopy(locale, 'Latest / previous sample', '최근 월 / 이전 월 거래 수', '最近月份 / 上期样本')} · {latest.count.toLocaleString(locale)} / {previous?.count.toLocaleString(locale) ?? '—'} {chartCopy(locale, 'sales', '건', '笔成交')}. {isPartial ? chartCopy(locale, 'The current calendar month is incomplete; no monthly change is calculated.', '현재 월은 집계 중이므로 전월 대비 변화율을 계산하지 않습니다.', '当前自然月尚未结束，不计算月度变化。') : chartCopy(locale, 'These are released records; late reporting can revise the totals.', '공개된 신고 자료이며 지연 신고로 수치가 바뀔 수 있습니다.', '这些是已发布记录；延迟申报可能修订总数。')}</p></>}
    <div className={styles.chartLegend}>
      {hasPrices && <span><i className={styles.priceKey} aria-hidden="true" />{locale === 'ko' ? '월별 가격 중앙값 · SGD' : locale === 'zh-CN' ? '每月价格中位数 · SGD' : 'Monthly median price · SGD'}</span>}
      <span><i className={styles.volumeKey} aria-hidden="true" />{locale === 'ko' ? '신고 거래량' : locale === 'zh-CN' ? '申报成交量' : 'Reported transactions'}</span>
    </div>
    <p className={styles.chartHint}>{localizedMarketCopy(locale, "Open monthly figures below for exact prices and transaction counts.", "정확한 가격과 거래 수는 아래 월별 수치에서 확인하세요.")}</p>
    <div ref={ref} className={styles.chartWrap} role="region" aria-label={localizedMarketCopy(locale, "Monthly transactions chart", "월별 거래 차트")} tabIndex={0}>
    <svg className={styles.chart} viewBox={`0 0 ${width} ${baseline + 36}`} role="img" aria-label={hasPrices ? (localizedMarketCopy(locale, "Monthly median price line and transaction-volume bars. Exact values are in the table below.", "월별 매매가 중앙값 선과 거래량 막대그래프입니다. 정확한 값은 아래 표에서 확인하세요.")) : (localizedMarketCopy(locale, "Monthly reported transaction counts. Exact values are in the table below.", "월별 신고 거래량입니다. 정확한 값은 아래 표에서 확인하세요."))}>
      {hasPrices ? [0, .5, 1].map((fraction) => <g key={fraction}><line x1="76" y1={priceY(maxPrice * fraction)} x2={width - 16} y2={priceY(maxPrice * fraction)} /><text x="0" y={priceY(maxPrice * fraction) + 4}>{money(maxPrice * fraction, 'SGD', true)}</text></g>) : null}
      <text x="0" y={baseline - 45}>{maxCount} {locale === 'ko' ? '건' : locale === 'zh-CN' ? '笔交易' : maxCount === 1 ? 'sale' : 'sales'}</text>
      <line x1="76" x2={width - 16} y1={baseline} y2={baseline} />
      {priceSegments.filter(segment => segment.length > 1).map(segment => <polyline key={segment[0]} className={styles.priceLine} points={segment.map(index => `${x(index)},${priceY(months[index]!.median!)}`).join(' ')} />)}
      {months.map((month, i) => <g key={month.month}>
        {!priced.has(i) ? null : <circle cx={x(i)} cy={priceY(month.median!)} r="3.5" fill="currentColor"><title>{`${month.month}: ${money(month.median!, 'SGD')} · ${month.count}${localizedMarketCopy(locale, " sales", "건")}`}</title></circle>}
        <rect x={x(i) - Math.max(1, Math.min(10, (width - 104) / Math.max(months.length, 1) * .7)) / 2} y={baseline - (month.count === 0 ? 0 : Math.max(2, month.count / maxCount * 50))} width={Math.max(1, Math.min(10, (width - 104) / Math.max(months.length, 1) * .7))} height={month.count === 0 ? 0 : Math.max(2, month.count / maxCount * 50)} fill="currentColor" opacity=".5"><title>{`${month.month}: ${locale === 'ko' ? `신고 거래 ${month.count}건` : locale === 'zh-CN' ? `${month.count} 笔申报交易` : `${month.count} reported sales`}`}</title></rect>
        {i === 0 || i === months.length - 1 || (width >= 430 && i === Math.floor(months.length / 2)) ? <text x={x(i)} y={baseline + 22} textAnchor={i === months.length - 1 ? 'end' : 'middle'}>{month.month}</text> : null}
      </g>)}
    </svg>
    </div>
    <p>{localizedMarketCopy(locale, "Source: URA released private residential transactions", "출처: URA 공개 민간 주택 거래")}{hasPrices ? (localizedMarketCopy(locale, " · SGD total sale prices", " · 총 매매가(SGD)")) : ''}. <a href="#detail-source">{localizedMarketCopy(locale, "Dataset and methodology", "자료와 집계 기준")}</a>.</p>
    <details><summary>{localizedMarketCopy(locale, "Monthly figures and sample sizes", "월별 수치와 거래 수")}</summary><div className={styles.tableWrap} role="region" aria-label={localizedMarketCopy(locale, "Monthly figures and sample sizes — scroll horizontally", "월별 수치와 거래 수 — 가로로 스크롤")} tabIndex={0}><table className={styles.table}><thead><tr><th>{localizedMarketCopy(locale, "Month", "계약월")}</th><th>{localizedMarketCopy(locale, "Reported sales", "신고 거래 수")}</th><th>{localizedMarketCopy(locale, "Median price", "가격 중앙값")}</th></tr></thead><tbody>{months.map((month) => <tr key={month.month}><td>{month.month}</td><td>{month.count.toLocaleString(locale)}</td><td>{published(month) === null ? (month.count === 0 ? (localizedMarketCopy(locale, "No transactions", "거래 없음")) : (localizedMarketCopy(locale, "Below 5 transactions", "거래 5건 미만"))) : money(month.median!, 'SGD')}</td></tr>)}</tbody></table></div></details>
  </section>;
}
