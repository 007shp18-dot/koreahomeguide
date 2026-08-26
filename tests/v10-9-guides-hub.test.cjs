const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
function read(rel) { return fs.readFileSync(path.join(root, rel), 'utf8'); }

const guideSlugs = [
  'wolse-vs-jeonse',
  'korea-rental-contract-checklist',
  'seoul-brokerage-fees',
  'before-you-sign',
  'rent-apartment-korea-foreigner',
  'korea-rental-scams',
  'seoul-officetel-rent'
];

test('EN guides hub exists with canonical, hreflang, and all guide links', () => {
  const html = read('guides/index.html');
  assert.match(html, /<link rel="canonical" href="https:\/\/koreahomeguide\.com\/guides\/"/);
  assert.match(html, /hreflang="zh-CN" href="https:\/\/koreahomeguide\.com\/zh\/guides\/"/);
  for (const slug of guideSlugs) assert.match(html, new RegExp(`href="/guides/${slug}/"`));
});

test('ZH guides hub exists with canonical, hreflang, and all localized guide links', () => {
  const html = read('zh/guides/index.html');
  assert.match(html, /<link rel="canonical" href="https:\/\/koreahomeguide\.com\/zh\/guides\/"/);
  assert.match(html, /hreflang="en" href="https:\/\/koreahomeguide\.com\/guides\/"/);
  for (const slug of guideSlugs) assert.match(html, new RegExp(`href="/zh/guides/${slug}/"`));
});

test('Explorer navigation points Guides to the hub in both locales', () => {
  assert.match(read('explore/index.html'), /href="\/guides\/">Guides<\/a>/);
  assert.match(read('zh/explore/index.html'), /href="\/zh\/guides\/">租房指南<\/a>/);
});

test('static sitemap includes both guide hubs', () => {
  const xml = read('sitemap-static.xml');
  assert.match(xml, /https:\/\/koreahomeguide\.com\/guides\//);
  assert.match(xml, /https:\/\/koreahomeguide\.com\/zh\/guides\//);
});

test('dynamic SEO page headers normalize Guides navigation to the new hub without changing contextual guide CTAs', () => {
  const post = require('../seo/seo-html-postprocess.cjs');
  assert.equal(
    post.normalizeGuideHubLinks('<a href="/guides/wolse-vs-jeonse/">Guides</a><a href="/guides/before-you-sign/">Before</a>', 'en'),
    '<a href="/guides/">Guides</a><a href="/guides/before-you-sign/">Before</a>'
  );
  assert.equal(
    post.normalizeGuideHubLinks('<a href="/zh/guides/wolse-vs-jeonse/">指南</a><a href="/zh/guides/before-you-sign/">签约前</a>', 'zh'),
    '<a href="/zh/guides/">指南</a><a href="/zh/guides/before-you-sign/">签约前</a>'
  );
  for (const file of ['api/seo-dong-page.js','api/seo-building-page.js']) {
    assert.match(read(file), /normalizeGuideHubLinks/);
  }
});
