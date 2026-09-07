import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { gzipSync } from 'node:zlib';

import { loadSingaporeHdbSeed, loadSingaporePrivateSeed } from './property-seed-source.mjs';
import {
  buildSingaporeNearbyArtifact,
  buildSingaporeNearbySourceSha256,
  matchHdbBuildingsToGeometry,
  parseGeocodedSchoolCsv,
  parseHdbBuildingGeometry,
  parseLtaStationExits,
  parseMoeSchools,
  selectOneMapSchoolLocation,
} from './singapore-nearby-place-source.mjs';

const LTA_DATASET_ID = 'd_b39d3a0871985372d7e1637193335da5';
const MOE_DATASET_ID = 'd_688b934f82c1059ed0a6993d2a829089';
const HDB_BUILDING_DATASET_ID = 'd_16b157c52ed637edd6ba1232e026258d';
const LTA_PAGE = `https://data.gov.sg/datasets/${LTA_DATASET_ID}/view`;
const MOE_PAGE = `https://data.gov.sg/datasets/${MOE_DATASET_ID}/view`;
const HDB_BUILDING_PAGE = `https://data.gov.sg/datasets/${HDB_BUILDING_DATASET_ID}/view`;
const ONEMAP_PAGE = 'https://www.onemap.gov.sg/apidocs/search';
const CACHE_VERSION = 'signedprice-singapore-onemap-cache-v1';

function sleep(milliseconds) {
  return new Promise((resolvePromise) => setTimeout(resolvePromise, milliseconds));
}

function parseArguments(argv) {
  const value = (name) => argv.find((argument) => argument.startsWith(`${name}=`))?.slice(name.length + 1);
  const requestsPerMinute = Number(value('--requests-per-minute') ?? '240');
  const maximumHdb = value('--max-hdb') === undefined ? null : Number(value('--max-hdb'));
  if (!Number.isFinite(requestsPerMinute) || requestsPerMinute < 1 || requestsPerMinute > 300) {
    throw new RangeError('OneMap requests per minute must be between 1 and 300.');
  }
  if (maximumHdb !== null && (!Number.isSafeInteger(maximumHdb) || maximumHdb < 0)) {
    throw new RangeError('Maximum HDB rows must be a non-negative integer.');
  }
  const date = value('--as-of') ?? new Date().toISOString().slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/u.test(date)) throw new TypeError('As-of date must use YYYY-MM-DD.');
  return Object.freeze({
    output: resolve(value('--output') ?? resolve(process.cwd(), 'data', 'singapore-nearby-places.json.gz')),
    cache: resolve(value('--cache') ?? resolve(process.cwd(), '.cache', 'singapore-onemap-geocodes.json')),
    requestsPerMinute,
    maximumHdb,
    privateOnly: argv.includes('--private-only'),
    checkedAt: `${date}T00:00:00.000Z`,
  });
}

function loadCache(path) {
  if (!existsSync(path)) return { version: CACHE_VERSION, locations: {} };
  const parsed = JSON.parse(readFileSync(path, 'utf8'));
  if (parsed?.version !== CACHE_VERSION || typeof parsed.locations !== 'object' || parsed.locations === null) {
    throw new TypeError('OneMap cache version mismatch.');
  }
  return parsed;
}

function saveCache(path, cache) {
  mkdirSync(dirname(path), { recursive: true });
  const temporary = `${path}.tmp`;
  writeFileSync(temporary, `${JSON.stringify(cache)}\n`);
  renameSync(temporary, path);
}

function createRateLimiter(requestsPerMinute) {
  const interval = 60_000 / requestsPerMinute;
  let nextStart = Date.now();
  return Object.freeze({
    async run(operation) {
      const scheduled = nextStart;
      nextStart = Math.max(nextStart, Date.now()) + interval;
      if (scheduled > Date.now()) await sleep(scheduled - Date.now());
      return operation();
    },
  });
}

async function fetchJson(url, { headers = {}, limiter = null, attempts = 5 } = {}) {
  let lastError;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      const response = await (limiter === null
        ? fetch(url, { headers })
        : limiter.run(() => fetch(url, { headers })));
      if (response.status === 429 || response.status >= 500) {
        const retryAfter = Number(response.headers.get('retry-after'));
        await sleep(Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter * 1_000 : attempt * 1_000);
        continue;
      }
      if (!response.ok) throw new Error(`HTTP ${response.status} for ${new URL(url).origin}`);
      const body = await response.json();
      if (body?.error) throw new Error(`Geocoder response error: ${body.error}`);
      return body;
    } catch (error) {
      lastError = error;
      if (attempt < attempts) await sleep(attempt * 1_000);
    }
  }
  throw lastError ?? new Error('Official dataset request failed.');
}

async function downloadOfficialSources(cacheDirectory) {
  const ltaCache = resolve(cacheDirectory, 'lta-station-exits.geojson');
  const hdbCache = resolve(cacheDirectory, 'hdb-existing-building.geojson');
  const schoolCoordinateCache = resolve(cacheDirectory, 'schools-geocoded.csv');
  const missingDatasets = [
    ...(!existsSync(ltaCache) ? [['lta', LTA_DATASET_ID]] : []),
    ...(!existsSync(hdbCache) ? [['hdb', HDB_BUILDING_DATASET_ID]] : []),
  ];
  const downloadUrls = new Map();
  await Promise.all(missingDatasets.map(async ([name, datasetId]) => {
    const poll = await fetchJson(`https://api-open.data.gov.sg/v1/public/api/datasets/${datasetId}/poll-download`);
    if (poll?.code !== 0 || typeof poll?.data?.url !== 'string') throw new Error(`${name} download URL unavailable.`);
    downloadUrls.set(name, poll.data.url);
  }));
  const [lta, hdb, moe] = await Promise.all([
    existsSync(ltaCache) ? JSON.parse(readFileSync(ltaCache, 'utf8')) : fetchJson(downloadUrls.get('lta')),
    existsSync(hdbCache) ? JSON.parse(readFileSync(hdbCache, 'utf8')) : fetchJson(downloadUrls.get('hdb')),
    existsSync(schoolCoordinateCache)
      ? Promise.resolve(null)
      : fetchJson(`https://data.gov.sg/api/action/datastore_search?resource_id=${MOE_DATASET_ID}&limit=500`),
  ]);
  for (const [path, value] of [[ltaCache, lta], [hdbCache, hdb]]) {
    if (!existsSync(path)) {
      mkdirSync(dirname(path), { recursive: true });
      writeFileSync(path, JSON.stringify(value));
    }
  }
  return Object.freeze({
    lta,
    moe,
    hdb,
    geocodedSchoolCsv: existsSync(schoolCoordinateCache) ? readFileSync(schoolCoordinateCache, 'utf8') : null,
  });
}

function oneMapUrl(searchValue) {
  const url = new URL('https://www.onemap.gov.sg/api/common/elastic/search');
  url.searchParams.set('searchVal', searchValue);
  url.searchParams.set('returnGeom', 'Y');
  url.searchParams.set('getAddrDetails', 'Y');
  url.searchParams.set('pageNum', '1');
  return url.toString();
}

async function collectLocations({ items, cache, cachePath, limiter, headers, keyFor, urlFor, select }) {
  const missing = items.filter((item) => !Object.hasOwn(cache.locations, keyFor(item)));
  for (let offset = 0; offset < missing.length; offset += 25) {
    const batch = missing.slice(offset, offset + 25);
    const settled = await Promise.allSettled(batch.map(async (item) => {
      const key = keyFor(item);
      const response = await fetchJson(urlFor(item), { headers, limiter });
      return [key, select(item, response)];
    }));
    for (const result of settled) {
      if (result.status === 'rejected') throw result.reason;
      const [key, location] = result.value;
      cache.locations[key] = location;
    }
    saveCache(cachePath, cache);
    process.stdout.write(`${JSON.stringify({ state: 'geocoding', completed: Math.min(offset + batch.length, missing.length), pendingAtStart: missing.length, cached: items.length - missing.length })}\n`);
  }
  return items.map((item) => ({ item, location: cache.locations[keyFor(item)] ?? null }));
}

async function main() {
  const options = parseArguments(process.argv.slice(2));
  const token = process.env.ONEMAP_TOKEN?.trim() ?? '';
  const schoolCoordinateSnapshot = resolve(dirname(options.cache), 'schools-geocoded.csv');
  if (!existsSync(schoolCoordinateSnapshot) && token === '') {
    throw new Error('ONEMAP_TOKEN is required when the verified OneMap school-coordinate snapshot is unavailable.');
  }
  const official = await downloadOfficialSources(dirname(options.cache));
  const stationExits = parseLtaStationExits(official.lta);
  let schoolDirectory;
  let schools;
  let schoolGeocoder;
  let schoolCoordinateSource;
  if (official.geocodedSchoolCsv !== null) {
    schools = parseGeocodedSchoolCsv(official.geocodedSchoolCsv);
    schoolDirectory = schools;
    schoolGeocoder = 'OneMap verified coordinate snapshot';
    schoolCoordinateSource = ONEMAP_PAGE;
  } else {
    schoolDirectory = parseMoeSchools(official.moe);
    const cache = loadCache(options.cache);
    const schoolLocations = await collectLocations({
      items: schoolDirectory,
      cache,
      cachePath: options.cache,
      limiter: createRateLimiter(options.requestsPerMinute),
      headers: { Authorization: token },
      keyFor: (school) => `onemap:school:${school.postalCode}`,
      urlFor: (school) => oneMapUrl(school.postalCode),
      select: selectOneMapSchoolLocation,
    });
    schools = schoolLocations.flatMap(({ item, location }) => location === null ? [] : [{ ...item, ...location }]);
    schoolGeocoder = 'OneMap';
    schoolCoordinateSource = ONEMAP_PAGE;
  }
  const privateInventory = loadSingaporePrivateSeed();
  const privateBuildings = privateInventory.flatMap((building) => building.latitude === null || building.longitude === null ? [] : [{
    buildingKey: building.legacyKey,
    latitude: building.latitude,
    longitude: building.longitude,
  }]);
  const requestedHdb = options.privateOnly ? [] : loadSingaporeHdbSeed().slice(0, options.maximumHdb ?? undefined);
  const hdbGeometry = parseHdbBuildingGeometry(official.hdb);
  const hdbMatch = matchHdbBuildingsToGeometry(requestedHdb, hdbGeometry);
  const hdbBuildings = hdbMatch.matches.map(({ buildingKey, latitude, longitude }) => ({
    buildingKey,
    latitude,
    longitude,
  }));
  const sourceCoordinates = [
    ...schools.map((school) => [school.providerId, {
      latitude: school.latitude,
      longitude: school.longitude,
      providerReference: school.postalCode,
    }]),
    ...hdbMatch.matches.map(({ buildingKey, latitude, longitude, providerReference }) => [
      buildingKey,
      { latitude, longitude, providerReference },
    ]),
  ].sort(([left], [right]) => left.localeCompare(right));
  const sourceSha256 = buildSingaporeNearbySourceSha256({
    lta: official.lta,
    moe: official.moe ?? official.geocodedSchoolCsv,
    hdb: official.hdb,
    privateBuildings: privateInventory,
    coordinates: sourceCoordinates,
  });
  const artifact = buildSingaporeNearbyArtifact({
    buildings: [...privateBuildings, ...hdbBuildings],
    stations: stationExits,
    schools,
    checkedAt: options.checkedAt,
    sourceSha256,
    sources: {
      lta: LTA_PAGE,
      moe: MOE_PAGE,
      hdbBuildings: HDB_BUILDING_PAGE,
      schoolCoordinates: schoolCoordinateSource,
    },
    coverage: {
      stationExits: stationExits.length,
      schoolDirectory: schoolDirectory.length,
      schoolsLocated: schools.length,
      privateInventory: privateInventory.length,
      privateLocated: privateBuildings.length,
      hdbInventory: loadSingaporeHdbSeed().length,
      hdbRequested: requestedHdb.length,
      hdbLocated: hdbBuildings.length,
      hdbUnmatched: hdbMatch.unmatched.length,
      hdbGeometryFeatures: hdbGeometry.length,
      schoolCoordinateProvider: schoolGeocoder,
    },
  });
  mkdirSync(dirname(options.output), { recursive: true });
  writeFileSync(options.output, gzipSync(JSON.stringify(artifact), { level: 9 }));
  process.stdout.write(`${JSON.stringify({ state: 'written', output: options.output, summary: artifact.summary })}\n`);
}

await main();
