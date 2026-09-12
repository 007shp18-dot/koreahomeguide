import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import data from '../data/tokyo-ranking-2026-q1.json';
import { TokyoRankings } from '../components/rankings/tokyo-rankings';

vi.mock('../lib/rankings/contracts.server', () => ({ contractRankings: vi.fn(), regionalRentRankings: vi.fn() }));
vi.mock('next/navigation', async importOriginal => ({ ...await importOriginal<typeof import('next/navigation')>(), useRouter: () => ({ push: vi.fn() }) }));

describe('Tokyo published ranking snapshot', () => {
  it('keeps 50 distinct anonymous records in descending reported price order', () => {
    expect(data.rows).toHaveLength(50);
    expect(new Set(data.rows.map(row => row.recordReference)).size).toBe(50);
    expect(data.rows.every((row, i) => row.price > 0 && row.areaSqm > 0 && (!i || (data.rows[i - 1]?.price ?? 0) >= row.price))).toBe(true);
    expect(data.rows[0]?.price).toBe(1_200_000_000);
    expect(data.rows[9]?.price).toBe(data.rows[10]?.price);
  });
  it('shows exact prices, the observation quarter and anonymous-source limitations', () => {
    const html = renderToStaticMarkup(<TokyoRankings />);
    expect(html).toContain('JPY 1,200,000,000');
    expect(html).toContain('2026 Q1');
    expect(html).toContain('Minamicho');
    expect(html).toContain('Equal prices');
    expect(html).toContain('https://www.reinfolib.mlit.go.jp/');
    expect(html).not.toMatch(/streetview|street-view|\/buildings\//i);
    expect(html).toContain('<table>');
    expect(html.match(/scope="row"/g)).toHaveLength(50);
    expect(html).toContain('Sources, coverage and ranking rules');
    expect(html).toContain('name="city"');
    expect(html).toContain('Show rankings');
  });
  it('routes Tokyo without loading Seoul or Singapore rankings', async () => {
    const { default: Page } = await import('../app/(en)/rankings/page');
    const { contractRankings, regionalRentRankings } = await import('../lib/rankings/contracts.server');
    const html = renderToStaticMarkup(await Page({ searchParams: Promise.resolve({ city: 'tokyo' }) }));
    expect(html).toContain('Tokyo');
    expect(html).toContain('JPY 1,200,000,000');
    expect(contractRankings).not.toHaveBeenCalled();
    expect(regionalRentRankings).not.toHaveBeenCalled();
  });
  it('normalizes unsupported filters when switching from another market to Tokyo', async () => {
    const { default: Page } = await import('../app/(en)/rankings/page');
    await expect(Page({ searchParams: Promise.resolve({ city: 'tokyo', kind: 'rent', order: 'lowest' }) })).rejects.toMatchObject({ digest: expect.stringContaining('/rankings/?city=tokyo&kind=sale&order=highest') });
  });
});
