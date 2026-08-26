'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { ENTRY_PAGES } = require('../seo/acquisition-catalog.cjs');

test('external kit contains four approved tracked entry URLs and no auto-post instruction', () => {
  const markdown = fs.readFileSync('docs/operations/2026-08-26-external-acquisition-kit.md', 'utf8');
  const urls = [...markdown.matchAll(/https:\/\/koreahomeguide\.com(\/[^\s?)]+\/)\?utm_source=([^&\s]+)&utm_medium=([^&\s]+)&utm_campaign=([^\s)]+)/g)];
  assert.equal(urls.length, 4);
  const allowed = new Set(ENTRY_PAGES.map(item => item.path));
  for (const match of urls) {
    assert.equal(allowed.has(match[1]), true, match[1]);
    assert.ok(match[2] && match[3] && match[4]);
  }
  assert.match(markdown, /Do not post, send, or submit automatically\./);
  assert.doesNotMatch(markdown, /[?&]origin_(?:source|medium|campaign)=/);
});

test('measurement handoff contains exact checkpoints and funnel metrics', () => {
  const markdown = fs.readFileSync('docs/operations/2026-08-26-acquisition-measurement.md', 'utf8');
  for (const date of ['2026-09-09', '2026-09-23', '2026-10-21', '2026-11-18']) {
    assert.match(markdown, new RegExp(date));
  }
  for (const metric of ['impressions', 'clicks', 'CTR', 'average position', 'Rent Check starts', 'Rent Check results', 'follow-up actions']) {
    assert.match(markdown, new RegExp(metric, 'i'));
  }
  assert.match(markdown, /Do not invent or backfill unavailable values\./);
});
