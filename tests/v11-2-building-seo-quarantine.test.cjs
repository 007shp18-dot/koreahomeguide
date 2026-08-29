const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

// The v11.2 quarantine put every building page behind noindex,nofollow and cut
// them out of the sitemap. The quarantine is lifted; what survives it is the
// stability contract it was built to protect. These tests guard that contract,
// not the quarantine.

function source(rel) {
  return fs.readFileSync(path.join(__dirname, '..', rel), 'utf8');
}

test('building responses are only offered to search deliberately, never by default', () => {
  const text = source('api/seo-building-page.js');
  // The default for every response is still noindex; index,follow has to be
  // asked for, and only the 200 path asks.
  assert.match(text, /robots = 'noindex,follow'/);
  assert.match(text, /X-Robots-Tag/);
  const indexable = text.match(/robots:'index,follow'/g) || [];
  assert.equal(indexable.length, 1, 'exactly one response may be marked indexable');
});

test('an indexable building page is cached at the CDN for a day', () => {
  const text = source('api/seo-building-page.js');
  assert.match(text, /cache:true/);
  for (const file of ['api/seo-dong-page.js', 'api/seo-building-page.js']) {
    assert.match(source(file), /s-maxage=86400, stale-while-revalidate=86400/);
  }
});

test('the publishing floor is a named constant, not a number buried in a branch', () => {
  const text = source('seo/seo-page-renderer.cjs');
  assert.match(text, /BUILDING_INDEX_MIN_CONTRACTS\s*=\s*\d+/);
  assert.match(text, /BUILDING_INDEX_MIN_RENT_CONTRACTS\s*=\s*\d+/);
  const { BUILDING_INDEX_MIN_CONTRACTS, BUILDING_INDEX_MIN_RENT_CONTRACTS } = require('../seo/seo-page-renderer.cjs');
  assert.ok(BUILDING_INDEX_MIN_CONTRACTS >= 10, 'a floor below 10 contracts publishes noise');
  assert.ok(BUILDING_INDEX_MIN_RENT_CONTRACTS >= 1);
});

test('Dong pages link to a building page only when that page is publishable', () => {
  const text = source('api/seo-dong-page.js');
  // The blanket second pass that rewrote every building link as nofollow is
  // gone; the renderer now decides per building.
  assert.doesNotMatch(text, /nofollowBuildingLinks/);

  const renderer = source('seo/seo-page-renderer.cjs');
  assert.match(renderer, /isBuildingIndexable\(item\)/);
  assert.match(renderer, /buildBuildingSeoUrl/);
  // Buildings below the floor still get a clickable Explorer link, still nofollow.
  assert.match(renderer, /rel="nofollow"/);
});

test('dynamic market sitemaps publish buildings without a second upstream fetch', () => {
  const text = source('api/sitemap-market.js');
  assert.match(text, /buildDongSeoUrl/);
  assert.match(text, /buildBuildingSeoUrl/);
  // api/ sits at the 11-function Hobby ceiling, so building URLs fold into this
  // endpoint rather than gain their own. That is affordable only because the
  // provider caches the district's rows: one districtwide aggregation, never a
  // getBuildings call per Dong.
  assert.match(text, /getBuildings\(\{ areaCode, propertyType, dong:'', months:6 \}\)/);
  const calls = text.match(/\.getBuildings\(/g) || [];
  assert.equal(calls.length, 1, 'exactly one districtwide building aggregation per request');
  assert.doesNotMatch(text, /for \(const \w+ of eligibleDongs\)[\s\S]{0,200}getBuildings/);
});

test('the sitemap never outlives its own publishing floor', () => {
  // If the floor moves, the sitemap must move with it — one shared predicate,
  // not a number copied into the sitemap.
  const text = source('api/sitemap-market.js');
  assert.match(text, /isBuildingIndexable/);
  assert.doesNotMatch(text, /contractCount\s*[<>]=?\s*\d/);
});
