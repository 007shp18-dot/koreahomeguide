const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

function read(rel) { return fs.readFileSync(path.join(__dirname, '..', rel), 'utf8'); }
function recorder() {
  return {
    statusCode:200, headers:{}, body:null,
    status(code){ this.statusCode=code; return this; },
    setHeader(name,value){ this.headers[name]=value; },
    json(value){ this.body=value; return this; }
  };
}

test('EN and ZH Explorer offer an all-Seoul area option', () => {
  assert.match(read('explore/index.html'), /<option value="all">All supported Seoul<\/option>/);
  assert.match(read('zh/explore/index.html'), /<option value="all">全首尔支持地区<\/option>/);
});

test('Explorer clients call the Seoul-wide endpoint and preserve district identity for links', () => {
  for (const file of ['explore/app.js','zh/explore/app.js']) {
    const text = read(file);
    assert.match(text, /\/api\/explore-seoul\?type=/);
    assert.match(text, /item\.districtCode/);
    assert.match(text, /districtName/);
  }
});

test('Seoul-wide API aggregates 10 districts over 3 completed months in bounded batches', async () => {
  const api = require('../api/explore-area.js');
  assert.equal(api.SUPPORTED_DISTRICT_CODES.length, 10);
  let active = 0;
  let maxActive = 0;
  let calls = 0;
  const fetchMonth = async ({ lawdCd, dealYmd, type }) => {
    calls += 1;
    active += 1;
    maxActive = Math.max(maxActive, active);
    await new Promise(resolve => setTimeout(resolve, 2));
    active -= 1;
    return [{ dong:`동-${lawdCd}`, buildingName:'', building:`동-${lawdCd}`, area:'25', deposit:'1,000', monthlyRent:'50', contractDate:`${dealYmd.slice(0,4)}-${dealYmd.slice(4)}-10`, type }];
  };
  const aggregateDongs = (_rows, { areaCode }) => [{ dong:`동-${areaCode}`, contractCount:3, medianMonthlyRentWon:500000, medianDepositWon:10000000, depositBands:[] }];
  const buildAreaSummary = rows => ({ totalContracts:rows.length, medianMonthlyRentWon:500000, medianDepositWon:10000000, monthsUsed:3, dataThroughMonth:'2026-07' });
  const handler = api.createHandler({
    fetchMonth,
    aggregateDongs,
    buildAreaSummary,
    referenceDate:new Date('2026-08-25T00:00:00Z'),
    batchSize:5
  });
  process.env.DATA_GO_KR_SERVICE_KEY = 'test-key';
  const res = recorder();
  await handler({ method:'GET', headers:{ origin:'https://koreahomeguide.com' }, query:{ scope:'all', type:'officetel' } }, res);
  assert.equal(res.statusCode, 200);
  assert.equal(calls, 30);
  assert.ok(maxActive <= 15, `expected <=15 concurrent month fetches, got ${maxActive}`);
  assert.equal(res.body.dongs.length, 10);
  assert.ok(res.body.dongs.every(item => item.districtCode && item.districtName));
  assert.equal(res.body.summary.monthsUsed, 3);
  assert.match(res.headers['Cache-Control'], /s-maxage=21600/);
});

test('Seoul-wide API rejects unsupported property types and foreign browser origins', async () => {
  const api = require('../api/explore-area.js');
  const handler = api.createHandler({
    fetchMonth:async()=>[], aggregateDongs:()=>[], buildAreaSummary:()=>({}), referenceDate:new Date('2026-08-25T00:00:00Z')
  });
  process.env.DATA_GO_KR_SERVICE_KEY='test-key';
  let res=recorder();
  await handler({ method:'GET', headers:{ origin:'https://evil.example' }, query:{ scope:'all', type:'officetel' } }, res);
  assert.equal(res.statusCode, 403);
  res=recorder();
  await handler({ method:'GET', headers:{ origin:'https://koreahomeguide.com' }, query:{ scope:'all', type:'castle' } }, res);
  assert.equal(res.statusCode, 400);
});

test('public Seoul-wide path rewrites to the consolidated area handler', () => {
  const config = require('../vercel.json');
  assert.equal(config.rewrites.some(route =>
    route.source === '/api/explore-seoul' &&
    route.destination === '/api/explore-area?scope=all'
  ), true);
});
