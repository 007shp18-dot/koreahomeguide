import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const databaseSource = readFileSync(
  new URL('../lib/db/postgres.server.ts', import.meta.url),
  'utf8',
);
const articleStoreSource = readFileSync(
  new URL('../lib/insights/content-article-store.server.ts', import.meta.url),
  'utf8',
);
const contentRepositorySource = readFileSync(
  new URL('../lib/content/content-repository.server.ts', import.meta.url),
  'utf8',
);

describe('public editorial database boundary', () => {
  it('uses a short optional read deadline without weakening administration writes', () => {
    expect(databaseSource).toContain('PUBLIC_CONTENT_READ_TIMEOUT_MS = 750');
    expect(databaseSource).toContain('export function publicContentDatabase()');
    expect(databaseSource).toContain('AbortSignal.timeout(PUBLIC_CONTENT_READ_TIMEOUT_MS)');
    expect(databaseSource).toContain('AbortSignal.timeout(8_000)');
    expect(articleStoreSource).not.toContain('publicContentDatabase()');
    expect(contentRepositorySource.match(/publicContentDatabase\(\)/gu)).toHaveLength(1);
    expect(articleStoreSource.match(/contentDatabase\(\)/gu)).toHaveLength(1);
  });
});
