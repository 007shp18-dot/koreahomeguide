const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

function responseRecorder() {
  return {
    statusCode:200, headers:{}, body:'',
    status(code) { this.statusCode = code; return this; },
    setHeader(name, value) { this.headers[name] = value; },
    send(value) { this.body = String(value); return this; }
  };
}

const dongApi = require('../api/seo-dong-page.js');
const buildingApi = require('../api/seo-building-page.js');

const fakeFxFetch = async () => ({ ok:true, json:async () => ({ rates:{ USD:0.00072, CNY:0.0052 } }) });
const dongSummary = {
  dong:'연남동', totalContracts:5, contractCount:5, monthlyRentCount:4, jeonseCount:1,
  medianMonthlyRentWon:700000, medianDepositWon:20000000, medianJeonseDepositWon:180000000,
  newContractMonthlyRentCount:4, renewalMonthlyRentCount:0, contractTypeCounts:{new:4,renewal:0,unknown:1},
  depositBands:[{minDepositWon:10000000,maxDepositWon:30000000,count:4,medianDepositWon:20000000,medianMonthlyRentWon:700000}], areaGroups:[],
  quarterChangePct:null, monthsUsed:6, dataThroughMonth:'2026-07', recentTransactions:[]
};
const building = { buildingName:'A Villa', buildingKey:'연남동::a villa', dong:'연남동', contractCount:4, medianMonthlyRentWon:720000, medianDepositWon:20000000, medianJeonseDepositWon:null, typicalAreaSqm:23, newContractMonthlyRentCount:4, renewalMonthlyRentCount:0, contractTypeCounts:{new:4,renewal:0,unknown:0}, depositBands:[{minDepositWon:10000000,maxDepositWon:30000000,count:4,medianDepositWon:20000000,medianMonthlyRentWon:720000}], areaGroups:[] };

function provider(overrides={}) {
  return {
    getDongSummary:async()=>dongSummary,
    getBuildings:async()=>[building],
    getBuildingDetail:async()=>({ ...building, monthlyTrend:[], recentTransactions:[] }),
    ...overrides
  };
}

test('Dong SEO endpoint returns localized HTML with cache headers', async () => {
  process.env.DATA_GO_KR_SERVICE_KEY = 'test';
  const handler = dongApi.createHandler({ providerFactory:()=>provider(), fetchImpl:fakeFxFetch, referenceDate:new Date('2026-08-24T00:00:00Z') });
  const res = responseRecorder();
  await handler({ method:'GET', query:{ district:'mapo-gu', dong:'yeonnam-dong', type:'villa', lang:'zh' } }, res);
  assert.equal(res.statusCode, 200);
  assert.match(res.headers['Content-Type'], /text\/html/);
  assert.match(res.headers['Cache-Control'], /s-maxage=3600/);
  assert.match(res.body, /延南洞/);
  assert.match(res.body, /¥3,640/);
  assert.match(res.body, /index,follow/);
});

test('Dong SEO endpoint returns 404/noindex for invalid route or missing recent data', async () => {
  process.env.DATA_GO_KR_SERVICE_KEY = 'test';
  let handler = dongApi.createHandler({ providerFactory:()=>provider(), fetchImpl:fakeFxFetch });
  let res = responseRecorder();
  await handler({ method:'GET', query:{ district:'bad-gu', dong:'yeonnam-dong', type:'villa', lang:'en' } }, res);
  assert.equal(res.statusCode, 404);
  assert.match(res.body, /noindex,follow/);

  handler = dongApi.createHandler({ providerFactory:()=>provider({ getDongSummary:async()=>null }), fetchImpl:fakeFxFetch });
  res = responseRecorder();
  await handler({ method:'GET', query:{ district:'mapo-gu', dong:'yeonnam-dong', type:'villa', lang:'en' } }, res);
  assert.equal(res.statusCode, 404);
  assert.match(res.body, /noindex,follow/);
});

test('SEO endpoints return 503/noindex when official data is unconfigured or upstream fails', async () => {
  const old = process.env.DATA_GO_KR_SERVICE_KEY;
  delete process.env.DATA_GO_KR_SERVICE_KEY;
  let handler = dongApi.createHandler({ providerFactory:()=>provider(), fetchImpl:fakeFxFetch });
  let res = responseRecorder();
  await handler({ method:'GET', query:{ district:'mapo-gu', dong:'yeonnam-dong', type:'villa', lang:'en' } }, res);
  assert.equal(res.statusCode, 503);
  assert.match(res.body, /noindex,follow/);

  process.env.DATA_GO_KR_SERVICE_KEY = 'test';
  handler = dongApi.createHandler({ providerFactory:()=>provider({ getDongSummary:async()=>{ throw new Error('upstream'); } }), fetchImpl:fakeFxFetch });
  res = responseRecorder();
  await handler({ method:'GET', query:{ district:'mapo-gu', dong:'yeonnam-dong', type:'villa', lang:'en' } }, res);
  assert.equal(res.statusCode, 503);
  assert.match(res.body, /noindex,follow/);
  if (old == null) delete process.env.DATA_GO_KR_SERVICE_KEY; else process.env.DATA_GO_KR_SERVICE_KEY = old;
});

test('Building SEO endpoint resolves deterministic slug and applies index quality gate', async () => {
  process.env.DATA_GO_KR_SERVICE_KEY = 'test';
  const routes = require('../seo/seo-route-utils.cjs');
  const slug = routes.buildingSlug(building);
  const handler = buildingApi.createHandler({ providerFactory:()=>provider(), fetchImpl:fakeFxFetch });
  let res = responseRecorder();
  await handler({ method:'GET', query:{ district:'mapo-gu', dong:'yeonnam-dong', type:'villa', building:slug, lang:'en' } }, res);
  assert.equal(res.statusCode, 200);
  assert.match(res.body, /A Villa/);
  assert.match(res.body, /content="index,follow"/);

  const sparseProvider = provider({ getBuildingDetail:async()=>({ ...building, contractCount:2, monthlyTrend:[], recentTransactions:[] }) });
  const sparseHandler = buildingApi.createHandler({ providerFactory:()=>sparseProvider, fetchImpl:fakeFxFetch });
  res = responseRecorder();
  await sparseHandler({ method:'GET', query:{ district:'mapo-gu', dong:'yeonnam-dong', type:'villa', building:slug, lang:'en' } }, res);
  assert.equal(res.statusCode, 200);
  assert.match(res.body, /content="noindex,follow"/);
});

test('Building SEO endpoint returns 404 for an unresolved building slug', async () => {
  process.env.DATA_GO_KR_SERVICE_KEY = 'test';
  const handler = buildingApi.createHandler({ providerFactory:()=>provider(), fetchImpl:fakeFxFetch });
  const res = responseRecorder();
  await handler({ method:'GET', query:{ district:'mapo-gu', dong:'yeonnam-dong', type:'villa', building:'missing-deadbee', lang:'en' } }, res);
  assert.equal(res.statusCode, 404);
  assert.match(res.body, /noindex,follow/);
});

test('vercel rewrites map EN/ZH Dong and building paths to two shared HTML endpoints', () => {
  const config = JSON.parse(fs.readFileSync('vercel.json','utf8'));
  const serialized = JSON.stringify(config);
  assert.match(serialized, /seo-dong-page/);
  assert.match(serialized, /seo-building-page/);
  assert.match(serialized, /\/zh\/seoul\//);
  const seoRewrites = config.rewrites.filter(route => /seo-(?:dong|building)-page/.test(route.destination));
  assert.equal(seoRewrites.length, 4);
});
