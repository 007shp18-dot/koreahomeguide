import { readFileSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { describe, expect, it, vi } from 'vitest';
vi.mock('server-only', () => ({}));
import { SEOUL_59SQM_UNDER_700M as english } from '../content/en/seoul-59sqm-under-700m';
import { KOREAN_SEOUL_59SQM_UNDER_700M as korean } from '../content/ko/seoul-59sqm-under-700m';
import { resolveNewsroomFilters } from '../components/newsroom/newsroom-index';
import { indexableMetadata } from '../lib/public-metadata';
import config from '../next.config';

type EvidenceRow = { name: string; buildingId: string; districtSlug: string; neighborhood: string; sales: number; salesAtOrBelow700m: number; medianKrw: number; areaLowSqm: number; areaHighSqm: number; detailHref: string };
const audit = JSON.parse(readFileSync(new URL('../../../../docs/operations/2026-09-08-seoul-59sqm-under-700m-evidence.json', import.meta.url), 'utf8')) as { records: EvidenceRow[]; checks: { eligibleSales: number; salesAtOrBelowCeiling: number } };
describe('Search-entry article evidence and URL contract', () => {
  it('reconciles retained aggregate evidence, not a new raw-data calculation', () => {
    expect(audit.records).toHaveLength(17);
    expect(audit.records.reduce((n, row) => n + row.sales, 0)).toBe(112);
    expect(audit.records.reduce((n, row) => n + row.salesAtOrBelow700m, 0)).toBe(110);
    const budget = audit.records.filter(row => row.medianKrw <= 500000000);
    expect(budget).toHaveLength(5);
    expect(budget.reduce((n, row) => n + row.sales, 0)).toBe(31);
    for (const row of audit.records) {
      expect(row.areaLowSqm).toBeGreaterThanOrEqual(55);
      expect(row.areaHighSqm).toBeLessThanOrEqual(65);
    }
  });
  it('retains source-matched building links in both language editions', () => {
    const inventory = JSON.parse(gunzipSync(readFileSync(new URL('../data/observed-building-inventory.json.gz', import.meta.url))).toString()).records as { buildingId: string; officialName: string; neighborhoodName: string; districtSlug: string }[];
    for (const row of audit.records) {
      expect(inventory.filter(item => item.buildingId === row.buildingId && item.officialName === row.name && item.neighborhoodName === row.neighborhood && item.districtSlug === row.districtSlug)).toHaveLength(1);
      expect(english.bodyMarkdown).toContain(row.detailHref);
      expect(korean.bodyMarkdown).toContain('/ko' + row.detailHref);
    }
  });
  it('keeps graph area labels consistent with the actual screen', () => {
    expect(english.infographic.title).toContain('55–65');
    expect(korean.infographic?.title).toContain('55~65');
    expect(english.bodyMarkdown).toContain('not 31 sales all below');
    expect(korean.bodyMarkdown).toContain('31건 모두가 5억원 이하라는 뜻은 아닙니다');
    expect(english.bodyMarkdown).toContain('62.22 sqm');
    expect(korean.bodyMarkdown).toContain('62.22㎡');
    expect(english.publishedAt).toBe('2026-09-08T02:30:00.000Z');
    expect(korean.publishedAt).toBe(english.publishedAt);
  });
  it('retains stable article URLs and HTTPS www metadata', () => {
    for (const article of [english, korean]) {
      expect(article.canonicalHref).toContain('/news/seoul-59sqm-under-700-million-2026/');
      const metadata = indexableMetadata({ path: article.canonicalHref as `/${string}`, title: article.title, description: article.deck });
      expect(metadata.alternates?.canonical).toBe('https://www.signedprice.com' + article.canonicalHref);
    }
  });
  it('removes building and tracking parameters from news canonical filters', () => {
    expect(resolveNewsroomFilters({ building: '807-41', market: 'seoul', utm_source: 'test' }).canonicalHref).toBe('/news/?market=seoul');
    expect(resolveNewsroomFilters({ building: '807-41' }).canonicalHref).toBe('/news/');
  });
  it('preserves the permanent old-news redirect rather than deleting routes', async () => {
    expect(await config.redirects?.()).toEqual(expect.arrayContaining([
      expect.objectContaining({ source: '/kr/seoul/news/', destination: '/news/?market=seoul', permanent: true }),
    ]));
  });
});
