const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

function responseRecorder() {
  return {
    statusCode:200, headers:{}, body:'',
    status(code) { this.statusCode = code; return this; },
    setHeader(name, value) { this.headers[name] = value; },
    send(value) { this.body = String(value); return this; },
    json(value) { this.body = JSON.stringify(value); return this; }
  };
}

test('root sitemap is an index with static pages plus all 25 Seoul districts x 3 property types', () => {
  const root = fs.readFileSync('sitemap.xml','utf8');
  const staticMap = fs.readFileSync('sitemap-static.xml','utf8');
  assert.match(root, /<sitemapindex/);
  assert.match(root, /https:\/\/koreahomeguide\.com\/sitemap-static\.xml/);
  assert.match(root, /https:\/\/koreahomeguide\.com\/sitemaps\/seoul\/mapo-gu\/villa\//);
  assert.match(root, /https:\/\/koreahomeguide\.com\/sitemaps\/seoul\/gangbuk-gu\/apartment\//);
  assert.match(root, /https:\/\/koreahomeguide\.com\/sitemaps\/seoul\/geumcheon-gu\/officetel\//);
  assert.doesNotMatch(root, /\/sitemaps\/seoul\/gwanak-gu\/detached\//);
  for (const type of ['apartment','officetel','villa']) {
    assert.match(root, new RegExp(`https://koreahomeguide\\.com/sitemaps/seoul/opportunities/${type}/`));
  }
  assert.equal((root.match(/<sitemap>/g) || []).length, 79);
  assert.equal((staticMap.match(/<url>/g) || []).length, 78);
  assert.equal(root.includes('/api/'), false);
});

test('opportunity sitemap emits only evidence-qualified approved routes in both locales', async () => {
  const oldKey = process.env.DATA_GO_KR_SERVICE_KEY;
  process.env.DATA_GO_KR_SERVICE_KEY = 'test';
  delete require.cache[require.resolve('../api/sitemap-market.js')];
  const sitemapApi = require('../api/sitemap-market.js');
  const dongs = [
    { dong:'회기동', districtCode:'11230', districtName:'Dongdaemun-gu', depositBands:[{ minDepositWon:10_000_000, maxDepositWon:30_000_000, count:5, medianDepositWon:20_000_000, medianMonthlyRentWon:520_000 }] },
    { dong:'신림동', districtCode:'11620', districtName:'Gwanak-gu', depositBands:[{ minDepositWon:10_000_000, maxDepositWon:30_000_000, count:6, medianDepositWon:10_000_000, medianMonthlyRentWon:560_000 }] },
    { dong:'연희동', districtCode:'11410', districtName:'Seodaemun-gu', depositBands:[{ minDepositWon:10_000_000, maxDepositWon:30_000_000, count:4, medianDepositWon:15_000_000, medianMonthlyRentWon:650_000 }] }
  ];
  const loadedTypes = [];
  const handler = sitemapApi.createHandler({ opportunityLoader:async ({ propertyType }) => {
    loadedTypes.push(propertyType);
    return { dongs };
  } });
  const res = responseRecorder();
  await handler({ method:'GET', query:{ mode:'opportunities', type:'officetel' } }, res);
  assert.equal(res.statusCode, 200);
  assert.match(res.body, /https:\/\/koreahomeguide\.com\/seoul\/officetel\/under-700000-won\//);
  assert.doesNotMatch(res.body, /\/seoul\/apartment\/under-700000-won\//);
  assert.doesNotMatch(res.body, /\/seoul\/villa\/under-700000-won\//);
  assert.match(res.body, /https:\/\/koreahomeguide\.com\/zh\/seoul\/officetel\/under-700000-won\//);
  assert.match(res.body, /https:\/\/koreahomeguide\.com\/seoul\/deposit\/10-million-won\//);
  assert.doesNotMatch(res.body, /50-million-won/);
  assert.doesNotMatch(res.body, /\/building\//);
  assert.deepEqual(loadedTypes, ['officetel']);

  const apartment = responseRecorder();
  await handler({ method:'GET', query:{ mode:'opportunities', type:'apartment' } }, apartment);
  assert.equal(apartment.statusCode, 200);
  assert.match(apartment.body, /\/seoul\/apartment\/under-700000-won\//);
  assert.doesNotMatch(apartment.body, /\/seoul\/deposit\//);
  assert.deepEqual(loadedTypes, ['officetel','apartment']);
  if (oldKey == null) delete process.env.DATA_GO_KR_SERVICE_KEY; else process.env.DATA_GO_KR_SERVICE_KEY = oldKey;
});

test('vercel exposes one shared child-sitemap endpoint without adding static HTML files', () => {
  const config = JSON.parse(fs.readFileSync('vercel.json','utf8'));
  const route = config.rewrites.find(item => item.destination.includes('sitemap-market') && item.destination.includes('district=:district'));
  assert.ok(route);
  assert.equal(route.source, '/sitemaps/seoul/:district/:type/');
  assert.match(route.destination, /district=:district/);
  assert.match(route.destination, /type=:type/);
  assert.equal(config.rewrites.some(item => item.source === '/sitemaps/seoul/opportunities/:type/' && item.destination.includes('mode=opportunities') && item.destination.includes('type=:type')), true);
});

test('dynamic market sitemap emits only substantial EN/ZH Dong URLs and never building URLs', async () => {
  const oldKey = process.env.DATA_GO_KR_SERVICE_KEY;
  process.env.DATA_GO_KR_SERVICE_KEY = 'test';
  delete require.cache[require.resolve('../api/sitemap-market.js')];
  const sitemapApi = require('../api/sitemap-market.js');
  const provider = {
    getDongs: async () => [
      { dong:'연남동', contractCount:12 },
      { dong:'서교동', contractCount:5 },
      { dong:'희우동', contractCount:2 }
    ],
    getBuildings: async () => { throw new Error('sitemap must not load buildings'); }
  };
  const handler = sitemapApi.createHandler({ providerFactory:() => provider, referenceDate:new Date('2026-08-25T00:00:00Z') });
  const res = responseRecorder();
  await handler({ method:'GET', query:{ district:'mapo-gu', type:'villa' } }, res);
  assert.equal(res.statusCode, 200);
  assert.match(res.headers['Content-Type'], /xml/);
  assert.match(res.headers['Cache-Control'], /s-maxage=/);
  assert.match(res.body, /https:\/\/koreahomeguide\.com\/seoul\/mapo-gu\/yeonnam-dong\/villa\//);
  assert.match(res.body, /https:\/\/koreahomeguide\.com\/zh\/seoul\/mapo-gu\/yeonnam-dong\/villa\//);
  assert.doesNotMatch(res.body, /seogyo-dong/);
  assert.doesNotMatch(res.body, /희우동/);
  assert.doesNotMatch(res.body, /a-villa|sparse-villa/);
  if (oldKey == null) delete process.env.DATA_GO_KR_SERVICE_KEY; else process.env.DATA_GO_KR_SERVICE_KEY = oldKey;
});

test('new English districts do not emit thin Chinese Dong URLs', async () => {
  const oldKey = process.env.DATA_GO_KR_SERVICE_KEY;
  process.env.DATA_GO_KR_SERVICE_KEY = 'test';
  const sitemapApi = require('../api/sitemap-market.js');
  const handler = sitemapApi.createHandler({
    providerFactory:() => ({
      getDongs:async () => [{ dong:'신림동', contractCount:12 }]
    })
  });
  const res = responseRecorder();
  await handler({ method:'GET', query:{ district:'gwanak-gu', type:'villa' } }, res);
  assert.equal(res.statusCode, 200);
  assert.match(res.body, /https:\/\/koreahomeguide\.com\/seoul\/gwanak-gu\//);
  assert.doesNotMatch(res.body, /https:\/\/koreahomeguide\.com\/zh\/seoul\/gwanak-gu\//);
  if (oldKey == null) delete process.env.DATA_GO_KR_SERVICE_KEY;
  else process.env.DATA_GO_KR_SERVICE_KEY = oldKey;
});

test('rent-market response and UI expose canonical neighborhood links', () => {
  const apiSource = fs.readFileSync('api/rent-market.js','utf8');
  const enSource = fs.readFileSync('rent-market-page.js','utf8');
  const zhSource = fs.readFileSync('zh/rent-market-page.js','utf8');
  const sampleEn = fs.readFileSync('rent/mapo-gu/villa/index.html','utf8');
  const sampleZh = fs.readFileSync('zh/rent/mapo-gu/villa/index.html','utf8');
  assert.match(apiSource, /aggregateDongs/);
  assert.match(apiSource, /dongs/);
  assert.match(enSource, /renderNeighborhoodLinks/);
  assert.match(enSource, /buildDongSeoUrl/);
  assert.match(zhSource, /renderNeighborhoodLinks/);
  assert.match(zhSource, /buildDongSeoUrl/);
  assert.match(sampleEn, /id="neighborhoodLinks"/);
  assert.match(sampleEn, /\/explore\/explorer-utils\.js/);
  assert.match(sampleZh, /id="neighborhoodLinks"/);
  assert.match(sampleZh, /\/explore\/explorer-utils\.js/);
});

test('robots keeps Search Console pointed at the stable root sitemap URL', () => {
  const robots = fs.readFileSync('robots.txt','utf8');
  assert.match(robots, /Sitemap: https:\/\/koreahomeguide\.com\/sitemap\.xml/);
});
