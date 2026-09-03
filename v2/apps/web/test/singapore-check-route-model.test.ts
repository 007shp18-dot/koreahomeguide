import { describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

import {
  buildSingaporeCheckArtifact,
  stringifySingaporeCheckArtifact,
  type HdbRentCheckRecord,
  type UraPrivateSaleCheckRecord,
} from '@signedprice/singapore-property';
import { createSingaporeCheckEvidenceRepositories } from '../lib/singapore/check-evidence-repository.server';
import { buildSingaporeCheckRouteModel } from '../lib/singapore/check-route-model.server';

const uraRecord = (amountSgd: number): UraPrivateSaleCheckRecord => ({
  market: 'ura-private-sale', month: '2026-08', amountSgd, marketSegment: 'CCR',
  projectId: 'project-a', project: 'Project A', propertyType: 'Condominium', district: '09',
  floorAreaSqm: 100, floorRange: '06-10', tenure: '99 yrs', saleType: 'Resale', psf: 1_900,
});
const rentRecord = (amountSgd: number): HdbRentCheckRecord => ({
  market: 'hdb-rent', month: '2026-08', amountSgd, town: 'BEDOK', blockId: 'block-a',
  block: '10', street: 'BEDOK ROAD', flatType: '3-ROOM',
});

async function repositories() {
  const ura = buildSingaporeCheckArtifact({ market: 'ura-private-sale', sourceIdentifier: 'URA', generatedAt: '2026-09-02T00:00:00.000Z', records: [1, 2, 3, 4, 5].map((value) => uraRecord(value * 100_000)) });
  const rent = buildSingaporeCheckArtifact({ market: 'hdb-rent', sourceIdentifier: 'HDB', generatedAt: '2026-09-02T00:00:00.000Z', records: [2_000, 2_100, 2_200, 2_300, 2_400].map(rentRecord) });
  return createSingaporeCheckEvidenceRepositories({
    'ura-private-sale': { serialized: stringifySingaporeCheckArtifact(ura), expectedDigest: ura.digest, expectedPeriod: '2026-08/2026-08' },
    'hdb-rent': { serialized: stringifySingaporeCheckArtifact(rent), expectedDigest: rent.digest, expectedPeriod: '2026-08/2026-08' },
  });
}

describe('Singapore Check route model', () => {
  it('derives native option catalogs without exposing records', async () => {
    const model = buildSingaporeCheckRouteModel(await repositories(), {});
    expect(model.catalogs['ura-private-sale']).toMatchObject({ available: true, projects: [{ id: 'project-a', label: 'Project A' }], districts: ['09'] });
    expect(model.catalogs['hdb-resale']).toMatchObject({ available: false });
    expect(model.catalogs['hdb-rent']).toMatchObject({ available: true, towns: ['BEDOK'], flatTypes: ['3-ROOM'] });
    expect(JSON.stringify(model.catalogs)).not.toContain('amountSgd');
    expect(model.result).toEqual({ kind: 'empty' });
  });

  it('evaluates one native URA offer from strict query fields', async () => {
    const model = buildSingaporeCheckRouteModel(await repositories(), {
      submitted: '1', mode: 'single', 'a-market': 'ura-private-sale', 'a-amount': '350000',
      'a-segment': 'CCR', 'a-project': 'project-a', 'a-district': '09',
      'a-property-type': 'Condominium', 'a-area-min': '80', 'a-area-max': '120',
      'a-month': '2026-08',
    });
    expect(model.result).toMatchObject({ kind: 'single', offer: { status: 'ready', distribution: { median: 300_000 }, percentile: 60, sampleCount: 5 } });
  });

  it('keeps cross-market A/B comparison neutral', async () => {
    const model = buildSingaporeCheckRouteModel(await repositories(), {
      submitted: '1', mode: 'compare', 'a-market': 'ura-private-sale', 'a-amount': '350000',
      'a-segment': 'CCR', 'a-project': 'project-a', 'a-district': '09', 'a-property-type': 'Condominium', 'a-area-min': '80', 'a-area-max': '120',
      'b-market': 'hdb-rent', 'b-amount': '2150', 'b-town': 'BEDOK', 'b-block': 'block-a', 'b-flat-type': '3-ROOM',
    });
    expect(model.result).toMatchObject({ kind: 'comparison', comparison: { status: 'ready', verdict: 'tradeoff', winner: null, marketRelationship: 'cross-market' } });
  });

  it('rejects duplicate or malformed query values', async () => {
    const duplicate = buildSingaporeCheckRouteModel(await repositories(), { submitted: '1', 'a-market': ['hdb-rent', 'ura-private-sale'] });
    expect(duplicate.result).toEqual({ kind: 'invalid', message: 'Check parameters are invalid.' });
  });
});
