const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

const guard = require('../lib/api-guard.cjs');
const prices = require('../lib/real-price-core.cjs');

function response(status, body = '', headers = {}) {
  return {
    status,
    ok: status >= 200 && status < 300,
    headers: { get(name) { return headers[String(name).toLowerCase()] || null; } },
    async text() { return body; }
  };
}

const xml = '<response><header><resultCode>00</resultCode></header><body><totalCount>1</totalCount><items><item><aptNm>A</aptNm><umdNm>역삼동</umdNm><excluUseAr>25</excluUseAr><dealYear>2026</dealYear><dealMonth>7</dealMonth><dealDay>1</dealDay><deposit>1,000</deposit><monthlyRent>100</monthlyRent></item></items></body></response>';

test('fetchWithRetry retries 429 and respects Retry-After before succeeding', async () => {
  const sleeps = [];
  let calls = 0;
  const fakeFetch = async () => {
    calls += 1;
    return calls === 1 ? response(429, '', { 'retry-after':'1' }) : response(200, xml);
  };
  const result = await guard.fetchWithRetry(fakeFetch, 'https://example.test', {}, 100, {
    retries:2,
    sleepImpl:async ms => sleeps.push(ms)
  });
  assert.equal(result.status, 200);
  assert.equal(calls, 2);
  assert.deepEqual(sleeps, [1000]);
});

test('fetchWithRetry does not retry permanent 403 responses', async () => {
  let calls = 0;
  const result = await guard.fetchWithRetry(async () => { calls += 1; return response(403); }, 'https://example.test', {}, 100, {
    retries:2,
    sleepImpl:async () => { throw new Error('must not sleep'); }
  });
  assert.equal(result.status, 403);
  assert.equal(calls, 1);
});

test('MOLIT retry helper caps concurrent upstream attempts at two per warm instance', async () => {
  let active = 0;
  let maxActive = 0;
  const fakeFetch = async () => {
    active += 1;
    maxActive = Math.max(maxActive, active);
    await new Promise(resolve => setTimeout(resolve, 15));
    active -= 1;
    return response(200, xml);
  };
  await Promise.all(Array.from({ length:6 }, () => guard.fetchWithRetry(fakeFetch, 'https://example.test', {}, 100, { retries:0 })));
  assert.equal(maxActive, 2);
});

test('fetchRentalMonth coalesces identical warm-instance month requests and caches the result briefly', async () => {
  let calls = 0;
  const fakeFetch = async () => {
    calls += 1;
    await new Promise(resolve => setTimeout(resolve, 10));
    return response(200, xml);
  };
  const args = { serviceKey:'test', type:'apartment', lawdCd:'11680', dealYmd:'202607', fetchImpl:fakeFetch };
  const [a,b] = await Promise.all([prices.fetchRentalMonth(args), prices.fetchRentalMonth(args)]);
  const c = await prices.fetchRentalMonth(args);
  assert.equal(calls, 1);
  assert.equal(a.length, 1);
  assert.deepEqual(a, b);
  assert.deepEqual(b, c);
});

test('failed month requests are not retained in the warm-instance cache', async () => {
  let calls = 0;
  const fakeFetch = async () => { calls += 1; return response(403, '<response/>'); };
  const args = { serviceKey:'test', type:'villa', lawdCd:'11170', dealYmd:'202607', fetchImpl:fakeFetch };
  await assert.rejects(() => prices.fetchRentalMonth(args), /HTTP 403/);
  await assert.rejects(() => prices.fetchRentalMonth(args), /HTTP 403/);
  assert.equal(calls, 2);
});

test('all direct MOLIT call paths are wired to the retry helper', () => {
  for (const file of ['lib/real-price-core.cjs','api/real-prices.js','api/rent-check.js']) {
    const text = fs.readFileSync(file, 'utf8');
    assert.match(text, /fetchWithRetry/, `${file} must use fetchWithRetry`);
  }
});
