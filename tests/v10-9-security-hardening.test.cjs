const test = require('node:test');
const assert = require('node:assert/strict');

const guardPath = '../lib/api-guard.cjs';

test('trustedRequestSource rejects an explicit foreign Origin and allows KoreaHomeGuide', () => {
  const { trustedRequestSource } = require(guardPath);
  assert.equal(trustedRequestSource({ headers:{ origin:'https://koreahomeguide.com' } }), true);
  assert.equal(trustedRequestSource({ headers:{ origin:'https://www.koreahomeguide.com' } }), true);
  assert.equal(trustedRequestSource({ headers:{ origin:'https://evil.example' } }), false);
});

test('trustedRequestSource allows headerless local tests but rejects headerless direct calls in production', () => {
  const { trustedRequestSource } = require(guardPath);
  const prior = process.env.VERCEL_ENV;
  try {
    delete process.env.VERCEL_ENV;
    assert.equal(trustedRequestSource({ headers:{} }), true);
    process.env.VERCEL_ENV = 'production';
    assert.equal(trustedRequestSource({ headers:{} }), false);
    assert.equal(trustedRequestSource({ headers:{ 'sec-fetch-site':'same-origin' } }), true);
    assert.equal(trustedRequestSource({ headers:{ referer:'https://koreahomeguide.com/explore/' } }), true);
    assert.equal(trustedRequestSource({ headers:{ referer:'https://evil.example/embed' } }), false);
  } finally {
    if (prior === undefined) delete process.env.VERCEL_ENV; else process.env.VERCEL_ENV = prior;
  }
});

test('isRecentCompletedMonth accepts only the configured completed-month window', () => {
  const { isRecentCompletedMonth } = require(guardPath);
  const referenceDate = new Date('2026-08-25T00:00:00Z');
  assert.equal(isRecentCompletedMonth('202607', { referenceDate, maxMonths:60 }), true);
  assert.equal(isRecentCompletedMonth('202608', { referenceDate, maxMonths:60 }), false);
  assert.equal(isRecentCompletedMonth('202107', { referenceDate, maxMonths:60 }), false);
  assert.equal(isRecentCompletedMonth('not-a-month', { referenceDate, maxMonths:60 }), false);
});

test('fetchWithTimeout aborts a slow upstream request', async () => {
  const { fetchWithTimeout } = require(guardPath);
  let sawSignal = false;
  const slowFetch = (_url, options = {}) => new Promise((_resolve, reject) => {
    sawSignal = Boolean(options.signal);
    options.signal.addEventListener('abort', () => {
      const error = new Error('aborted');
      error.name = 'AbortError';
      reject(error);
    }, { once:true });
  });
  await assert.rejects(
    () => fetchWithTimeout(slowFetch, 'https://example.test', {}, 15),
    error => error && error.name === 'AbortError'
  );
  assert.equal(sawSignal, true);
});

test('logApiError logs safe context without upstream URL or service key fields', () => {
  const { logApiError } = require(guardPath);
  const original = console.error;
  const calls = [];
  console.error = (...args) => calls.push(args);
  try {
    logApiError('real-prices', new Error('upstream failed'), {
      lawdCd:'11680', type:'villa', dealYmd:'202607', serviceKey:'SECRET', url:'https://secret'
    });
  } finally {
    console.error = original;
  }
  assert.equal(calls.length, 1);
  const payload = calls[0][1];
  assert.deepEqual(payload, {
    lawdCd:'11680',
    type:'villa',
    dealYmd:'202607',
    message:'upstream failed'
  });
});

test('real-prices rejects an explicit foreign browser origin before upstream work', async () => {
  const api = require('../api/real-prices.js');
  const res = {
    statusCode:200,
    body:null,
    status(code) { this.statusCode = code; return this; },
    json(value) { this.body = value; return this; },
    setHeader() {}
  };
  await api({
    method:'GET',
    headers:{ origin:'https://evil.example' },
    query:{ type:'apartment', lawdCd:'11680', dealYmd:'202607' }
  }, res);
  assert.equal(res.statusCode, 403);
  assert.deepEqual(res.body, { error:'Request origin is not allowed.' });
});

const fs = require('node:fs');
const path = require('node:path');
function source(rel) { return fs.readFileSync(path.join(__dirname, '..', rel), 'utf8'); }

test('raw/client MOLIT APIs apply district/source guards and safe error logging', () => {
  const realPrices = source('api/real-prices.js');
  assert.match(realPrices, /isSupportedAreaCode/);
  assert.match(realPrices, /isRecentCompletedMonth/);
  assert.match(realPrices, /trustedRequestSource/);
  assert.match(realPrices, /fetchWithRetry/);
  assert.match(realPrices, /logApiError/);

  const rentCheck = source('api/rent-check.js');
  assert.match(rentCheck, /isSupportedAreaCode/);
  assert.match(rentCheck, /fetchWithRetry/);

  for (const file of ['api/rent-check.js','api/rent-market.js','api/explore-area.js','api/explore-dong.js','api/explore-building.js']) {
    const text = source(file);
    assert.match(text, /trustedRequestSource/, `${file} must validate explicit browser source headers`);
    assert.match(text, /logApiError/, `${file} must log upstream failures safely`);
  }
});

test('SEO and dynamic sitemap endpoints with upstream work log failures instead of swallowing them', () => {
  for (const file of ['api/seo-dong-page.js','api/sitemap-market.js']) {
    const text = source(file);
    assert.match(text, /logApiError/, `${file} must log upstream failures safely`);
    assert.doesNotMatch(text, /catch \(_\)/, `${file} must not swallow the error object`);
  }
});

test('shared data.go.kr paging path uses retry handling over the 5 second timeout', () => {
  const text = source('lib/real-price-core.cjs');
  assert.match(text, /fetchWithRetry/);
  assert.match(text, /DEFAULT_UPSTREAM_TIMEOUT_MS/);
});
