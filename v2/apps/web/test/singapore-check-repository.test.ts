import { describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

import {
  buildSingaporeCheckArtifact,
  stringifySingaporeCheckArtifact,
  type UraPrivateSaleCheckRecord,
} from '@signedprice/singapore-property';
import {
  createSingaporeCheckEvidenceRepositories,
} from '../lib/singapore/check-evidence-repository.server';

function record(amountSgd: number): UraPrivateSaleCheckRecord {
  return {
    market: 'ura-private-sale', month: '2026-08', amountSgd,
    marketSegment: 'CCR', projectId: 'project-a', project: 'Project A',
    propertyType: 'Condominium', district: '09', floorAreaSqm: 100,
    floorRange: '06-10', tenure: '99 yrs from 2020', saleType: 'Resale', psf: 1_858,
  };
}

describe('Singapore Check evidence repositories', () => {
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
