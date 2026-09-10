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

test('root sitemap is an index with static pages plus 10 districts x 3 proven property-type child sitemaps', () => {
  const root = fs.readFileSync('sitemap.xml','utf8');
  const staticMap = fs.readFileSync('sitemap-static.xml','utf8');
  assert.match(root, /<sitemapindex/);
  assert.match(root, /https:\/\/koreahomeguide\.com\/sitemap-static\.xml/);
  assert.match(root, /https:\/\/koreahomeguide\.com\/sitemaps\/seoul\/mapo-gu\/villa\//);
  assert.doesNotMatch(root, /\/sitemaps\/seoul\/gwanak-gu\/detached\//);
  assert.equal((root.match(/<sitemap>/g) || []).length, 31);
  assert.equal((staticMap.match(/<url>/g) || []).length, 76);
  assert.equal(root.includes('/api/'), false);
});

test('vercel exposes one shared child-sitemap endpoint without adding static HTML files', () => {
  const config = JSON.parse(fs.readFileSync('vercel.json','utf8'));
  const route = config.rewrites.find(item => item.destination.includes('sitemap-market'));
  assert.ok(route);
  assert.equal(route.source, '/sitemaps/seoul/:district/:type/');
  assert.match(route.destination, /district=:district/);
  assert.match(route.destination, /type=:type/);
});

test('dynamic market sitemap emits substantial EN/ZH Dong URLs plus the buildings that clear the publishing floor', async () => {
  const oldKey = process.env.DATA_GO_KR_SERVICE_KEY;
  process.env.DATA_GO_KR_SERVICE_KEY = 'test';
  delete require.cache[require.resolve('../api/sitemap-market.js')];
  const sitemapApi = require('../api/sitemap-market.js');
  const routes = require('../seo/seo-route-utils.cjs');

  const deep = { buildingName:'Deep Villa', buildingKey:'연남동::deep villa', dong:'연남동', contractCount:41, monthlyRentCount:22, medianMonthlyRentWon:720000 };
  const thin = { buildingName:'Thin Villa', buildingKey:'연남동::thin villa', dong:'연남동', contractCount:6, monthlyRentCount:2, medianMonthlyRentWon:700000 };
  // Deep enough on its own, but its Dong is below the Dong floor, so its parent
  // page 404s and it must not be published either.
  const orphan = { buildingName:'Orphan Villa', buildingKey:'희우동::orphan villa', dong:'희우동', contractCount:44, monthlyRentCount:30, medianMonthlyRentWon:700000 };

  let buildingCalls = [];
  const provider = {
    getDongs: async () => [
      { dong:'연남동', contractCount:12 },
      { dong:'서교동', contractCount:5 },
      { dong:'희우동', contractCount:2 }
    ],
    getBuildings: async args => { buildingCalls.push(args); return [deep, thin, orphan]; }
  };
  const handler = sitemapApi.createHandler({ providerFactory:() => provider, referenceDate:new Date('2026-08-25T00:00:00Z') });
  const res = responseRecorder();
  await handler({ method:'GET', query:{ district:'mapo-gu', type:'villa' } }, res);

  assert.equal(res.statusCode, 200);
  assert.match(res.headers['Content-Type'], /xml/);
  assert.match(res.headers['Cache-Control'], /s-maxage=/);

  // Dong URLs behave exactly as before.
  assert.match(res.body, /https:\/\/koreahomeguide\.com\/seoul\/mapo-gu\/yeonnam-dong\/villa\//);
  assert.match(res.body, /https:\/\/koreahomeguide\.com\/zh\/seoul\/mapo-gu\/yeonnam-dong\/villa\//);
  assert.doesNotMatch(res.body, /seogyo-dong/);
  assert.doesNotMatch(res.body, /희우동/);

  // One aggregation for the whole district, not one call per Dong: the rows are
  // already cached by getDongs, and per-Dong calls would be the expensive shape.
  assert.equal(buildingCalls.length, 1);
  assert.equal(buildingCalls[0].dong, '');

  const deepUrl = `https://koreahomeguide.com${routes.buildBuildingSeoUrl({ areaCode:'11440', dong:'연남동', propertyType:'villa', building:deep, lang:'en' })}`;
  assert.ok(res.body.includes(deepUrl), 'a building above the floor is published');
  assert.ok(res.body.includes(deepUrl.replace('.com/seoul', '.com/zh/seoul')), 'and in Chinese where the district is localized');
  assert.doesNotMatch(res.body, /thin-villa/, 'a building below the floor is not published');
  assert.doesNotMatch(res.body, /orphan-villa/, 'a building under an unpublished Dong is not published');

  if (oldKey == null) delete process.env.DATA_GO_KR_SERVICE_KEY; else process.env.DATA_GO_KR_SERVICE_KEY = oldKey;
});

test('a building lookup failure costs the building URLs, never the Dong URLs', async () => {
  const oldKey = process.env.DATA_GO_KR_SERVICE_KEY;
  process.env.DATA_GO_KR_SERVICE_KEY = 'test';
  delete require.cache[require.resolve('../api/sitemap-market.js')];
  const sitemapApi = require('../api/sitemap-market.js');
  const handler = sitemapApi.createHandler({
    providerFactory:() => ({
      getDongs: async () => [{ dong:'연남동', contractCount:12 }],
      getBuildings: async () => { throw new Error('aggregation blew up'); }
    })
  });
  const res = responseRecorder();
  await handler({ method:'GET', query:{ district:'mapo-gu', type:'villa' } }, res);
  assert.equal(res.statusCode, 200);
  assert.match(res.body, /https:\/\/koreahomeguide\.com\/seoul\/mapo-gu\/yeonnam-dong\/villa\//);
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
  assert.match(robots, /Disallow: \/api\//);
  assert.match(robots, /Sitemap: https:\/\/koreahomeguide\.com\/sitemap\.xml/);
});
