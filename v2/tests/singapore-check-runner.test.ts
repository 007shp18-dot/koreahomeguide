import { spawnSync } from 'node:child_process';
import { readFileSync, rmSync, writeFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { gunzipSync } from 'node:zlib';
import { afterEach, describe, expect, it } from 'vitest';

import {
  buildHdbSnapshot,
  buildSingaporeSnapshot,
  parseHdbPropertyCsv,
  parseHdbRentalCsv,
  parseHdbResaleCsv,
  parseSingaporeCheckArtifact,
  parseUraPrivateSaleEnvelope,
  stringifyHdbSnapshot,
  stringifySingaporeSnapshot,
} from '@signedprice/singapore-property';

const fixture = JSON.parse(readFileSync(
  resolve('packages/singapore-property/test/fixtures/ura-transaction-envelope.synthetic.json'),
  'utf8',
)) as unknown;
const temporaryDirectories: string[] = [];

afterEach(() => {
  for (const directory of temporaryDirectories.splice(0)) {
    rmSync(directory, { recursive: true, force: true });
  }
});

describe('Singapore Check snapshot builder', () => {
  it('writes three independently parseable compressed artifacts and a manifest', () => {
    const directory = mkdtempSync(join(tmpdir(), 'signedprice-sg-check-'));
    temporaryDirectories.push(directory);
    const uraPath = join(directory, 'ura.json');
    const hdbPath = join(directory, 'hdb.json');
    const output = join(directory, 'output');
    const ura = buildSingaporeSnapshot({
      records: [1, 2, 3, 4].flatMap((batch) => parseUraPrivateSaleEnvelope(fixture, batch)),
      generatedAt: '2026-09-02T00:00:00.000Z',
    });
    const hdb = buildHdbSnapshot({
      resale: parseHdbResaleCsv(`month,town,flat_type,block,street_name,storey_range,floor_area_sqm,flat_model,lease_commence_date,remaining_lease,resale_price
2026-08,ANG MO KIO,3 ROOM,108,ANG MO KIO AVE 4,01 TO 03,67,Model A,1978,50 years,500000
`),
      rental: parseHdbRentalCsv(`rent_approval_date,town,block,street_name,flat_type,monthly_rent
2026-08,ANG MO KIO,108,ANG MO KIO AVE 4,3-ROOM,2800
`),
      properties: parseHdbPropertyCsv(`blk_no,street,max_floor_lvl,year_completed,residential,commercial,market_hawker,miscellaneous,multistorey_carpark,precinct_pavilion,bldg_contract_town,total_dwelling_units,1room_sold,2room_sold,3room_sold,4room_sold,5room_sold,exec_sold,multigen_sold,studio_apartment_sold,1room_rental,2room_rental,3room_rental,other_room_rental
108,ANG MO KIO AVE 4,12,1978,Y,N,N,N,N,N,AMK,120,0,0,120,0,0,0,0,0,0,0,0,0
`),
      generatedAt: '2026-09-02T00:00:00.000Z',
    });
    writeFileSync(uraPath, stringifySingaporeSnapshot(ura));
    writeFileSync(hdbPath, stringifyHdbSnapshot(hdb));

    const result = spawnSync(process.execPath, [
      '--conditions=react-server',
      '--experimental-loader', './scripts/typescript-extension-loader.mjs',
      '--experimental-transform-types',
      'scripts/build-singapore-check-snapshots.mts',
      '--ura', uraPath,
      '--hdb', hdbPath,
      '--output', output,
    ], { cwd: resolve('.'), encoding: 'utf8' });

    expect(result.stderr).not.toContain('Error:');
    expect(result.status).toBe(0);
    const manifest = JSON.parse(readFileSync(
      join(output, 'singapore-check-manifest.json'),
      'utf8',
    ));
    expect(manifest.artifacts).toHaveLength(3);
    for (const market of ['ura-private-sale', 'hdb-resale', 'hdb-rent'] as const) {
      const serialized = gunzipSync(readFileSync(
        join(output, `singapore-check-${market}.json.gz`),
      )).toString('utf8');
      expect(parseSingaporeCheckArtifact(serialized, market).market).toBe(market);
    }
  });
});
