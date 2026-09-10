import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { gunzipSync } from 'node:zlib';

let cachedSeed;

function sha256(value) {
  return createHash('sha256').update(value).digest('hex');
}

function readDataFile(name) {
  for (const path of [resolve(process.cwd(), 'data', name), resolve(process.cwd(), 'apps/web/data', name)]) {
    try { return readFileSync(path); } catch { /* Try the workspace-root location. */ }
  }
  throw new Error(`SignedPrice K-apt source unavailable: ${name}`);
}

function normalizedName(value) {
  return value.normalize('NFKC').toLocaleLowerCase('ko-KR').replace(/[^\p{L}\p{N}]+/gu, '');
}

function providerId(kaptCode, kind, name) {
  return `kapt:${kaptCode}:${kind}:${sha256(normalizedName(name)).slice(0, 16)}`;
}

function closingParenthesis(source, contentStart) {
  let depth = 1;
  for (let index = contentStart; index < source.length; index += 1) {
    if (source[index] === '(') depth += 1;
    if (source[index] === ')') depth -= 1;
    if (depth === 0) return index;
  }
  return -1;
}

function cleanName(value) {
  const cleaned = value
    .replace(/\(\s*\d+\s*\)/gu, '')
    .replace(/[.;]+$/gu, '')
    .trim()
    .replace(/역$/u, '')
    .trim();
  return cleaned === '' ? null : cleaned;
}

function stationNames(value) {
  return value.split(',').flatMap((part) => {
    const trimmed = part.trim();
    if (trimmed === '') return [];
    const whitespace = trimmed.split(/\s+/u).filter(Boolean);
    return whitespace.length > 1 && whitespace.every((name) => name.endsWith('역'))
      ? whitespace
      : [trimmed];
  }).map(cleanName).filter((name) => name !== null);
}

export function parseKaptWalkingMinutes(value) {
  if (typeof value !== 'string' || value.includes('초과')) return null;
  const values = [...value.matchAll(/\d+/gu)].map((match) => Number(match[0]));
  return values.length === 0 ? null : Math.max(...values);
}

export function parseKaptStationRows(input) {
  if (typeof input.subwayStation !== 'string' || input.subwayStation.trim() === '') return Object.freeze([]);
  const rows = new Map();
  const pattern = /([^\s()]+)\(수도권,/gu;
  for (const match of input.subwayStation.matchAll(pattern)) {
    if (match.index === undefined) continue;
    const start = match.index + match[0].length;
    const end = closingParenthesis(input.subwayStation, start);
    if (end < 0) continue;
    const line = `${match[1]}(수도권)`;
    for (const name of stationNames(input.subwayStation.slice(start, end))) {
      const key = normalizedName(name);
      const current = rows.get(key);
      rows.set(key, Object.freeze({
        buildingKey: input.buildingKey,
        kind: 'station',
        providerId: providerId(input.kaptCode, 'station', name),
        name,
        distanceMeters: null,
        walkingMinutes: parseKaptWalkingMinutes(input.subwayWalkTime),
        latitude: null,
        longitude: null,
        lines: Object.freeze([...(current?.lines ?? []), line]
          .filter((value, index, values) => values.indexOf(value) === index)),
        isNearest: false,
        source: 'https://www.k-apt.go.kr/',
      }));
    }
  }
  return Object.freeze([...rows.values()]);
}

export function parseKaptSchoolRows(input) {
  if (typeof input.educationFacility !== 'string' || input.educationFacility.trim() === '') return Object.freeze([]);
  const rows = new Map();
  const pattern = /(초등학교|중학교|고등학교|대학교)\(/gu;
  for (const match of input.educationFacility.matchAll(pattern)) {
    if (match.index === undefined) continue;
    const start = match.index + match[0].length;
    const end = closingParenthesis(input.educationFacility, start);
    if (end < 0) continue;
    for (const rawName of input.educationFacility.slice(start, end).split(/[,.;]/u)) {
      const name = cleanName(rawName);
      if (name === null) continue;
      const key = normalizedName(name);
      if (rows.has(key)) continue;
      rows.set(key, Object.freeze({
        buildingKey: input.buildingKey,
        kind: 'school',
        providerId: providerId(input.kaptCode, 'school', name),
        name,
        distanceMeters: null,
        walkingMinutes: null,
        latitude: null,
        longitude: null,
        lines: Object.freeze([]),
        isNearest: false,
        source: 'https://www.k-apt.go.kr/',
      }));
    }
  }
  return Object.freeze([...rows.values()].sort((left, right) => left.name.localeCompare(right.name, 'ko')));
}

export function loadKaptNearbyPlaceSeed() {
  if (cachedSeed !== undefined) return cachedSeed;
  const serialized = gunzipSync(readDataFile('kapt-building-facts.json.gz'));
  const artifact = JSON.parse(serialized.toString('utf8'));
  if (artifact.schemaVersion !== 'signedprice-kapt-building-facts-v1' || !Array.isArray(artifact.records)) {
    throw new TypeError('SignedPrice K-apt nearby-place source invalid.');
  }
  const sourceSha256 = sha256(serialized);
  const rows = Object.freeze(artifact.records.flatMap((record) => {
    const input = Object.freeze({
      buildingKey: `seoul:${record.buildingId}`,
      kaptCode: record.match.kaptCode,
      subwayStation: record.nearby?.subwayStation,
      subwayWalkTime: record.nearby?.subwayWalkTime,
      educationFacility: record.nearby?.educationFacility,
    });
    return [...parseKaptStationRows(input), ...parseKaptSchoolRows(input)].map((row) => Object.freeze({
      ...row,
      checkedAt: artifact.asOf,
      evidenceSha256: sourceSha256,
      identityKey: `${row.buildingKey}:${row.kind}:${row.providerId}`,
    }));
  }));
  cachedSeed = Object.freeze({
    rows,
    summary: Object.freeze({
      buildings: new Set(rows.map(({ buildingKey }) => buildingKey)).size,
      stations: rows.filter(({ kind }) => kind === 'station').length,
      schools: rows.filter(({ kind }) => kind === 'school').length,
      total: rows.length,
      digest: sha256([...rows].map(({ identityKey }) => identityKey).sort().join('\n')),
      sourceSha256,
    }),
  });
  return cachedSeed;
}
