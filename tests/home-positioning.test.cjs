const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

const home = fs.readFileSync('index.html','utf8');
const app = fs.readFileSync('app.js','utf8');
const zhHome = fs.readFileSync('zh/index.html','utf8');
const zhApp = fs.readFileSync('app.js','utf8');

test('homepage positions KoreaHomeGuide as one pre-signing Rent Check funnel, not a listings promise', () => {
  assert.match(home, /Is your Seoul rent actually fair\?/);
  assert.match(home, /Official transaction data, explained for foreign renters/);
  assert.match(home, /id="rentCheckButton"[^>]*>Check</);
  assert.doesNotMatch(home, /class="hero-primary-action"/);
  assert.match(home, /does not promote live listings/);
  assert.match(home, /data-lead-capture/);
  assert.doesNotMatch(home, /Find a home in Seoul/i);
  assert.doesNotMatch(home, /Current listings will be added separately/i);
});

test('homepage Rent Check stays inline and Explorer becomes the secondary discovery path', () => {
  assert.match(home, /id="rentCheckForm"/);
  assert.match(home, /href="\/explore\/"/);
  assert.doesNotMatch(home, /id="findDistrict"/);
  assert.doesNotMatch(home, /id="rentBudget"/);
  assert.doesNotMatch(home, /id="depositBudget"/);
  assert.match(app, /\/api\/rent-check\?/);
  assert.match(app, /khg:rent-check-result/);
});

test('Chinese homepage carries the same trust -> result -> lead funnel', () => {
  assert.match(zhHome, /你的首尔租金报价真的合理吗？/);
  assert.match(zhHome, /韩国官方真实签约成交/);
  assert.match(zhHome, /id="rentCheckButton"[^>]*>检查这个租金</);
  assert.doesNotMatch(zhHome, /class="hero-primary-action"/);
  assert.match(zhHome, /data-lead-capture/);
  assert.match(zhHome, /href="\/zh\/explore\/"/);
  assert.doesNotMatch(zhHome, /id="findDistrict"/);
  assert.match(zhApp, /\/api\/rent-check\?/);
  assert.match(zhApp, /khg:rent-check-result/);
});
