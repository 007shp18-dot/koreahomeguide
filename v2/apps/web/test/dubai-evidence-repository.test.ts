import { createHash } from 'node:crypto';
import { describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

import {
  createDubaiEvidenceRepository,
  createDubaiEvidenceRepositoryFromInstalled,
} from '../lib/dubai/evidence-repository.server';
import {
  dubaiEvidenceFixture,
  pendingDubaiRights,
} from './dubai-evidence-fixture';

function serialized(value: unknown) {
  const source = JSON.stringify(value);
  return { source, digest: createHash('sha256').update(source).digest('hex') };
}

describe('Dubai area evidence repository', () => {
  it('opens one approved release atomically and exposes its indexable routes', async () => {
    const input = serialized(dubaiEvidenceFixture());
    const repository = await createDubaiEvidenceRepository({
      serialized: input.source,
      expectedDigest: input.digest,
    });

    expect(repository.getContext()).toMatchObject({
      asOfDate: '2026-09-05',
      displayState: 'published',
      indexState: 'index',
      publicationMinimum: 30,
    });
    expect(repository.listAreas()).toHaveLength(1);
    expect(repository.getArea('marsa-dubai')?.name).toBe('Marsa Dubai');
    expect(repository.listAreaRouteParams()).toEqual([{ area: 'marsa-dubai' }]);
  });

  it('keeps a displayable noindex release out of static SEO enumeration', async () => {
    const fixture = {
      ...dubaiEvidenceFixture(),
      publication: { displayState: 'stale', indexState: 'noindex' },
    };
    const input = serialized(fixture);
    const repository = await createDubaiEvidenceRepository({
      serialized: input.source,
      expectedDigest: input.digest,
    });

    expect(repository.listAreas()).toHaveLength(1);
    expect(repository.listAreaRouteParams()).toEqual([]);
  });

  it.each([
    ['wrong object digest', dubaiEvidenceFixture(), '0'.repeat(64)],
    ['pending rights', {
      ...dubaiEvidenceFixture(),
      rights: pendingDubaiRights,
      publication: { displayState: 'draft', indexState: 'noindex' },
    }, null],
    ['approved rights without a named reviewer', {
      ...dubaiEvidenceFixture(),
      rights: { ...dubaiEvidenceFixture().rights, reviewedBy: undefined },
    }, null],
    ['withdrawn release', {
      ...dubaiEvidenceFixture(),
      publication: { displayState: 'withdrawn', indexState: 'noindex' },
    }, null],
  ])('fails closed for %s', async (_label, fixture, suppliedDigest) => {
    const input = serialized(fixture);
    await expect(createDubaiEvidenceRepository({
      serialized: input.source,
      expectedDigest: suppliedDigest ?? input.digest,
    })).rejects.toThrow('Dubai area evidence unavailable');
  });

  it('binds an installer-verified payload to its semantic release metadata', () => {
    const payload = dubaiEvidenceFixture();
    const installed = {
      metadata: {
        marketId: 'ae-dubai' as const,
        dataset: 'ae-area-evidence' as const,
        schemaVersion: payload.version,
        sourceVersion: 'dld-open-data-2026-09-06',
        parserVersion: 'signedprice-dubai-area-evidence-v1',
        rightsPolicyId: payload.rights.policyId,
        period: '2026-06/2026-09',
        generatedAt: payload.generatedAt,
        objectUrl: 'installed://ae-area-evidence',
        sha256: 'a'.repeat(64),
        recordCount: payload.areas.length,
      },
      payload,
    };

    expect(createDubaiEvidenceRepositoryFromInstalled(installed).listAreas())
      .toHaveLength(1);
    for (const override of [
      { schemaVersion: 'signedprice-dubai-area-evidence-v2' },
      { rightsPolicyId: 'wrong-policy' },
      { period: '2026-05/2026-09' },
      { generatedAt: '2026-09-07T00:00:00.000Z' },
      { recordCount: 2 },
    ]) {
      expect(() => createDubaiEvidenceRepositoryFromInstalled({
        ...installed,
        metadata: { ...installed.metadata, ...override },
      })).toThrow('Dubai area evidence unavailable');
    }
  });
});
