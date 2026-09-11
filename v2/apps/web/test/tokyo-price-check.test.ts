import { describe, expect, it, vi } from 'vitest';
vi.mock('server-only', () => ({}));
import { parseTokyoCheck, compareTokyoPrice } from '../lib/japan/price-check';
import { readTokyoPriceEvidence } from '../lib/japan/price-check.server';

describe('Tokyo asking-price comparison', () => {
  it('requires positive bounded inputs and one published ward, without inventing an asking price', () => {
    expect(parseTokyoCheck({})).toBeNull();
    expect(parseTokyoCheck({ city: '13103', area: '60', price: '90000000' })).toEqual({ city: '13103', area: 60, price: 90000000, neighbourhood: '' });
    for (const invalid of [{ area: '0' }, { price: 'Infinity' }, { city: '13000' }, { area: ['60', '80'] }, { price: '-1' }, { area: '2001' }]) {
      expect(() => parseTokyoCheck({ city: '13103', area: '60', price: '90000000', ...invalid })).toThrow();
    }
  });
  it('compares unit prices, not a paginated median or a size-adjusted valuation', () => {
    expect(compareTokyoPrice(90000000, 60, { count: 12, median: 1000000, lower: 800000, upper: 1200000 })).toEqual({ askingPerSqm: 1500000, differencePercent: 50 });
    expect(compareTokyoPrice(90000000, 60, { count: 4, median: 1000000, lower: 800000, upper: 1200000 })).toBeNull();
    expect(compareTokyoPrice(90000000, 60, { count: 12, median: 0, lower: 0, upper: 0 })).toBeNull();
  });
  it('aggregates the complete activated condominium cohort with exact neighbourhood and a disclosed size band', async () => {
    const query = vi.fn().mockResolvedValue([{ count: 12, median: '1000000', lower: '800000', upper: '1200000', retrieved_at: '2026-08-01' }]);
    const result = await readTokyoPriceEvidence({ city:'13103', year:'2026', quarter:'1', neighbourhood:'Azabu', minArea:48, maxArea:72 }, { query, transaction:vi.fn() });
    expect(result).toMatchObject({ count:12, median:1000000, lower:800000, upper:1200000 });
    const [sql, values] = query.mock.calls[0]!;
    expect(sql).toContain("r.state = 'published'");
    expect(sql).toContain("a.record->>'district' = $4");
    expect(sql).not.toMatch(/LIMIT|OFFSET/);
    expect(values).toEqual(['13103','2026','1','Azabu',48,72,'Pre-owned Condominiums, etc.']);
  });
});
