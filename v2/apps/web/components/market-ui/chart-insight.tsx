import type { MarketLocale } from '../../lib/locale/market-localization';
import { compareChartValues } from '../../lib/research/chart-insights';
import styles from './chart-insight.module.css';

export const chartCopy = (locale: MarketLocale, en: string, ko: string, zh: string) => locale === 'ko' ? ko : locale === 'zh-CN' ? zh : en;

export function ChartInsight({ locale, latest, previous, latestLabel, previousLabel, format, comparisonAllowed = true }: {
  locale: MarketLocale; latest: number | null | undefined; previous: number | null | undefined;
  latestLabel: string; previousLabel: string; format: (value: number) => string; comparisonAllowed?: boolean;
}) {
  const comparison = comparisonAllowed ? compareChartValues(latest, previous) : null;
  const missing = chartCopy(locale, 'Not published', '미공개', '未公布');
  const value = (v: number | null | undefined) => v == null || !Number.isFinite(v) ? missing : format(v);
  const signed = (v: number) => `${v > 0 ? '+' : v < 0 ? '−' : ''}${new Intl.NumberFormat(locale, { maximumFractionDigits: 1 }).format(Math.abs(v))}%`;
  return <dl className={styles.insight}>
    <div><dt>{latestLabel}</dt><dd>{value(latest)}</dd></div>
    <div><dt>{previousLabel}</dt><dd>{value(previous)}</dd></div>
    <div><dt>{chartCopy(locale, 'Change between periods', '두 기간의 변화', '两期变化')}</dt><dd>{comparison ? <>{comparison.absolute > 0 ? '+' : comparison.absolute < 0 ? '−' : ''}{format(Math.abs(comparison.absolute))}{comparison.percent !== null && <small>{signed(comparison.percent)}</small>}</> : <span className={styles.unavailable}>{chartCopy(locale, 'Not comparable', '비교 불가', '不可比较')}</span>}</dd></div>
  </dl>;
}
