const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const read = rel => fs.readFileSync(path.join(__dirname, '..', rel), 'utf8');

test('standalone Rent Check keeps core decision flow in main column with related context after it', () => {
  for (const file of ['tools/seoul-rent-check/index.html','zh/tools/seoul-rent-check/index.html']) {
    const html = read(file);
    assert.match(html, /class="product-layout tool-product-layout"/);
    assert.match(html, /class="product-main"/);
    assert.match(html, /class="context-rail"/);
    assert.ok(html.indexOf('rentCheckResult') < html.indexOf('context-rail'));
  }
});

test('pillar Before You Sign guides use editorial layout and a dormant guide ad slot', () => {
  for (const file of ['guides/before-you-sign/index.html','zh/guides/before-you-sign/index.html']) {
    const html = read(file);
    assert.match(html, /article-layout/);
    assert.match(html, /article-main/);
    assert.match(html, /class="context-rail/);
    assert.match(html, /data-slot="guide"/);
  }
});
