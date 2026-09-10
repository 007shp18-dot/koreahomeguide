import {
  calculateDubaiAreaEvidenceDataDigest,
  type DubaiAreaEvidenceSnapshot,
} from '../lib/dubai/evidence-contract';

export const approvedDubaiRights = Object.freeze({
  state: 'approved' as const,
  canStore: true,
  canCreateDerived: true,
  canUseCommercially: true,
  canDisplay: true,
  canIndex: true,
  policyId: 'ae-dubai-dld-area-aggregate-v1',
  sourceUrl: 'https://dubailand.gov.ae/en/open-data/real-estate-data/',
  licenseUrl: 'https://example.test/dubai-data-licence',
  attribution: 'Source: Dubai Land Department',
  checkedAt: '2026-09-06T00:00:00.000Z',
  reviewedBy: 'SignedPrice rights review',
});

export const pendingDubaiRights = Object.freeze({
  ...approvedDubaiRights,
  state: 'pending' as const,
  canStore: false,
  canCreateDerived: false,
  canUseCommercially: false,
  canDisplay: false,
  canIndex: false,
  licenseUrl: null,
  reviewedBy: null,
});

export const verifiedDubaiUnits = Object.freeze({
  state: 'verified' as const,
  currency: 'AED' as const,
  currencyFields: ['TRANS_VALUE', 'ANNUAL_AMOUNT'] as const,
  area: 'sqm' as const,
  areaField: 'ACTUAL_AREA' as const,
  evidenceUrl: 'https://example.test/dld-data-dictionary',
  checkedAt: '2026-09-06T00:00:00.000Z',
  reviewedBy: 'SignedPrice data review',
});

export const pendingDubaiUnits = Object.freeze({
  ...verifiedDubaiUnits,
  state: 'pending' as const,
  evidenceUrl: null,
  checkedAt: null,
  reviewedBy: null,
});

export const marsaDubaiSlugRegistry = Object.freeze({
  version: 'signedprice-dubai-area-slugs-v1' as const,
  entries: Object.freeze({ 'marsa dubai': 'marsa-dubai' }),
});

export function dubaiEvidenceFixture(): DubaiAreaEvidenceSnapshot {
  const snapshot: DubaiAreaEvidenceSnapshot = {
    version: 'signedprice-dubai-area-evidence-v1',
    slugRegistryVersion: 'signedprice-dubai-area-slugs-v1',
    marketId: 'ae-dubai',
    generatedAt: '2026-09-06T00:00:00.000Z',
    asOfDate: '2026-09-05',
    comparisonPeriod: { from: '2026-06-08', to: '2026-09-05' },
    sourcePeriods: {
      transactions: { from: '2026-01-01', to: '2026-09-06' },
      rents: { from: '2026-06-01', to: '2026-09-05' },
    },
    units: {
      currency: 'AED',
      currencyBasis: 'verified-source-schema',
      area: 'sqm',
      rentPeriod: 'year',
    },
    unitVerification: verifiedDubaiUnits,
    rights: approvedDubaiRights,
    publication: { displayState: 'published', indexState: 'index' },
    publicationMinimum: 30,
    sources: {
      transactions: { sha256: '1'.repeat(64), rows: 31 },
      rents: { sha256: '2'.repeat(64), rows: 60 },
      lands: { sha256: '3'.repeat(64), rows: 3 },
    },
    totals: {
      qualifyingSaleRows: 31,
      mappedSaleRows: 31,
      excludedSaleRows: 0,
      unmappedSaleRows: 0,
      qualifyingRentRows: 60,
      excludedRentRows: 0,
      unmappedRentRows: 0,
      verifiedAliases: 1,
      publishedAreas: 1,
      publishedSegments: 1,
    },
    areas: [{
      id: 'ae-dubai:area:marsa-dubai',
      slug: 'marsa-dubai',
      name: 'Marsa Dubai',
      searchAliases: ['Dubai Marina', 'Marsa Dubai'],
      segments: [{
        housing: 'apartment',
        sales: {
          ready: {
            n: 31,
            medianPriceAed: 1_500_000,
            priceP25Aed: 1_400_000,
            priceP75Aed: 1_600_000,
            medianPricePerSqmAed: 20_000,
            pricePerSqmP25Aed: 18_000,
            pricePerSqmP75Aed: 21_000,
          },
          offPlan: null,
        },
        rent: {
          newN: 30,
          renewedN: 30,
          totalN: 60,
          medianAnnualRentAed: 90_000,
          medianAnnualRentPerSqmAed: 1_200,
          newShare: 0.5,
          renewedShare: 0.5,
        },
        readyGrossYieldPct: 6,
        comparableAreaIds: { ready: [], offPlan: [] },
      }],
    }],
    dataDigest: '0'.repeat(64),
  };
  return {
    ...snapshot,
    dataDigest: calculateDubaiAreaEvidenceDataDigest(snapshot),
  };
}

export function dubaiComparableEvidenceFixture(): DubaiAreaEvidenceSnapshot {
  const base = dubaiEvidenceFixture();
  const baseArea = base.areas[0]!;
  const baseSegment = baseArea.segments[0]!;
  const ready = baseSegment.sales.ready!;
  const peerId = 'ae-dubai:area:business-bay';
  const areas = [{
    ...baseArea,
    segments: [{
      ...baseSegment,
      sales: {
        ready,
        offPlan: { ...ready, medianPriceAed: 1_800_000, priceP75Aed: 1_900_000 },
      },
      comparableAreaIds: { ready: [peerId], offPlan: [peerId] },
    }],
  }, {
    ...baseArea,
    id: peerId,
    slug: 'business-bay',
    name: 'Business Bay',
    searchAliases: ['Business Bay'],
    segments: [{
      ...baseSegment,
      sales: {
        ready: {
          ...ready,
          medianPriceAed: 2_000_000,
          priceP25Aed: 1_900_000,
          priceP75Aed: 2_100_000,
        },
        offPlan: {
          ...ready,
          medianPriceAed: 2_200_000,
          priceP25Aed: 2_100_000,
          priceP75Aed: 2_300_000,
        },
      },
      readyGrossYieldPct: 4.5,
      comparableAreaIds: { ready: [], offPlan: [] },
    }],
  }];
  const snapshot: DubaiAreaEvidenceSnapshot = {
    ...base,
    sources: {
      ...base.sources,
      transactions: { ...base.sources.transactions, rows: 124 },
      rents: { ...base.sources.rents, rows: 120 },
    },
    totals: {
      ...base.totals,
      qualifyingSaleRows: 124,
      mappedSaleRows: 124,
      excludedSaleRows: 0,
      unmappedSaleRows: 0,
      qualifyingRentRows: 120,
      excludedRentRows: 0,
      unmappedRentRows: 0,
      publishedAreas: 2,
      publishedSegments: 2,
    },
    areas,
  };
  return withDubaiEvidenceDataDigest(snapshot);
}

export function withDubaiEvidenceDataDigest(
  snapshot: DubaiAreaEvidenceSnapshot,
): DubaiAreaEvidenceSnapshot {
  return {
    ...snapshot,
    dataDigest: calculateDubaiAreaEvidenceDataDigest(snapshot),
  };
}
