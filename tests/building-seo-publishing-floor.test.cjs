// Replaces tests/building-seo-retirement.test.cjs.
//
// Building pages were retired in the 2026-08-26 stability release: every URL
// answered 410 with noindex,nofollow and nothing linked to them. They are back,
// but behind a publishing floor instead of a blanket switch — a building is
// offered to search only when its six-month sample is deep enough to say
// something true about it. Below the floor the URL 404s, because it was never
// published and 410 would be a lie about a page that never existed.

const test = require('node:test');
const assert = require('node:assert/strict');

const buildingApi = require('../api/seo-building-page.js');
const routes = require('../seo/seo-route-utils.cjs');
const {
  BUILDING_INDEX_MIN_CONTRACTS,
  BUILDING_INDEX_MIN_RENT_CONTRACTS
} = require('../seo/seo-page-renderer.cjs');

function responseRecorder() {
  return {
    statusCode:200,
    headers:{},
    body:'',
    status(code) { this.statusCode = code; return this; },
    setHeader(name, value) { this.headers[name] = value; },
    send(value) { this.body = String(value); return this; },
    end() { return this; }
  };
}

const DEEP = {
  buildingName:'Twin Villa',
  buildingKey:'연남동::twin villa',
  dong:'연남동',
  contractCount:BUILDING_INDEX_MIN_CONTRACTS + 21,
  monthlyRentCount:BUILDING_INDEX_MIN_RENT_CONTRACTS + 19,
  medianMonthlyRentWon:720000,
  medianMonthlyRentWonNew:720000,
  contextualMedianMonthlyRentWon:720000,
  medianDepositWon:20000000,
  medianJeonseDepositWon:180000000,
  typicalAreaSqm:23,
  newContractMonthlyRentCount:18,
  renewalMonthlyRentCount:4,
  contractTypeCounts:{ new:18, renewal:4, unknown:0 },
  depositBands:[{ minDepositWon:10000000, maxDepositWon:30000000, count:22, medianDepositWon:20000000, medianMonthlyRentWon:720000 }],
  areaGroups:[]
};

const SHALLOW = {
  ...DEEP,
  buildingName:'Thin Villa',
  buildingKey:'연남동::thin villa',
  contractCount:BUILDING_INDEX_MIN_CONTRACTS - 1,
  monthlyRentCount:1
};

function provider(overrides = {}) {
  return {
    getDongSummary:async () => ({ dong:'연남동', contractCount:412, buildings:[], monthlyTrend:[], recentTransactions:[] }),
    getBuildings:async () => [DEEP, SHALLOW],
    getBuildingDetail:async () => ({ ...DEEP, monthlyTrend:[], recentTransactions:[] }),
    ...overrides
  };
}

const fakeFxFetch = async () => ({ ok:true, json:async () => ({ rates:{ USD:0.00072, CNY:0.0052 } }) });

function makeHandler(overrides = {}) {
  return buildingApi.createHandler({
    providerFactory:() => provider(overrides),
    fetchImpl:fakeFxFetch
  });
}

async function request(handler, query) {
  const res = responseRecorder();
  await handler({ method:'GET', query:{ district:'mapo-gu', dong:'yeonnam-dong', type:'villa', lang:'en', ...query } }, res);
  return res;
}

test.beforeEach(() => { process.env.DATA_GO_KR_SERVICE_KEY = 'test'; });

test('a building above the publishing floor is served and offered to search', async () => {
  const res = await request(makeHandler(), { building:routes.buildingSlug(DEEP) });
  assert.equal(res.statusCode, 200);
  assert.equal(res.headers['X-Robots-Tag'], 'index,follow');
  assert.match(res.body, /<meta name="robots" content="index,follow">/);
  assert.match(res.headers['Cache-Control'], /s-maxage=86400/);
  assert.match(res.body, /Twin Villa/);
});

test('a building below the publishing floor is 404, not 410 — it was never published', async () => {
  const res = await request(makeHandler(), { building:routes.buildingSlug(SHALLOW) });
  assert.equal(res.statusCode, 404);
  assert.equal(res.headers['X-Robots-Tag'], 'noindex,follow');
  assert.doesNotMatch(res.body, /Twin Villa/);
});

test('a building with contracts but almost no monthly rents stays below the floor', async () => {
  const rentless = { ...DEEP, buildingKey:'연남동::rentless', buildingName:'Rentless Villa', monthlyRentCount:BUILDING_INDEX_MIN_RENT_CONTRACTS - 1 };
  const handler = buildingApi.createHandler({
    providerFactory:() => provider({ getBuildings:async () => [rentless] }),
    fetchImpl:fakeFxFetch
  });
  const res = await request(handler, { building:routes.buildingSlug(rentless) });
  assert.equal(res.statusCode, 404);
});

test('the hash suffix is the identity: a stale readable half 301s to the canonical URL', async () => {
  const canonical = routes.buildingSlug(DEEP);
  const suffix = routes.suffixOfSlug(canonical);
  assert.ok(suffix, 'slug must end in a stable hash suffix');

  const res = await request(makeHandler(), { building:`a-name-we-used-to-print-${suffix}` });
  assert.equal(res.statusCode, 301);
  assert.equal(
    res.headers.Location,
    routes.buildBuildingSeoUrl({ areaCode:'11440', dong:'연남동', propertyType:'villa', building:DEEP, lang:'en' })
  );
});

test('the canonical URL itself does not redirect', async () => {
  const res = await request(makeHandler(), { building:routes.buildingSlug(DEEP) });
  assert.equal(res.statusCode, 200);
  assert.equal(res.headers.Location, undefined);
});

test('a redirect keeps the Chinese path prefix', async () => {
  const suffix = routes.suffixOfSlug(routes.buildingSlug(DEEP));
  const res = await request(makeHandler(), { building:`stale-${suffix}`, lang:'zh' });
  assert.equal(res.statusCode, 301);
  assert.match(res.headers.Location, /^\/zh\/seoul\//);
});

test('an unknown slug 404s without inventing a building', async () => {
  const res = await request(makeHandler(), { building:'twin-villa-deadbee' });
  assert.equal(res.statusCode, 404);
});

test('a missing slug 404s before any provider is created', async () => {
  let providerCalls = 0;
  const handler = buildingApi.createHandler({
    providerFactory:() => { providerCalls += 1; return provider(); },
    fetchImpl:fakeFxFetch
  });
  const res = await request(handler, {});
  assert.equal(res.statusCode, 404);
  assert.equal(providerCalls, 0);
});

test('an unconfigured service key answers 503, never a half-built page', async () => {
  const previous = process.env.DATA_GO_KR_SERVICE_KEY;
  delete process.env.DATA_GO_KR_SERVICE_KEY;
  try {
    const res = await request(makeHandler(), { building:routes.buildingSlug(DEEP) });
    assert.equal(res.statusCode, 503);
    assert.equal(res.headers['X-Robots-Tag'], 'noindex,follow');
    assert.equal(res.headers['Cache-Control'], 'no-store');
  } finally {
    if (previous === undefined) delete process.env.DATA_GO_KR_SERVICE_KEY;
    else process.env.DATA_GO_KR_SERVICE_KEY = previous;
  }
});

test('an upstream failure answers 503 and is never cached as a 200', async () => {
  const handler = buildingApi.createHandler({
    providerFactory:() => provider({ getBuildings:async () => { throw new Error('upstream'); } }),
    fetchImpl:fakeFxFetch
  });
  const res = await request(handler, { building:routes.buildingSlug(DEEP) });
  assert.equal(res.statusCode, 503);
  assert.equal(res.headers['Cache-Control'], 'no-store');
});
