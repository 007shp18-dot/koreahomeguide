import { readFileSync } from 'node:fs';
import { describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

import {
  buildSingaporeSnapshot,
  parseUraPrivateSaleEnvelope,
  stringifySingaporeSnapshot,
} from '@signedprice/singapore-property';
import { createSingaporeSnapshotRepository } from '../lib/singapore/snapshot-repository.server';
import {
  buildSingaporeEntryModel,
  buildSingaporeExploreModel,
  buildSingaporeProjectModel,
  buildSingaporeSegmentModel,
} from '../lib/singapore/route-model.server';

const fixture = JSON.parse(readFileSync(
  new URL('../../../packages/singapore-property/test/fixtures/ura-transaction-envelope.synthetic.json', import.meta.url),
  'utf8',
)) as unknown;
const rights = { operations: { aggregate: 'allowed', display: 'allowed' } } as const;

async function repository() {
  const snapshot = buildSingaporeSnapshot({
    records: [1, 2, 3, 4].flatMap((batch) => parseUraPrivateSaleEnvelope(fixture, batch)),
    generatedAt: '2026-08-31T09:00:00.000Z',
    rights,
  });
  return createSingaporeSnapshotRepository({
    serialized: stringifySingaporeSnapshot(snapshot),
    expectedDigest: snapshot.digest,
    expectedPeriod: '2026-06..2026-08',
    rights,
  });
}

describe('Singapore route models', () => {
  it('builds native market entry and segment evidence without foreign product vocabulary', async () => {
    const store = await repository();
    const entry = buildSingaporeEntryModel(store);
    const explore = buildSingaporeExploreModel(store);
    const ccr = buildSingaporeSegmentModel(store, 'ccr');

    expect(entry).toMatchObject({
      status: 'ready',
      currency: 'SGD',
      transactionLabel: '12 private residential sale transactions',
      periodLabel: 'Jun 2026–Aug 2026',
      correctionHref: '/sg/singapore/corrections/',
    });
    expect(explore.status).toBe('ready');
    if (explore.status !== 'ready') throw new Error('expected ready');
    expect(explore.segments.map(({ code, href }) => ({ code, href }))).toEqual([
      { code: 'CCR', href: '/sg/singapore/explore/ccr/' },
      { code: 'RCR', href: '/sg/singapore/explore/rcr/' },
      { code: 'OCR', href: '/sg/singapore/explore/ocr/' },
    ]);
    expect(ccr?.status).toBe('ready');
    const serialized = JSON.stringify([entry, explore, ccr]);
    expect(serialized).not.toMatch(/KRW|jeonse/i);
    expect(serialized).not.toMatch(/hdbMedian|hdbTransactions|combinedMedian/i);
  });

  it('derives SGD, PSF, PSM, sale type, property type, tenure, and area basis labels from records', async () => {
    const store = await repository();
    const project = store.listProjects('CCR')[0]!;
    const model = buildSingaporeProjectModel(store, 'ccr', project.id);

    expect(model?.status).toBe('ready');
    if (model?.status !== 'ready') throw new Error('expected ready');
    expect(model.display).toMatchObject({
      medianPriceLabel: expect.stringContaining('SGD'),
      medianPsfLabel: expect.stringContaining('PSF'),
    });
    expect(model.transactions[0]).toMatchObject({
      priceLabel: expect.stringContaining('SGD'),
      psfLabel: expect.stringContaining('PSF'),
      psmLabel: expect.stringContaining('PSM'),
      saleTypeLabel: 'New sale',
      propertyTypeLabel: 'Condominium',
      areaBasisLabel: 'Strata area',
      tenureLabel: 'Freehold',
    });
    expect(model.evidence).toMatchObject({
      provider: 'URA',
      period: '2026-06..2026-08',
      publicationMinimum: 5,
      correctionHref: '/sg/singapore/corrections/',
    });
    expect(model.evidence.limitations.join(' ')).toContain('Private residential sales only');
    const checkUrl = new URL(model.checkHref, 'https://www.signedprice.com');
    expect(checkUrl.pathname).toBe('/sg/singapore/check/');
    expect(Object.fromEntries(checkUrl.searchParams)).toEqual({
      mode: 'single',
      'a-market': 'ura-private-sale',
      'a-segment': project.marketSegment,
      'a-project': project.id,
      'a-district': project.district,
      'a-property-type': project.propertyTypes[0],
    });
    for (const unsupportedValue of ['amount', 'area-min', 'area-max']) {
      expect(checkUrl.searchParams.has(`a-${unsupportedValue}`)).toBe(false);
    }
  });

  it('withholds metrics below five and returns null for unknown identities', async () => {
    const store = await repository();
    expect(buildSingaporeSegmentModel(store, 'ocr')).toMatchObject({
      status: 'insufficient',
      count: 4,
      threshold: 5,
    });
    const ocr = store.listProjects('OCR')[0]!;
    expect(buildSingaporeProjectModel(store, 'ocr', ocr.id)).toMatchObject({
      status: 'insufficient',
      count: 4,
      threshold: 5,
    });
    expect(buildSingaporeSegmentModel(store, 'bad')).toBeNull();
    expect(buildSingaporeProjectModel(store, 'ccr', 'missing')).toBeNull();
  });

  it('uses one sanitized unavailable union when no repository is ready', () => {
    expect(buildSingaporeEntryModel(null)).toEqual({
      status: 'unavailable',
      message: 'Verified Singapore evidence unavailable',
      correctionHref: '/sg/singapore/corrections/',
    });
    expect(buildSingaporeExploreModel(null)).toMatchObject({
      status: 'unavailable',
      message: 'Verified Singapore evidence unavailable',
    });
  });
});
