import { describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

import {
  MOLIT_ENDPOINT_VERSION,
  MOLIT_PARSER_VERSION,
  MOLIT_RIGHTS_POLICY_ID,
  MOLIT_SALE_ENDPOINT_VERSION,
  MOLIT_SALE_PARSER_VERSION,
  MOLIT_SALE_RIGHTS_POLICY_ID,
  buildKoreaRentEvidence,
  buildKoreaSaleEvidence,
  type KoreaRentRecord,
  type KoreaSaleRecord,
} from '@signedprice/korea-rent';

import { createKoreaEvidenceRepositoryLoader } from '../lib/public-market/korea-evidence-repositories.server';
import { buildKoreaRentEvidenceArtifact } from '../lib/public-market/rent-evidence-artifact-builder.server';
import { buildKoreaSaleEvidenceArtifact } from '../lib/public-market/sale-evidence-artifact-builder.server';

const period = '2026-01/2026-07';
const generatedAt = '2026-08-01T00:00:00.000Z';
const months = [
  '2026-01', '2026-02', '2026-03', '2026-04', '2026-05', '2026-06', '2026-07',
] as const;

function rentRecord(index: number): KoreaRentRecord {
  return {
    sourceHousingType: 'apartment',
    areaSqm: 45 + index,
    depositWon: (index + 1) * 100_000_000,
    monthlyRentWon: 0,
    contractDate: `2026-07-${String(index + 1).padStart(2, '0')}`,
    contractType: 'new',
    recordStatus: 'active',
    legalDong: '대치동',
    buildingLabel: '검증아파트',
  };
}

function saleRecord(index: number): KoreaSaleRecord {
  return {
    sourceHousingType: 'apartment',
    areaSqm: 45 + index,
    priceWon: (index + 1) * 200_000_000,
    contractDate: `2026-07-${String(index + 1).padStart(2, '0')}`,
    recordStatus: 'active',
    legalDong: '대치동',
    buildingLabel: '검증아파트',
  };
}

async function fixtures() {
  const rent = await buildKoreaRentEvidenceArtifact(buildKoreaRentEvidence({
    period,
    completedMonths: months,
    generatedAt,
    records: Array.from({ length: 5 }, (_, index) => ({
      districtSlug: 'gangnam-gu' as const,
      record: rentRecord(index),
    })),
  }));
  const sale = await buildKoreaSaleEvidenceArtifact(buildKoreaSaleEvidence({
    period,
    completedMonths: months,
    generatedAt,
    records: Array.from({ length: 5 }, (_, index) => ({
      districtSlug: 'gangnam-gu' as const,
      record: saleRecord(index),
    })),
  }));
  return { rent, sale };
}

function registry(
  input: Awaited<ReturnType<typeof fixtures>>,
  datasets: readonly ('rent' | 'sale')[] = ['rent', 'sale'],
) {
  const snapshots = [];
  if (datasets.includes('rent')) snapshots.push({
    marketId: 'kr-seoul', dataset: 'kr-rent',
    schemaVersion: 'signedprice-korea-rent-evidence-v1',
    sourceVersion: MOLIT_ENDPOINT_VERSION, parserVersion: MOLIT_PARSER_VERSION,
    rightsPolicyId: MOLIT_RIGHTS_POLICY_ID, period, generatedAt,
    objectUrl: 'installed://kr-rent', sha256: input.rent.sha256,
    recordCount: input.rent.recordCount,
  });
  if (datasets.includes('sale')) snapshots.push({
    marketId: 'kr-seoul', dataset: 'kr-sale',
    schemaVersion: 'signedprice-korea-sale-evidence-v1',
    sourceVersion: MOLIT_SALE_ENDPOINT_VERSION, parserVersion: MOLIT_SALE_PARSER_VERSION,
    rightsPolicyId: MOLIT_SALE_RIGHTS_POLICY_ID, period, generatedAt,
    objectUrl: 'installed://kr-sale', sha256: input.sale.sha256,
    recordCount: input.sale.recordCount,
  });
  return { registryVersion: 'signedprice-installed-snapshots-v1', snapshots };
}

function resolver(input: Awaited<ReturnType<typeof fixtures>>) {
  return (objectUrl: string): unknown => ({
    'installed://kr-rent': input.rent.artifact,
    'installed://kr-sale': input.sale.artifact,
  })[objectUrl];
}

describe('installed Korea evidence repositories', () => {
  it('activates rent and sale independently and exposes exact-cohort lookups', async () => {
    const source = await fixtures();
    const loader = createKoreaEvidenceRepositoryLoader();
    const both = loader.load({ registrySource: registry(source), resolveObject: resolver(source) });
    expect(both.rent?.getAreaRecord('seoul:all').cohorts).toHaveLength(40);
    expect(both.sale?.getAreaRecord('seoul:all').cohorts).toHaveLength(5);
    const rentBuilding = both.rent?.listBuildingRecords()[0];
    const saleBuilding = both.sale?.listBuildingRecords()[0];
    expect(both.rent?.getBuilding('gangnam-gu', rentBuilding!.buildingId)).toBe(rentBuilding);
    expect(both.sale?.getBuilding('gangnam-gu', saleBuilding!.buildingId)).toBe(saleBuilding);

    const rentOnly = createKoreaEvidenceRepositoryLoader().load({
      registrySource: registry(source, ['rent']),
      resolveObject: resolver(source),
    });
    expect(rentOnly.rent).not.toBeNull();
    expect(rentOnly.sale).toBeNull();
  });

  it.each([
    ['digest', { sha256: 'f'.repeat(64) }],
    ['period', { period: '2025-01/2025-07' }],
    ['count', { recordCount: 999 }],
  ] as const)('keeps rent ready when only sale %s verification fails', async (_label, overrides) => {
    const source = await fixtures();
    const modified = registry(source) as { snapshots: Array<Record<string, unknown>> };
    Object.assign(modified.snapshots.find(({ dataset }) => dataset === 'kr-sale')!, overrides);
    const loaded = createKoreaEvidenceRepositoryLoader().load({
      registrySource: modified,
      resolveObject: resolver(source),
    });
    expect(loaded.rent).not.toBeNull();
    expect(loaded.sale).toBeNull();
  });

  it('retains each last-known-good repository when a later activation is malformed', async () => {
    const source = await fixtures();
    const loader = createKoreaEvidenceRepositoryLoader();
    const first = loader.load({ registrySource: registry(source), resolveObject: resolver(source) });
    const second = loader.load({
      registrySource: { registryVersion: 'broken', snapshots: [] },
      resolveObject: () => undefined,
    });
    expect(second.rent).toBe(first.rent);
    expect(second.sale).toBe(first.sale);
  });
});
