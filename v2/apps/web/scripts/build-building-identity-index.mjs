import { writeFileSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import { loadSeoulBuildingSeed } from './property-seed-source.mjs';

const rows = loadSeoulBuildingSeed().map(row => [row.externalId, row.localAttributes.districtSlug,
  row.localAttributes.neighborhoodName, row.name, row.localAttributes.housingType]);
writeFileSync(new URL('../data/building-identity-index.json.gz', import.meta.url),
  gzipSync(JSON.stringify({ version: 1, rows })));
console.log(`Built compact identity index for ${rows.length} Seoul buildings.`);
