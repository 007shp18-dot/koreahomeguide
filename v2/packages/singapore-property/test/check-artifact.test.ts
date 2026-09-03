import { describe, expect, it } from 'vitest';

import {
  buildSingaporeCheckArtifact,
  parseSingaporeCheckArtifact,
  singaporeLatestCompletedMonth,
  stringifySingaporeCheckArtifact,
  type UraPrivateSaleCheckRecord,
} from '../src/check-artifact';

function record(overrides: Partial<UraPrivateSaleCheckRecord> = {}): UraPrivateSaleCheckRecord {
  return {
    market: 'ura-private-sale',
    month: '2026-08',
    amountSgd: 2_000_000,
    marketSegment: 'CCR',
    projectId: 'project-a',
    project: 'Project A',
    propertyType: 'Condominium',
    district: '09',
    floorAreaSqm: 100,
    floorRange: '06-10',
    tenure: '99 yrs from 2020',
    saleType: 'Resale',
    psf: 1_858,
    ...overrides,
  };
}

describe('Singapore Check artifact', () => {
  it('cuts raw builders at the latest Singapore completed month', () => {
    expect(singaporeLatestCompletedMonth('2026-09-01T00:00:00.000Z')).toBe('2026-08');
    expect(singaporeLatestCompletedMonth('2026-01-01T00:00:00.000Z')).toBe('2025-12');
  });

  it('owns exact source, period, row-count, schema, and digest metadata', () => {
    const artifact = buildSingaporeCheckArtifact({
      market: 'ura-private-sale',
      sourceIdentifier: 'URA private residential transactions',
      generatedAt: '2026-09-02T00:00:00.000Z',
      records: [record({ month: '2026-07' }), record()],
    });

    expect(artifact).toMatchObject({
      version: 'signedprice-singapore-check-market-v1',
      market: 'ura-private-sale',
      sourceIdentifier: 'URA private residential transactions',
      generatedAt: '2026-09-02T00:00:00.000Z',
      period: { from: '2026-07', to: '2026-08' },
      recordCount: 2,
    });
    expect(artifact.digest).toMatch(/^[a-f0-9]{64}$/);
    expect(parseSingaporeCheckArtifact(
      stringifySingaporeCheckArtifact(artifact),
      'ura-private-sale',
    )).toEqual(artifact);
  });

  it('rejects digest mutation, extra keys, and cross-market installation', () => {
    const artifact = buildSingaporeCheckArtifact({
      market: 'ura-private-sale',
      sourceIdentifier: 'URA private residential transactions',
      generatedAt: '2026-09-02T00:00:00.000Z',
      records: [record()],
    });
    const mutated = JSON.parse(stringifySingaporeCheckArtifact(artifact));
    mutated.records[0].amountSgd = 1;
    expect(() => parseSingaporeCheckArtifact(JSON.stringify(mutated), 'ura-private-sale'))
      .toThrow('Singapore Check artifact digest is invalid.');

    const extra = JSON.parse(stringifySingaporeCheckArtifact(artifact));
    extra.records[0].invented = true;
    expect(() => buildSingaporeCheckArtifact({
      market: 'ura-private-sale',
      sourceIdentifier: 'URA private residential transactions',
      generatedAt: '2026-09-02T00:00:00.000Z',
      records: extra.records,
    })).toThrow('Singapore Check record is invalid.');

    expect(() => parseSingaporeCheckArtifact(
      stringifySingaporeCheckArtifact(artifact),
      'hdb-resale',
    )).toThrow('Singapore Check artifact market does not match.');
  });
});
