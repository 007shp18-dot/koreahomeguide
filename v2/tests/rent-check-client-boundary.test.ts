import { access, mkdtemp, mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { afterEach, describe, expect, test } from 'vitest';

import {
  scanRentCheckClientBoundary,
} from '../scripts/scan-rent-check-client-boundary.mjs';

const temporaryDirectories: string[] = [];
const webRoot = fileURLToPath(new URL('../apps/web/', import.meta.url));

async function sourceFiles(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(entries.map((entry) => {
    const path = join(directory, entry.name);
    return entry.isDirectory()
      ? sourceFiles(path)
      : ['.ts', '.tsx'].includes(extname(entry.name)) ? [path] : [];
  }));
  return nested.flat();
}

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
  test('ships no retired P1 public-summary execution route or app import', async () => {
    const temporaryFiles = [
      'app/api/internal/public-summary-job/route.ts',
      'lib/public-market/job-handler.server.ts',
      'lib/public-market/public-summary-job-cache.server.ts',
    ];
    for (const relativePath of temporaryFiles) {
      await expect(access(join(webRoot, relativePath))).rejects.toThrow();
    }

    const appSources = await sourceFiles(join(webRoot, 'app'));
    const appText = (await Promise.all(appSources.map((path) => readFile(path, 'utf8')))).join('\n');
    expect(appText).not.toMatch(
      /\/api\/internal\/public-summary-job|finalizeKoreaPublicSummaryJob/,
    );
  });

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

  test('reports public area artifact, source-record, and temporary generator markers', async () => {
    const directory = await fixtureNextDirectory();
    await writeFile(
      join(directory, 'static', 'chunks', 'area-explore.js'),
      [
        'SIGNEDPRICE_PUBLIC_AREA_SUMMARY_ARTIFACT',
        'signedprice-public-area-summary-v1',
        'sourceRecordId',
        'public-area-summary-job',
      ].join('\n'),
    );

    const findings = await scanRentCheckClientBoundary(directory);

    expect(findings.map((finding) => finding.marker)).toEqual([
      'area artifact environment',
      'area artifact contract',
      'raw source record',
      'temporary area job',
    ]);
  });

  test('reports conversion artifact environment names in client artifacts', async () => {
    const directory = await fixtureNextDirectory();
    await writeFile(
      join(directory, 'static', 'chunks', 'contract-check.js'),
      'SIGNEDPRICE_CONVERSION_CURVE_ARTIFACT SIGNEDPRICE_CONVERSION_CURVE_SHA256',
    );

    const findings = await scanRentCheckClientBoundary(directory);

    expect(findings).toEqual([{
      file: 'static/chunks/contract-check.js',
      marker: 'conversion artifact environment',
    }]);
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
