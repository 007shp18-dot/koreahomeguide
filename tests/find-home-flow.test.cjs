const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const read = rel => fs.readFileSync(path.join(root, rel), 'utf8');

test('English Find a Home uses district/type/budget fields and routes to Explorer', () => {
  const html = read('index.html');
  const app = read('app.js');
  assert.match(html, /id="findDistrict"/);
  assert.match(html, /id="homeType"/);
  assert.match(html, /id="rentBudget"/);
  assert.match(html, /id="depositBudget"/);
  assert.doesNotMatch(html, /id="areaSearch"/);
  assert.match(html, />Check rents</);
  assert.match(app, /\/explore\/\?/);
  assert.match(app, /maxRent/);
  assert.match(app, /maxDeposit/);
});

test('Chinese Find a Home routes the same filters to Chinese Explorer', () => {
  const html = read('zh/index.html');
  const app = read('zh/app.js');
  assert.match(html, /id="findDistrict"/);
  assert.doesNotMatch(html, /id="areaSearch"/);
  assert.match(html, />查看租金</);
  assert.match(app, /\/zh\/explore\/\?/);
  assert.match(app, /maxRent/);
  assert.match(app, /maxDeposit/);
});

test('Explorer exposes budget filters and filters neighborhood medians', () => {
  const html = read('explore/index.html');
  const app = read('explore/app.js');
  assert.match(html, /id="exploreMaxRent"/);
  assert.match(html, /id="exploreMaxDeposit"/);
  assert.match(app, /function filterDongsByBudget/);
  assert.match(app, /medianMonthlyRentWon/);
  assert.match(app, /medianDepositWon/);
  assert.match(app, /maxRent/);
  assert.match(app, /maxDeposit/);
});

test('Chinese Explorer mirrors budget filtering controls', () => {
  const html = read('zh/explore/index.html');
  const app = read('zh/explore/app.js');
  assert.match(html, /id="exploreMaxRent"/);
  assert.match(html, /id="exploreMaxDeposit"/);
  assert.match(app, /function filterDongsByBudget/);
  assert.match(app, /maxRent/);
  assert.match(app, /maxDeposit/);
});


test('budget helper keeps only neighborhoods whose medians fit both limits', () => {
  const explorer = require('../explore/explorer-utils.js');
  const dongs = [
    { dong:'A', medianMonthlyRentWon:700000, medianDepositWon:10000000 },
    { dong:'B', medianMonthlyRentWon:900000, medianDepositWon:10000000 },
    { dong:'C', medianMonthlyRentWon:700000, medianDepositWon:30000000 },
    { dong:'D', medianMonthlyRentWon:null, medianDepositWon:5000000 }
  ];
  assert.deepEqual(
    explorer.filterDongsByBudget(dongs, { maxRent:800000, maxDeposit:20000000 }).map(item => item.dong),
    ['A']
  );
});

test('Explorer area reload never references a stale local params variable when updating history', () => {
  for (const rel of ['explore/app.js','zh/explore/app.js']) {
    const app = read(rel);
    const loadArea = app.slice(app.indexOf('async function loadArea'), app.indexOf('function applyQuerySelection'));
    assert.doesNotMatch(loadArea, /\$\{params\.toString\(\)\}/);
    assert.match(loadArea, /currentParams\(false\)\.toString\(\)/);
  }
});
