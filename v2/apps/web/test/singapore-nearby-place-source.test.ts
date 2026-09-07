import { describe, expect, it } from 'vitest';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';

import {
  buildSingaporeNearbyArtifact,
  buildSingaporeNearbyRows,
  buildSingaporeNearbySourceSha256,
  haversineMeters,
  parseLtaStationExits,
  parseHdbBuildingGeometry,
  parseGeocodedSchoolCsv,
  parseMoeSchools,
  matchHdbBuildingsToGeometry,
  selectOneMapHdbLocation,
  selectOneMapSchoolLocation,
} from '../scripts/singapore-nearby-place-source.mjs';

describe('Singapore official nearby-place source', () => {
  it('parses LTA exits into stable station identities and rail modes', () => {
    const rows = parseLtaStationExits({ type: 'FeatureCollection', features: [
      { type: 'Feature', geometry: { type: 'Point', coordinates: [103.8358, 1.3858] }, properties: { OBJECTID: 1, STATION_NA: 'LENTOR MRT STATION', EXIT_CODE: 'Exit 2' } },
      { type: 'Feature', geometry: { type: 'Point', coordinates: [103.8353, 1.3854] }, properties: { OBJECTID: 2, STATION_NA: 'LENTOR MRT STATION', EXIT_CODE: 'Exit 1' } },
      { type: 'Feature', geometry: { type: 'Point', coordinates: [103.8970, 1.4050] }, properties: { OBJECTID: 3, STATION_NA: 'SOO TECK LRT STATION', EXIT_CODE: 'Exit A' } },
    ] });

    expect(rows).toHaveLength(3);
    expect(rows[0]).toMatchObject({ name: 'Lentor MRT', exitCode: 'Exit 1', lines: ['MRT'] });
    expect(rows[0]?.providerId).toBe(rows[1]?.providerId);
    expect(rows[2]).toMatchObject({ name: 'Soo Teck LRT', lines: ['LRT'] });
  });

  it('accepts valid MOE schools and selects an exact OneMap postal match', () => {
    const [school] = parseMoeSchools({ result: { records: [{
      school_name: 'AI TONG SCHOOL', address: '100 Bright Hill Drive', postal_code: '579646',
      mainlevel_code: 'PRIMARY', mrt_desc: 'Bishan MRT',
    }] } });
    expect(school).toMatchObject({
      name: 'AI TONG SCHOOL', postalCode: '579646', level: 'PRIMARY',
    });
    expect(selectOneMapSchoolLocation(school!, { results: [
      { POSTAL: '579647', LATITUDE: '1.1', LONGITUDE: '103.1' },
      { POSTAL: '579646', LATITUDE: '1.361208', LONGITUDE: '103.833217' },
    ] })).toEqual({ latitude: 1.361208, longitude: 103.833217, providerReference: '579646' });
  });

  it('parses the MOE and OneMap geocoded school snapshot', () => {
    const rows = parseGeocodedSchoolCsv([
      'school_name,postal_code,mainlevel_code,latitude,longitude',
      'AI TONG SCHOOL,579646,PRIMARY,1.360583433890406,103.8330203339857',
      'BROKEN SCHOOL,123,PRIMARY,0,0',
    ].join('\n'));

    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      name: 'AI TONG SCHOOL', postalCode: '579646', level: 'PRIMARY',
      latitude: 1.360583433890406, longitude: 103.8330203339857,
    });
    expect(rows[0]?.providerId).toMatch(/^moe:school:/);
  });

  it('preserves quoted commas and restores leading-zero Singapore postal codes', () => {
    const rows = parseGeocodedSchoolCsv([
      'school_name,postal_code,mainlevel_code,latitude,longitude',
      'CANTONMENT PRIMARY SCHOOL,88256,PRIMARY,1.275472526232034,103.8399626317482',
      '"SCHOOL OF SCIENCE AND TECHNOLOGY, SINGAPORE",138572,SECONDARY (S1-S4),1.312928106002766,103.7740115293219',
      'SINGAPORE SPORTS SCHOOL,737913,"MIXED LEVEL (S1-S5, JC1-JC2)",1.426411405563434,103.7894447939508',
    ].join('\n'));

    expect(rows).toHaveLength(3);
    expect(rows.find(({ name }) => name === 'SINGAPORE SPORTS SCHOOL'))
      .toMatchObject({ postalCode: '737913', level: 'MIXED LEVEL (S1-S5, JC1-JC2)' });
    expect(rows.find(({ name }) => name === 'CANTONMENT PRIMARY SCHOOL'))
      .toMatchObject({ postalCode: '088256' });
    expect(rows.some(({ name }) => name === 'SCHOOL OF SCIENCE AND TECHNOLOGY, SINGAPORE')).toBe(true);
  });

  it('requires an exact HDB block and street match from OneMap', () => {
    const building = { address: '123A BEDOK NORTH STREET 2, Singapore', block: '123A', street: 'BEDOK NORTH STREET 2' };
    expect(selectOneMapHdbLocation(building, { results: [
      { BLK_NO: '123', ROAD_NAME: 'BEDOK NORTH STREET 2', POSTAL: '460123', LATITUDE: '1.1', LONGITUDE: '103.1' },
      { BLK_NO: '123A', ROAD_NAME: 'BEDOK NORTH STREET 2', POSTAL: '461234', LATITUDE: '1.328', LONGITUDE: '103.931' },
    ] })).toEqual({ latitude: 1.328, longitude: 103.931, providerReference: '461234' });
    expect(selectOneMapHdbLocation(building, { results: [
      { BLK_NO: '123A', ROAD_NAME: 'BEDOK NORTH AVENUE 2', POSTAL: '461234', LATITUDE: '1.328', LONGITUDE: '103.931' },
    ] })).toBeNull();
  });

  it('matches HDB inventory to official building polygons by block and street-code overlap', () => {
    const geometry = parseHdbBuildingGeometry({ type: 'FeatureCollection', features: [
      { type: 'Feature', properties: { BLK_NO: '101', ST_COD: 'STA', POSTAL_COD: '560101' }, geometry: { type: 'Polygon', coordinates: [[[103.80, 1.30], [103.802, 1.30], [103.802, 1.302], [103.80, 1.302], [103.80, 1.30]]] } },
      { type: 'Feature', properties: { BLK_NO: '102', ST_COD: 'STA', POSTAL_COD: '560102' }, geometry: { type: 'Polygon', coordinates: [[[103.81, 1.31], [103.812, 1.31], [103.812, 1.312], [103.81, 1.312], [103.81, 1.31]]] } },
      { type: 'Feature', properties: { BLK_NO: '101', ST_COD: 'STB', POSTAL_COD: '460101' }, geometry: { type: 'Polygon', coordinates: [[[103.90, 1.40], [103.902, 1.40], [103.902, 1.402], [103.90, 1.402], [103.90, 1.40]]] } },
    ] });
    const result = matchHdbBuildingsToGeometry([
      { legacyKey: 'singapore:block:a', localAttributes: { block: '101', street: 'STREET A', town: 'TOWN A' } },
      { legacyKey: 'singapore:block:b', localAttributes: { block: '102', street: 'STREET A', town: 'TOWN A' } },
      { legacyKey: 'singapore:block:missing', localAttributes: { block: '999', street: 'STREET A', town: 'TOWN A' } },
    ], geometry);

    expect(result.matches).toHaveLength(2);
    expect(result.matches[0]).toMatchObject({ buildingKey: 'singapore:block:a', longitude: 103.801, providerReference: '560101' });
    expect(result.matches[0]?.latitude).toBeCloseTo(1.301, 8);
    expect(result.unmatched).toEqual(['singapore:block:missing']);
  });

  it('rejects a unique block match that falls outside the building town', () => {
    const buildings = [
      { legacyKey: 'singapore:block:queenstown-1', localAttributes: { block: '1', street: 'LOCAL ROAD', town: 'QUEENSTOWN' } },
      { legacyKey: 'singapore:block:queenstown-2', localAttributes: { block: '2', street: 'LOCAL ROAD', town: 'QUEENSTOWN' } },
      { legacyKey: 'singapore:block:queenstown-3', localAttributes: { block: '3', street: 'LOCAL ROAD', town: 'QUEENSTOWN' } },
      { legacyKey: 'singapore:block:tanglin-halt-28', localAttributes: { block: '28', street: 'TANGLIN HALT RD', town: 'QUEENSTOWN' } },
    ];
    const geometry = [
      { block: '1', streetCode: 'LOCAL', postalCode: '140001', providerReference: '140001', latitude: 1.290, longitude: 103.800 },
      { block: '2', streetCode: 'LOCAL', postalCode: '140002', providerReference: '140002', latitude: 1.291, longitude: 103.801 },
      { block: '3', streetCode: 'LOCAL', postalCode: '140003', providerReference: '140003', latitude: 1.292, longitude: 103.802 },
      { block: '28', streetCode: 'PASIR', postalCode: '519235', providerReference: '519235', latitude: 1.3813, longitude: 103.9440 },
    ];

    const result = matchHdbBuildingsToGeometry(buildings, geometry);

    expect(result.matches.map(({ buildingKey }) => buildingKey)).toEqual([
      'singapore:block:queenstown-1',
      'singapore:block:queenstown-2',
      'singapore:block:queenstown-3',
    ]);
    expect(result.unmatched).toEqual(['singapore:block:tanglin-halt-28']);
  });

  it('keeps repeated low block numbers attached to their own HDB street code', () => {
    const buildings = [
      ...['1', '2', '3', '4'].map((block) => ({
        legacyKey: `singapore:block:queens-${block}`,
        localAttributes: { block, street: "QUEEN'S RD", town: 'BUKIT TIMAH' },
      })),
      ...['1', '2', '3', '4', '5'].map((block) => ({
        legacyKey: `singapore:block:toh-yi-${block}`,
        localAttributes: { block, street: 'TOH YI DR', town: 'BUKIT TIMAH' },
      })),
    ];
    const geometry = [
      ...['1', '2', '3', '4'].map((block) => ({
        block, streetCode: 'QUE01M', postalCode: `26000${block}`, providerReference: `26000${block}`,
        latitude: 1.318, longitude: 103.806,
      })),
      ...['1', '2', '3', '4', '5'].map((block) => ({
        block, streetCode: 'TOD03Z', postalCode: `59150${block}`, providerReference: `59150${block}`,
        latitude: 1.339, longitude: 103.773,
      })),
    ];

    const result = matchHdbBuildingsToGeometry(buildings, geometry);

    expect(result.matches.find(({ buildingKey }) => buildingKey === 'singapore:block:queens-1'))
      .toMatchObject({ providerReference: '260001', latitude: 1.318, longitude: 103.806 });
    expect(result.matches.find(({ buildingKey }) => buildingKey === 'singapore:block:toh-yi-1'))
      .toMatchObject({ providerReference: '591501', latitude: 1.339, longitude: 103.773 });
  });

  it('computes straight-line distance and emits only the nearest station and school', () => {
    expect(haversineMeters({ latitude: 1.3, longitude: 103.8 }, { latitude: 1.301, longitude: 103.8 }))
      .toBeGreaterThanOrEqual(111);
    const rows = buildSingaporeNearbyRows({
      buildings: [{ buildingKey: 'singapore:project:p1', latitude: 1.3, longitude: 103.8 }],
      stations: [
        { providerId: 'lta:station:a', name: 'Alpha MRT', lines: ['MRT'], exitCode: 'Exit A', latitude: 1.301, longitude: 103.8 },
        { providerId: 'lta:station:a', name: 'Alpha MRT', lines: ['MRT'], exitCode: 'Exit B', latitude: 1.302, longitude: 103.8 },
        { providerId: 'lta:station:b', name: 'Beta MRT', lines: ['MRT'], exitCode: 'Exit A', latitude: 1.31, longitude: 103.8 },
      ],
      schools: [
        { providerId: 'moe:school:a', name: 'Near School', latitude: 1.3, longitude: 103.802 },
        { providerId: 'moe:school:b', name: 'Far School', latitude: 1.3, longitude: 103.82 },
      ],
      checkedAt: '2026-09-07T00:00:00.000Z',
      evidenceSha256: 'a'.repeat(64),
    });

    expect(rows).toHaveLength(2);
    expect(rows[0]).toMatchObject({
      buildingKey: 'singapore:project:p1', kind: 'station', providerId: 'lta:station:a',
      name: 'Alpha MRT', lines: ['MRT'], isNearest: true, walkingMinutes: null,
    });
    expect(rows[1]).toMatchObject({ kind: 'school', providerId: 'moe:school:a', name: 'Near School' });
  });

  it('builds a deterministic artifact independent of input order', () => {
    const input = {
      buildings: [
        { buildingKey: 'singapore:project:b', latitude: 1.31, longitude: 103.81 },
        { buildingKey: 'singapore:project:a', latitude: 1.3, longitude: 103.8 },
      ],
      stations: [{ providerId: 'lta:station:a', name: 'Alpha MRT', lines: ['MRT'], exitCode: 'Exit A', latitude: 1.301, longitude: 103.8 }],
      schools: [{ providerId: 'moe:school:a', name: 'Alpha School', latitude: 1.3, longitude: 103.802 }],
      checkedAt: '2026-09-07T00:00:00.000Z',
      sourceSha256: 'b'.repeat(64),
      sources: { lta: 'lta', moe: 'moe', oneMap: 'onemap' },
    };
    const first = buildSingaporeNearbyArtifact(input);
    const second = buildSingaporeNearbyArtifact({ ...input, buildings: [...input.buildings].reverse() });

    expect(second).toEqual(first);
    expect(first.summary).toMatchObject({ buildings: 2, stations: 2, schools: 2, total: 4 });
    expect(first.summary.digest).toMatch(/^[a-f0-9]{64}$/);
  });

  it('changes the evidence generation when private inventory coordinates change', () => {
    const input = {
      lta: { features: [] }, moe: { records: [] }, hdb: { features: [] }, coordinates: [],
      privateBuildings: [{ legacyKey: 'singapore:project:a', latitude: 1.3, longitude: 103.8 }],
    };

    expect(buildSingaporeNearbySourceSha256(input)).not.toBe(buildSingaporeNearbySourceSha256({
      ...input,
      privateBuildings: [{ legacyKey: 'singapore:project:a', latitude: null, longitude: null }],
    }));
  });

  it('requires OneMap when no verified school-coordinate snapshot is available', () => {
    const temporary = mkdtempSync(resolve(tmpdir(), 'signedprice-sg-nearby-'));
    try {
      expect(() => execFileSync(process.execPath, [
        resolve(import.meta.dirname, '../scripts/build-singapore-nearby-places.mjs'),
        `--cache=${resolve(temporary, 'geocodes.json')}`,
      ], {
        cwd: resolve(import.meta.dirname, '..'),
        env: { ...process.env, ONEMAP_TOKEN: '' },
        stdio: 'pipe',
      })).toThrow(/ONEMAP_TOKEN/);
    } finally {
      rmSync(temporary, { recursive: true, force: true });
    }
  });
});
