import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { MONTHLY_REPORTS } from '../content/en/monthly-reports';
import { MonthlyReportNavigation, MonthlyReportTrend, monthlyReportHref } from '../components/newsroom/monthly-reports';

describe('September monthly reports', () => {
  it('gives each city a complete report and distinct crawlable navigation', () => {
    expect(MONTHLY_REPORTS).toHaveLength(3);
    for (const report of MONTHLY_REPORTS) {
      expect(report.bodyMarkdown.startsWith('## ')).toBe(true);
      expect(report.bodyMarkdown.match(/^## /gm)?.length).toBeGreaterThanOrEqual(5);
      expect(report.bodyMarkdown).not.toMatch(/계약월|소표본|\/workspace\//);
      const nav = renderToStaticMarkup(<MonthlyReportNavigation slug={report.slug} />);
      expect(nav.match(/aria-current="page"/g)).toHaveLength(1);
      for (const city of ['seoul', 'singapore', 'dubai']) expect(nav).toContain(`href="${monthlyReportHref(city).replace(/\/$/u, '')}"`);
      const chart = renderToStaticMarkup(<MonthlyReportTrend slug={report.slug} />);
      expect(chart).toContain('role="img"');
      expect(chart).toContain('<desc');
    }
  });
  it('preserves different reporting windows and sparse-price limitations', () => {
    expect(MONTHLY_REPORTS[0]?.bodyMarkdown).toContain('5,321');
    expect(MONTHLY_REPORTS[1]?.bodyMarkdown).toContain('no district had ten eligible cohorts');
    expect(MONTHLY_REPORTS[2]?.bodyMarkdown).toContain('March–May with June–August');
    expect(monthlyReportHref('all')).toBe('/news/seoul-monthly-2026-09/');
    expect(renderToStaticMarkup(<MonthlyReportNavigation slug="unrelated" />)).toBe('');
  });
});
