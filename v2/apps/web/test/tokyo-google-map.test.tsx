import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn() }) }));
vi.mock('../components/maps/google-place-map', () => ({ GooglePlaceMap: ({ market, points }: { market: string; points: { label: string }[] }) => <div data-google-market={market}>{points.map(p => p.label).join('|')}</div> }));
import { TokyoAreaMap, tokyoMapAreaHref, tokyoAreaPoint } from '../components/japan/tokyo-area-map';
import { TOKYO_WARDS } from '../lib/japan/query';
import wardLocations from '../lib/japan/tokyo-ward-locations.json';
const row = { city: '13103', year: '2025', quarter: '4', municipality: 'Minato Ward', district: null, count: 25, median: 13000000 };
const filters = { q: '', type: 'Condo', minArea: 50, maxArea: 90 };
describe('Tokyo Google map', () => {
  it('shows concise ward labels with a separate selected price summary', () => {
    const html = renderToStaticMarkup(<TokyoAreaMap rows={[row]} city="13103" year="2025" quarter="4" browserKey="test" filters={filters} />);
    expect(html).toContain('data-google-market="tokyo"');
    expect(html).toContain('>Minato</div>');
    expect(html).toContain('¥13,000,000');
    expect(html).toContain('Selected area price summary');
    expect(html).not.toContain('Open ward and neighbourhood');
    expect(html).toContain('Neighbourhoods');
  });
  it('uses published ward reference coordinates without a browser address lookup', () => {
    const point = tokyoAreaPoint(row, 0, true);
    expect(point).not.toHaveProperty('address');
    expect(point).toMatchObject({ label: 'Minato', selected: true });
    expect(point).toHaveProperty('latitude');
    expect(point).toHaveProperty('bounds');
    const neighbourhood = tokyoAreaPoint({ ...row, district: 'Akasaka' }, 0, false);
    expect(neighbourhood).toHaveProperty('address', 'Akasaka, Minato Ward, Tokyo, Japan');
    expect(neighbourhood).not.toHaveProperty('latitude');
  });
  it('has bounded source-derived locations for all 23 wards', () => {
    expect(Object.keys(wardLocations.wards).sort()).toEqual(TOKYO_WARDS.map(([code]) => code).sort());
    for (const point of Object.values(wardLocations.wards)) {
      expect(point.latitude).toBeGreaterThan(point.bounds.south);
      expect(point.latitude).toBeLessThan(point.bounds.north);
      expect(point.longitude).toBeGreaterThan(point.bounds.west);
      expect(point.longitude).toBeLessThan(point.bounds.east);
    }
  });
  it('preserves period and property filters and resets transaction pagination on map selection', () => {
    const ward = new URL(tokyoMapAreaHref(row, { ...filters, q: 'Azabu' }), 'https://signedprice.com');
    expect(Object.fromEntries(ward.searchParams)).toEqual({ city: '13103', year: '2025', quarter: '4', type: 'Condo', minArea: '50', maxArea: '90' });
    const area = new URL(tokyoMapAreaHref({ ...row, district: 'Akasaka' }, { ...filters, q: 'Azabu' }), 'https://signedprice.com');
    expect(area.searchParams.get('q')).toBe('Akasaka');
    expect(area.searchParams.has('page')).toBe(false);
  });
  it('keeps the map visible during summary outages', () => {
    const html = renderToStaticMarkup(<TokyoAreaMap rows={[]} city="13103" year="2025" quarter="4" browserKey="test" filters={filters} unavailable />);
    expect(html).toContain('data-google-market="tokyo"');
    expect(html).toContain('temporarily unavailable');
  });
  it('shows the selected ward neighbourhoods without requiring a hidden map mode or geocoding them', () => {
    const shibuya = { ...row, city: '13113', municipality: 'Shibuya Ward' };
    const html = renderToStaticMarkup(<TokyoAreaMap rows={[row, shibuya,
      { ...shibuya, district: 'Ebisu', count: 12 }, { ...shibuya, district: 'Hiroo', count: 8 },
      { ...row, district: 'Azabu' },
    ]} city="13113" year="2025" quarter="4" browserKey="test" filters={{ ...filters, q: 'Ebisu' }} />);
    expect(html).toContain('Neighbourhoods in Shibuya');
    expect(html).toContain('data-neighbourhood="Ebisu"');
    expect(html).toContain('data-neighbourhood="Hiroo"');
    expect(html).not.toContain('data-neighbourhood="Azabu"');
    expect(html).toContain('>Minato|Shibuya</div>');
    expect(html).toMatch(/data-neighbourhood="Ebisu"[^>]*aria-current="location"/);
    expect(html).toContain('#tokyo-transactions');
    expect(html).not.toContain('aria-label="Map detail"');
  });
  it('retains an explicitly selected all-property view when switching wards', () => {
    const href = new URL(tokyoMapAreaHref(row, { q: 'Hiroo', type: '', minArea: null, maxArea: null }), 'https://signedprice.com');
    expect(href.searchParams.get('type')).toBe('');
    expect(href.searchParams.has('q')).toBe(false);
  });
});
