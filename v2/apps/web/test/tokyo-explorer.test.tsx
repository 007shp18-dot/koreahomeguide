import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));
const read = vi.hoisted(() => vi.fn());
vi.mock('../lib/japan/publication-cache.server', () => ({ readCachedJapanPublication: read }));
import TokyoExplorer from '../components/japan/tokyo-explorer';

beforeEach(() => { read.mockReset(); });

describe('Tokyo transaction exploration', () => {
  it('uses the shared Explore frame without inventing a building map and preserves query pagination', async () => {
    read.mockResolvedValue({ releaseId: 'release-one', retrievedAt: '2026-09-01T00:00:00Z', sourceCount: 24, filteredCount: 24,
      records: [{ recordReference: 'one', district: 'Azabu', municipality: 'Minato', type: 'Pre-owned Condominiums, etc.', areaLabel: '60', floorPlan: '2LDK', buildingYear: '2010', structure: 'RC', price: 85000000 }] });
    const html = renderToStaticMarkup(await TokyoExplorer({ searchParams: Promise.resolve({ q: 'Azabu', city: '13103', year: '2025', quarter: '4' }) }));
    expect(html).toContain('data-market-explore-shell="true"');
    expect(html).toContain('data-layout="list"');
    expect(html).not.toContain('data-market-shell-region="spatial"');
    expect(html).toContain('¥85,000,000');
    expect(html).toContain('q=Azabu&amp;city=13103&amp;year=2025&amp;quarter=4&amp;page=2&amp;release=release-one');
    expect(read).toHaveBeenCalledWith({ city: '13103', year: '2025', quarter: '4' }, expect.objectContaining({ q: 'Azabu' }));
  });

  it('keeps filters available on a failed read without displaying a fabricated zero count', async () => {
    read.mockRejectedValue(new Error('private storage error'));
    const html = renderToStaticMarkup(await TokyoExplorer({ searchParams: Promise.resolve({}) }));
    expect(html).toContain('aria-label="Tokyo transaction filters"');
    expect(html).toContain('role="alert"');
    expect(html).not.toContain('private storage error');
    expect(html).not.toContain('0 recorded transactions');
  });

  it('starts with a compact search while retaining the default period in the form', async () => {
    read.mockResolvedValue(null);
    const html = renderToStaticMarkup(await TokyoExplorer({ searchParams: Promise.resolve({}) }));
    const advanced = html.match(/<details\b[^>]*aria-label="More filters"[^>]*>/)?.[0];
    expect(advanced).toBeDefined();
    expect(advanced).not.toContain('open=""');
    expect(html).toContain('method="get"');
    expect(html).toContain('name="year"');
    expect(html).toContain('name="quarter"');
    expect(html).toContain('<option selected="">2025</option>');
    expect(html).toContain('<option value="4" selected="">Q4</option>');
  });

  it('exposes active advanced filters without pinning a new search to the previous scope release', async () => {
    read.mockResolvedValue(null);
    const release = 'jp-area-11111111-1111-4111-8111-111111111111';
    const html = renderToStaticMarkup(await TokyoExplorer({ searchParams: Promise.resolve({
      city: '13110', year: '2024', quarter: '2', q: 'Nakameguro',
      type: 'Pre-owned Condominiums, etc.', minArea: '50', maxArea: '80', release,
    }) }));
    const advanced = html.match(/<details\b[^>]*aria-label="More filters"[^>]*>/)?.[0];
    expect(advanced).toContain('open=""');
    const form = html.match(/<form\b[^>]*aria-label="Tokyo transaction filters"[\s\S]*?<\/form>/)?.[0];
    expect(form).toBeDefined();
    expect(form).not.toContain('name="release"');
    expect(html).toContain('name="q"');
    expect(html).toContain('value="Nakameguro"');
    expect(html).toContain('<option value="13110" selected="">Meguro</option>');
    expect(html).toContain('<option selected="">2024</option>');
    expect(html).toContain('<option value="2" selected="">Q2</option>');
    expect(html).toContain('<option selected="">Pre-owned Condominiums, etc.</option>');
    expect(html).toContain('value="50"');
    expect(html).toContain('value="80"');
  });

  it('offers a useful city guide when no publication exists instead of inventing an available quarter', async () => {
    read.mockResolvedValue(null);
    const html = renderToStaticMarkup(await TokyoExplorer({ searchParams: Promise.resolve({}) }));
    expect(html).not.toContain('Try Minato, 2025 Q4');
    expect(html).not.toContain('0 recorded transactions');
    expect(html).toMatch(/href="\/news\/city-stories\/tokyo\/?"/);
  });
});
