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
  const rows = source.records.map((entry) => {
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
  const rows = source.projects.map((entry) => {
    const record = object(entry);
    if (record === null) throw new Error('SignedPrice Singapore private seed record invalid.');
    const externalId = text(record.id, 'project.id');
    const name = text(record.project, 'project.project');
    const street = text(record.street, 'project.street');
    const district = text(record.district, 'project.district');
    const marketSegment = text(record.marketSegment, 'project.marketSegment');
    const geographyId = `sg-singapore:district:${district}`;
    return {
      source: 'singapore-private',
      legacyKey: `singapore:project:${externalId}`,
      legacyMarketKey: 'singapore',
      externalId,
      name,
      normalizedName: normalizedName(name),
      address: `${street}, Singapore`,
      latitude: null,
      longitude: null,
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
