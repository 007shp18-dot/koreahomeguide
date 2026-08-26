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

test('fetchWithRetry stops after the configured retry budget', async () => {
  let calls = 0;
  const result = await guard.fetchWithRetry(
    async () => { calls += 1; return response(503); },
    'https://example.test',
    {},
    100,
    { retries:2, sleepImpl:async () => {} }
  );
  assert.equal(result.status, 503);
  assert.equal(calls, 3);
});

test('fetchWithRetry clamps an excessive Retry-After delay', async () => {
  const sleeps = [];
  let calls = 0;
  const result = await guard.fetchWithRetry(async () => {
    calls += 1;
    return calls === 1
      ? response(429, '', { 'retry-after':'999999' })
      : response(200, xml);
  }, 'https://example.test', {}, 100, {
    retries:1,
    maxRetryDelayMs:750,
    sleepImpl:async ms => sleeps.push(ms)
  });

  assert.equal(result.status, 200);
  assert.equal(calls, 2);
  assert.deepEqual(sleeps, [750]);
});

test('fetchWithRetry treats Retry-After zero as an immediate retry', async () => {
  const sleeps = [];
  let calls = 0;
  const result = await guard.fetchWithRetry(async () => {
    calls += 1;
    return calls === 1
      ? response(429, '', { 'retry-after':'0' })
      : response(200, xml);
  }, 'https://example.test', {}, 100, {
    retries:1,
    sleepImpl:async ms => sleeps.push(ms)
  });

  assert.equal(result.status, 200);
  assert.equal(calls, 2);
  assert.deepEqual(sleeps, []);
});

test('fetchWithRetry stops before starting an attempt beyond the overall deadline', async () => {
  let now = 0;
  let calls = 0;
  await assert.rejects(() => guard.fetchWithRetry(async () => {
    calls += 1;
    return response(503, '', { 'retry-after':'999999' });
  }, 'https://example.test', {}, 100, {
    retries:2,
    maxRetryDelayMs:1_000,
    totalTimeoutMs:1_000,
    nowImpl:() => now,
    sleepImpl:async ms => { now += ms; }
  }), /deadline/i);

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

test('overall retry deadline includes time waiting for an upstream concurrency slot', async () => {
  let releaseBlockers;
  const blockerGate = new Promise(resolve => { releaseBlockers = resolve; });
  let startedBlockers = 0;
  let markBlockersReady;
  const blockersReady = new Promise(resolve => { markBlockersReady = resolve; });
  const blockerFetch = async () => {
    startedBlockers += 1;
    if (startedBlockers === 2) markBlockersReady();
    await blockerGate;
    return response(200, xml);
  };
  const blockers = [
    guard.fetchWithRetry(blockerFetch, 'https://example.test/a', {}, 1_000, { retries:0, totalTimeoutMs:1_000 }),
    guard.fetchWithRetry(blockerFetch, 'https://example.test/b', {}, 1_000, { retries:0, totalTimeoutMs:1_000 })
  ];
  await blockersReady;

  let queuedCalls = 0;
  try {
    await assert.rejects(() => guard.fetchWithRetry(async () => {
      queuedCalls += 1;
      return response(200, xml);
    }, 'https://example.test/queued', {}, 1_000, {
      retries:0,
      totalTimeoutMs:20
    }), /deadline/i);
    assert.equal(queuedCalls, 0);
  } finally {
    releaseBlockers();
    await Promise.all(blockers);
  }
});

test('fetchWithRetry keeps the timeout active through body consumption and retries a stalled body', async () => {
  let calls = 0;
  const fakeFetch = async (_url, options) => {
    calls += 1;
    if (calls > 1) return response(200, xml);
    return {
      ...response(200),
      async text() {
        return new Promise((resolve, reject) => {
          options.signal.addEventListener('abort', () => {
            const error = new Error('body read aborted');
            error.name = 'AbortError';
            reject(error);
          }, { once:true });
        });
      }
    };
  };

  const result = await guard.fetchWithRetry(fakeFetch, 'https://example.test', {}, 15, {
    retries:1,
    sleepImpl:async () => {},
    readBody:upstream => upstream.text()
  });

  assert.equal(calls, 2);
  assert.equal(result.body, xml);
  assert.equal(result.response.status, 200);
});

test('MOLIT concurrency slots remain occupied until response bodies finish', async () => {
  let activeBodies = 0;
  let maxActiveBodies = 0;
  const fakeFetch = async () => ({
    ...response(200),
    async text() {
      activeBodies += 1;
      maxActiveBodies = Math.max(maxActiveBodies, activeBodies);
      await new Promise(resolve => setTimeout(resolve, 15));
      activeBodies -= 1;
      return xml;
    }
  });

  await Promise.all(Array.from({ length:6 }, () => guard.fetchWithRetry(
    fakeFetch,
    'https://example.test',
    {},
    100,
    { retries:0, readBody:upstream => upstream.text() }
  )));

  assert.equal(maxActiveBodies, 2);
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

test('malformed HTTP 200 MOLIT bodies are rejected and never written to cache', async () => {
  const payloads = [
    '<html><body>temporary proxy page</body></html>',
    '<response><header><resultCode>00</resultCode></header><body><totalCount>1</totalCount><items><item>'
  ];
  let writes = 0;
  for (const body of payloads) {
    await assert.rejects(() => prices.fetchRentalMonth({
      serviceKey:'test',
      type:'detached',
      lawdCd:'11215',
      dealYmd:'202605',
      fetchImpl:async () => response(200, body),
      runtimeCacheProvider:async () => ({
        async get() { return null; },
        async set() { writes += 1; }
      })
    }), /invalid MOLIT response/i);
  }
  assert.equal(writes, 0);
});

test('MOLIT pagination rejects a changed total count instead of caching a partial month', async () => {
  const item = pageNo => `<item><aptNm>P${pageNo}</aptNm><umdNm>역삼동</umdNm><excluUseAr>25</excluUseAr><dealYear>2026</dealYear><dealMonth>7</dealMonth><dealDay>${pageNo}</dealDay><deposit>1,000</deposit><monthlyRent>100</monthlyRent></item>`;
  const fakeFetch = async url => {
    const pageNo = Number(new URL(url).searchParams.get('pageNo'));
    const totalCount = pageNo === 1 ? 2 : 3;
    return response(200, `<response><header><resultCode>00</resultCode></header><body><totalCount>${totalCount}</totalCount><pageNo>${pageNo}</pageNo><items>${item(pageNo)}</items></body></response>`);
  };

  await assert.rejects(() => prices.fetchRentalMonth({
    serviceKey:'test',
    type:'apartment',
    lawdCd:'11290',
    dealYmd:'202604',
    fetchImpl:fakeFetch,
    pageSize:1,
    runtimeCacheProvider:async () => null
  }), /pagination metadata/i);
});

test('all direct MOLIT call paths are wired to the retry helper', () => {
  for (const file of ['lib/real-price-core.cjs','api/real-prices.js','api/rent-check.js']) {
    const text = fs.readFileSync(file, 'utf8');
    assert.match(text, /fetchWithRetry/, `${file} must use fetchWithRetry`);
  }
});
