const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const read = rel => fs.readFileSync(path.join(root, rel), 'utf8');

test('English homepage makes Rent Check primary and keeps Explorer as a secondary budget-discovery path', () => {
  const html = read('index.html');
  assert.match(html, /Is your Seoul rent actually fair\?/);
  assert.match(html, /href="\/explore\/"/);
  assert.match(html, /Compare Seoul before you choose an area/);
  assert.doesNotMatch(html, /id="findDistrict"/);
  assert.doesNotMatch(html, /id="rentBudget"/);
  assert.doesNotMatch(html, /id="depositBudget"/);
});

test('Chinese homepage mirrors the same Rent Check-first flow and keeps Chinese Explorer secondary', () => {
  const html = read('zh/index.html');
  assert.match(html, /你的首尔租金报价真的合理吗？/);
  assert.match(html, /href="\/zh\/explore\/"/);
  assert.match(html, /选地区前，先比较首尔真实租金/);
  assert.doesNotMatch(html, /id="findDistrict"/);
  assert.doesNotMatch(html, /id="rentBudget"/);
  assert.doesNotMatch(html, /id="depositBudget"/);
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
