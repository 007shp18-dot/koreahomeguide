import { readFileSync } from 'node:fs';
import { mkdir, mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

import { scanSingaporeClientBoundary } from '../scripts/scan-singapore-client-boundary.mjs';

describe('Singapore browser credential boundary', () => {
  it('keeps the browser entry free of credentials, endpoints, and server headers', () => {
    const source = readFileSync(
      new URL('../packages/singapore-property/src/browser.ts', import.meta.url),
      'utf8',
    );
    expect(source).not.toMatch(
      /SIGNEDPRICE_URA_ACCESS_KEY|sentinel-ura-key|insertNewToken|invokeUraDS|AccessKey|\bToken\b/,
    );
  });

  it('detects a sentinel in static assets but permits an absent build directory', async () => {
    const root = await mkdtemp(join(tmpdir(), 'signedprice-sg-client-scan-'));
    expect(await scanSingaporeClientBoundary(join(root, 'missing'))).toEqual([]);
    const staticDirectory = join(root, '.next', 'static', 'chunks');
    await mkdir(staticDirectory, { recursive: true });
    await writeFile(join(staticDirectory, 'client.js'), 'const key = "sentinel-ura-key";', 'utf8');
    expect(await scanSingaporeClientBoundary(join(root, '.next'))).toEqual([
      { file: 'static/chunks/client.js', marker: 'sentinel key' },
    ]);
  });
});
