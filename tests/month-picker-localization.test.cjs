const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const KHGRealPrices = require('../real-price-utils.js');

function read(file){ return fs.readFileSync(file,'utf8'); }

test('cold-start home no longer embeds the raw official transaction month browser', () => {
  const en=read('index.html'), zh=read('zh/index.html');
  assert.doesNotMatch(en, /id="priceMonth"/);
  assert.doesNotMatch(zh, /id="priceMonth"/);
  assert.match(en, /href="\/explore\/"/);
  assert.match(zh, /href="\/zh\/explore\/"/);
});

test('recentCompletedMonths preserves YYYY-MM values for API consumers that still use it', () => {
  const months=KHGRealPrices.recentCompletedMonths(new Date(2026,7,24),3);
  assert.deepEqual(months,['2026-07','2026-06','2026-05']);
});

test('homepage runtime is focused on Rent Check rather than raw month-table rendering', () => {
  const en=read('app.js'), zh=read('zh/app.js');
  assert.match(en, /\/api\/rent-check\?/);
  assert.match(zh, /\/api\/rent-check\?/);
  assert.doesNotMatch(en, /recentCompletedMonths/);
  assert.doesNotMatch(zh, /recentCompletedMonths/);
});
