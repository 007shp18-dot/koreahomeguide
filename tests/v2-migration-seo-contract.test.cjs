'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {
  collectSeoContracts,
  contractFromHtml,
  isIndexableRobots
} = require('../scripts/v2-migration/collect-seo-contracts.cjs');

const routes = JSON.parse(fs.readFileSync(
  path.join(process.cwd(), 'artifacts/v2-migration/legacy-static-routes.json'),
  'utf8',
));

test('every indexable route has one canonical and non-empty title', () => {
  const contracts = collectSeoContracts(process.cwd(), routes);
  for (const page of contracts.filter((item) => isIndexableRobots(item.robots))) {
    assert.match(page.canonical, /^https:\/\/koreahomeguide\.com\//);
    assert.equal(page.title.trim().length > 0, true);
  }
});

test('preserves the complete robots directive while noindex remains token-detectable', () => {
  const page = contractFromHtml({
    path:'/fixture/',
    rootDir:process.cwd(),
    html:'<meta name="robots" content="noindex,follow,noarchive">'
  });
  assert.equal(page.robots, 'noindex,follow,noarchive');
  assert.equal(page.robots.split(/[\s,]+/).includes('noindex'), true);
});

test('dynamic templates record their applicable child sitemap and implementation source', () => {
  const contracts = collectSeoContracts(process.cwd(), routes);
  const sourceFor = template => contracts.find(item => item.path === template).sitemapSources;
  assert.deepEqual(sourceFor('/seoul/:district/:dong/:type/'), [
    '/sitemaps/seoul/mapo-gu/apartment/',
    'api/sitemap-market.js'
  ]);
  assert.deepEqual(sourceFor('/seoul/:district/:dong/:type/:building/'), [
    '/sitemaps/seoul/mapo-gu/apartment/buildings/',
    'api/sitemap-market.js'
  ]);
  assert.deepEqual(sourceFor('/seoul/:type/:slug/'), [
    '/sitemaps/seoul/opportunities/apartment/',
    'api/sitemap-market.js'
  ]);
  assert.deepEqual(sourceFor('/seoul/deposit/:slug/'), [
    '/sitemaps/seoul/opportunities/officetel/',
    'api/sitemap-market.js'
  ]);
  assert.equal(sourceFor('/seoul/:district/:dong/:type/').includes('sitemap.xml'), false);
});
