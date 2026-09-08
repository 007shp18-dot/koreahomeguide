import { describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

type Candidate = (rows: readonly Readonly<{
  id: string;
  name: string;
  segment: 'CCR' | 'RCR' | 'OCR';
  district: string;
  street: string;
  sample: number;
  medianPriceSgd: number | null;
  medianPsf: number | null;
  href: string;
}>[], metric: 'price' | 'psf' | 'sample', page: number, pageSize?: number) => Readonly<{
  rows: readonly Readonly<{ id: string; rank: number }>[];
  pagination: Readonly<{ page: number; pageSize: number; total: number; pageCount: number; previousPage: number | null; nextPage: number | null }>;
}>;

async function candidate(): Promise<Candidate> {
  const rankingModel = await import('../lib/public-market/rankings-route-model.server');
  const fn = (rankingModel as unknown as Record<string, unknown>).buildSingaporeRankingsModel;
  expect(typeof fn).toBe('function');
  return fn as Candidate;
}

const row = (id: string, price: number, name = id, psf: number | null = price) => ({
  id, name, segment: 'CCR' as const, district: '09', street: 'TEST STREET', sample: 5,
  medianPriceSgd: price, medianPsf: psf, href: `/sg/singapore/explore/ccr/${id}/`,
});

describe('Singapore ranking route model', () => {
  it('uses the stable project ID before slicing tied prices across pages', async () => {
    const build = await candidate();
    const leading = Array.from({ length: 19 }, (_, index) => row(`project-${String(index).padStart(2, '0')}`, 1_000_000 - index));
    const source = [...leading, row('tie-z', 500_000, 'A NAME'), row('tie-a', 500_000, 'Z NAME'), row('last', 100_000)];

    const first = build(source, 'price', 1, 20);
    const second = build(source, 'price', 2, 20);

    expect(first.rows.at(-1)).toMatchObject({ id: 'tie-a', rank: 20 });
    expect(second.rows[0]).toMatchObject({ id: 'tie-z', rank: 21 });
    expect(new Set([...first.rows, ...second.rows].map(({ id }) => id)).size).toBe(22);
    expect(second.pagination).toEqual({ page: 2, pageSize: 20, total: 22, pageCount: 2, previousPage: 1, nextPage: null });
  });

  it('ranks a unit-price metric only from rows carrying verified unit prices', async () => {
    const build = await candidate();
    const result = build([row('verified', 500_000, 'Verified', 1_900), row('missing', 900_000, 'Missing', null)], 'psf', 1);

    expect(result.rows.map(({ id }) => id)).toEqual(['verified']);
    expect(result.pagination.total).toBe(1);
  });
});
