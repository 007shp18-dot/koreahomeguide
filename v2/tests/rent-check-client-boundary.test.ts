import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { afterEach, describe, expect, test } from 'vitest';

import {
  scanRentCheckClientBoundary,
} from '../scripts/scan-rent-check-client-boundary.mjs';

const temporaryDirectories: string[] = [];

async function fixtureNextDirectory(): Promise<string> {
  const directory = await mkdtemp(join(tmpdir(), 'rent-check-client-boundary-'));
  temporaryDirectories.push(directory);
  await mkdir(join(directory, 'static', 'chunks'), { recursive: true });
  await mkdir(join(directory, 'server', 'app', 'page'), { recursive: true });
  return directory;
}

afterEach(async () => {
  await Promise.all(temporaryDirectories.splice(0).map((directory) =>
    rm(directory, { recursive: true, force: true })));
});

describe('Rent Check client boundary scan', () => {
  test('reports raw provider, rights evidence, and credential markers in client artifacts', async () => {
    const directory = await fixtureNextDirectory();
    await writeFile(
      join(directory, 'static', 'chunks', 'rent-check.js'),
      [
        'https://apis.data.go.kr/1613000/RTMSDataSvcAptRent',
        'https://www.data.go.kr/data/15126474/openapi.do',
        'DATA_GO_KR_SERVICE_KEY',
      ].join('\n'),
    );

    const findings = await scanRentCheckClientBoundary(directory);

    expect(findings.map((finding) => finding.marker)).toEqual([
      'credential marker',
      'MOLIT raw endpoint',
      'MOLIT endpoint family',
      'rights evidence URL',
    ]);
  });

  test('scans client manifests but ignores server-only route output', async () => {
    const directory = await fixtureNextDirectory();
    await writeFile(
      join(directory, 'server', 'app', 'page', 'page_client-reference-manifest.js'),
      'serviceKey',
    );
    await writeFile(
      join(directory, 'server', 'app', 'page', 'route.js'),
      'https://apis.data.go.kr/1613000/RTMSDataSvcAptRent',
    );

    const findings = await scanRentCheckClientBoundary(directory);

    expect(findings).toEqual([{
      file: 'server/app/page/page_client-reference-manifest.js',
      marker: 'credential marker',
    }]);
  });

  test('accepts browser artifacts containing only the public Rent Check contract', async () => {
    const directory = await fixtureNextDirectory();
    await writeFile(
      join(directory, 'static', 'chunks', 'rent-check.js'),
      'Dongjak-gu kr-rent-check-quote-normalization kr-molit-rent-parser-v2',
    );

    await expect(scanRentCheckClientBoundary(directory)).resolves.toEqual([]);
  });
});
