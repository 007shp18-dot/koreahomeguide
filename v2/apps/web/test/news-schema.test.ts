import { describe, expect, it } from 'vitest';

import { parseVerifiedNewsRecord } from '../lib/news/news-schema';

function validRecord() {
  return {
    schemaVersion: 1,
    id: 'kr-seoul-method-2026-08-31',
    slug: 'how-signedprice-reads-reported-rental-contracts',
    marketId: 'kr-seoul',
    language: 'en',
    category: 'methodology',
    title: 'How SignedPrice reads reported rental contracts',
    summary: 'A concise explanation of the evidence boundary used by Seoul pages.',
    publishedAt: '2026-08-31T00:00:00.000Z',
    updatedAt: null as string | null,
    source: {
      publisher: 'Public Data Portal',
      title: 'MOLIT apartment rental transaction API',
      url: 'https://www.data.go.kr/data/15126474/openapi.do',
      publishedAt: null,
    },
    evidence: {
      status: 'not-applicable',
      line: 'This brief explains the method and makes no market-change claim.',
      artifactIds: [],
    },
    body: [
      { type: 'paragraph', text: 'SignedPrice separates reported contracts from listings.' },
      { type: 'heading', text: 'What the evidence can answer' },
      { type: 'list', items: ['Completed-period distribution', 'Publication limits'] },
    ],
  };
}

describe('verified News schema', () => {
  it('parses and deeply freezes one exact record', () => {
    const parsed = parseVerifiedNewsRecord(validRecord());

    expect(parsed).toMatchObject({
      schemaVersion: 1,
      marketId: 'kr-seoul',
      evidence: { status: 'not-applicable' },
    });
    expect(Object.isFrozen(parsed)).toBe(true);
    expect(Object.isFrozen(parsed.source)).toBe(true);
    expect(Object.isFrozen(parsed.evidence)).toBe(true);
    expect(Object.isFrozen(parsed.evidence.artifactIds)).toBe(true);
    expect(Object.isFrozen(parsed.body)).toBe(true);
    expect(parsed.body.every(Object.isFrozen)).toBe(true);
  });

  it.each([
    ['extra root key', (record: ReturnType<typeof validRecord>) => {
      Object.assign(record, { articleText: 'copied body' });
    }],
    ['extra source key', (record: ReturnType<typeof validRecord>) => {
      Object.assign(record.source, { html: '<article />' });
    }],
    ['extra evidence key', (record: ReturnType<typeof validRecord>) => {
      Object.assign(record.evidence, { confidence: 1 });
    }],
    ['unknown category', (record: ReturnType<typeof validRecord>) => {
      record.category = 'rumor';
    }],
    ['invalid slug', (record: ReturnType<typeof validRecord>) => {
      record.slug = 'Not Safe';
    }],
    ['non-HTTPS source', (record: ReturnType<typeof validRecord>) => {
      record.source.url = 'http://example.test/source';
    }],
    ['non-canonical published time', (record: ReturnType<typeof validRecord>) => {
      record.publishedAt = '2026-08-31';
    }],
    ['updated before published', (record: ReturnType<typeof validRecord>) => {
      record.updatedAt = '2026-08-30T00:00:00.000Z';
    }],
    ['empty body', (record: ReturnType<typeof validRecord>) => {
      record.body = [];
    }],
    ['unknown body block', (record: ReturnType<typeof validRecord>) => {
      record.body[0] = { type: 'quote', text: 'No' } as typeof record.body[number];
    }],
    ['control character', (record: ReturnType<typeof validRecord>) => {
      record.title = 'Bad\u0000title';
    }],
  ])('rejects %s', (_name, mutate) => {
    const record = structuredClone(validRecord());
    mutate(record);
    expect(() => parseVerifiedNewsRecord(record)).toThrow('Invalid verified News record.');
  });

  it('requires declared artifacts for verified evidence', () => {
    const record = structuredClone(validRecord());
    record.evidence = {
      status: 'verified',
      line: 'Twenty-five districts are included.',
      artifactIds: [],
    };
    expect(() => parseVerifiedNewsRecord(record)).toThrow('Invalid verified News record.');
  });

  it('rejects numeric claims from not-confirmed evidence', () => {
    const record = structuredClone(validRecord());
    record.evidence = {
      status: 'not-confirmed',
      line: 'Prices rose 12 percent.',
      artifactIds: [],
    };
    expect(() => parseVerifiedNewsRecord(record)).toThrow('Invalid verified News record.');
  });
});
