const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

test('currency utility module exists', () => {
  assert.equal(fs.existsSync('currency-utils.js'), true);
});

test('currency utility exposes KRW conversion and locale defaults', () => {
  delete require.cache[require.resolve('../currency-utils.js')];
  const fx = require('../currency-utils.js');
  assert.equal(typeof fx.convertFromKrw, 'function');
  assert.equal(typeof fx.defaultCurrency, 'function');
  assert.equal(fx.convertFromKrw(1_200_000, 'USD', { USD: 0.00072, CNY: 0.0052 }), 864);
  assert.equal(fx.defaultCurrency('en'), 'KRW');
  assert.equal(fx.defaultCurrency('zh-CN'), 'KRW');
});

test('currency utility keeps official KRW primary with selected foreign currency as reference', () => {
  delete require.cache[require.resolve('../currency-utils.js')];
  const fx = require('../currency-utils.js');
  assert.equal(typeof fx.formatMoneyHtml, 'function');
  const usd = fx.formatMoneyHtml(1_200_000, 'USD', { USD: 0.00072 }, 'en-US');
  assert.match(usd, /money-primary[^>]*>₩1,200,000/);
  assert.match(usd, /fx-secondary[^>]*>≈ \$864/);
  assert.match(usd, /fx-secondary/);
  const cny = fx.formatMoneyHtml(850_000, 'CNY', { CNY: 0.0052 }, 'zh-CN');
  assert.match(cny, /money-primary[^>]*>₩850,000/);
  assert.match(cny, /fx-secondary[^>]*>≈ ¥4,420/);
  const krw = fx.formatMoneyHtml(850_000, 'KRW', { CNY: 0.0052 }, 'zh-CN');
  assert.equal(krw.includes('fx-secondary'), false);
});

test('currency utility parses grouped input and renders readable amounts', () => {
  const fx = require('../currency-utils.js');
  assert.equal(fx.parseInputAmount('10,000,000'), 10_000_000);
  assert.equal(fx.parseInputAmount(' 1,200,000 '), 1_200_000);
  assert.equal(fx.parseInputAmount('not money'), null);
  assert.equal(fx.parseInputAmount('-1'), null);
  assert.equal(fx.formatInputAmount(10_000_000, 'KRW', 'en-US'), '10,000,000');
  assert.equal(fx.formatInputAmount(4420, 'CNY', 'zh-CN'), '4,420');
});

test('KRW helper explains Korean ten-thousand-won units in both languages', () => {
  const fx = require('../currency-utils.js');
  assert.equal(fx.manwonLabel(10_000_000, 'en'), '= 1,000만원');
  assert.equal(fx.manwonLabel(1_200_000, 'zh-CN'), '= 120万韩元（만원）');
  assert.equal(fx.manwonLabel(null, 'en'), '');
});

test('currency preference accepts only supported values and survives storage failures', () => {
  const fx = require('../currency-utils.js');
  const values = new Map();
  const storage = {
    getItem(key) { return values.get(key) || null; },
    setItem(key, value) { values.set(key, value); }
  };
  assert.equal(fx.readCurrencyPreference(storage), null);
  assert.equal(fx.writeCurrencyPreference(storage, 'USD'), 'USD');
  assert.equal(fx.readCurrencyPreference(storage), 'USD');
  assert.equal(fx.writeCurrencyPreference(storage, 'JPY'), null);
  assert.equal(fx.readCurrencyPreference({ getItem() { throw new Error('blocked'); } }), null);
});

test('browser bootstrap survives a localStorage getter security error', () => {
  const root = {
    document:{ querySelector() { return null; } }
  };
  Object.defineProperty(root, 'localStorage', {
    configurable:true,
    get() { throw new Error('SecurityError'); }
  });
  const context = { globalThis:root };
  assert.doesNotThrow(() => vm.runInNewContext(fs.readFileSync('currency-utils.js', 'utf8'), context));
  assert.equal(typeof root.KHGCurrency.bindCurrencyPreference, 'function');
});
