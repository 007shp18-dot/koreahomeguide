import { describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

import { createNewsRepository } from '../lib/news/news-repository.server';
import { KR_SEOUL_NEWS_RECORDS } from '../content/news/kr-seoul';

function record(id: string, slug: string, publishedAt: string) {
  return {
    schemaVersion: 1,
    id,
    slug,
    marketId: 'kr-seoul',
    language: 'en',
    category: 'methodology',
    title: `Title ${id}`,
    summary: `Summary ${id}`,
    publishedAt,
    updatedAt: null,
    source: {
      publisher: 'Public Data Portal',
      title: 'MOLIT apartment rental transaction API',
      url: 'https://www.data.go.kr/data/15126474/openapi.do',
      publishedAt: null,
    },
    evidence: {
      status: 'not-applicable',
      line: 'This brief explains method rather than a market-change claim.',
      artifactIds: [],
    },
    body: [{ type: 'paragraph', text: `Body ${id}` }],
  };
}

describe('verified News repository', () => {
  it('accepts the authored Seoul collection through the strict repository', () => {
    const repository = createNewsRepository(KR_SEOUL_NEWS_RECORDS);

    expect(repository.list('kr-seoul').map(({ slug }) => slug)).toEqual([
      'what-the-seoul-district-snapshot-covers',
      'how-signedprice-reads-reported-rental-contracts',
    ]);
  });

  it('sorts validated records newest-first and looks up only exact slugs', () => {
    const repository = createNewsRepository([
      record('older', 'older-method', '2026-08-30T00:00:00.000Z'),
      record('newer', 'newer-method', '2026-08-31T00:00:00.000Z'),
    ]);

    expect(repository.list('kr-seoul').map(({ id }) => id)).toEqual(['newer', 'older']);
    expect(repository.getBySlug('kr-seoul', 'older-method')?.id).toBe('older');
    expect(repository.getBySlug('kr-seoul', 'unknown')).toBeNull();
    expect(Object.isFrozen(repository)).toBe(true);
    expect(Object.isFrozen(repository.list('kr-seoul'))).toBe(true);
  });

  it.each([
    ['duplicate id', [
      record('same', 'first', '2026-08-31T00:00:00.000Z'),
      record('same', 'second', '2026-08-30T00:00:00.000Z'),
    ]],
    ['duplicate slug', [
      record('first', 'same', '2026-08-31T00:00:00.000Z'),
      record('second', 'same', '2026-08-30T00:00:00.000Z'),
    ]],
  ])('rejects %s', (_name, records) => {
    expect(() => createNewsRepository(records)).toThrow('Invalid verified News repository.');
  });
});
