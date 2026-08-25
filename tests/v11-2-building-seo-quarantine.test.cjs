const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

function source(rel) {
  return fs.readFileSync(path.join(__dirname, '..', rel), 'utf8');
}

test('building SEO pages are marked noindex while remaining user-accessible', () => {
  const text = source('api/seo-building-page.js');
  assert.match(text, /noindex,follow/);
  assert.match(text, /X-Robots-Tag/);
  assert.match(text, /cache:true/);
});

test('dynamic market sitemaps publish Dong URLs only', () => {
  const text = source('api/sitemap-market.js');
  assert.match(text, /buildDongSeoUrl/);
  assert.doesNotMatch(text, /buildBuildingSeoUrl/);
  assert.doesNotMatch(text, /provider\.getBuildings/);
});

test('Dong pages keep building links clickable but tell crawlers not to follow them', () => {
  const text = source('api/seo-dong-page.js');
  assert.match(text, /nofollowBuildingLinks/);
  assert.match(text, /rel="nofollow"/);
});

test('Dong and Building successful pages keep 24-hour CDN caching', () => {
  for (const file of ['api/seo-dong-page.js', 'api/seo-building-page.js']) {
    const text = source(file);
    assert.match(text, /s-maxage=86400, stale-while-revalidate=86400/);
  }
});
