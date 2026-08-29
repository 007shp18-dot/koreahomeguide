const test = require('node:test');
const assert = require('node:assert/strict');

const market = require('../seo/opportunity-market.cjs');
const { renderOpportunityPage } = require('../seo/opportunity-page.cjs');

const dongs = [
  { dong:'회기동', districtCode:'11230', districtName:'Dongdaemun-gu', depositBands:[{ minDepositWon:10_000_000, maxDepositWon:30_000_000, count:5, medianDepositWon:20_000_000, medianMonthlyRentWon:520_000 }] },
  { dong:'신림동', districtCode:'11620', districtName:'Gwanak-gu', depositBands:[{ minDepositWon:10_000_000, maxDepositWon:30_000_000, count:6, medianDepositWon:10_000_000, medianMonthlyRentWon:560_000 }] },
  { dong:'연희동', districtCode:'11410', districtName:'Seodaemun-gu', depositBands:[{ minDepositWon:10_000_000, maxDepositWon:30_000_000, count:4, medianDepositWon:15_000_000, medianMonthlyRentWon:650_000 }] }
];

function modelFor(mode, slug, propertyType) {
  const query = market.parseOpportunity({ mode, slug, propertyType });
  return market.buildOpportunityModel(dongs, query);
}

function responseRecorder() {
  return {
    statusCode:200, headers:{}, body:'',
    status(code) { this.statusCode = code; return this; },
    setHeader(name, value) { this.headers[name] = value; },
    send(value) { this.body = String(value); return this; }
  };
}

test('English budget page is canonical, evidence-led and hands off to Explorer', () => {
  const html = renderOpportunityPage({
    lang:'en',
    model:modelFor('budget', 'under-700000-won', 'officetel'),
    dataThroughMonth:'2026-07',
    fxRates:{ USD:0.00072 }
  });
  assert.match(html, /<html lang="en">/);
  assert.match(html, /<meta name="robots" content="index,follow">/);
  assert.match(html, /<link rel="canonical" href="https:\/\/koreahomeguide\.com\/seoul\/officetel\/under-700000-won\/">/);
  assert.match(html, /hreflang="zh-CN" href="https:\/\/koreahomeguide\.com\/zh\/seoul\/officetel\/under-700000-won\/"/);
  assert.match(html, /Seoul officetels under ₩700,000/);
  assert.match(html, /15 reported contracts across 3 neighborhoods/);
  assert.match(html, /Hoegi-dong \(회기동\)/);
  assert.match(html, /₩520,000/);
  assert.match(html, /maxRent=700000/);
  assert.match(html, /lawdCd=11230/);
  assert.match(html, /"@type":"Dataset"/);
  assert.match(html, /"temporalCoverage":"2026-05\/2026-07"/);
  assert.match(html, /Ministry of Land, Infrastructure and Transport/);
  assert.match(html, /<script defer src="\/acquisition-context\.js"><\/script>/);
  assert.match(html, /<script defer src="\/acquisition-links\.js"><\/script>/);
  assert.match(html, /href="\/privacy\/"/);
  assert.doesNotMatch(html, /available now|live listing|contact landlord|book a viewing/i);
});

test('Chinese deposit page explicitly labels officetel evidence and keeps KRW primary', () => {
  const html = renderOpportunityPage({
    lang:'zh',
    model:modelFor('deposit', '10-million-won'),
    dataThroughMonth:'2026-07',
    fxRates:{ CNY:0.0052 }
  });
  assert.match(html, /<html lang="zh-CN">/);
  assert.match(html, /首尔押金1,000万韩元的办公公寓/);
  assert.match(html, /本页首版仅比较办公公寓/);
  assert.match(html, /办公公寓成交依据/);
  assert.match(html, /数据截至 2026-07/);
  assert.match(html, /韩国国土交通部/);
  assert.match(html, /₩10,000,000/);
  assert.match(html, /≈ ¥52,000/);
  assert.match(html, /href="\/zh\/privacy\/"/);
  assert.match(html, /\/zh\/explore\/\?lawdCd=11230&amp;type=officetel&amp;maxDeposit=10000000/);
  assert.doesNotMatch(html, /href="\/zh\/seoul\/(?:dongdaemun-gu|gwanak-gu|seodaemun-gu)\//);
  assert.doesNotMatch(html, /Seoul officetels under/);
});

test('sparse opportunity page stays useful but is noindex', () => {
  const query = market.parseOpportunity({ mode:'budget', slug:'under-700000-won', propertyType:'officetel' });
  const sparse = market.buildOpportunityModel(dongs.slice(0, 2), query);
  const html = renderOpportunityPage({ lang:'en', model:sparse, dataThroughMonth:'2026-07' });
  assert.match(html, /<meta name="robots" content="noindex,follow">/);
  assert.match(html, /Evidence is still limited for this exact constraint/);
});

test('existing SEO handler dispatches approved opportunity routes without a new function', async () => {
  const oldKey = process.env.DATA_GO_KR_SERVICE_KEY;
  process.env.DATA_GO_KR_SERVICE_KEY = 'test';
  delete require.cache[require.resolve('../api/seo-dong-page.js')];
  const api = require('../api/seo-dong-page.js');
  let loadedType = '';
  const handler = api.createHandler({
    opportunityLoader:async ({ propertyType }) => {
      loadedType = propertyType;
      return { dongs, summary:{ dataThroughMonth:'2026-07' } };
    },
    fetchImpl:async () => ({ ok:false })
  });
  const res = responseRecorder();
  await handler({ method:'GET', query:{ mode:'budget', slug:'under-700000-won', type:'officetel', lang:'en' } }, res);
  assert.equal(res.statusCode, 200);
  assert.equal(loadedType, 'officetel');
  assert.match(res.headers['Content-Type'], /text\/html/);
  assert.match(res.headers['Cache-Control'], /s-maxage=86400/);
  assert.match(res.body, /Seoul officetels under ₩700,000/);
  if (oldKey == null) delete process.env.DATA_GO_KR_SERVICE_KEY; else process.env.DATA_GO_KR_SERVICE_KEY = oldKey;
});

test('opportunity handler rejects unapproved slugs before loading Seoul data', async () => {
  const oldKey = process.env.DATA_GO_KR_SERVICE_KEY;
  process.env.DATA_GO_KR_SERVICE_KEY = 'test';
  const api = require('../api/seo-dong-page.js');
  let calls = 0;
  const handler = api.createHandler({ opportunityLoader:async () => { calls += 1; return {}; } });
  const res = responseRecorder();
  await handler({ method:'GET', query:{ mode:'deposit', slug:'999-million-won', lang:'en' } }, res);
  assert.equal(res.statusCode, 404);
  assert.equal(calls, 0);
  assert.match(res.body, /<meta name="robots" content="noindex,follow">/);
  if (oldKey == null) delete process.env.DATA_GO_KR_SERVICE_KEY; else process.env.DATA_GO_KR_SERVICE_KEY = oldKey;
});

test('budget and deposit rewrites precede dynamic dong routes', () => {
  const config = require('../vercel.json');
  const destinations = config.rewrites.map(route => route.destination);
  const budgetIndex = destinations.findIndex(value => value.includes('mode=budget'));
  const depositIndex = destinations.findIndex(value => value.includes('mode=deposit'));
  const dongIndex = destinations.findIndex(value => value.includes('seo-dong-page') && value.includes('dong=:dong'));
  assert.ok(budgetIndex >= 0 && budgetIndex < dongIndex);
  assert.ok(depositIndex >= 0 && depositIndex < dongIndex);
});
