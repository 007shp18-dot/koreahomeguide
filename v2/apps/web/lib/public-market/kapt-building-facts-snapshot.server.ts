import 'server-only';

import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { gunzipSync } from 'node:zlib';

import type { OfficialBuildingFacts } from './official-building-facts.server';

type ReadyFacts = Extract<OfficialBuildingFacts, { status: 'ready' }>;
type SnapshotRecord = Readonly<{
  buildingId: string;
  districtSlug: string;
  officialName: string;
  facts: ReadyFacts;
}>;

function object(value: unknown): Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new TypeError('Invalid K-apt building facts snapshot object.');
  }
  return value as Record<string, unknown>;
}

function requiredText(value: unknown, field: string): string {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new TypeError(`Invalid K-apt building facts snapshot ${field}.`);
  }
  return value.trim();
}

function nullableText(value: unknown, field: string): string | null {
  if (value === null || value === undefined) return null;
  return requiredText(value, field);
}

function nullableNumber(value: unknown, field: string): number | null {
  if (value === null || value === undefined) return null;
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) {
    throw new TypeError(`Invalid K-apt building facts snapshot ${field}.`);
  }
  return value;
}

function parseApartment(value: unknown): ReadyFacts['apartment'] {
  const source = object(value);
  return Object.freeze({
    name: requiredText(source.name, 'apartment name'),
    legalAddress: requiredText(source.legalAddress, 'legal address'),
    roadAddress: nullableText(source.roadAddress, 'road address'),
    households: nullableNumber(source.households, 'households'),
    buildings: nullableNumber(source.buildings, 'buildings'),
    heating: nullableText(source.heating, 'heating'),
    corridorType: nullableText(source.corridorType, 'corridor type'),
    saleType: nullableText(source.saleType, 'sale type'),
    approvalDate: nullableText(source.approvalDate, 'approval date'),
    totalAreaSqm: nullableNumber(source.totalAreaSqm, 'total area'),
    structure: nullableText(source.structure, 'structure'),
    floorsAbove: nullableNumber(source.floorsAbove, 'floors above'),
    floorsBelow: nullableNumber(source.floorsBelow, 'floors below'),
    parkingSpaces: nullableNumber(source.parkingSpaces, 'parking spaces'),
  });
}

function parseNearby(value: unknown): ReadyFacts['nearby'] {
  if (value === null) return null;
  const source = object(value);
  return Object.freeze({
    subwayLine: nullableText(source.subwayLine, 'subway line'),
    subwayStation: nullableText(source.subwayStation, 'subway station'),
    subwayWalkTime: nullableText(source.subwayWalkTime, 'subway walk time'),
    busWalkTime: nullableText(source.busWalkTime, 'bus walk time'),
    educationFacility: nullableText(source.educationFacility, 'education facility'),
    convenientFacility: nullableText(source.convenientFacility, 'convenient facility'),
  });
}

export function createKaptBuildingFactsSnapshot(value: unknown) {
  const artifact = object(value);
  if (artifact.schemaVersion !== 'signedprice-kapt-building-facts-v1') {
    throw new TypeError('Invalid K-apt building facts snapshot schema.');
  }
  const source = object(artifact.source);
  const apartmentSource = requiredText(source.apartment, 'apartment source');
  const nearbySource = requiredText(source.nearby, 'nearby source');
  if (!Array.isArray(artifact.records)) throw new TypeError('Invalid K-apt building facts snapshot records.');
  const records = new Map<string, SnapshotRecord>();
  for (const valueRecord of artifact.records) {
    const record = object(valueRecord);
    const buildingId = requiredText(record.buildingId, 'building id');
    if (records.has(buildingId)) throw new TypeError(`Duplicate K-apt building identity: ${buildingId}`);
    const match = object(record.match);
    const kaptCode = requiredText(match.kaptCode, 'K-apt code');
    const bjdCode = requiredText(match.bjdCode, 'BJD code');
    if (!/^[A-Z0-9]{2,20}$/.test(kaptCode) || !/^\d{10}$/.test(bjdCode)) {
      throw new TypeError(`Invalid K-apt identity keys: ${buildingId}`);
    }
    const facts: ReadyFacts = Object.freeze({
      status: 'ready',
      source: Object.freeze({ apartment: apartmentSource, register: null, nearby: nearbySource }),
      match: Object.freeze({ kaptCode, bjdCode }),
      apartment: parseApartment(record.apartment),
      register: null,
      nearby: parseNearby(record.nearby),
    });
    records.set(buildingId, Object.freeze({
      buildingId,
      districtSlug: requiredText(record.districtSlug, 'district slug'),
      officialName: requiredText(record.officialName, 'official name'),
      facts,
    }));
  }
  return Object.freeze({
    getByBuildingId(buildingId: string): ReadyFacts | null {
      return records.get(buildingId)?.facts ?? null;
    },
    records(): readonly SnapshotRecord[] {
      return Object.freeze([...records.values()]);
    },
  });
}

export function loadKaptBuildingFactsSnapshot(source: Buffer) {
  return createKaptBuildingFactsSnapshot(JSON.parse(gunzipSync(source).toString('utf8')));
}

let installedSnapshot: ReturnType<typeof createKaptBuildingFactsSnapshot> | null | undefined;

export function installedKaptBuildingFactsSnapshot() {
  if (installedSnapshot !== undefined) return installedSnapshot;
  const configured = process.env.SIGNEDPRICE_KAPT_BUILDING_FACTS_ARTIFACT?.trim();
  const candidates = configured
    ? [resolve(configured)]
    : [
        resolve(process.cwd(), 'data/kapt-building-facts.json.gz'),
        resolve(process.cwd(), 'apps/web/data/kapt-building-facts.json.gz'),
      ];
  const path = candidates.find((candidate) => existsSync(candidate));
  installedSnapshot = path === undefined ? null : loadKaptBuildingFactsSnapshot(readFileSync(path));
  return installedSnapshot;
}
