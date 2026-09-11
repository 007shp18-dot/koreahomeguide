import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { MONTHLY_REPORTS } from '../content/en/monthly-reports';
import { KOREAN_MONTHLY_REPORTS } from '../content/ko/monthly-reports';
import { CHINESE_MONTHLY_REPORTS } from '../content/zh-CN/monthly-reports';
import { CHINESE_DUBAI_RENTAL_YIELD } from '../content/zh-CN/dubai-rental-yield';
import { DUBAI_RENTAL_YIELD } from '../content/en/dubai-rental-yield';
import { getPortfolioRecord } from '../content/portfolio-manifest';
import { editorialLanguageRoutes } from '../lib/navigation/editorial-language-routes';
import { MonthlyReportNavigation, MonthlyReportTrend, monthlyReportHref } from '../components/newsroom/monthly-reports';

describe('September monthly reports', () => {
  it('preserves the Dubai investment analysis calculations, external evidence and full section structure', () => {
    const translated = CHINESE_DUBAI_RENTAL_YIELD;
    const tables = (body: string) => body.split('\n').filter(line => line.startsWith('|')).join('\n').match(/\d+(?:[,.]\d+)*/g);
    const links = (body: string) => [...body.matchAll(/\]\((https[^)]+)\)/g)].map(match => match[1]);
    expect(tables(translated.bodyMarkdown)).toEqual(tables(DUBAI_RENTAL_YIELD.bodyMarkdown));
    expect(links(translated.bodyMarkdown)).toEqual(links(DUBAI_RENTAL_YIELD.bodyMarkdown));
    expect(translated.bodyMarkdown.match(/^## /gm)).toHaveLength(DUBAI_RENTAL_YIELD.bodyMarkdown.match(/^## /gm)!.length);
    expect(translated.bodyMarkdown).toContain('73,614');
    expect(translated.bodyMarkdown).toContain('85,400');
    expect(translated.bodyMarkdown).toContain('虚构计算案例');
    expect(translated.sources.map(source => source.href)).toEqual(DUBAI_RENTAL_YIELD.sources.map(source => source.href));
    expect(editorialLanguageRoutes()[translated.canonicalHref]?.en).toBe(DUBAI_RENTAL_YIELD.canonicalHref);
  });
  it('keeps translated reports on the same identity with every source table value and source URL', () => {
    const tableNumbers = (body: string) => body.split('\n').filter(line => line.startsWith('|')).join('\n').match(/\d+(?:[,.]\d+)*/g);
    for (const translations of [KOREAN_MONTHLY_REPORTS, CHINESE_MONTHLY_REPORTS]) {
      for (const translated of translations) {
        const original = MONTHLY_REPORTS.find(report => report.slug === translated.slug)!;
        expect(getPortfolioRecord(translated.locale, original.slug)?.id).toBe(translated.id);
        expect(translated.translationGroupId).toBe(original.slug);
        expect(editorialLanguageRoutes()[original.canonicalHref]?.[translated.locale]).toBe(translated.canonicalHref);
        expect(editorialLanguageRoutes()[translated.canonicalHref]?.en).toBe(original.canonicalHref);
        expect(translated.sources.map(source => source.href)).toEqual(original.sources.map(source => source.href));
        expect(translated.evidenceReleaseIds).toEqual(original.evidenceReleaseIds);
        expect(translated.bodyMarkdown.match(/^## /gm)?.length).toBe(original.bodyMarkdown.match(/^## /gm)?.length);
        // Month labels are translated to numeric months; compare data cells, not header labels.
        const dataRows = (body: string) => body.split('\n').filter(line => line.startsWith('|') && !/Contract month|Brokered sales|District|June|July|August|Month|Postal district|Source area|Status|계약 월|자치구|우편 구역|원자료 지역명|\| 월 \||合同月份|行政区|邮政区|原始地区名称|\| 月份 \|/.test(line)).join('\n');
        expect(tableNumbers(dataRows(translated.bodyMarkdown))).toEqual(tableNumbers(dataRows(original.bodyMarkdown)));
      }
    }
  });
  it('keeps Chinese chart labels and city navigation in Chinese', () => {
    const nav = renderToStaticMarkup(<MonthlyReportNavigation slug="seoul-monthly-2026-09" locale="zh-CN" />);
    expect(nav).toContain('/zh-cn/news/dubai-monthly-2026-09');
    expect(nav).toContain('首尔');
    const chart = renderToStaticMarkup(<MonthlyReportTrend slug="dubai-monthly-2026-09" locale="zh-CN" />);
    expect(chart).toContain('近六个月成交趋势');
    expect(chart).toContain('期房公寓记录');
  });
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
