const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { ENTRY_PAGES, findEntryPage } = require('../seo/acquisition-catalog.cjs');

test('catalogue contains exactly seven guides and 30 market pages', () => {
  assert.equal(ENTRY_PAGES.length, 37);
  assert.equal(ENTRY_PAGES.filter(item => item.kind === 'guide').length, 7);
  assert.equal(ENTRY_PAGES.filter(item => item.kind === 'market').length, 30);
  assert.equal(new Set(ENTRY_PAGES.map(item => item.path)).size, 37);
  assert.equal(new Set(ENTRY_PAGES.map(item => item.primaryQuery)).size, 37);
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
