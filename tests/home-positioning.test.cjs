const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

const home = fs.readFileSync('index.html','utf8');
const app = fs.readFileSync('app.js','utf8');
const zhHome = fs.readFileSync('zh/index.html','utf8');
const zhApp = fs.readFileSync('zh/app.js','utf8');

test('homepage keeps Find a Home brand promise while clearly describing signed-rent comparison', () => {
  assert.match(home, /Find a home in Seoul\./);
  assert.match(home, /official signed-rent data/i);
  assert.match(home, /Explore neighborhoods using recent signed rents/i);
  assert.match(home, /Signed monthly rent/i);
  assert.match(home, /Signed deposit/i);
  assert.match(home, />Compare Seoul rents</);
  assert.match(home, /This is not a live-listings search/i);
  assert.doesNotMatch(home, /Current listings will be added separately/i);
});

test('homepage result actions describe area exploration and official rent data, not listings', () => {
  assert.match(app, />Explore area</);
  assert.match(app, />View official rent data</);
  assert.match(app, /Signed rent filter/);
  assert.match(app, /Signed deposit filter/);
  assert.doesNotMatch(app, />Compare recent contracts</);
});

test('Chinese homepage carries the same non-listing positioning', () => {
  assert.match(zhHome, /在首尔找房。/);
  assert.match(zhHome, /官方.*签约租金/);
  assert.match(zhHome, /通过近期真实签约租金比较首尔地区/);
  assert.match(zhHome, /已签约月租/);
  assert.match(zhHome, /已签约押金/);
  assert.match(zhHome, />比较首尔租金</);
  assert.match(zhHome, /这里不是实时房源搜索/);
  assert.match(zhApp, />查看区域</);
  assert.match(zhApp, />查看官方租金数据</);
});
