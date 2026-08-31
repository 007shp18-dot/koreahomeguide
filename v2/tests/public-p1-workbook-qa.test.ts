import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const qa = JSON.parse(readFileSync(
  new URL('../../artifacts/public-p1/workbook-qa.json', import.meta.url),
  'utf8',
)) as {
  schemaVersion: number;
  summary: Record<'total' | 'automated' | 'manual' | 'deferred', number>;
  rows: Array<{
    id: number;
    check: string;
    disposition: 'automated' | 'manual' | 'deferred';
    owner: string;
    reason?: string;
    evidence?: string[];
  }>;
};

describe('signedprice workbook QA mapping', () => {
  it('maps all 23 acceptance rows exactly once', () => {
    expect(qa.schemaVersion).toBe(1);
    expect(qa.rows.map(({ id }) => id)).toEqual(
      Array.from({ length: 23 }, (_unused, index) => index + 1),
    );
    expect(new Set(qa.rows.map(({ id }) => id)).size).toBe(23);
  });

  it('keeps every row owned and every non-automated decision explained', () => {
    for (const row of qa.rows) {
      expect(row.check.trim()).not.toBe('');
      expect(row.owner.trim()).not.toBe('');
      if (row.disposition === 'automated') {
        expect(row.evidence?.length ?? 0).toBeGreaterThan(0);
      } else {
        expect(row.reason?.trim()).toBeTruthy();
      }
    }
  });

  it('keeps summary counts equal to the mapped rows', () => {
    const counts = { total: qa.rows.length, automated: 0, manual: 0, deferred: 0 };
    for (const row of qa.rows) counts[row.disposition] += 1;
    expect(counts).toEqual(qa.summary);
  });
});
