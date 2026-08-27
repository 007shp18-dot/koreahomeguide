const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');

function freshPrices() {
  const target = require.resolve('../lib/real-price-core.cjs');
  delete require.cache[target];
  return require('../lib/real-price-core.cjs');
}

test('v11.3 exposes stable service-key-free shared month keys', () => {
  const prices = freshPrices();
  assert.equal(
    prices.runtimeMonthCacheKey({ kind:'rent', type:'villa', lawdCd:'11680', dealYmd:'202607', pageSize:1000 }),
    'molit-v2:rent:villa:11680:202607:1000'
  );
  assert.equal(
    prices.runtimeMonthCacheKey({ kind:'sale', type:'apartment', lawdCd:'11680', dealYmd:'202607', pageSize:1000 }),
    'molit-v2:sale:apartment:11680:202607:1000'
  );
  assert.doesNotMatch(
    prices.runtimeMonthCacheKey({ kind:'rent', type:'villa', lawdCd:'11680', dealYmd:'202607', pageSize:1000 }),
    /service|key/i
  );
});

test('shared cache hit returns cached rows without calling upstream loader', async () => {
  const prices = freshPrices();
  let loads = 0;
  const cache = {
    async get(key) {
      assert.equal(key, 'molit-v2:rent:villa:11680:202607:1000');
      return [{ building:'cached' }];
    },
    async set() { throw new Error('set must not run on a hit'); }
  };
  const result = await prices.loadWithRuntimeCache({
    cacheProvider: async () => cache,
    cacheKey:'molit-v2:rent:villa:11680:202607:1000',
    loader:async () => { loads += 1; return [{ building:'origin' }]; }
  });
  assert.deepEqual(result, [{ building:'cached' }]);
  assert.equal(loads, 0);
});

test('shared cache miss writes origin rows for 24 hours', async () => {
  const prices = freshPrices();
  const writes = [];
  const cache = {
    async get() { return null; },
    async set(key, value, options) { writes.push({ key, value, options }); }
  };
  const result = await prices.loadWithRuntimeCache({
    cacheProvider: async () => cache,
    cacheKey:'molit-v2:rent:officetel:11170:202607:1000',
    loader:async () => [{ building:'origin' }]
  });
  assert.deepEqual(result, [{ building:'origin' }]);
  assert.equal(writes.length, 1);
  assert.equal(writes[0].key, 'molit-v2:rent:officetel:11170:202607:1000');
  assert.deepEqual(writes[0].value, [{ building:'origin' }]);
  assert.equal(writes[0].options.ttl, 86400);
  assert.deepEqual(writes[0].options.tags, ['molit-month']);
});

test('runtime cache read failure degrades to upstream and still returns data', async () => {
  const prices = freshPrices();
  let loads = 0;
  const cache = {
    async get() { throw new Error('cache unavailable'); },
    async set() {}
  };
  const result = await prices.loadWithRuntimeCache({
    cacheProvider: async () => cache,
    cacheKey:'molit-v2:rent:apartment:11440:202607:1000',
    loader:async () => { loads += 1; return [{ building:'origin' }]; }
  });
  assert.equal(loads, 1);
  assert.deepEqual(result, [{ building:'origin' }]);
});

test('runtime cache write failure never discards successful MOLIT data', async () => {
  const prices = freshPrices();
  const cache = {
    async get() { return undefined; },
    async set() { throw new Error('write unavailable'); }
  };
  const result = await prices.loadWithRuntimeCache({
    cacheProvider: async () => cache,
    cacheKey:'molit-v2:rent:apartment:11440:202607:1000',
    loader:async () => [{ building:'origin' }]
  });
  assert.deepEqual(result, [{ building:'origin' }]);
});

test('missing runtime cache preserves legacy loader behavior', async () => {
  const prices = freshPrices();
  let loads = 0;
  const result = await prices.loadWithRuntimeCache({
    cacheProvider: async () => null,
    cacheKey:'molit-v2:rent:detached:11170:202607:1000',
    loader:async () => { loads += 1; return [{ building:'origin' }]; }
  });
  assert.equal(loads, 1);
  assert.deepEqual(result, [{ building:'origin' }]);
});

test('runtime cache adapter is lazy and does not hard-fail outside Vercel', async () => {
  const runtime = require('../lib/runtime-cache.cjs');
  const previous = process.env.VERCEL;
  delete process.env.VERCEL;
  try {
    assert.equal(await runtime.getRuntimeCache(), null);
  } finally {
    if (previous === undefined) delete process.env.VERCEL;
    else process.env.VERCEL = previous;
  }
});

test('runtime cache adapter passes its namespace through the SDK options object', async () => {
  const runtime = require('../lib/runtime-cache.cjs');
  const cache = { get:async () => undefined, set:async () => undefined };
  let receivedOptions = null;
  const result = await runtime.getRuntimeCache({
    env:{ VERCEL:'1' },
    moduleLoader:async () => ({
      getCache(options) {
        receivedOptions = options;
        return cache;
      }
    })
  });
  assert.equal(result, cache);
  assert.deepEqual(receivedOptions, { namespace:'khg-molit-v11-3' });
});

test('package metadata pins the Vercel Functions dependency used by Runtime Cache', () => {
  const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
  assert.equal(pkg.private, true);
  assert.equal(pkg.dependencies['@vercel/functions'], '3.9.5');
});

function response(status, body = '') {
  return {
    status,
    ok: status >= 200 && status < 300,
    headers: { get() { return null; } },
    async text() { return body; }
  };
}

const xml = '<response><header><resultCode>00</resultCode></header><body><totalCount>1</totalCount><items><item><aptNm>Origin</aptNm><umdNm>역삼동</umdNm><excluUseAr>25</excluUseAr><dealYear>2026</dealYear><dealMonth>7</dealMonth><dealDay>1</dealDay><deposit>1,000</deposit><monthlyRent>100</monthlyRent></item></items></body></response>';

test('fetchRentalMonth uses a supplied regional cache before MOLIT', async () => {
  const prices = freshPrices();
  let upstreamCalls = 0;
  const fakeFetch = async () => { upstreamCalls += 1; return response(500, ''); };
  const cached = [{ building:'Shared', buildingName:'Shared', dong:'역삼동', area:'25', deposit:'1,000', monthlyRent:'100', contractDate:'2026-07-01', type:'apartment' }];
  const result = await prices.fetchRentalMonth({
    serviceKey:'secret-not-in-key',
    type:'apartment',
    lawdCd:'11680',
    dealYmd:'202607',
    fetchImpl:fakeFetch,
    runtimeCacheProvider:async () => ({
      async get(key) {
        assert.equal(key, 'molit-v2:rent:apartment:11680:202607:1000');
        return cached;
      },
      async set() { throw new Error('must not write hit'); }
    })
  });
  assert.deepEqual(result, cached);
  assert.equal(upstreamCalls, 0);
});

test('fetchRentalMonth writes parsed MOLIT rows to the supplied regional cache on miss', async () => {
  const prices = freshPrices();
  let upstreamCalls = 0;
  const writes = [];
  const fakeFetch = async () => { upstreamCalls += 1; return response(200, xml); };
  const result = await prices.fetchRentalMonth({
    serviceKey:'test',
    type:'apartment',
    lawdCd:'11680',
    dealYmd:'202607',
    fetchImpl:fakeFetch,
    runtimeCacheProvider:async () => ({
      async get() { return null; },
      async set(key, value, options) { writes.push({ key, value, options }); }
    })
  });
  assert.equal(upstreamCalls, 1);
  assert.equal(result.length, 1);
  assert.equal(result[0].building, 'Origin');
  assert.equal(writes.length, 1);
  assert.equal(writes[0].key, 'molit-v2:rent:apartment:11680:202607:1000');
  assert.deepEqual(writes[0].value, result);
  assert.equal(writes[0].options.ttl, 86400);
});

test('fetchSaleMonth uses the same regional month-cache layer', async () => {
  const prices = freshPrices();
  let upstreamCalls = 0;
  const fakeFetch = async () => { upstreamCalls += 1; return response(500, ''); };
  const cached = [{ building:'Shared sale', dealAmount:'100,000', type:'apartment' }];
  const result = await prices.fetchSaleMonth({
    serviceKey:'secret-not-in-key',
    type:'apartment',
    lawdCd:'11680',
    dealYmd:'202607',
    fetchImpl:fakeFetch,
    runtimeCacheProvider:async () => ({
      async get(key) {
        assert.equal(key, 'molit-v2:sale:apartment:11680:202607:1000');
        return cached;
      },
      async set() { throw new Error('must not write hit'); }
    })
  });
  assert.deepEqual(result, cached);
  assert.equal(upstreamCalls, 0);
});

test('two cold module instances reuse one shared month result', async () => {
  const store = new Map();
  const cacheProvider = async () => ({
    async get(key) { return store.has(key) ? store.get(key) : null; },
    async set(key, value) { store.set(key, value); }
  });

  let firstCalls = 0;
  const firstPrices = freshPrices();
  const first = await firstPrices.fetchRentalMonth({
    serviceKey:'test',
    type:'villa',
    lawdCd:'11440',
    dealYmd:'202607',
    fetchImpl:async () => { firstCalls += 1; return response(200, xml); },
    runtimeCacheProvider:cacheProvider
  });

  let secondCalls = 0;
  const secondPrices = freshPrices();
  const second = await secondPrices.fetchRentalMonth({
    serviceKey:'test',
    type:'villa',
    lawdCd:'11440',
    dealYmd:'202607',
    fetchImpl:async () => { secondCalls += 1; return response(500, ''); },
    runtimeCacheProvider:cacheProvider
  });

  assert.equal(firstCalls, 1);
  assert.equal(secondCalls, 0);
  assert.deepEqual(second, first);
});
