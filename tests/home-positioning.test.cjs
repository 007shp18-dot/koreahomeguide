const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

const home = fs.readFileSync('index.html','utf8');
const app = fs.readFileSync('app.js','utf8');
const zhHome = fs.readFileSync('zh/index.html','utf8');
const zhApp = fs.readFileSync('zh/app.js','utf8');

test('homepage keeps Find a Home promise and turns it into budget-based neighborhood discovery', () => {
  assert.match(home, /Find a home in Seoul with real rent data\./);
  assert.match(home, /real rent data|signed contracts/i);
  assert.match(home, /Find neighborhoods that fit your budget/i);
  assert.match(home, /Monthly rent budget/i);
  assert.match(home, /Deposit budget/i);
  assert.match(home, />Find neighborhoods</);
  assert.match(home, /not live listings or asking prices/i);
  assert.doesNotMatch(home, /Neighborhood, station or university/i);
  assert.doesNotMatch(home, /Current listings will be added separately/i);
});

test('Find a Home hands the selected district, type, and optional budgets to Rent Explorer', () => {
  assert.match(app, /findDistrict/);
  assert.match(app, /new URLSearchParams\(\{ lawdCd:findDistrict\.value, type:homeType\.value \}\)/);
  assert.match(app, /params\.set\('maxRent'/);
  assert.match(app, /params\.set\('maxDeposit'/);
  assert.match(app, /window\.location\.href = `\/explore\/\?/);
  assert.doesNotMatch(app, /data-focus=/);
});

test('Chinese homepage carries the same budget-based non-listing flow', () => {
  assert.match(zhHome, /用真实租金数据，在首尔找到适合你的家/);
  assert.match(zhHome, /官方.*签约数据/);
  assert.match(zhHome, /按预算查找合适的首尔街区/);
  assert.match(zhHome, /月租预算/);
  assert.match(zhHome, /押金预算/);
  assert.match(zhHome, />查找合适地区</);
  assert.match(zhHome, /不是实时房源或挂牌报价/);
  assert.match(zhApp, /window\.location\.href = `\/zh\/explore\/\?/);
});
