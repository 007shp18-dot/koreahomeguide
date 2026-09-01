import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

import {
  buildUraSchemaManifest,
  stringifyUraSchemaManifest,
} from '../scripts/ura-schema-canary.mts';

const fixture = JSON.parse(readFileSync(
  new URL('../packages/singapore-property/test/fixtures/ura-transaction-envelope.synthetic.json', import.meta.url),
  'utf8',
)) as unknown;

describe('URA schema canary sanitizer', () => {
  it('retains only schema, counts, official sources, retrieval time, and digest', () => {
    const batches = [1, 2, 3, 4].map(() => structuredClone(fixture));
    const manifest = buildUraSchemaManifest({
      batches,
      retrievedAt: '2026-08-31T08:00:00.000Z',
      forbiddenValues: ['server-access-key', 'server-token', 'AccessKey', 'Token'],
    });
    const serialized = stringifyUraSchemaManifest(manifest);

    expect(manifest).toMatchObject({
      version: 'signedprice-ura-private-sale-schema-v1',
      parserVersion: 'ura-private-sale-parser-v1',
      service: 'PMI_Resi_Transaction',
      batchCount: 4,
      counts: { projects: 8, transactions: 12 },
      retrievedAt: '2026-08-31T08:00:00.000Z',
    });
    expect(manifest.fields.envelope).toEqual([
      { name: 'Message', type: 'string' },
      { name: 'Result', type: 'array' },
      { name: 'Status', type: 'string' },
    ]);
    expect(manifest.fields.project.map(({ name }) => name)).toEqual([
      'marketSegment', 'project', 'street', 'transaction', 'x', 'y',
    ]);
    expect(manifest.fields.transaction.map(({ name }) => name)).toEqual([
      'area', 'contractDate', 'district', 'floorRange', 'noOfUnits', 'price',
      'propertyType', 'tenure', 'typeOfArea', 'typeOfSale',
    ]);
    expect(manifest.digest).toMatch(/^[a-f0-9]{64}$/);
    for (const providerValue of [
      'Example Residences', 'Example Road', '2000000', '28900.125', 'Freehold', '0826',
      'server-access-key', 'server-token', 'AccessKey', 'Token',
    ]) {
      expect(serialized).not.toContain(providerValue);
    }
  });

  it('rejects non-four-batch and blank-batch evidence', () => {
    expect(() => buildUraSchemaManifest({
      batches: [fixture, fixture, fixture],
      retrievedAt: '2026-08-31T08:00:00.000Z',
    })).toThrow('URA schema canary requires four complete batches.');

    const blank = structuredClone(fixture) as Record<string, unknown>;
    blank.Result = [];
    expect(() => buildUraSchemaManifest({
      batches: [fixture, fixture, blank, fixture],
      retrievedAt: '2026-08-31T08:00:00.000Z',
    })).toThrow('URA schema canary requires four complete batches.');
  });

  it('rejects any forbidden raw provider value found in the manifest', () => {
    expect(() => buildUraSchemaManifest({
      batches: [fixture, fixture, fixture, fixture],
      retrievedAt: '2026-08-31T08:00:00.000Z',
      forbiddenValues: ['PMI_Resi_Transaction'],
    })).toThrow('URA schema manifest contains a provider value.');
  });
});
