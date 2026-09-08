import { describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

import {
  buildSingaporeCheckArtifact,
  stringifySingaporeCheckArtifact,
  type UraPrivateSaleCheckRecord,
} from '@signedprice/singapore-property';
import {
  createSingaporeCheckEvidenceRepositories,
  singaporeCheckEvidenceRepositoriesFromEnvironment,
} from '../lib/singapore/check-evidence-repository.server';
import { buildSingaporeCheckRouteModel } from '../lib/singapore/check-route-model.server';

function record(amountSgd: number): UraPrivateSaleCheckRecord {
  return {
    market: 'ura-private-sale', month: '2026-08', amountSgd,
    marketSegment: 'CCR', projectId: 'project-a', project: 'Project A',
    propertyType: 'Condominium', district: '09', floorAreaSqm: 100,
    floorRange: '06-10', tenure: '99 yrs from 2020', saleType: 'Resale', psf: 1_858,
  };
}

describe('Singapore Check evidence repositories', () => {
  it('validates an object source without copying transaction history and still rejects tampering', async () => {
    const artifact = buildSingaporeCheckArtifact({
      market: 'ura-private-sale', sourceIdentifier: 'URA',
      generatedAt: '2026-09-02T00:00:00.000Z', records: [record(100)],
    });
    const source = {
      payload: artifact, expectedDigest: artifact.digest, expectedPeriod: '2026-08/2026-08',
    };
    const repositories = await createSingaporeCheckEvidenceRepositories({ 'ura-private-sale': source });
    expect(repositories.get('ura-private-sale')).toBe(artifact);
    const tampered = { ...artifact, records: [record(999)] };
    const rejected = await createSingaporeCheckEvidenceRepositories({
      'ura-private-sale': { ...source, payload: tampered },
    });
    expect(rejected.get('ura-private-sale')).toBeNull();
  });
  it('reuses immutable installed evidence but respects disabled and overridden sources', async () => {
    const first = singaporeCheckEvidenceRepositoriesFromEnvironment();
    expect(singaporeCheckEvidenceRepositoriesFromEnvironment()).toBe(first);
    try {
      vi.stubEnv('SIGNEDPRICE_USE_CHECKED_IN_SNAPSHOTS', 'false');
      expect((await singaporeCheckEvidenceRepositoriesFromEnvironment()).get('hdb-resale')).toBeNull();
      vi.stubEnv('SIGNEDPRICE_USE_CHECKED_IN_SNAPSHOTS', 'true');
      vi.stubEnv('SIGNEDPRICE_SINGAPORE_CHECK_HDB_RESALE_ARTIFACT', '{}');
      expect((await singaporeCheckEvidenceRepositoriesFromEnvironment()).get('hdb-resale')).toBeNull();
    } finally { vi.unstubAllEnvs(); }
    expect(singaporeCheckEvidenceRepositoriesFromEnvironment()).toBe(first);
  }, 30_000);
  it('checks installed HDB resale and rental rows through the last completed month', async () => {
    const repositories = await singaporeCheckEvidenceRepositoriesFromEnvironment();
    for (const market of ['hdb-resale', 'hdb-rent'] as const) {
      const artifact = repositories.get(market);
      expect(artifact).not.toBeNull();
      expect(artifact!.period.to).toBe('2026-08');
      expect(artifact!.records.every(row => row.month <= '2026-08')).toBe(true);
      const model = buildSingaporeCheckRouteModel(repositories, {
        submitted: '1', 'a-market': market, 'a-town': 'ANG MO KIO',
        'a-flat-type': market === 'hdb-resale' ? '4 ROOM' : '4-ROOM',
        'a-amount': market === 'hdb-resale' ? '600000' : '3000',
        'a-area-min': '80', 'a-area-max': '110',
      });
      expect(model.result.kind).toBe('single');
      if (model.result.kind === 'single') expect(model.result.offer.status).toBe('ready');
    }
  }, 30_000);
  it('checks an Explore project using the installed private-sale records', async () => {
    const repositories = await singaporeCheckEvidenceRepositoriesFromEnvironment();
    const artifact = repositories.get('ura-private-sale');
    expect(artifact).not.toBeNull();
    const project = artifact!.records.find(row => row.project === 'PARKTOWN RESIDENCE')!;
    const model = buildSingaporeCheckRouteModel(repositories, {
      submitted: '1', 'a-market': 'ura-private-sale', 'a-amount': '1852000',
      'a-project': project.projectId, 'a-segment': project.marketSegment,
      'a-district': project.district, 'a-property-type': project.propertyType,
      'a-area-min': '80', 'a-area-max': '120',
    });
    expect(model.catalogs['ura-private-sale'].available).toBe(true);
    expect(model.result.kind).toBe('single');
    if (model.result.kind === 'single') expect(model.result.offer.status).toBe('ready');
  });
  it('validates three markets independently through a Check-only source', async () => {
    const artifact = buildSingaporeCheckArtifact({
      market: 'ura-private-sale', sourceIdentifier: 'URA',
      generatedAt: '2026-09-02T00:00:00.000Z',
      records: [100, 200, 300, 400, 500].map(record),
    });
    const repositories = await createSingaporeCheckEvidenceRepositories({
      'ura-private-sale': {
        serialized: stringifySingaporeCheckArtifact(artifact),
        expectedDigest: artifact.digest,
        expectedPeriod: '2026-08/2026-08',
      },
      'hdb-resale': {
        serialized: stringifySingaporeCheckArtifact(artifact),
        expectedDigest: artifact.digest,
        expectedPeriod: '2026-08/2026-08',
      },
    });

    expect(repositories.get('ura-private-sale')).toEqual(artifact);
    expect(repositories.get('hdb-resale')).toBeNull();
    expect(repositories.get('hdb-rent')).toBeNull();
    expect(repositories.availability()).toEqual({
      'ura-private-sale': true,
      'hdb-resale': false,
      'hdb-rent': false,
    });
  });

  it('fails only the digest- or period-mismatched market closed', async () => {
    const artifact = buildSingaporeCheckArtifact({
      market: 'ura-private-sale', sourceIdentifier: 'URA',
      generatedAt: '2026-09-02T00:00:00.000Z', records: [record(100)],
    });
    const repositories = await createSingaporeCheckEvidenceRepositories({
      'ura-private-sale': {
        serialized: stringifySingaporeCheckArtifact(artifact),
        expectedDigest: '0'.repeat(64),
        expectedPeriod: '2026-08/2026-08',
      },
    });

    expect(repositories.get('ura-private-sale')).toBeNull();
  });
});
