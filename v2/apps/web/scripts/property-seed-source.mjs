import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { gunzipSync } from 'node:zlib';

const SEOUL_VERSION = 'signedprice-observed-building-inventory-v1';
const SG_PRIVATE_VERSION = 'signedprice-singapore-private-sale-v1';
const SG_HDB_VERSION = 'signedprice-singapore-hdb-published-v1';

const SEOUL_DISTRICT_NAMES = Object.freeze({
  'jongno-gu': '종로구',
  'jung-gu': '중구',
  'yongsan-gu': '용산구',
  'seongdong-gu': '성동구',
  'gwangjin-gu': '광진구',
  'dongdaemun-gu': '동대문구',
  'jungnang-gu': '중랑구',
  'seongbuk-gu': '성북구',
  'gangbuk-gu': '강북구',
  'dobong-gu': '도봉구',
  'nowon-gu': '노원구',
  'eunpyeong-gu': '은평구',
  'seodaemun-gu': '서대문구',
  'mapo-gu': '마포구',
  'yangcheon-gu': '양천구',
  'gangseo-gu': '강서구',
  'guro-gu': '구로구',
  'geumcheon-gu': '금천구',
  'yeongdeungpo-gu': '영등포구',
  'dongjak-gu': '동작구',
  'gwanak-gu': '관악구',
  'seocho-gu': '서초구',
  'gangnam-gu': '강남구',
  'songpa-gu': '송파구',
  'gangdong-gu': '강동구',
});

function readDataFile(name) {
  const candidates = [
    resolve(process.cwd(), 'data', name),
    resolve(process.cwd(), 'apps/web/data', name),
  ];
  for (const path of candidates) {
    try {
      return readFileSync(path);
    } catch {
      // Try the alternate workspace root.
    }
  }
  throw new Error(`SignedPrice seed source unavailable: ${name}`);
}

function readGzipJson(name) {
  return JSON.parse(gunzipSync(readDataFile(name)).toString('utf8'));
}

function object(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value) ? value : null;
}

function text(value, field) {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new Error(`SignedPrice seed source invalid: ${field}`);
  }
  return value.trim();
}

function normalizedName(value) {
  return value.normalize('NFKC').toLocaleLowerCase('en-US').replace(/[^\p{L}\p{N}]+/gu, '');
}

function slug(value) {
  const result = value.toLocaleLowerCase('en-SG').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  if (result === '') throw new Error('SignedPrice seed source invalid: slug');
  return result;
}

function stableDigest(values) {
  return createHash('sha256').update([...values].sort().join('\n')).digest('hex');
}

function freezeRows(rows) {
  return Object.freeze(rows.map((row) => Object.freeze(row)));
}

function svy21ToWgs84(x, y) {
  if (!Number.isFinite(x) || !Number.isFinite(y) || x < 0 || x > 60_000 || y < 0 || y > 60_000) return null;
  const semiMajorAxis = 6_378_137;
  const flattening = 1 / 298.257223563;
  const eccentricitySquared = flattening * (2 - flattening);
  const secondEccentricitySquared = eccentricitySquared / (1 - eccentricitySquared);
  const radians = Math.PI / 180;
  const originLatitude = (1 + 22 / 60) * radians;
  const meridian = (latitude) => semiMajorAxis * (
    (1 - eccentricitySquared / 4 - 3 * eccentricitySquared ** 2 / 64
      - 5 * eccentricitySquared ** 3 / 256) * latitude
    - (3 * eccentricitySquared / 8 + 3 * eccentricitySquared ** 2 / 32
      + 45 * eccentricitySquared ** 3 / 1024) * Math.sin(2 * latitude)
    + (15 * eccentricitySquared ** 2 / 256 + 45 * eccentricitySquared ** 3 / 1024)
      * Math.sin(4 * latitude)
    - 35 * eccentricitySquared ** 3 / 3072 * Math.sin(6 * latitude)
  );
  const target = meridian(originLatitude) + y - 38_744.572;
  let latitudeRadians = originLatitude;
  for (let iteration = 0; iteration < 5; iteration += 1) {
    const radius = semiMajorAxis * (1 - eccentricitySquared)
      / (1 - eccentricitySquared * Math.sin(latitudeRadians) ** 2) ** 1.5;
    latitudeRadians += (target - meridian(latitudeRadians)) / radius;
  }
  const sine = Math.sin(latitudeRadians);
  const cosine = Math.cos(latitudeRadians);
  const tangent = Math.tan(latitudeRadians);
  const primeVertical = semiMajorAxis
    / Math.sqrt(1 - eccentricitySquared * sine ** 2);
  const meridional = semiMajorAxis * (1 - eccentricitySquared)
    / (1 - eccentricitySquared * sine ** 2) ** 1.5;
  const tangentSquared = tangent ** 2;
  const correction = secondEccentricitySquared * cosine ** 2;
  const distance = (x - 28_001.642) / primeVertical;
  const latitude = (latitudeRadians - primeVertical * tangent / meridional * (
    distance ** 2 / 2
    - (5 + 3 * tangentSquared + 10 * correction - 4 * correction ** 2
      - 9 * secondEccentricitySquared) * distance ** 4 / 24
    + (61 + 90 * tangentSquared + 298 * correction + 45 * tangentSquared ** 2
      - 252 * secondEccentricitySquared - 3 * correction ** 2) * distance ** 6 / 720
  )) / radians;
  const longitude = 103 + 50 / 60 + (
    distance - (1 + 2 * tangentSquared + correction) * distance ** 3 / 6
    + (5 - 2 * correction + 28 * tangentSquared - 3 * correction ** 2
      + 8 * secondEccentricitySquared + 24 * tangentSquared ** 2) * distance ** 5 / 120
  ) / cosine / radians;
  return latitude >= 1.15 && latitude <= 1.5 && longitude >= 103.55 && longitude <= 104.15
    ? Object.freeze({ latitude, longitude })
    : null;
}

function singaporeProjectLocations(source) {
  const pointsByProject = new Map();
  for (const entry of source.records) {
    const record = object(entry);
    if (record === null || typeof record.projectId !== 'string') continue;
    if (typeof record.x !== 'number' || typeof record.y !== 'number'
      || !Number.isFinite(record.x) || !Number.isFinite(record.y)
      || record.x < 0 || record.x > 60_000 || record.y < 0 || record.y > 60_000) continue;
    const points = pointsByProject.get(record.projectId) ?? [];
    points.push(Object.freeze({ x: record.x, y: record.y }));
    pointsByProject.set(record.projectId, points);
  }
  const locations = new Map();
  for (const [projectId, points] of pointsByProject) {
    const first = points[0];
    if (first === undefined
      || points.some((point) => Math.hypot(point.x - first.x, point.y - first.y) > 250)) continue;
    const location = svy21ToWgs84(first.x, first.y);
    if (location !== null) locations.set(projectId, location);
  }
  return locations;
}

function seoulSearchAddress(districtSlug, neighborhoodName, buildingName) {
  const districtName = SEOUL_DISTRICT_NAMES[districtSlug];
  if (districtName === undefined) {
    throw new Error(`SignedPrice Seoul seed district is unsupported: ${districtSlug}`);
  }
  const lotNumber = /^\((산?\d+(?:-\d+)?)\)$/.exec(buildingName)?.[1];
  return `서울특별시 ${districtName} ${neighborhoodName} ${lotNumber ?? buildingName}`;
}

export function loadSeoulBuildingSeed() {
  const source = object(readGzipJson('observed-building-inventory.json.gz'));
  if (source?.artifactVersion !== SEOUL_VERSION || !Array.isArray(source.records)) {
    throw new Error('SignedPrice Seoul building seed source version mismatch.');
  }
  const sale = object(readGzipJson('korea-sale-evidence.json.gz'));
  if (!Array.isArray(sale?.buildingRecords)) throw new Error('SignedPrice Seoul sale identities unavailable.');
  const identities = new Map(source.records.map(record => [record.buildingId, record]));
  for (const record of sale.buildingRecords) {
    const existing = identities.get(record.buildingId);
    if (existing && ['districtSlug', 'neighborhoodName', 'housingType', 'officialName'].some(key => existing[key] !== record[key])) {
      throw new Error(`SignedPrice Seoul identity conflict: ${record.buildingId}`);
    }
    if (!existing) identities.set(record.buildingId, record);
  }
  const rows = [...identities.values()].map((entry) => {
    const record = object(entry);
    if (record === null) throw new Error('SignedPrice Seoul building seed record invalid.');
    const externalId = text(record.buildingId, 'buildingId');
    const name = text(record.officialName, 'officialName');
    const districtSlug = text(record.districtSlug, 'districtSlug');
    const neighborhoodId = text(record.neighborhoodId, 'neighborhoodId');
    const neighborhoodName = text(record.neighborhoodName, 'neighborhoodName');
    const coordinate = object(record.coordinate);
    const ready = coordinate?.state === 'ready'
      && typeof coordinate.latitude === 'number' && Number.isFinite(coordinate.latitude)
      && typeof coordinate.longitude === 'number' && Number.isFinite(coordinate.longitude);
    const geographyId = `kr-seoul:neighborhood:${neighborhoodId}`;
    return {
      source: 'seoul-building',
      legacyKey: `seoul:${externalId}`,
      legacyMarketKey: 'seoul',
      externalId,
      name,
      normalizedName: normalizedName(name),
      address: seoulSearchAddress(districtSlug, neighborhoodName, name),
      latitude: ready ? coordinate.latitude : null,
      longitude: ready ? coordinate.longitude : null,
      globalEntityId: `kr-seoul:estate:${externalId}`,
      globalMarketId: 'kr-seoul',
      globalKind: 'estate',
      geographyId,
      geographyKind: 'neighborhood',
      geographyName: neighborhoodName,
      geographyProviderCode: neighborhoodId,
      externalSourceId: 'signedprice-korea-building',
      externalType: 'building-id',
      localSchemaVersion: 'kr-property@1',
      localAttributes: {
        housingType: text(record.housingType, 'housingType'),
        districtSlug,
        neighborhoodName,
        legacyBuildingKey: `seoul:${externalId}`,
      },
    };
  });
  return freezeRows(rows);
}

export function loadSingaporePrivateSeed() {
  const source = object(readGzipJson('singapore-private-sale.json.gz'));
  if (source?.version !== SG_PRIVATE_VERSION || !Array.isArray(source.projects)) {
    throw new Error('SignedPrice Singapore private seed source version mismatch.');
  }
  const locations = singaporeProjectLocations(source);
  const rows = source.projects.map((entry) => {
    const record = object(entry);
    if (record === null) throw new Error('SignedPrice Singapore private seed record invalid.');
    const externalId = text(record.id, 'project.id');
    const name = text(record.project, 'project.project');
    const street = text(record.street, 'project.street');
    const district = text(record.district, 'project.district');
    const marketSegment = text(record.marketSegment, 'project.marketSegment');
    const location = locations.get(externalId) ?? null;
    const geographyId = `sg-singapore:district:${district}`;
    return {
      source: 'singapore-private',
      legacyKey: `singapore:project:${externalId}`,
      legacyMarketKey: 'singapore',
      externalId,
      name,
      normalizedName: normalizedName(name),
      address: `${street}, Singapore`,
      latitude: location?.latitude ?? null,
      longitude: location?.longitude ?? null,
      globalEntityId: `sg-singapore:project:${externalId}`,
      globalMarketId: 'sg-singapore',
      globalKind: 'project',
      geographyId,
      geographyKind: 'district',
      geographyName: district,
      geographyProviderCode: district,
      externalSourceId: 'ura-private-sale',
      externalType: 'project-id',
      localSchemaVersion: 'sg-private@1',
      localAttributes: {
        housingSector: 'private_residential',
        marketSegment,
        street,
        legacyBuildingKey: `singapore:project:${externalId}`,
      },
    };
  });
  return freezeRows(rows);
}

export function loadSingaporeHdbSeed() {
  const source = object(readGzipJson('singapore-hdb.json.gz'));
  if (source?.version !== SG_HDB_VERSION || !Array.isArray(source.blocks)) {
    throw new Error('SignedPrice Singapore HDB seed source version mismatch.');
  }
  const rows = source.blocks.map((entry) => {
    const record = object(entry);
    if (record === null) throw new Error('SignedPrice Singapore HDB seed record invalid.');
    const externalId = text(record.blockId, 'block.blockId');
    const town = text(record.town, 'block.town');
    const block = text(record.block, 'block.block');
    const street = text(record.street, 'block.street');
    const name = `${block} ${street}`;
    const townSlug = slug(town);
    const geographyId = `sg-singapore:town:${townSlug}`;
    return {
      source: 'singapore-hdb',
      legacyKey: `singapore:block:${externalId}`,
      legacyMarketKey: 'singapore',
      externalId,
      name,
      normalizedName: normalizedName(name),
      address: `${name}, Singapore`,
      latitude: null,
      longitude: null,
      globalEntityId: `sg-singapore:block:${externalId}`,
      globalMarketId: 'sg-singapore',
      globalKind: 'block',
      geographyId,
      geographyKind: 'town',
      geographyName: town,
      geographyProviderCode: townSlug,
      externalSourceId: 'hdb',
      externalType: 'block-id',
      localSchemaVersion: 'sg-hdb@1',
      localAttributes: {
        housingSector: 'hdb',
        town,
        block,
        street,
        legacyBuildingKey: `singapore:block:${externalId}`,
      },
    };
  });
  return freezeRows(rows);
}

export function loadPropertySeedRows() {
  const seoul = loadSeoulBuildingSeed();
  const singaporePrivate = loadSingaporePrivateSeed();
  const singaporeHdb = loadSingaporeHdbSeed();
  const all = freezeRows([...seoul, ...singaporePrivate, ...singaporeHdb]);
  const legacyIds = all.map(({ legacyMarketKey, externalId }) => `${legacyMarketKey}:${externalId}`);
  const entityIds = all.map(({ globalEntityId }) => globalEntityId);
  if (new Set(legacyIds).size !== legacyIds.length) {
    throw new Error('SignedPrice seed contains duplicate legacy market IDs.');
  }
  if (new Set(entityIds).size !== entityIds.length) {
    throw new Error('SignedPrice seed contains duplicate global entity IDs.');
  }
  return Object.freeze({
    seoul,
    singaporePrivate,
    singaporeHdb,
    all,
    summary: Object.freeze({
      seoul: seoul.length,
      singaporePrivate: singaporePrivate.length,
      singaporeHdb: singaporeHdb.length,
      total: all.length,
      legacyIdDigest: stableDigest(legacyIds),
      entityIdDigest: stableDigest(entityIds),
    }),
  });
}

export function propertySeedPage(kind, offset = 0, limit = 1000) {
  const seed = loadPropertySeedRows();
  const source = kind === 'seoul'
    ? seed.seoul
    : kind === 'singapore-private'
      ? seed.singaporePrivate
      : kind === 'singapore-hdb'
        ? seed.singaporeHdb
        : null;
  if (source === null) throw new Error('Unknown SignedPrice seed kind.');
  const start = Number.isSafeInteger(offset) && offset >= 0 ? offset : 0;
  const size = Number.isSafeInteger(limit) && limit >= 1 && limit <= 5000 ? limit : 1000;
  return Object.freeze({
    kind,
    offset: start,
    limit: size,
    total: source.length,
    summary: seed.summary,
    items: Object.freeze(source.slice(start, start + size)),
  });
}
