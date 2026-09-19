'use client';
import { useChartWidth } from '../market-ui/use-chart-width';
import { ChartInsight, chartCopy } from '../market-ui/chart-insight';
import { consecutiveChartPeriods } from '../../lib/research/chart-insights';
import type { InfographicSpec } from '../../lib/infographics/infographic-types';
import { formatInfographicValue, InfographicFrame } from './infographic-frame';
import styles from './infographic.module.css';

export function MarketTrendInfographic({ spec }: Readonly<{ spec: InfographicSpec }>) {
  const { ref, width } = useChartWidth();
  const values = spec.series.flatMap(series => series.values.map(datum => datum.value)).filter(Number.isFinite);
  const minimum = values.length ? Math.min(...values) : 0;
  const maximum = values.length ? Math.max(...values) : 1;
  const labels = [...new Set(spec.series.flatMap(series => series.values.map(datum => datum.label)))];
  if (labels.every(label => /^\d{4}(?:-(?:\d{2}|Q[1-4]))?$/.test(label))) labels.sort();
  const x = (label: string) => labels.length === 1 ? width / 2 : 64 + labels.indexOf(label) / Math.max(labels.length - 1, 1) * (width - 88);
  const y = (value: number) => 220 - (value - minimum) / Math.max(maximum - minimum, 1) * 150;
  return <InfographicFrame spec={spec}>
    {spec.series.map(series => {
      const latest = series.values.at(-1), previous = series.values.at(-2);
      return <div key={series.id}><p><strong>{series.label}</strong> · {spec.unit}</p><ChartInsight locale={spec.locale} latest={latest?.value} previous={previous?.value} latestLabel={latest?.label ?? '—'} previousLabel={previous?.label ?? '—'} format={value => formatInfographicValue(value, spec.locale)} comparisonAllowed={!!latest && !!previous && consecutiveChartPeriods(previous.label, latest.label)} /></div>;
    })}
    <p>{chartCopy(spec.locale, 'Read each series in its stated unit. Points connect only across consecutive dated periods; gaps are not estimated.', '각 계열은 표시된 단위로 읽으세요. 연속된 날짜의 기간만 연결하며 빈 기간은 추정하지 않습니다.', '请按各系列所示单位阅读。仅连接连续日期期间，不估算缺失期间。')}</p>
    <div ref={ref} className={styles.chartScroll}>
      <svg className={styles.chart} viewBox={`0 0 ${width} 280`} style={{ minWidth: 0 }} role="img" aria-label={spec.accessibleSummary}>
        {[...new Set([minimum, (minimum + maximum) / 2, maximum])].map(value => <g key={value}><line x1="64" y1={y(value)} x2={width - 24} y2={y(value)} /><text x="56" y={y(value) + 4} textAnchor="end">{new Intl.NumberFormat(spec.locale, { notation: 'compact', maximumFractionDigits: 1 }).format(value)}</text></g>)}
        {spec.series.map((series, seriesIndex) => <g className={styles[`series${seriesIndex + 1}`]} key={series.id}>
          {series.values.slice(1).map((datum, index) => {
            const previous = series.values[index]!;
            return Number.isFinite(datum.value) && Number.isFinite(previous.value) && consecutiveChartPeriods(previous.label, datum.label) ? <polyline key={datum.label} strokeDasharray={seriesIndex % 2 ? '6 4' : undefined} points={`${x(previous.label)},${y(previous.value)} ${x(datum.label)},${y(datum.value)}`} /> : null;
          })}
          {series.values.filter(datum => Number.isFinite(datum.value)).map(datum => <g key={`${series.id}:${datum.label}`}>
            <circle cx={x(datum.label)} cy={y(datum.value)} r="5"><title>{`${series.label} · ${datum.label}: ${formatInfographicValue(datum.value, spec.locale, spec.unit)}`}</title></circle>
          </g>)}
        </g>)}
        {labels.filter((_, index) => width >= 600 || index === 0 || index === labels.length - 1).map((label, index, shown) => <text key={label} x={x(label)} y="248" textAnchor={index === 0 ? 'start' : index === shown.length - 1 ? 'end' : 'middle'}>{label}</text>)}
      </svg>
    </div>
    <div className={styles.trendLegend}>{spec.series.map((series, index) => <span key={series.id}><svg width="30" height="12" viewBox="0 0 30 12" aria-hidden="true" className={styles[`series${index + 1}`]}><polyline points="0,6 30,6" strokeDasharray={index % 2 ? '6 4' : undefined} /><circle cx="15" cy="6" r="3" /></svg>{series.label}</span>)}</div>
  </InfographicFrame>;
}
