const test = require('node:test');
const assert = require('node:assert/strict');

function responseRecorder() {
  return {
    statusCode:200,
    headers:{},
    body:null,
    status(code) { this.statusCode = code; return this; },
    setHeader(name, value) { this.headers[name] = value; },
    json(value) { this.body = value; return this; }
  };
}

const areaApi = require('../api/explore-area.js');
const buildingApi = require('../api/explore-building.js');
const dongApi = require('../api/explore-dong.js');

test('explore-area validates method, Seoul district, and property type', async () => {
  const fakeProvider = { getAreaSummary:async()=>({}), getDongs:async()=>[], getBuildings:async()=>[] };
  const handler = areaApi.createHandler(() => fakeProvider);

  let res = responseRecorder();
  await handler({ method:'POST', query:{} }, res);
  assert.equal(res.statusCode, 405);

  res = responseRecorder();
  await handler({ method:'GET', query:{ lawdCd:'99999', type:'officetel' } }, res);
  assert.equal(res.statusCode, 400);

  res = responseRecorder();
  await handler({ method:'GET', query:{ lawdCd:'11680', type:'house' } }, res);
  assert.equal(res.statusCode, 400);
});

test('explore-area returns area summary and building aggregates with cache headers', async () => {
  const fakeProvider = {
    getAreaSummary:async()=>({ totalContracts:12, medianMonthlyRentWon:900000 }),
    getDongs:async()=>[{ dong:'역삼동', contractCount:7 }],
    getBuildings:async()=>[{ buildingKey:'역삼동::a', buildingName:'A', dong:'역삼동', contractCount:5 }]
  };
  const handler = areaApi.createHandler(() => fakeProvider);
  const res = responseRecorder();
  process.env.DATA_GO_KR_SERVICE_KEY = 'test';
  await handler({ method:'GET', query:{ lawdCd:'11680', type:'officetel' } }, res);
  assert.equal(res.statusCode, 200);
  assert.equal(res.body.districtCode, '11680');
  assert.equal(res.body.propertyType, 'officetel');
  assert.equal(res.body.summary.totalContracts, 12);
  assert.equal(res.body.buildings.length, 1);
  assert.equal(res.body.dongs.length, 1);
  assert.equal(res.body.dongs[0].dong, '역삼동');
  assert.match(res.headers['Cache-Control'], /s-maxage=3600/);
});

test('explore-building requires a building key and returns 404 for a missing building in the selected period', async () => {
  const fakeProvider = { getBuildingDetail:async()=>null };
  const handler = buildingApi.createHandler(() => fakeProvider);
  process.env.DATA_GO_KR_SERVICE_KEY = 'test';

  let res = responseRecorder();
  await handler({ method:'GET', query:{ lawdCd:'11680', type:'officetel' } }, res);
  assert.equal(res.statusCode, 400);

  res = responseRecorder();
  await handler({ method:'GET', query:{ lawdCd:'11680', type:'officetel', buildingKey:'missing' } }, res);
  assert.equal(res.statusCode, 404);
  assert.match(res.body.error, /not found/i);
});

test('explore-building returns a selected building detail and cache header', async () => {
  const fakeProvider = { getBuildingDetail:async()=>({ buildingKey:'a', buildingName:'A', recentTransactions:[] }) };
  const handler = buildingApi.createHandler(() => fakeProvider);
  process.env.DATA_GO_KR_SERVICE_KEY = 'test';
  const res = responseRecorder();
  await handler({ method:'GET', query:{ lawdCd:'11680', type:'officetel', buildingKey:'a' } }, res);
  assert.equal(res.statusCode, 200);
  assert.equal(res.body.buildingName, 'A');
  assert.match(res.headers['Cache-Control'], /s-maxage=3600/);
});

test('explore-building accepts only a legal code inside the requested district', async () => {
  let received = null;
  const fakeProvider = { getBuildingDetail:async options => { received = options; return { buildingKey:'a', buildingName:'A' }; } };
  const handler = buildingApi.createHandler(() => fakeProvider);
  process.env.DATA_GO_KR_SERVICE_KEY = 'test';

  let res = responseRecorder();
  await handler({ method:'GET', query:{ lawdCd:'11680', type:'apartment', buildingKey:'a', legalCode:'1168010100' } }, res);
  assert.equal(res.statusCode, 200);
  assert.equal(received.legalCode, '1168010100');

  res = responseRecorder();
  await handler({ method:'GET', query:{ lawdCd:'11680', type:'apartment', buildingKey:'a', legalCode:'1144010100' } }, res);
  assert.equal(res.statusCode, 400);
});


test('explore-dong validates dong and returns dong summary plus buildings', async () => {
  const fakeProvider = {
    getDongSummary:async({ dong }) => dong === '역삼동' ? { dong, totalContracts:8, medianMonthlyRentWon:950000 } : null,
    getBuildings:async({ dong }) => dong === '역삼동' ? [{ buildingKey:'역삼동::a', buildingName:'A', dong, contractCount:4 }] : []
  };
  const handler = dongApi.createHandler(() => fakeProvider);
  process.env.DATA_GO_KR_SERVICE_KEY = 'test';

  let res = responseRecorder();
  await handler({ method:'GET', query:{ lawdCd:'11680', type:'officetel' } }, res);
  assert.equal(res.statusCode, 400);

  res = responseRecorder();
  await handler({ method:'GET', query:{ lawdCd:'11680', type:'officetel', dong:'역삼동' } }, res);
  assert.equal(res.statusCode, 200);
  assert.equal(res.body.dong, '역삼동');
  assert.equal(res.body.summary.totalContracts, 8);
  assert.equal(res.body.buildings[0].dong, '역삼동');
  assert.match(res.headers['Cache-Control'], /s-maxage=3600/);
});

test('explore-dong returns 404 when the selected dong has no recent contracts', async () => {
  const fakeProvider = { getDongSummary:async()=>null, getBuildings:async()=>[] };
  const handler = dongApi.createHandler(() => fakeProvider);
  process.env.DATA_GO_KR_SERVICE_KEY = 'test';
  const res = responseRecorder();
  await handler({ method:'GET', query:{ lawdCd:'11680', type:'officetel', dong:'없는동' } }, res);
  assert.equal(res.statusCode, 404);
});
