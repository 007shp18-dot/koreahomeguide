'use strict';

const fs = require('node:fs');
const path = require('node:path');

const HISTORICAL_SUMMARY = Object.freeze({
  tests:887,
  pass:864,
  fail:23,
  cancelled:0,
  skipped:0,
  todo:0
});

const CURRENT_SUMMARY = Object.freeze({
  tests:898,
  pass:875,
  fail:23,
  cancelled:0,
  skipped:0,
  todo:0
});

const KNOWN_FAILURES = Object.freeze([
  ['tests/analytics-pages.test.cjs', 'every new indexable Phase 1 page defers GA4 to the shared analytics loader'],
  ['tests/building-seo-publishing-floor.test.cjs', 'a building above the publishing floor is served and offered to search'],
  ['tests/building-seo-publishing-floor.test.cjs', 'a building below the publishing floor is 404, not 410 — it was never published'],
  ['tests/building-seo-publishing-floor.test.cjs', 'the hash suffix is the identity: a stale readable half 301s to the canonical URL'],
  ['tests/building-seo-publishing-floor.test.cjs', 'the canonical URL itself does not redirect'],
  ['tests/building-seo-publishing-floor.test.cjs', 'a redirect keeps the Chinese path prefix'],
  ['tests/building-seo-publishing-floor.test.cjs', 'an unconfigured service key answers 503, never a half-built page'],
  ['tests/building-seo-publishing-floor.test.cjs', 'an upstream failure answers 503 and is never cached as a 200'],
  ['tests/currency-defaults.test.cjs', 'every currency-enabled page renders KRW first and loads persistent preference support'],
  ['tests/seo-discovery.test.cjs', 'homepage and sitemap expose guide hubs, expanded market pages, and Rent Explorer'],
  ['tests/seo-endpoints.test.cjs', 'Dong SEO endpoint returns localized HTML with cache headers'],
  ['tests/seo-endpoints.test.cjs', 'Building SEO endpoint 404s a building whose sample is too thin to publish'],
  ['tests/seo-endpoints.test.cjs', 'vercel rewrites map EN/ZH Dong and building paths to two shared HTML endpoints'],
  ['tests/seo-page-renderer.test.cjs', 'English Dong HTML has canonical, hreflang, index metadata, Dataset JSON-LD and nofollow Explorer building links'],
  ['tests/seo-page-renderer.test.cjs', 'Chinese Dong HTML is genuinely localized and keeps KRW primary'],
  ['tests/seo-page-renderer.test.cjs', 'a thin building sample is not published'],
  ['tests/seo-page-renderer.test.cjs', 'a building above the publishing floor is published'],
  ['tests/seo-page-renderer.test.cjs', 'a below-floor building page still renders in full, but noindex'],
  ['tests/v10-6-dynamic-sitemap.test.cjs', 'root sitemap is an index with static pages plus 10 districts x 3 proven property-type child sitemaps'],
  ['tests/v10-6-dynamic-sitemap.test.cjs', 'vercel exposes one shared child-sitemap endpoint without adding static HTML files'],
  ['tests/v11-2-building-seo-quarantine.test.cjs', 'the publishing floor is a named constant, not a number buried in a branch'],
  ['tests/v11-2-building-seo-quarantine.test.cjs', 'Dong pages link to a building page only when that page is publishable'],
  ['tests/v11-2-building-seo-quarantine.test.cjs', 'dynamic market sitemaps publish buildings without a second upstream fetch']
]);

function sortFailures(failures) {
  return [...failures]
    .map((failure) => ({ file:failure.file, title:failure.title }))
    .sort((left, right) => (
      left.file.localeCompare(right.file) || left.title.localeCompare(right.title)
    ));
}

function buildLegacyTestFailureManifest() {
  return {
    schemaVersion:1,
    historicalSummary:{ ...HISTORICAL_SUMMARY },
    currentSummary:{ ...CURRENT_SUMMARY },
    failures:sortFailures(KNOWN_FAILURES.map(([file, title]) => ({ file, title })))
  };
}

function writeJson(outputFile, value) {
  const outputPath = path.resolve(outputFile);
  fs.mkdirSync(path.dirname(outputPath), { recursive:true });
  fs.writeFileSync(outputPath, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

if (require.main === module) {
  const writeIndex = process.argv.indexOf('--write');
  if (writeIndex === -1 || !process.argv[writeIndex + 1]) {
    process.stdout.write(`${JSON.stringify(buildLegacyTestFailureManifest(), null, 2)}\n`);
  } else {
    writeJson(process.argv[writeIndex + 1], buildLegacyTestFailureManifest());
  }
}

module.exports = {
  CURRENT_SUMMARY,
  HISTORICAL_SUMMARY,
  buildLegacyTestFailureManifest,
  sortFailures,
  writeJson
};
