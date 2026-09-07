import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { gunzipSync } from 'node:zlib';

export const SINGAPORE_NEARBY_VERSION = 'signedprice-singapore-nearby-v2';

const LTA_SOURCE = 'https://data.gov.sg/datasets/d_b39d3a0871985372d7e1637193335da5/view';
const MOE_SOURCE = 'https://data.gov.sg/datasets/d_688b934f82c1059ed0a6993d2a829089/view';
const HDB_TOWN_MAX_DISTANCE_METERS = 4_500;
let cachedSeed;

function sha256(value) {
  return createHash('sha256').update(value).digest('hex');
}

export function buildSingaporeNearbySourceSha256({ lta, moe, hdb, privateBuildings, coordinates }) {
  const orderedPrivateBuildings = [...privateBuildings].map((building) => ({
    buildingKey: building.legacyKey ?? building.buildingKey,
    latitude: building.latitude ?? null,
    longitude: building.longitude ?? null,
  })).sort((left, right) => left.buildingKey.localeCompare(right.buildingKey));
  const orderedCoordinates = [...coordinates].sort(([left], [right]) => left.localeCompare(right));
  return sha256(JSON.stringify({
    version: SINGAPORE_NEARBY_VERSION,
    lta,
    moe,
    hdb,
    privateBuildings: orderedPrivateBuildings,
    coordinates: orderedCoordinates,
  }));
}

function normalizedIdentity(value) {
  return value.normalize('NFKC').toLocaleUpperCase('en-SG').replace(/[^A-Z0-9]+/g, '');
}

function titleCase(value) {
  return value.toLocaleLowerCase('en-SG').replace(/(^|[\s/-])([a-z])/g, (_, prefix, letter) => `${prefix}${letter.toUpperCase()}`);
}

function finiteCoordinate(value, minimum, maximum) {
  const parsed = typeof value === 'string' && value.trim() !== '' ? Number(value) : value;
  return typeof parsed === 'number' && Number.isFinite(parsed) && parsed >= minimum && parsed <= maximum
    ? parsed
    : null;
}

function singaporeLocation(latitudeValue, longitudeValue, providerReference) {
  const latitude = finiteCoordinate(latitudeValue, 1.1, 1.55);
  const longitude = finiteCoordinate(longitudeValue, 103.5, 104.2);
  if (latitude === null || longitude === null) return null;
  return Object.freeze({ latitude, longitude, providerReference });
}

function stationNameAndLines(value) {
  const upper = value.normalize('NFKC').trim().toLocaleUpperCase('en-SG').replace(/\s+/g, ' ');
  const lines = [];
  if (/\bMRT\b/u.test(upper)) lines.push('MRT');
  if (/\bLRT\b/u.test(upper)) lines.push('LRT');
  const withoutSuffix = upper.replace(/\s+STATION$/u, '').trim();
  return Object.freeze({ name: titleCase(withoutSuffix).replace(/\bMrt\b/g, 'MRT').replace(/\bLrt\b/g, 'LRT'), lines: Object.freeze(lines) });
}

function recordsFrom(value) {
  if (Array.isArray(value)) return value;
  if (typeof value !== 'object' || value === null) return [];
  if (Array.isArray(value.records)) return value.records;
  if (typeof value.result === 'object' && value.result !== null && Array.isArray(value.result.records)) {
    return value.result.records;
  }
  return [];
}

export function parseLtaStationExits(value) {
  if (typeof value !== 'object' || value === null || !Array.isArray(value.features)) {
    throw new TypeError('LTA station-exit source is invalid.');
  }
  const rows = [];
  for (const feature of value.features) {
    const coordinates = feature?.geometry?.type === 'Point' ? feature.geometry.coordinates : null;
    const rawName = feature?.properties?.STATION_NA;
    if (!Array.isArray(coordinates) || typeof rawName !== 'string' || rawName.trim() === '') continue;
    const location = singaporeLocation(coordinates[1], coordinates[0], null);
    const station = stationNameAndLines(rawName);
    if (location === null || station.lines.length === 0) continue;
    rows.push(Object.freeze({
      providerId: `lta:station:${sha256(normalizedIdentity(rawName)).slice(0, 20)}`,
      name: station.name,
      lines: station.lines,
      exitCode: typeof feature.properties?.EXIT_CODE === 'string' ? feature.properties.EXIT_CODE.trim() : '',
      latitude: location.latitude,
      longitude: location.longitude,
    }));
  }
  return Object.freeze(rows.sort((left, right) => left.providerId.localeCompare(right.providerId)
    || left.exitCode.localeCompare(right.exitCode) || left.latitude - right.latitude || left.longitude - right.longitude));
}

export function parseMoeSchools(value) {
  const rows = [];
  for (const record of recordsFrom(value)) {
    const name = typeof record?.school_name === 'string' ? record.school_name.trim() : '';
    const address = typeof record?.address === 'string' ? record.address.trim() : '';
    const postalCode = typeof record?.postal_code === 'string' ? record.postal_code.trim() : '';
    if (name === '' || address === '' || !/^\d{6}$/u.test(postalCode)) continue;
    rows.push(Object.freeze({
      providerId: `moe:school:${sha256(normalizedIdentity(name)).slice(0, 20)}`,
      name,
      address,
      postalCode,
      level: typeof record.mainlevel_code === 'string' ? record.mainlevel_code.trim() : null,
      mrtDescription: typeof record.mrt_desc === 'string' ? record.mrt_desc.trim() : null,
    }));
  }
  return Object.freeze(rows.sort((left, right) => left.providerId.localeCompare(right.providerId)));
}

function parseCsvRow(line) {
  const cells = [];
  let cell = '';
  let quoted = false;
  for (let index = 0; index < line.length; index += 1) {
    const character = line[index];
    if (character === '"') {
      if (quoted && line[index + 1] === '"') {
        cell += '"';
        index += 1;
      } else {
        quoted = !quoted;
      }
    } else if (character === ',' && !quoted) {
      cells.push(cell);
      cell = '';
    } else {
      cell += character;
    }
  }
  if (quoted) throw new TypeError('Geocoded school source contains an unterminated quote.');
  cells.push(cell);
  return cells;
}

export function parseGeocodedSchoolCsv(value) {
  if (typeof value !== 'string') throw new TypeError('Geocoded school source is invalid.');
  const [header, ...lines] = value.trim().split(/\r?\n/u);
  if (header?.trim() !== 'school_name,postal_code,mainlevel_code,latitude,longitude') {
    throw new TypeError('Geocoded school source header is invalid.');
  }
  const rows = [];
  for (const line of lines) {
    const [rawName, rawPostalCode, rawLevel, rawLatitude, rawLongitude, ...overflow] = parseCsvRow(line);
    const name = rawName?.trim() ?? '';
    const rawPostal = rawPostalCode?.trim() ?? '';
    const postalCode = /^\d{5,6}$/u.test(rawPostal) ? rawPostal.padStart(6, '0') : rawPostal;
    const location = singaporeLocation(rawLatitude, rawLongitude, postalCode);
    if (overflow.length > 0 || name === '' || !/^\d{6}$/u.test(postalCode) || location === null) continue;
    rows.push(Object.freeze({
      providerId: `moe:school:${sha256(normalizedIdentity(name)).slice(0, 20)}`,
      name,
      address: '',
      postalCode,
      level: rawLevel?.trim() || null,
      mrtDescription: null,
      latitude: location.latitude,
      longitude: location.longitude,
    }));
  }
  return Object.freeze(rows.sort((left, right) => left.providerId.localeCompare(right.providerId)));
}

function oneMapResults(value) {
  return typeof value === 'object' && value !== null && Array.isArray(value.results) ? value.results : [];
}

export function selectOneMapSchoolLocation(school, value) {
  const matches = oneMapResults(value).filter((result) => `${result?.POSTAL ?? ''}`.trim() === school.postalCode)
    .map((result) => singaporeLocation(result.LATITUDE, result.LONGITUDE, school.postalCode))
    .filter((location) => location !== null);
  return matches[0] ?? null;
}

export function selectOneMapHdbLocation(building, value) {
  const expectedBlock = normalizedIdentity(building.block);
  const expectedStreet = normalizedIdentity(building.street);
  const matches = oneMapResults(value).filter((result) => normalizedIdentity(`${result?.BLK_NO ?? ''}`) === expectedBlock
      && normalizedIdentity(`${result?.ROAD_NAME ?? ''}`) === expectedStreet)
    .map((result) => singaporeLocation(result.LATITUDE, result.LONGITUDE, `${result.POSTAL ?? ''}`.trim() || null))
    .filter((location) => location !== null);
  return matches[0] ?? null;
}

function geometryPoints(value, output = []) {
  if (Array.isArray(value) && typeof value[0] === 'number' && typeof value[1] === 'number') {
    output.push(value);
  } else if (Array.isArray(value)) {
    for (const entry of value) geometryPoints(entry, output);
  }
  return output;
}

export function parseHdbBuildingGeometry(value) {
  if (typeof value !== 'object' || value === null || !Array.isArray(value.features)) {
    throw new TypeError('HDB building geometry source is invalid.');
  }
  const rows = [];
  for (const feature of value.features) {
    const block = typeof feature?.properties?.BLK_NO === 'string' ? feature.properties.BLK_NO.trim() : '';
    const streetCode = typeof feature?.properties?.ST_COD === 'string' ? feature.properties.ST_COD.trim() : '';
    const postalCode = `${feature?.properties?.POSTAL_COD ?? ''}`.trim();
    const points = geometryPoints(feature?.geometry?.coordinates);
    if (block === '' || streetCode === '' || !/^\d{6}$/u.test(postalCode) || points.length === 0) continue;
    const longitudes = points.map(([longitude]) => longitude);
    const latitudes = points.map(([, latitude]) => latitude);
    const location = singaporeLocation(
      (Math.min(...latitudes) + Math.max(...latitudes)) / 2,
      (Math.min(...longitudes) + Math.max(...longitudes)) / 2,
      postalCode,
    );
    if (location === null) continue;
    rows.push(Object.freeze({
      block,
      streetCode,
      postalCode,
      providerReference: postalCode,
      latitude: location.latitude,
      longitude: location.longitude,
    }));
  }
  return Object.freeze(rows.sort((left, right) => normalizedIdentity(left.block).localeCompare(normalizedIdentity(right.block))
    || left.streetCode.localeCompare(right.streetCode) || left.postalCode.localeCompare(right.postalCode)));
}

function addToSetMap(map, key, value) {
  const values = map.get(key) ?? new Set();
  values.add(value);
  map.set(key, values);
}

function addToListMap(map, key, value) {
  const values = map.get(key) ?? [];
  values.push(value);
  map.set(key, values);
}

function coordinateForGeometryGroup(rows) {
  return Object.freeze({
    latitude: rows.reduce((sum, row) => sum + row.latitude, 0) / rows.length,
    longitude: rows.reduce((sum, row) => sum + row.longitude, 0) / rows.length,
    providerReference: [...rows].sort((left, right) => left.postalCode.localeCompare(right.postalCode))[0].postalCode,
  });
}

function median(values) {
  const ordered = [...values].sort((left, right) => left - right);
  const middle = Math.floor(ordered.length / 2);
  return ordered.length % 2 === 0 ? (ordered[middle - 1] + ordered[middle]) / 2 : ordered[middle];
}

function townCentresFor(rows) {
  const coordinatesByTown = new Map();
  for (const row of rows) addToListMap(coordinatesByTown, row.building.localAttributes.town, row);
  return new Map([...coordinatesByTown].map(([town, townRows]) => [town, {
    latitude: median(townRows.map(({ latitude }) => latitude)),
    longitude: median(townRows.map(({ longitude }) => longitude)),
    sampleSize: townRows.length,
  }]));
}

function streetCodeMnemonicMatches(street, streetCode) {
  const words = street.normalize('NFKC').toLocaleUpperCase('en-SG').match(/[A-Z0-9]+/gu) ?? [];
  const first = words[0] ?? '';
  const second = words[1] ?? '';
  const last = words.at(-1) ?? '';
  const prefix = streetCode.slice(0, 3);
  return new Set([
    first.slice(0, 3),
    `${first.slice(0, 2)}${second[0] ?? ''}`,
    `${first.slice(0, 2)}${last[0] ?? ''}`,
    words.slice(0, 3).map((word) => word[0]).join(''),
    `${first[0] ?? ''}${second[0] ?? ''}${last[0] ?? ''}`,
  ]).has(prefix);
}

export function matchHdbBuildingsToGeometry(buildings, geometryRows) {
  const blocksByStreet = new Map();
  const blocksByCode = new Map();
  const streetLabels = new Map();
  const geometryByBlockAndCode = new Map();
  for (const building of buildings) {
    const street = normalizedIdentity(building.localAttributes.street);
    addToSetMap(blocksByStreet, street, normalizedIdentity(building.localAttributes.block));
    streetLabels.set(street, building.localAttributes.street);
  }
  for (const row of geometryRows) {
    addToSetMap(blocksByCode, row.streetCode, normalizedIdentity(row.block));
    addToListMap(geometryByBlockAndCode, `${normalizedIdentity(row.block)}:${row.streetCode}`, row);
  }

  const provisionalStreetCodes = [];
  for (const [street, streetBlocks] of blocksByStreet) {
    const scored = [...blocksByCode].flatMap(([streetCode, codeBlocks]) => {
      const overlap = [...streetBlocks].filter((block) => codeBlocks.has(block)).length;
      if (overlap === 0) return [];
      return [{
        streetCode,
        overlap,
        mnemonic: streetCodeMnemonicMatches(streetLabels.get(street), streetCode),
        similarity: overlap / (streetBlocks.size + codeBlocks.size - overlap),
      }];
    }).sort((left, right) => Number(right.mnemonic) - Number(left.mnemonic)
      || right.similarity - left.similarity || right.overlap - left.overlap
      || left.streetCode.localeCompare(right.streetCode));
    const first = scored[0];
    const second = scored[1];
    if (first === undefined) continue;
    const comparableSecondSimilarity = second?.mnemonic === first.mnemonic ? second.similarity : 0;
    const clear = first.mnemonic
      ? second?.mnemonic !== true || first.similarity - comparableSecondSimilarity >= 0.05
      : first.similarity >= 0.5 && first.similarity - comparableSecondSimilarity >= 0.05;
    if (clear) provisionalStreetCodes.push({ street, streetCode: first.streetCode });
  }

  const streetsByCode = new Map();
  for (const choice of provisionalStreetCodes) addToSetMap(streetsByCode, choice.streetCode, choice.street);
  const streetCodes = new Map(provisionalStreetCodes.flatMap((choice) =>
    streetsByCode.get(choice.streetCode)?.size === 1 ? [[choice.street, choice.streetCode]] : []));

  const matched = [];
  const unmatched = [];
  for (const building of buildings) {
    const block = normalizedIdentity(building.localAttributes.block);
    const streetCode = streetCodes.get(normalizedIdentity(building.localAttributes.street));
    const rows = streetCode === undefined ? [] : geometryByBlockAndCode.get(`${block}:${streetCode}`) ?? [];
    if (rows.length === 0) unmatched.push(building.legacyKey);
    else matched.push({ building, ...coordinateForGeometryGroup(rows) });
  }
  const initialTownCentres = townCentresFor(matched);
  const validatedMatches = matched.filter((row) => {
    const townCentre = initialTownCentres.get(row.building.localAttributes.town);
    const valid = townCentre === undefined || townCentre.sampleSize < 3
      || haversineMeters(townCentre, row) < HDB_TOWN_MAX_DISTANCE_METERS;
    if (!valid) unmatched.push(row.building.legacyKey);
    return valid;
  });
  return Object.freeze({
    matches: Object.freeze(validatedMatches.map(({ building, ...location }) => Object.freeze({
      buildingKey: building.legacyKey,
      ...location,
    })).sort((left, right) => left.buildingKey.localeCompare(right.buildingKey))),
    unmatched: Object.freeze(unmatched.sort()),
  });
}

export function haversineMeters(left, right) {
  const radians = (degrees) => degrees * Math.PI / 180;
  const deltaLatitude = radians(right.latitude - left.latitude);
  const deltaLongitude = radians(right.longitude - left.longitude);
  const leftLatitude = radians(left.latitude);
  const rightLatitude = radians(right.latitude);
  const haversine = Math.sin(deltaLatitude / 2) ** 2
    + Math.cos(leftLatitude) * Math.cos(rightLatitude) * Math.sin(deltaLongitude / 2) ** 2;
  return Math.round(6_371_008.8 * 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine)));
}

function nearestPlace(building, places) {
  let nearest = null;
  for (const place of places) {
    const distanceMeters = haversineMeters(building, place);
    if (nearest === null || distanceMeters < nearest.distanceMeters
      || (distanceMeters === nearest.distanceMeters && place.providerId.localeCompare(nearest.place.providerId) < 0)) {
      nearest = { place, distanceMeters };
    }
  }
  return nearest;
}

export function buildSingaporeNearbyRows({ buildings, stations, schools, checkedAt, evidenceSha256 }) {
  const rows = [];
  for (const building of [...buildings].sort((left, right) => left.buildingKey.localeCompare(right.buildingKey))) {
    const latitude = finiteCoordinate(building.latitude, 1.1, 1.55);
    const longitude = finiteCoordinate(building.longitude, 103.5, 104.2);
    if (!building.buildingKey?.startsWith('singapore:') || latitude === null || longitude === null) continue;
    const coordinate = { latitude, longitude };
    const station = nearestPlace(coordinate, stations);
    const school = nearestPlace(coordinate, schools);
    if (station !== null) rows.push({
      buildingKey: building.buildingKey,
      kind: 'station',
      providerId: station.place.providerId,
      name: station.place.name,
      distanceMeters: station.distanceMeters,
      walkingMinutes: null,
      latitude: station.place.latitude,
      longitude: station.place.longitude,
      lines: [...station.place.lines],
      isNearest: true,
      source: LTA_SOURCE,
      evidenceSha256,
      checkedAt,
    });
    if (school !== null) rows.push({
      buildingKey: building.buildingKey,
      kind: 'school',
      providerId: school.place.providerId,
      name: school.place.name,
      distanceMeters: school.distanceMeters,
      walkingMinutes: null,
      latitude: school.place.latitude,
      longitude: school.place.longitude,
      lines: [],
      isNearest: true,
      source: MOE_SOURCE,
      evidenceSha256,
      checkedAt,
    });
  }
  return Object.freeze(rows.map((row) => Object.freeze({
    ...row,
    lines: Object.freeze(row.lines),
    identityKey: `${row.buildingKey}:${row.kind}:${row.providerId}`,
  })));
}

export function buildSingaporeNearbyArtifact(input) {
  const rows = buildSingaporeNearbyRows({
    ...input,
    evidenceSha256: input.sourceSha256,
  });
  const orderedRows = Object.freeze([...rows].sort((left, right) => left.identityKey.localeCompare(right.identityKey)));
  const summary = Object.freeze({
    buildings: new Set(orderedRows.map(({ buildingKey }) => buildingKey)).size,
    stations: orderedRows.filter(({ kind }) => kind === 'station').length,
    schools: orderedRows.filter(({ kind }) => kind === 'school').length,
    total: orderedRows.length,
    digest: sha256(orderedRows.map(({ identityKey }) => identityKey).join('\n')),
    sourceSha256: input.sourceSha256,
    ...(input.coverage ?? {}),
  });
  return Object.freeze({
    version: SINGAPORE_NEARBY_VERSION,
    asOf: input.checkedAt,
    sources: Object.freeze({ ...input.sources }),
    summary,
    rows: orderedRows,
  });
}

function readDataFile(name) {
  for (const path of [resolve(process.cwd(), 'data', name), resolve(process.cwd(), 'apps/web/data', name)]) {
    try { return readFileSync(path); } catch { /* Try the alternate workspace root. */ }
  }
  throw new Error(`SignedPrice Singapore nearby source unavailable: ${name}`);
}

export function loadSingaporeNearbyPlaceSeed() {
  if (cachedSeed !== undefined) return cachedSeed;
  const artifact = JSON.parse(gunzipSync(readDataFile('singapore-nearby-places.json.gz')).toString('utf8'));
  if (artifact?.version !== SINGAPORE_NEARBY_VERSION || !Array.isArray(artifact.rows)
    || typeof artifact.summary?.digest !== 'string' || typeof artifact.summary?.sourceSha256 !== 'string') {
    throw new TypeError('SignedPrice Singapore nearby-place source invalid.');
  }
  const rows = Object.freeze(artifact.rows.map((row) => Object.freeze({
    ...row,
    lines: Object.freeze(Array.isArray(row.lines) ? row.lines : []),
  })));
  const digest = sha256(rows.map(({ identityKey }) => identityKey).sort().join('\n'));
  if (digest !== artifact.summary.digest || rows.length !== artifact.summary.total
    || rows.some((row) => row.evidenceSha256 !== artifact.summary.sourceSha256)) {
    throw new TypeError('SignedPrice Singapore nearby-place source digest mismatch.');
  }
  cachedSeed = Object.freeze({ rows, summary: Object.freeze({ ...artifact.summary }), artifact: Object.freeze(artifact) });
  return cachedSeed;
}
