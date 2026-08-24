const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

const home = fs.readFileSync('index.html','utf8');
const app = fs.readFileSync('app.js','utf8');
const zhHome = fs.readFileSync('zh/index.html','utf8');
const zhApp = fs.readFileSync('zh/app.js','utf8');

test('homepage positions KoreaHomeGuide as rent understanding before signing, not a listings promise', () => {
  assert.match(home, /Know the real price before you sign\./);
  assert.match(home, /official signed rental transactions|signed contracts/i);
  assert.match(home, /Compare neighborhoods by budget/i);
  assert.match(home, /Monthly rent budget/i);
  assert.match(home, /Deposit budget/i);
  assert.match(home, />Check rents</);
  assert.match(home, /not live listings or asking prices/i);
  assert.doesNotMatch(home, /Find a home in Seoul/i);
  assert.doesNotMatch(home, /Neighborhood, station or university/i);
  assert.doesNotMatch(home, /Current listings will be added separately/i);
});

test('home rent check hands the selected district, type, and optional budgets to Rent Explorer', () => {
  assert.match(app, /findDistrict/);
  assert.match(app, /mapRentCheckType\(homeType\.value\)\.officialType/);
  assert.match(app, /new URLSearchParams\(\{ lawdCd:findDistrict\.value, type:officialHomeType \}\)/);
  assert.match(app, /params\.set\('maxRent'/);
  assert.match(app, /params\.set\('maxDeposit'/);
  assert.match(app, /window\.location\.href = `\/explore\/\?/);
  assert.doesNotMatch(app, /data-focus=/);
});

test('Chinese homepage carries the same pre-signing, budget-based non-listing flow', () => {
  assert.match(zhHome, /签约前，先了解真实租金/);
  assert.match(zhHome, /官方.*签约/);
  assert.match(zhHome, /按预算比较首尔街区/);
  assert.match(zhHome, /月租预算/);
  assert.match(zhHome, /押金预算/);
  assert.match(zhHome, />查看租金</);
  assert.match(zhHome, /不是实时房源或挂牌报价/);
  assert.doesNotMatch(zhHome, /找到适合你的家|<span class="eyebrow">找房<\/span>/);
  assert.match(zhApp, /window\.location\.href = `\/zh\/explore\/\?/);
});
