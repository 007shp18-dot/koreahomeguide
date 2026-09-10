import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

import { buildSingaporeSnapshot } from '../src/artifact';
import {
  buildSingaporePublicIndex,
  singaporeProjectPeriodKey,
} from '../src/public-index';
import { parseUraPrivateSaleEnvelope } from '../src/ura-transaction';

const fixture = JSON.parse(readFileSync(
  new URL('./fixtures/ura-transaction-envelope.synthetic.json', import.meta.url),
  'utf8',
)) as unknown;
const rights = Object.freeze({
  operations: Object.freeze({ aggregate: 'allowed' as const, display: 'allowed' as const }),
});

function sourceRecords() {
  return [1, 2, 3, 4].flatMap((batch) => parseUraPrivateSaleEnvelope(fixture, batch));
}

function snapshot(records = sourceRecords()) {
  return buildSingaporeSnapshot({
    records,
    generatedAt: '2026-08-31T09:00:00.000Z',
    rights,
  });
}

describe('Singapore public index', () => {
  it('groups each project and release period into one sorted immutable array', () => {
    const source = snapshot();
    const index = buildSingaporePublicIndex(source);
    const project = source.projects[0]!;
    const key = singaporeProjectPeriodKey(project.id, source.period);
    const records = index.projectTransactionsByIdPeriod[key]!;

    expect(index.version).toBe('signedprice-singapore-public-index-v1');
    expect(Object.keys(index.regionSummaryByCode)).toEqual(['CCR', 'RCR', 'OCR']);
    expect(index.projectSummaryById[project.id]).toEqual(project);
    expect(records.map(({ contractMonth }) => contractMonth)).toEqual(
      [...records.map(({ contractMonth }) => contractMonth)].sort().reverse(),
    );
    expect(Object.isFrozen(index)).toBe(true);
    expect(Object.isFrozen(records)).toBe(true);
    expect(index.evidenceReleaseByScope[`project:${project.id}`]).toMatchObject({
      period: '2026-06..2026-08',
      sourceDigest: source.digest,
    });
  });

  it('rejects duplicate project identities', () => {
    const source = snapshot();
    expect(() => buildSingaporePublicIndex({
      ...source,
      projects: Object.freeze([...source.projects, source.projects[0]!]),
    })).toThrow('duplicate Singapore project id');
  });

  it('changes its digest whenever a public record changes', () => {
    const records = sourceRecords();
    const changed = records.map((record, index) => index === 0
      ? Object.freeze({ ...record, priceSgd: record.priceSgd + 10_000 })
      : record);

    expect(buildSingaporePublicIndex(snapshot(changed)).digest)
      .not.toBe(buildSingaporePublicIndex(snapshot(records)).digest);
  });
});
