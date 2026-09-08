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
});
