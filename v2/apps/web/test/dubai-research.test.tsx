import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { DubaiExplorer } from '../components/dubai/dubai-explorer';
import { DubaiOverview } from '../components/dubai/dubai-overview';
import { DubaiGuide } from '../components/dubai/dubai-guide';
import { DUBAI_ANNUAL_TRANSACTIONS, filterDubaiAreas } from '../lib/dubai/research';
import { resolveNewsroomFilters } from '../components/newsroom/newsroom-index';
describe('Dubai research release', () => {
  it('keeps annual values comparable and quarter figures separately labelled', () => {
    expect(DUBAI_ANNUAL_TRANSACTIONS.map((row) => row.year)).toEqual(['2024', '2025']);
    const html = renderToStaticMarkup(<DubaiOverview />);
    expect(html).toContain('Q1 2026'); expect(html).toContain('not residential sale-price indices');
    expect(html).toContain('AED 761B'); expect(html).toContain('AED 917B');
  });
  it('searches actual curated area names and keeps empty matches empty', () => {
    expect(filterDubaiAreas(' marina ').map((area) => area.id)).toEqual(['dubai-marina']);
    expect(filterDubaiAreas('unavailable tower')).toEqual([]);
    const html = renderToStaticMarkup(<DubaiExplorer browserKey={null} initialArea="dubai-marina" />);
    expect(html).toContain('Official neighbourhood guide'); expect(html).toContain('not individual buildings');
    expect(html).not.toContain('SGD'); expect(html).not.toContain('KRW');
  });
  it('starts AED assumptions empty and enables the Dubai news filter', () => {
    const html = renderToStaticMarkup(<DubaiGuide />);
    expect(html).toContain('data-property-scenario="AED"');
    expect(html).toContain('value=""'); expect(html).not.toContain('value="2000000"');
    expect(resolveNewsroomFilters({market: 'dubai'}).market).toBe('dubai');
  });
});
