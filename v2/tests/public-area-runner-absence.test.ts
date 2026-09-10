import { access, readFile, readdir } from 'node:fs/promises';
import { extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

const webRoot = fileURLToPath(new URL('../apps/web/', import.meta.url));
const nextRoot = join(webRoot, '.next');
const retiredFiles = [
  'lib/public-market/public-area-summary-job-cache.server.ts',
  'lib/public-market/area-job-handler.server.ts',
  'app/api/internal/public-area-summary-job/route.ts',
  'test/public-area-summary-job-cache.test.ts',
  'test/public-area-summary-job-handler.test.ts',
] as const;

async function sourceFiles(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(entries.map((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return sourceFiles(path);
    return entry.isFile() && ['.ts', '.tsx'].includes(extname(entry.name)) ? [path] : [];
  }));
  return nested.flat();
}

describe('temporary public area generator removal', () => {
  it('ships none of the five temporary source or test files', async () => {
    for (const relativePath of retiredFiles) {
      await expect(access(join(webRoot, relativePath))).rejects.toThrow();
    }
  });

  it('keeps the retired route marker out of web app and server-library sources', async () => {
    const files = [
      ...await sourceFiles(join(webRoot, 'app')),
      ...await sourceFiles(join(webRoot, 'lib')),
    ];
    const contents = await Promise.all(files.map((path) => readFile(path, 'utf8')));

    expect(contents.join('\n')).not.toContain('public-area-summary-job');
  });

  it('keeps the retired route out of a completed build manifest', async () => {
    const manifestPath = join(nextRoot, 'server', 'app-paths-manifest.json');
    let serialized: string;
    try {
      serialized = await readFile(manifestPath, 'utf8');
    } catch (error) {
      if (error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT') {
        return;
      }
      throw error;
    }
    const manifest = JSON.parse(serialized) as Record<string, string>;

    expect(Object.keys(manifest)).not.toContain('/api/internal/public-area-summary-job/route');
    expect(JSON.stringify(manifest)).not.toContain('public-area-summary-job');
  });
});
