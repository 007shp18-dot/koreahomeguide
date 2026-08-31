import { readFileSync } from 'node:fs';
import { describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

import {
  buildSingaporeSnapshot,
  parseUraPrivateSaleEnvelope,
  stringifySingaporeSnapshot,
} from '@signedprice/singapore-property';
import {
  SingaporeEvidenceUnavailableError,
  createSingaporeSnapshotRepository,
} from '../lib/singapore/snapshot-repository.server';

const fixture = JSON.parse(readFileSync(
  new URL('../../../packages/singapore-property/test/fixtures/ura-transaction-envelope.synthetic.json', import.meta.url),
  'utf8',
)) as unknown;
const allowedRights = {
  operations: { aggregate: 'allowed', display: 'allowed' },
} as const;

function snapshot() {
  return buildSingaporeSnapshot({
    records: [1, 2, 3, 4].flatMap((batch) => parseUraPrivateSaleEnvelope(fixture, batch)),
    generatedAt: '2026-08-31T09:00:00.000Z',
    rights: allowedRights,
  });
}

describe('Singapore snapshot repository', () => {
  it('loads once, requires exact evidence, and exposes immutable ready lookups', async () => {
    const source = snapshot();
    let reads = 0;
    const repository = await createSingaporeSnapshotRepository({
      load: async () => { reads += 1; return stringifySingaporeSnapshot(source); },
      expectedDigest: source.digest,
      expectedPeriod: '2026-06..2026-08',
      rights: allowedRights,
    });

    expect(reads).toBe(1);
    expect(repository.getMarket()).toBe(source.version);
    expect(repository.listSegments().map(({ segment }) => segment)).toEqual(['CCR', 'RCR', 'OCR']);
    expect(repository.getSegment('CCR')?.published).toBe(true);
    expect(repository.getSegment('RCR')?.published).toBe(false);
    expect(repository.getSegment('BAD')).toBeNull();
    expect(repository.listProjects('CCR')).toHaveLength(1);
    const project = repository.listProjects('CCR')[0]!;
    expect(repository.getProject('CCR', project.id)?.id).toBe(project.id);
    expect(repository.getProject('OCR', project.id)).toBeNull();
    expect(repository.getProject('CCR', 'missing')).toBeNull();
    expect(repository.listProjectRouteParams()).toEqual([
      { area: 'ccr', projectId: project.id },
    ]);
    expect(Object.isFrozen(repository)).toBe(true);
    expect(Object.isFrozen(repository.listSegments())).toBe(true);
    expect(Object.isFrozen(project)).toBe(true);
  });

  it('accepts an environment-style serialized source', async () => {
    const source = snapshot();
    const repository = await createSingaporeSnapshotRepository({
      serialized: stringifySingaporeSnapshot(source),
      expectedDigest: source.digest,
      expectedPeriod: '2026-06..2026-08',
      rights: allowedRights,
    });
    expect(repository.getContext()).toMatchObject({
      period: '2026-06..2026-08',
      generatedAt: '2026-08-31T09:00:00.000Z',
      transactions: 12,
    });
  });

  it.each([
    ['missing config', { serialized: undefined, expectedDigest: '', expectedPeriod: '', rights: allowedRights }],
    ['malformed payload', { serialized: '{bad', expectedDigest: 'x', expectedPeriod: '2026-06..2026-08', rights: allowedRights }],
    ['digest mismatch', { serialized: stringifySingaporeSnapshot(snapshot()), expectedDigest: '0'.repeat(64), expectedPeriod: '2026-06..2026-08', rights: allowedRights }],
    ['period mismatch', { serialized: stringifySingaporeSnapshot(snapshot()), expectedDigest: snapshot().digest, expectedPeriod: '2026-01..2026-02', rights: allowedRights }],
    ['rights withdrawal', { serialized: stringifySingaporeSnapshot(snapshot()), expectedDigest: snapshot().digest, expectedPeriod: '2026-06..2026-08', rights: { operations: { aggregate: 'allowed' as const, display: 'blocked' as const } } }],
  ])('sanitizes %s', async (_label, input) => {
    await expect(createSingaporeSnapshotRepository(input)).rejects.toEqual(
      new SingaporeEvidenceUnavailableError(),
    );
  });

  it('sanitizes private storage failures without retrying them', async () => {
    let reads = 0;
    await expect(createSingaporeSnapshotRepository({
      load: async () => { reads += 1; throw new Error('private bucket hostname and token'); },
      expectedDigest: '0'.repeat(64),
      expectedPeriod: '2026-06..2026-08',
      rights: allowedRights,
    })).rejects.toMatchObject({
      message: 'Verified Singapore evidence unavailable',
      code: 'singapore_evidence_unavailable',
    });
    expect(reads).toBe(1);
  });
});
