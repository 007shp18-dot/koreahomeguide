import { describe, expect, it, vi } from 'vitest';
vi.mock('server-only', () => ({}));
vi.mock('../lib/public-market/korea-evidence-repositories.server', () => ({ koreaEvidenceRepositoriesFromEnvironment: () => ({ sale: {
  getArtifact: () => ({ stats: { eligibleRecordCount: 999 }, period: '2026-01' }),
  listBuildingRecords: () => [
    { housingType: 'apartment', recentSales: [{ priceWon: 500_000_000, areaSqm: 50 }, { priceWon: 600_000_000, areaSqm: 50 }] },
    { housingType: 'officetel', recentSales: [{ priceWon: 100_000_000, areaSqm: 50 }] },
  ], listAreaRecords: () => [],
} }) }));
vi.mock('../lib/singapore/snapshot-repository.server', () => ({ singaporeSnapshotRepositoryFromEnvironment: async () => ({
  listSegments: () => [{ segment: 'CCR' }],
  listProjects: () => [{ published: true, propertyTypes: ['apartment'], n: 12, medianPsf: 2000, medianPriceSgd: 1_000_000, project: 'One', marketSegment: 'CCR', id: 'one' }],
  getContext: () => ({ transactions: 999, period: '2026-01' }),
}) }));
vi.mock('../lib/dubai/evidence-repository.server', () => ({ dubaiEvidenceRepositoryFromEnvironment: () => ({
  listAreas: () => [
    { name: 'Apartment area', slug: 'apartment', segments: [{ housing: 'apartment', readyGrossYieldPct: 6, sales: { ready: { n: 20, medianPricePerSqmAed: 18000, medianPriceAed: 1_000_000 } } }] },
    { name: 'Villa only', slug: 'villa', segments: [{ housing: 'villa', readyGrossYieldPct: 5, sales: { ready: { n: 300, medianPricePerSqmAed: 1000, medianPriceAed: 500_000 } } }] },
  ], getContext: () => ({ comparisonPeriod: { from: '2026-01-01', to: '2026-01-31' } }),
}) }));
import { loadPassportEvidence } from '../lib/passport/evidence.server';
describe('Passport evidence scope', () => {
  it('counts only included records and discloses the unit-price aggregation basis', async () => {
    const [seoul, singapore, dubai] = await loadPassportEvidence();
    expect(seoul).toMatchObject({ sample: 2, priceSample: 2, priceBasis: 'transactions', medianPsm: 11_000_000 });
    expect(singapore).toMatchObject({ sample: 12, priceSample: 1, priceBasis: 'projects' });
    expect(dubai).toMatchObject({ sample: 20, priceSample: 1, priceBasis: 'areas', medianPsm: 18000 });
    expect(dubai!.scopes.map(s => s.name)).toEqual(['Apartment area']);
  });
});
