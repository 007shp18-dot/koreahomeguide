import { readdirSync, readFileSync } from 'node:fs';
import { extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const webRoot = fileURLToPath(new URL('../', import.meta.url));

function sourceFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return sourceFiles(path);
    return ['.ts', '.tsx'].includes(extname(entry.name)) ? [path] : [];
  });
}

describe('Community server/client boundary', () => {
  it('marks every Community server module as server-only', () => {
    const files = sourceFiles(join(webRoot, 'lib', 'community'))
      .filter((path) => path.endsWith('.server.ts'));

    expect(files.length).toBeGreaterThan(0);
    for (const path of files) {
      expect(readFileSync(path, 'utf8')).toMatch(/^import 'server-only';/);
    }
  });

  it('keeps SQL, identity, network, and environment secrets out of client modules', () => {
    const clientSources = sourceFiles(webRoot)
      .map((path) => ({ path, source: readFileSync(path, 'utf8') }))
      .filter(({ source }) => /^['"]use client['"];/.test(source));

    for (const { source } of clientSources) {
      expect(source).not.toMatch(
        /community-(?:repository|identity|environment|sql-port)\.server|SIGNEDPRICE_COMMUNITY_|respondentKey|networkKey|signedprice_evidence_responses/,
      );
    }
  });

  it('does not expose Community server configuration as NEXT_PUBLIC variables', () => {
    const source = sourceFiles(join(webRoot, 'lib', 'community'))
      .map((path) => readFileSync(path, 'utf8'))
      .join('\n');

    expect(source).not.toMatch(/NEXT_PUBLIC_.*(?:COMMUNITY|DATABASE|POSTGRES)/);
  });
});
