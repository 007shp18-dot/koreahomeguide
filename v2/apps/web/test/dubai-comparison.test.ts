import { describe, expect, it } from 'vitest';
import { comparisonFromHash, comparisonHash, comparisonRows, parseDubaiComparison, saveComparison, savedComparisons, type DubaiComparison } from '../lib/dubai/comparison';
import { dubaiEvidenceFixture } from './dubai-evidence-fixture';
const preset: DubaiComparison = { areas: ['marsa-dubai', 'business-bay'], housing: 'apartment', stage: 'ready', from: '2026-06-08', to: '2026-09-05' };
describe('browser-only Dubai comparisons', () => {
  it('round trips a bounded share fragment without prices or query parameters', () => {
    expect(comparisonFromHash(comparisonHash(preset))).toEqual(preset);
    expect(comparisonHash(preset)).not.toMatch(/price|\?/);
  });
  it('rejects malformed, oversized, duplicate and unsupported inputs', () => {
    for (const value of [null, {}, { ...preset, areas: ['a'] }, { ...preset, areas: ['a', 'b', 'c', 'd'] }, { ...preset, areas: ['a', 'a'] }, { ...preset, areas: ['a', '<script>'] }, { ...preset, stage: 'rent' }, { ...preset, housing: ['apartment'] }, { ...preset, stage: ['ready'] }, { ...preset, from: '2026-02-30' }, { ...preset, to: '2025-01-01' }]) expect(parseDubaiComparison(value)).toBeNull();
    for (const hash of ['#other', '#compare=%', '#compare=' + 'x'.repeat(2050)]) expect(comparisonFromHash(hash)).toBeNull();
    expect(savedComparisons('[')).toEqual([]);
    expect(savedComparisons(' '.repeat(16001))).toEqual([]);
  });
  it('caps storage and replaces equivalent selections with the latest period', () => {
    let saved: DubaiComparison[] = [];
    for (let i = 0; i < 12; i++) saved = saveComparison(saved, { ...preset, areas: [`area-${i}`, 'marsa-dubai'] });
    expect(saved).toHaveLength(10);
    expect(saved[0]?.areas[0]).toBe('area-11');
    const next = { ...saved[0]!, areas: [...saved[0]!.areas].reverse(), to: '2026-09-06' };
    const deduped = saveComparison(saved, next);
    expect(deduped).toHaveLength(10);
    expect(deduped[0]).toEqual(next);
    expect(savedComparisons(JSON.stringify([{}, ...deduped]))).toHaveLength(9);
  });
  it('uses only the same housing and stage and leaves missing data empty', () => {
    const areas = dubaiEvidenceFixture().areas.map(area => ({ ...area, href: null }));
    const rows = comparisonRows(areas, preset);
    expect(rows[0]?.sale?.medianPriceAed).toBe(1500000);
    expect(rows[0]?.rent?.medianAnnualRentAed).toBe(90000);
    expect(rows[1]?.area).toBeNull();
    expect(rows[1]?.sale).toBeNull();
    expect(comparisonRows(areas, { ...preset, housing: 'villa' })[0]?.sale).toBeNull();
    const offPlan = comparisonRows(areas, { ...preset, stage: 'off-plan' });
    expect(offPlan[0]?.sale).toBeNull();
    expect(offPlan[0]?.rent).toBeNull();
  });
});
