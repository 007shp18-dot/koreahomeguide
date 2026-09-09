import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn() }) }));
vi.mock('../components/maps/google-place-map', () => ({ GooglePlaceMap: ({ market, points }: { market: string; points: { label: string }[] }) => <div data-google-market={market}>{points.map(p => p.label).join('|')}</div> }));
import { TokyoAreaMap, tokyoMapAreaHref } from '../components/japan/tokyo-area-map';
const row = { city: '13103', year: '2025', quarter: '4', municipality: 'Minato Ward', district: null, count: 25, median: 13000000 };
const filters = { q: '', type: 'Condo', minArea: 50, maxArea: 90 };
describe('Tokyo Google map', () => {
  it('shows Google map and ward price bubbles immediately', () => {
    const html = renderToStaticMarkup(<TokyoAreaMap rows={[row]} city="13103" year="2025" quarter="4" browserKey="test" filters={filters} />);
    expect(html).toContain('data-google-market="tokyo"');
    expect(html).toContain('Minato · ¥13.0M · 25 · 2025Q4');
    expect(html).not.toContain('Open ward and neighbourhood');
    expect(html).toContain('Selected ward neighbourhoods');
  });
  it('preserves period and property filters and resets transaction pagination on map selection', () => {
    const ward = new URL(tokyoMapAreaHref(row, { ...filters, q: 'Azabu' }), 'https://signedprice.com');
    expect(Object.fromEntries(ward.searchParams)).toEqual({ city: '13103', year: '2025', quarter: '4', q: 'Azabu', type: 'Condo', minArea: '50', maxArea: '90' });
    const area = new URL(tokyoMapAreaHref({ ...row, district: 'Akasaka' }, { ...filters, q: 'Azabu' }), 'https://signedprice.com');
    expect(area.searchParams.get('q')).toBe('Akasaka');
    expect(area.searchParams.has('page')).toBe(false);
  });
  it('keeps the map visible during summary outages', () => {
    const html = renderToStaticMarkup(<TokyoAreaMap rows={[]} city="13103" year="2025" quarter="4" browserKey="test" filters={filters} unavailable />);
    expect(html).toContain('data-google-market="tokyo"');
    expect(html).toContain('temporarily unavailable');
  });
});
