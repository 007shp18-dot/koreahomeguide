const test = require('node:test');
const assert = require('node:assert/strict');

const realPrice = require('../lib/real-price-core.cjs');
const { createKoreaHousingProvider } = require('../providers/korea-provider.cjs');
const rentCheckApi = require('../api/rent-check.js');
const rentMarketApi = require('../api/rent-market.js');

function responseRecorder() {
  return {
    statusCode:200,
    headers:{},
    body:null,
    setHeader(name, value) { this.headers[name] = value; },
    status(code) { this.statusCode = code; return this; },
    json(value) { this.body = value; return this; }
  };
}

test('public transaction fetch retries one HTTP 429 before returning data', async () => {
  let attempts = 0;
  const waits = [];
  const fetchImpl = async () => {
    attempts += 1;
    if (attempts === 1) return { ok:false, status:429, text:async () => '' };
    return {
      ok:true,
      status:200,
      text:async () => '<response><header><resultCode>000</resultCode></header><body><totalCount>0</totalCount><items></items></body></response>'
    };
  };

  const rows = await realPrice.fetchRentalMonth({
    serviceKey:'key', type:'apartment', lawdCd:'11440', dealYmd:'202607',
    fetchImpl, sleepImpl:async ms => waits.push(ms)
  });

  assert.deepEqual(rows, []);
  assert.equal(attempts, 2);
  assert.equal(waits.length, 1);
});

test('Explorer provider keeps public month requests sequential', async () => {
  let active = 0;
  let maxActive = 0;
  const provider = createKoreaHousingProvider({
    serviceKey:'key',
    referenceDate:new Date('2026-08-25T00:00:00Z'),
    fetchMonth:async () => {
      active += 1;
      maxActive = Math.max(maxActive, active);
      await new Promise(resolve => setImmediate(resolve));
      active -= 1;
      return [];
    }
  });

  await provider.getAreaSummary({ areaCode:'11440', propertyType:'apartment', months:3 });
  assert.equal(maxActive, 1);
});

test('Rent Check keeps public month requests sequential', async () => {
  let active = 0;
  let maxActive = 0;
  const previousKey = process.env.DATA_GO_KR_SERVICE_KEY;
  process.env.DATA_GO_KR_SERVICE_KEY = 'key';
  try {
    const handler = rentCheckApi.createHandler({
      now:() => new Date('2026-08-25T00:00:00Z'),
      fetchMonth:async () => {
        active += 1;
        maxActive = Math.max(maxActive, active);
        await new Promise(resolve => setImmediate(resolve));
        active -= 1;
        return [];
      }
    });
    const res = responseRecorder();
    await handler({ method:'GET', query:{ lawdCd:'11440', type:'apartment', deposit:'10000000', rent:'1200000', area:'25' } }, res);
    assert.equal(res.statusCode, 200);
    assert.equal(maxActive, 1);
  } finally {
    if (previousKey === undefined) delete process.env.DATA_GO_KR_SERVICE_KEY;
    else process.env.DATA_GO_KR_SERVICE_KEY = previousKey;
  }
});

test('district rent market keeps its six public month requests sequential', async () => {
  let active = 0;
  let maxActive = 0;
  const previousKey = process.env.DATA_GO_KR_SERVICE_KEY;
  process.env.DATA_GO_KR_SERVICE_KEY = 'key';
  try {
    const handler = rentMarketApi.createHandler({
      now:() => new Date('2026-08-25T00:00:00Z'),
      fetchMonth:async () => {
        active += 1;
        maxActive = Math.max(maxActive, active);
        await new Promise(resolve => setImmediate(resolve));
        active -= 1;
        return [];
      }
    });
    const res = responseRecorder();
    await handler({ method:'GET', query:{ lawdCd:'11440', type:'apartment' } }, res);
    assert.equal(res.statusCode, 200);
    assert.equal(maxActive, 1);
  } finally {
    if (previousKey === undefined) delete process.env.DATA_GO_KR_SERVICE_KEY;
    else process.env.DATA_GO_KR_SERVICE_KEY = previousKey;
  }
});
