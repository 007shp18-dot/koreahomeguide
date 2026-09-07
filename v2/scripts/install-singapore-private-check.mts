import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { gunzipSync, gzipSync } from 'node:zlib';
import { buildUraPrivateSaleCheckArtifact, parseSingaporeSnapshot, stringifySingaporeCheckArtifact } from '@signedprice/singapore-property';

// Rebuild from the same verified source used by Explore, never from project medians.
const data = new URL('../apps/web/data/', import.meta.url);
const registryFile = new URL('installed-snapshots.json', data);
const registry = JSON.parse(readFileSync(registryFile, 'utf8'));
const source = registry.snapshots.find((row: { dataset: string }) => row.dataset === 'sg-private-sale');
const serializedSource = gunzipSync(readFileSync(new URL('singapore-private-sale.json.gz', data))).toString('utf8');
if (!source || createHash('sha256').update(serializedSource).digest('hex') !== source.sha256) throw new Error('Private-sale source digest mismatch');
const snapshot = parseSingaporeSnapshot(serializedSource);
const artifact = buildUraPrivateSaleCheckArtifact(snapshot);
const serialized = stringifySingaporeCheckArtifact(artifact);
const dataset = 'sg-check-ura-private-sale';
writeFileSync(new URL('singapore-check-ura-private-sale.json.gz', data), gzipSync(serialized, { level: 9 }));
const activation = {
  ...source, dataset, schemaVersion: artifact.version,
  parserVersion: 'sg-ura-private-check-v1',
  period: `${artifact.period.from}/${artifact.period.to}`,
  objectUrl: `installed://${dataset}`,
  sha256: createHash('sha256').update(serialized).digest('hex'),
  recordCount: artifact.recordCount,
};
registry.snapshots = [...registry.snapshots.filter((row: { dataset: string }) => row.dataset !== dataset), activation];
writeFileSync(registryFile, `${JSON.stringify(registry, null, 2)}\n`);
console.log(JSON.stringify({ dataset, records: artifact.recordCount, period: activation.period, directory: fileURLToPath(data) }));
