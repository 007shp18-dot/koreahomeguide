import { describe, expect, it } from 'vitest';
import { buildMonthlyResearch, calculatePropertyScenario, summarizeSizeCohorts } from '../lib/research/property-research';

describe('property research calculations', () => {
  it('keeps missing months and suppresses prices below five, without dropping volume', () => {
    const rows = [100, 200, 300, 400, 500].map((price) => ({ month: '2026-01', price, area: 50, group: 'resale' }));
    const result = buildMonthlyResearch([...rows, { month: '2026-03', price: 999, area: 50, group: 'resale' }], '2026-01', '2026-03');
    expect(result).toEqual([
      { month: '2026-01', count: 5, median: 300 },
      { month: '2026-02', count: 0, median: null },
      { month: '2026-03', count: 1, median: null },
    ]);
  });
  it('separates property, sale and area-basis groups before comparing sizes', () => {
    const rows = [1, 2, 3, 4, 5].map(() => ({ month: '2026-01', price: 1_000_000, area: 80, group: 'condominium · resale · strata' }));
    const result = summarizeSizeCohorts([...rows, { month: '2026-01', price: 8_000_000, area: 80, group: 'detached · resale · land' }]);
    expect(result).toContainEqual({ group: 'condominium · resale · strata', size: '60–85 m²', count: 5, median: 1_000_000 });
    expect(result).toContainEqual({ group: 'detached · resale · land', size: '60–85 m²', count: 1, median: null });
  });
  it('includes acquisition costs and vacancy and distinguishes operating return from financed return', () => {
    expect(calculatePropertyScenario({ price: 1_000_000, acquisitionCosts: 100_000, monthlyRent: 5_000, annualCosts: 12_000, vacancyMonths: 2 })).toEqual({
      totalCost: 1_100_000, annualRent: 50_000, netIncome: 38_000, grossYield: 5, netYield: 38_000 / 1_100_000 * 100,
    });
    expect(calculatePropertyScenario({ price: 0, acquisitionCosts: 0, monthlyRent: 0, annualCosts: 0, vacancyMonths: 0 })).toBeNull();
    expect(calculatePropertyScenario({ price: 1, acquisitionCosts: 0, monthlyRent: 0, annualCosts: 0, vacancyMonths: 13 })).toBeNull();
  });
});
