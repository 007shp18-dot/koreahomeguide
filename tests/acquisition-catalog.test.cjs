const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { ENTRY_PAGES, findEntryPage } = require('../seo/acquisition-catalog.cjs');

test('catalogue contains exactly eight guides and 30 market pages', () => {
  assert.equal(ENTRY_PAGES.length, 38);
  assert.equal(ENTRY_PAGES.filter(item => item.kind === 'guide').length, 8);
  assert.equal(ENTRY_PAGES.filter(item => item.kind === 'market').length, 30);
  assert.equal(new Set(ENTRY_PAGES.map(item => item.path)).size, 38);
  assert.equal(new Set(ENTRY_PAGES.map(item => item.primaryQuery)).size, 38);
});

test('every catalogued page exists and owns its canonical metadata', () => {
  for (const item of ENTRY_PAGES) {
    assert.equal(fs.existsSync(item.file), true, item.file);
    const html = fs.readFileSync(item.file, 'utf8');
    assert.match(
      html,
      new RegExp(`<link rel="canonical" href="https://koreahomeguide\\.com${item.path}"`),
      item.file
    );
    assert.match(html, /<title>[^<]+<\/title>/, item.file);
    assert.match(html, /<meta name="description" content="[^"]+"/, item.file);
  }
});

test('lookup normalizes trailing slashes but rejects non-entry surfaces', () => {
  assert.equal(findEntryPage('/guides/wolse-vs-jeonse').path, '/guides/wolse-vs-jeonse/');
  assert.equal(findEntryPage('/rent/gangnam-gu/apartment/').lawdCd, '11680');
  assert.equal(findEntryPage('/explore/building/'), null);
});

const DEEP_PATHS = [
  '/guides/wolse-vs-jeonse/',
  '/guides/korea-rental-contract-checklist/',
  '/guides/seoul-brokerage-fees/',
  '/guides/before-you-sign/',
  '/guides/rent-apartment-korea-foreigner/',
  '/guides/korea-rental-scams/',
  '/guides/seoul-officetel-rent/',
  '/guides/korea-rent-deposit-protection-foreigners/',
  '/rent/gangnam-gu/apartment/',
  '/rent/mapo-gu/officetel/',
  '/rent/yongsan-gu/villa/'
];

test('catalogue exposes one complete search contract per entry page', () => {
  for (const item of ENTRY_PAGES) {
    assert.ok(item.userQuestion && item.userQuestion.length >= 20, item.path);
    assert.ok(item.pagePromise && item.pagePromise.length >= 30, item.path);
    assert.ok(['deep', 'metadata'].includes(item.priorityTier), item.path);
  }
});

test('catalogue locks exactly the eleven approved deep-improvement pages', () => {
  const actual = ENTRY_PAGES
    .filter(item => item.priorityTier === 'deep')
    .map(item => item.path)
    .sort();
  assert.deepEqual(actual, [...DEEP_PATHS].sort());
  assert.equal(ENTRY_PAGES.filter(item => item.priorityTier === 'metadata').length, 27);
});
