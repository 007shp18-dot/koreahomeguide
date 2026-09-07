import { describe, expect, it, vi } from 'vitest';
vi.mock('server-only', () => ({}));
vi.mock('../lib/public-market/korea-evidence-repositories.server', () => ({ koreaEvidenceRepositoriesFromEnvironment: () => ({ sale: {
  getArtifact: () => ({ stats: { eligibleRecordCount: 999 }, period: '2026-01' }),
  listBuildingRecords: () => [
    { buildingId: 'mapo-gu-tower', districtSlug: 'mapo-gu', neighborhoodName: '아현동', officialName: '서울 단지', housingType: 'apartment', cohorts: [{areaBand:'all',price:{published:true,n:7,med:550_000_000}}], recentSales: [{ priceWon: 500_000_000, areaSqm: 50 }, { priceWon: 600_000_000, areaSqm: 50 }] },
    { buildingId: 'mapo-gu-thin', districtSlug: 'mapo-gu', neighborhoodName: '아현동', officialName: '표본 부족 단지', housingType: 'apartment', cohorts: [{areaBand:'all',price:{published:false,n:2}}], recentSales: [] },
    { buildingId: 'mapo-gu-office', districtSlug: 'mapo-gu', officialName: '오피스텔', housingType: 'officetel', cohorts: [{areaBand:'all',price:{published:true,n:7,med:100_000_000}}], recentSales: [{ priceWon: 100_000_000, areaSqm: 50 }] },
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
  it('offers only published apartment buildings in Seoul and retains each candidate’s evidence count', async () => {
    const [seoul, singapore, dubai] = await loadPassportEvidence();
    expect(seoul!.scopes).toEqual([expect.objectContaining({name:'서울 단지',kind:'building',sample:7,medianPrice:550_000_000,href:'/kr/seoul/explore/mapo-gu/mapo-gu-tower/?transaction=sale&propertyType=apartment'})]);
    expect(singapore!.scopes[0]).toMatchObject({kind:'project',sample:12});
    expect(dubai!.scopes[0]).toMatchObject({kind:'ready-area',sample:20});
  });
});
