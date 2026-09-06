import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { gunzipSync } from 'node:zlib';
import { describe, expect, test, vi } from 'vitest';

vi.mock('server-only', () => ({}));

import { loadKaptBuildingFactsSnapshot } from '../lib/public-market/kapt-building-facts-snapshot.server';

describe('checked-in K-apt building facts artifact', () => {
  test('contains broad exact-match coverage and the production Gangnam building', () => {
    const path = resolve(import.meta.dirname, '../data/kapt-building-facts.json.gz');
    expect(existsSync(path)).toBe(true);
    if (!existsSync(path)) return;
    const snapshot = loadKaptBuildingFactsSnapshot(readFileSync(path));
    expect(snapshot.records().length).toBeGreaterThanOrEqual(790);
    expect(snapshot.getByBuildingId('gangnam-gu-54w9ma')).toMatchObject({
      status: 'ready',
      match: { kaptCode: 'A10024564', bjdCode: '1168010300' },
      apartment: expect.objectContaining({ households: 2296, buildings: 31, parkingSpaces: 3961 }),
      nearby: expect.objectContaining({
        subwayLine: '3호선', educationFacility: '초등학교(구룡초, 포이초)',
      }),
    });
    const observed = JSON.parse(gunzipSync(readFileSync(resolve(
      import.meta.dirname, '../data/observed-building-inventory.json.gz',
    ))).toString('utf8')) as { records: readonly Readonly<{ buildingId: string; housingType: string }>[] };
    const housingTypes = new Map(observed.records.map((record) => [record.buildingId, record.housingType]));
    expect(snapshot.records().filter((record) => housingTypes.get(record.buildingId) !== 'apartment')).toEqual([]);
    expect(snapshot.records().filter((record) => record.facts.apartment.parkingSpaces === 0)).toEqual([]);
    expect(snapshot.getByBuildingId('gangnam-gu-54w9ma')?.source?.apartment).toContain('weekly apartment profile + complex detail');
  });
});
