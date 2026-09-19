import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { compareChartValues, consecutiveChartPeriods } from '../lib/research/chart-insights';
import { ChartInsight } from '../components/market-ui/chart-insight';
import { MonthlyTransactionResearch } from '../components/market-ui/monthly-transaction-research';
import { HomeReportPulse } from '../components/home/home-report-pulse';
import { MonthlyReportTrend } from '../components/newsroom/monthly-report-trend';
import { PropertyReviewVisuals } from '../components/market-ui/property-review-visuals';

afterEach(() => vi.useRealTimers());

describe('honest chart comparisons', () => {
  it('derives actual changes and withholds percentage growth at a zero or missing baseline', () => {
    expect(compareChartValues(5321, 5096)?.absolute).toBe(225);
    expect(compareChartValues(5321, 5096)?.percent).toBeCloseTo(4.415);
    expect(compareChartValues(10, 0)).toEqual({ absolute: 10, percent: null });
    expect(compareChartValues(10, null)).toBeNull();
    expect(compareChartValues(NaN, 10)).toBeNull();
    expect(compareChartValues(10, Infinity)).toBeNull();
    const html = renderToStaticMarkup(<ChartInsight locale="en" latest={10} previous={0} latestLabel="July" previousLabel="June" format={String} />);
    expect(html).toContain('+10');
    expect(html).not.toContain('%');
  });
  it('recognizes calendar boundaries but never joins missing or unknown periods', () => {
    expect(consecutiveChartPeriods('2025-12', '2026-01')).toBe(true);
    expect(consecutiveChartPeriods('2025-Q4', '2026-Q1')).toBe(true);
    expect(consecutiveChartPeriods('2023', '2024')).toBe(true);
    expect(consecutiveChartPeriods('2026-01', '2026-03')).toBe(false);
    expect(consecutiveChartPeriods('2022', '2024')).toBe(false);
    expect(consecutiveChartPeriods('2026-01', '2026-01')).toBe(false);
    expect(consecutiveChartPeriods('Unspecified', 'Unspecified')).toBe(false);
  });
  it('labels historical home cohorts and shows the source-derived July comparison in all locales', () => {
    for (const locale of ['en', 'ko', 'zh-CN'] as const) {
      const html = renderToStaticMarkup(<HomeReportPulse locale={locale} />);
      expect(html).toContain('2026');
      expect(html).toContain('5,321');
      expect(html).toContain('5,096');
      expect(html).toContain('+225');
      expect(html).toContain('+4.4%');
      expect(html).toContain('<table');
    }
    expect(renderToStaticMarkup(<HomeReportPulse locale="en" />)).toContain('REPORT ARCHIVE');
  });
  it('uses Dubai’s actual August vs July reporting window and both separate cohorts', () => {
    const html = renderToStaticMarkup(<MonthlyReportTrend slug="dubai-monthly-2026-09" />);
    expect(html).toContain('Aug 2026');
    expect(html).toContain('Jul 2026');
    expect(html).toContain('7,142');
    expect(html).toContain('8,629');
    expect(html).toContain('2,079');
    expect(html).toContain('2,417');
  });
  it('does not compare incomplete current-month prices with a full previous month', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-09-19T00:00:00Z'));
    const html = renderToStaticMarkup(<MonthlyTransactionResearch months={[{ month: '2026-08', count: 9, median: 1000000 }, { month: '2026-09', count: 5, median: 1100000 }]} />);
    expect(html).toContain('partial month');
    expect(html).toContain('Not comparable');
    expect(html).not.toContain('+10%');
  });
  it('does not skip a suppressed latest month to claim price growth', () => {
    const html = renderToStaticMarkup(<MonthlyTransactionResearch months={[{ month: '2025-08', count: 9, median: 1000000 }, { month: '2025-09', count: 2, median: null }]} />);
    expect(html).toContain('Not published');
    expect(html).toContain('Not comparable');
    expect(html).toContain('2 / 9 sales');
  });
  it('does not connect review years across missing observations', () => {
    const html = renderToStaticMarkup(<PropertyReviewVisuals locale="en" series={[{ label: { en: 'Visits', ko: '방문' }, unit: 'visits', basis: { en: 'Annual records', ko: '연간 기록' }, sourceId: 'source', points: [{ period: '2022', value: 100 }, { period: '2024', value: 120 }] }]} />);
    expect(html).toContain('Not comparable');
    expect(html).not.toContain('trendLine');
    expect(html).toContain('120');
  });
});
