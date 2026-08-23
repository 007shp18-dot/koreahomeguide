const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

test('currency utility module exists', () => {
  assert.equal(fs.existsSync('currency-utils.js'), true);
});

test('currency utility exposes KRW conversion and locale defaults', () => {
  delete require.cache[require.resolve('../currency-utils.js')];
  const fx = require('../currency-utils.js');
  assert.equal(typeof fx.convertFromKrw, 'function');
  assert.equal(typeof fx.defaultCurrency, 'function');
  assert.equal(fx.convertFromKrw(1_200_000, 'USD', { USD: 0.00072, CNY: 0.0052 }), 864);
  assert.equal(fx.defaultCurrency('en'), 'USD');
  assert.equal(fx.defaultCurrency('zh-CN'), 'CNY');
});

test('currency utility formats KRW with optional approximate foreign currency', () => {
  delete require.cache[require.resolve('../currency-utils.js')];
  const fx = require('../currency-utils.js');
  assert.equal(typeof fx.formatMoneyHtml, 'function');
  const usd = fx.formatMoneyHtml(1_200_000, 'USD', { USD: 0.00072 }, 'en-US');
  assert.match(usd, /₩1,200,000/);
  assert.match(usd, /≈ \$864/);
  assert.match(usd, /fx-secondary/);
  const cny = fx.formatMoneyHtml(850_000, 'CNY', { CNY: 0.0052 }, 'zh-CN');
  assert.match(cny, /₩850,000/);
  assert.match(cny, /≈ ¥4,420/);
  const krw = fx.formatMoneyHtml(850_000, 'KRW', { CNY: 0.0052 }, 'zh-CN');
  assert.equal(krw.includes('fx-secondary'), false);
});
