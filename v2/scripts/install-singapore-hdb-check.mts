import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { constants, gzipSync } from 'node:zlib';
import {
  buildHdbSnapshot, parseHdbResaleCsv, parseHdbRentalCsv, parseHdbPropertyCsv,
  buildHdbResaleCheckArtifact, buildHdbRentCheckArtifact, stringifySingaporeCheckArtifact,
} from '@signedprice/singapore-property';

// Usage: node --experimental-strip-types scripts/install-singapore-hdb-check.mts <csv-directory> <retrieved-at>
// Inputs are the three unmodified CSVs from the official data.gov.sg download API.
const directory = process.argv[2];
const retrievedAt = process.argv[3];
if (!directory || !retrievedAt || !Number.isFinite(Date.parse(retrievedAt))) {
  throw new Error('Pass a CSV directory and an explicit ISO retrieval timestamp.');
}
const csv = (name: string) => readFileSync(resolve(directory, `${name}.csv`), 'utf8');
const resale = csv('resale');
const rental = csv('rental');
const property = csv('property');
const snapshot = buildHdbSnapshot({
  resale: parseHdbResaleCsv(resale), rental: parseHdbRentalCsv(rental),
  properties: parseHdbPropertyCsv(property), generatedAt: retrievedAt,
});
const data = new URL('../apps/web/data/', import.meta.url);
const registryFile = new URL('installed-snapshots.json', data);
const registry = JSON.parse(readFileSync(registryFile, 'utf8'));
const source = registry.snapshots.find((row: { dataset: string }) => row.dataset === 'sg-hdb');
if (!source || source.rightsPolicyId !== 'sg-open-data-licence-v1') {
  throw new Error('Expected an installed HDB source with Singapore Open Data Licence.');
}
const hash = (value: string) => createHash('sha256').update(value).digest('hex');
// Build and validate both before changing the installed registry.
const outputs = [buildHdbResaleCheckArtifact(snapshot), buildHdbRentCheckArtifact(snapshot)].map(artifact => {
  const serialized = stringifySingaporeCheckArtifact(artifact);
  const dataset = `sg-check-${artifact.market}`;
  return {
    filename: `singapore-check-${artifact.market}.json.gz`, serialized,
    activation: {
      ...source, dataset, schemaVersion: artifact.version,
      sourceVersion: `data-gov-sg-${snapshot.generatedAt.slice(0, 10)}`,
      parserVersion: 'sg-hdb-check-v1', generatedAt: snapshot.generatedAt,
      period: `${artifact.period.from}/${artifact.period.to}`,
      objectUrl: `installed://${dataset}`, sha256: hash(serialized),
      recordCount: artifact.recordCount,
    },
  };
});
for (const output of outputs) writeFileSync(new URL(output.filename, data), gzipSync(output.serialized, {
  level: 9, memLevel: 9, strategy: constants.Z_FILTERED,
}));
const datasets = new Set(outputs.map(output => output.activation.dataset));
registry.snapshots = [...registry.snapshots.filter((row: { dataset: string }) => !datasets.has(row.dataset)), ...outputs.map(output => output.activation)];
writeFileSync(registryFile, `${JSON.stringify(registry, null, 2)}\n`);
const sources = [
  { kind: 'resale', dataset: snapshot.sourceDatasets.resale, sha256: hash(resale), records: snapshot.totals.resale },
  { kind: 'rental', dataset: snapshot.sourceDatasets.rental, sha256: hash(rental), records: snapshot.totals.rental },
  { kind: 'property', dataset: snapshot.sourceDatasets.property, sha256: hash(property), records: snapshot.totals.properties },
];
const manifest = {
  retrievedAt: snapshot.generatedAt, sources,
  note: 'Check artifacts exclude the retrieval month. Source rows are reported transactions or rental approvals, not available listings. Explore retains its separately dated published snapshot.',
  artifacts: outputs.map(output => output.activation),
};
writeFileSync(new URL('review/singapore-hdb-check-sources.json', data), `${JSON.stringify(manifest, null, 2)}\n`);
console.log(JSON.stringify(manifest, null, 2));
