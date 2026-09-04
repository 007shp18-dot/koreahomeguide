import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { gzipSync } from 'node:zlib';

import {
  SINGAPORE_CHECK_ARTIFACT_VERSION,
  SINGAPORE_PUBLIC_INDEX_VERSION,
  buildHdbRentCheckArtifact,
  buildHdbResaleCheckArtifact,
  buildSingaporePublicIndex,
  buildUraPrivateSaleCheckArtifact,
  parseHdbSnapshot,
  parseSingaporeSnapshot,
  stringifySingaporeCheckArtifact,
  type SingaporeCheckArtifact,
  type SingaporeCheckMarket,
} from '@signedprice/singapore-property';

function argument(name: string): string {
  const index = process.argv.indexOf(name);
  const value = index < 0 ? undefined : process.argv[index + 1];
  if (value === undefined || value.startsWith('--')) {
    throw new Error(`Missing required ${name} argument.`);
  }
  return resolve(value);
}

const uraPath = argument('--ura');
const hdbPath = argument('--hdb');
const outputDirectory = argument('--output');

const ura = parseSingaporeSnapshot(readFileSync(uraPath, 'utf8'));
const hdb = parseHdbSnapshot(readFileSync(hdbPath, 'utf8'));
const artifacts = Object.freeze([
  buildUraPrivateSaleCheckArtifact(ura),
  buildHdbResaleCheckArtifact(hdb),
  buildHdbRentCheckArtifact(hdb),
]);
const publicIndex = buildSingaporePublicIndex(ura);
const dataset = Object.freeze({
  'ura-private-sale': 'sg-check-ura-private-sale',
  'hdb-resale': 'sg-check-hdb-resale',
  'hdb-rent': 'sg-check-hdb-rent',
} as const satisfies Readonly<Record<SingaporeCheckMarket, string>>);

mkdirSync(outputDirectory, { recursive: true });
const manifest = artifacts.map((artifact: SingaporeCheckArtifact) => {
  const serialized = stringifySingaporeCheckArtifact(artifact);
  const compressed = gzipSync(serialized, { level: 9, mtime: 0 });
  const filename = `singapore-check-${artifact.market}.json.gz`;
  writeFileSync(resolve(outputDirectory, filename), compressed);
  return Object.freeze({
    marketId: 'sg-singapore',
    dataset: dataset[artifact.market],
    schemaVersion: SINGAPORE_CHECK_ARTIFACT_VERSION,
    period: `${artifact.period.from}/${artifact.period.to}`,
    generatedAt: artifact.generatedAt,
    objectUrl: `installed://${dataset[artifact.market]}`,
    sha256: createHash('sha256').update(serialized).digest('hex'),
    recordCount: artifact.recordCount,
    artifactDigest: artifact.digest,
  });
});
const publicIndexSerialized = `${JSON.stringify(publicIndex)}\n`;
writeFileSync(
  resolve(outputDirectory, 'singapore-public-index.json.gz'),
  gzipSync(publicIndexSerialized, { level: 9, mtime: 0 }),
);
writeFileSync(
  resolve(outputDirectory, 'singapore-check-manifest.json'),
  `${JSON.stringify({
    artifacts: manifest,
    publicIndex: {
      marketId: 'sg-singapore',
      dataset: 'sg-private-sale-public-index',
      schemaVersion: SINGAPORE_PUBLIC_INDEX_VERSION,
      period: `${ura.period.from}/${ura.period.to}`,
      generatedAt: ura.generatedAt,
      objectUrl: 'installed://sg-private-sale-public-index',
      sha256: createHash('sha256').update(publicIndexSerialized).digest('hex'),
      recordCount: ura.records.length,
      artifactDigest: publicIndex.digest,
    },
  }, null, 2)}\n`,
);
