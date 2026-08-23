const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

test('fx API endpoint exists', () => {
  assert.equal(fs.existsSync('api/fx.js'), true);
});

test('fx API returns KRW-based USD/CNY rates with one-hour CDN caching', async () => {
  const originalFetch = global.fetch;
  global.fetch = async (url) => {
    assert.equal(url, 'https://api.frankfurter.dev/v1/latest?base=KRW&symbols=USD,CNY');
    return {
      ok: true,
      async json() {
        return { base: 'KRW', date: '2026-08-24', rates: { USD: 0.00072, CNY: 0.0052 } };
      }
    };
  };

  const headers = {};
  let statusCode = 200;
  let body;
  const res = {
    setHeader(name, value) { headers[name] = value; },
    status(code) { statusCode = code; return this; },
    json(value) { body = value; return this; }
  };

  try {
    delete require.cache[require.resolve('../api/fx.js')];
    const handler = require('../api/fx.js');
    await handler({}, res);
    assert.equal(statusCode, 200);
    assert.match(headers['Cache-Control'], /s-maxage=3600/);
    assert.deepEqual(body.rates, { USD: 0.00072, CNY: 0.0052 });
    assert.equal(body.base, 'KRW');
    assert.equal(body.date, '2026-08-24');
    assert.equal(body.source, 'Frankfurter');
  } finally {
    global.fetch = originalFetch;
  }
});
