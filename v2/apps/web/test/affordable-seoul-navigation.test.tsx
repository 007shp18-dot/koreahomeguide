import { readFileSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { AFFORDABLE_RESALE_STORIES } from '../content/en/affordable-resale';
import { EditorialMarkdown } from '../components/insights/editorial-markdown';

describe('recent Seoul article navigation', () => {
  it('links every shortlist row to a uniquely matched building and selected sale map', () => {
    const audit = JSON.parse(readFileSync(new URL('../../../../docs/operations/2026-09-07-affordable-resale-evidence.json', import.meta.url), 'utf8'));
    const inventory = JSON.parse(gunzipSync(readFileSync(new URL('../data/observed-building-inventory.json.gz', import.meta.url))).toString()).records;
    const sale = JSON.parse(gunzipSync(readFileSync(new URL('../data/korea-sale-evidence.json.gz', import.meta.url))).toString()).buildingRecords;
    const article = AFFORDABLE_RESALE_STORIES[0]!;
    const html = renderToStaticMarkup(<EditorialMarkdown source={article.bodyMarkdown} />);
    const links = audit.koreaRecent.navigationLinks;
    expect(links).toHaveLength(23);
    expect(new Set(links.map((link: { buildingId: string }) => link.buildingId)).size).toBe(23);
    for (const link of links) {
      const matches = inventory.filter((row: { buildingId: string; officialName: string; neighborhoodName: string; districtSlug: string }) => row.buildingId === link.buildingId && row.officialName === link.name && row.neighborhoodName === link.neighborhood && row.districtSlug === link.districtSlug);
      expect(matches).toHaveLength(1);
      expect(sale.some((row: { buildingId: string }) => row.buildingId === link.buildingId)).toBe(true);
      expect(link.detailHref).toContain(`/explore/${link.districtSlug}/${link.buildingId}/`);
      const map = new URL(link.mapHref, 'https://www.signedprice.com');
      expect(map.searchParams.get('buildingId')).toBe(link.buildingId);
      expect(map.searchParams.get('district')).toBe(link.districtSlug);
      expect(map.searchParams.get('neighborhood')).toBe(matches[0].neighborhoodId);
      expect(map.searchParams.get('transaction')).toBe('sale');
      expect(map.searchParams.get('view')).toBe('map');
      expect(html).toContain(`href="${link.detailHref.replaceAll('&', '&amp;')}"`);
      expect(html).toContain(`href="${link.mapHref.replaceAll('&', '&amp;')}"`);
    }
    expect(article.bodyMarkdown).toContain('not active listings');
    expect(article.bodyMarkdown).toContain('exact pin depends on verified coordinates');
  });
});
