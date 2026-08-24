const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

const KHGRealPrices = require('../real-price-utils.js');

function read(file) {
  return fs.readFileSync(file, 'utf8');
}

test('official rent month controls do not use the browser-native month input', () => {
  const en = read('index.html');
  const zh = read('zh/index.html');
  assert.doesNotMatch(en, /id="priceMonth"[^>]*type="month"/);
  assert.doesNotMatch(zh, /id="priceMonth"[^>]*type="month"/);
  assert.match(en, /<select id="priceMonth"/);
  assert.match(zh, /<select id="priceMonth"/);
});

test('recentCompletedMonths preserves YYYY-MM values for the API', () => {
  const months = KHGRealPrices.recentCompletedMonths(new Date(2026, 7, 24), 3);
  assert.deepEqual(months, ['2026-07', '2026-06', '2026-05']);
});

test('English and Chinese apps render contract-month options with site locale labels', () => {
  const en = read('app.js');
  const zh = read('zh/app.js');
  assert.match(en, /KHGDate\.formatMonth\(value, 'en-US'\)/);
  assert.match(zh, /KHGDate\.formatMonth\(value, 'zh-CN'\)/);
  assert.match(en, /recentCompletedMonths/);
  assert.match(zh, /recentCompletedMonths/);
});
