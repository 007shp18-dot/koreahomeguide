'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { ENTRY_PAGES } = require('../seo/acquisition-catalog.cjs');

function metadata(item) {
  const html = fs.readFileSync(item.file, 'utf8');
  const title = (html.match(/<title>([^<]+)<\/title>/i) || [])[1] || '';
  const description = (html.match(/<meta name="description" content="([^"]+)"/i) || [])[1] || '';
  return { html, title: title.trim(), description: description.trim() };
}

test('all acquisition metadata is unique and within the sprint guardrails', () => {
  const rows = ENTRY_PAGES.map(item => ({ item, ...metadata(item) }));
  assert.equal(new Set(rows.map(row => row.title)).size, 38);
  assert.equal(new Set(rows.map(row => row.description)).size, 38);
  for (const row of rows) {
    assert.ok(row.title.length > 0 && row.title.length <= 65, `${row.item.path}: title ${row.title.length}`);
    assert.ok(row.description.length >= 110 && row.description.length <= 160, `${row.item.path}: description ${row.description.length}`);
    assert.doesNotMatch(row.title, /live listings|available now|guaranteed|appraisal|legal review/i, row.item.path);
    assert.doesNotMatch(row.description, /live listings|available now|guaranteed|appraisal|legal review/i, row.item.path);
  }
});

test('metadata edits preserve canonical and hreflang contracts', () => {
  for (const item of ENTRY_PAGES) {
    const { html } = metadata(item);
    assert.match(html, new RegExp(`<link rel="canonical" href="https://koreahomeguide\\.com${item.path}"`), item.file);
    assert.match(html, /<link rel="alternate" hreflang="en"/, item.file);
    assert.match(html, /<link rel="alternate" hreflang="x-default"/, item.file);
  }
});
