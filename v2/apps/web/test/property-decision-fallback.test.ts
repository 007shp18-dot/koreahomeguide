import { describe, expect, it, vi } from 'vitest';
vi.mock('server-only', () => ({}));
import { koreaDecisionPriceFallback, singaporeDecisionPriceFallback } from '../lib/research/property-decision-fallback.server';
import type { KoreaEvidenceRepositories } from '../lib/public-market/korea-evidence-repositories.server';
import type { SingaporeSnapshotRepository } from '../lib/singapore/snapshot-repository.server';

const published = { published: true, n: 20, min: 400_000_000, p25: 450_000_000, med: 500_000_000, p75: 550_000_000, max: 600_000_000 };
const request = { district: 'seongdong-gu', buildingId: 'review-test', housingType: 'apartment', transaction: 'sale', areaBand: '60-85', contractGroup: 'not-applicable' } as const;
function repositories(broaderProperty = false, publishedDistrict = true): KoreaEvidenceRepositories {
  const building = { buildingId: 'review-test', districtSlug: 'seongdong-gu', housingType: 'apartment', cohorts: [
    { areaBand: '60-85', price: { published: false, n: 2 } },
    { areaBand: 'all', price: broaderProperty ? { ...published, med: 800_000_000, p25: 700_000_000, p75: 900_000_000 } : { published: false, n: 3 } },
  ] };
  return { rent: null, sale: {
    getArtifact: () => ({ period: '2026-02/2026-08' }), listBuildingRecords: () => [building],
    listAreaRecords: () => [{ scope: 'district', districtSlug: 'seongdong-gu', housingType: 'apartment', cohorts: [{ areaBand: '60-85', price: publishedDistrict ? published : { published: false, n: 4 } }] }],
  } } as unknown as KoreaEvidenceRepositories;
}

describe('published price context when an exact property cohort is unavailable', () => {
  it('uses the district’s published distribution with explicit area scope and its own count', () => {
    const result = koreaDecisionPriceFallback({ ...request, repositories: repositories() });
    expect(result?.en).toMatchObject({ scope: 'area', amount: 500_000_000, count: 20, currency: 'KRW', period: '2026-02/2026-08', range: { low: 450_000_000, high: 550_000_000 } });
    expect(result?.en.note).toContain('not this property’s price');
    expect(result?.ko.label).toContain('성동구');
    expect(result?.['zh-CN'].note).toContain('不代表本项目价格');
  });

  it('prefers a separately published broader property cohort and discloses the broader area band', () => {
    const result = koreaDecisionPriceFallback({ ...request, repositories: repositories(true) });
    expect(result?.en).toMatchObject({ scope: 'property', amount: 800_000_000, count: 20 });
    expect(result?.en.basis).toContain('all sizes');
    expect(result?.en.note).toContain('wider size and contract scope');
  });

  it('keeps unavailable and wrong-transaction evidence empty instead of calculating from hidden cohorts', () => {
    expect(koreaDecisionPriceFallback({ ...request, repositories: repositories(false, false) })).toBeUndefined();
    expect(koreaDecisionPriceFallback({ ...request, transaction: 'monthly', repositories: repositories() })).toBeUndefined();
    expect(koreaDecisionPriceFallback({ ...request, housingType: 'officetel', repositories: repositories() })).toBeUndefined();
  });

  it('uses the Singapore region’s published median and never creates one when the region is suppressed', () => {
    const repository = {
      getSegment: () => ({ segment: 'CCR', published: true, n: 100, medianPriceSgd: 2_500_000, p25PriceSgd: 1_800_000, p75PriceSgd: 3_800_000 }),
      getContext: () => ({ period: '2021-08..2026-08' }),
    } as unknown as SingaporeSnapshotRepository;
    expect(singaporeDecisionPriceFallback(repository, 'CCR')?.en).toMatchObject({ scope: 'area', amount: 2_500_000, count: 100, currency: 'SGD', range: { low: 1_800_000, high: 3_800_000 } });
    expect(singaporeDecisionPriceFallback(repository, 'CCR')?.en.note).toContain('not this project’s price');
    expect(singaporeDecisionPriceFallback({ ...repository, getSegment: () => ({ published: false, n: 3 }) } as unknown as SingaporeSnapshotRepository, 'CCR')).toBeUndefined();
  });
});
