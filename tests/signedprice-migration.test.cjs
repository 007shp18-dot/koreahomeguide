const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const {
  buildMigrationManifest,
} = require('../scripts/seo/build-signedprice-migration.cjs');
const {
  validateMigrationManifest,
  validateRenderedMigration,
} = require('../scripts/seo/validate-signedprice-migration.cjs');
const {
  renderRootSitemap,
  renderStaticSitemap,
  renderVercelConfig,
} = require('../scripts/seo/render-signedprice-migration.cjs');

test('builds deterministic active redirects only for verified exact English destinations', () => {
  const first = buildMigrationManifest({ root });
  const second = buildMigrationManifest({ root });
  assert.deepEqual(second, first);
  assert.equal(first.schemaVersion, 1);
  assert.equal(first.entries.length, 27);
  assert.equal(first.patterns.length, 40);
  assert.deepEqual(first.entries[0],
    {
      sourcePath: '/',
      targetPath: '/kr/seoul/check/',
      destination: 'https://www.signedprice.com/kr/seoul/check/',
      cohort: 3,
      locale: 'en',
      statusCode: 301,
      active: true,
      evidence: 'seoul-rent-decision-home-equivalent',
    });
  assert.ok(first.entries.some(({ sourcePath, targetPath }) => (
    sourcePath === '/explore/' && targetPath === '/kr/seoul/explore/'
  )));
  assert.ok(first.entries.some(({ sourcePath, targetPath }) => (
    sourcePath === '/guides/' && targetPath === '/kr/seoul/guide/'
  )));
  assert.ok(first.entries.some(({ sourcePath }) => (
    sourcePath === '/rent/gangnam-gu/apartment/'
  )));
  assert.ok(first.entries.some(({ sourcePath }) => (
    sourcePath === '/rent/yongsan-gu/villa/'
  )));
  assert.ok(!first.entries.some(({ sourcePath }) => (
    sourcePath === '/rent/gwanak-gu/officetel/'
  )));
  assert.ok(first.entries.every(({ sourcePath, destination, statusCode }) => (
    !sourcePath.startsWith('/zh/')
    && destination.startsWith('https://www.signedprice.com/')
    && statusCode === 301
  )));
  assert.ok(first.patterns.some(({ sourcePattern, targetPath }) => (
    sourcePattern === '/seoul/gangnam-gu/:dong/apartment/:building/'
    && targetPath === '/kr/seoul/explore/gangnam-gu/apartment/'
  )));
  assert.ok(first.patterns.some(({ sourcePattern, targetPath }) => (
    sourcePattern === '/seoul/yongsan-gu/:dong/villa/'
    && targetPath === '/kr/seoul/explore/yongsan-gu/villa/'
  )));
});

test('classifies every remaining sitemap URL as an explicit retained asset', () => {
  const manifest = buildMigrationManifest({ root });
  const retained = new Map(manifest.retained.map((entry) => [entry.sourcePath, entry.reason]));
  const sitemap = fs.readFileSync(path.join(root, 'sitemap-static.xml'), 'utf8');
  const sitemapPaths = [...sitemap.matchAll(
    /<loc>https:\/\/koreahomeguide\.com([^<]*)<\/loc>/g,
  )].map((match) => match[1] || '/');
  assert.deepEqual([...retained.keys()], [...sitemapPaths].sort());
  assert.equal(retained.get('/compare/'), 'no-equivalent-signedprice-intent-page');
  assert.equal(retained.get('/buy-or-rent/'), 'no-equivalent-english-intent-page');
  assert.equal(retained.get('/value-check/'), 'no-equivalent-signedprice-intent-page');
  assert.equal(retained.get('/net-proceeds/'), 'no-equivalent-signedprice-intent-page');
  assert.equal(retained.get('/guides/before-you-sign/'), 'guide-content-equivalent-not-published');
  assert.equal(retained.get('/rent/gwanak-gu/officetel/'), 'signedprice-publication-floor-not-met');
  assert.equal(retained.get('/zh/'), 'no-signedprice-chinese-equivalent');
});

test('rejects duplicate sources, redirect chains, Chinese entries, and generic targets', () => {
  const manifest = buildMigrationManifest({ root });
  const duplicate = {
    ...manifest,
    entries: [...manifest.entries, manifest.entries[0]],
  };
  assert.throws(() => validateMigrationManifest(duplicate), /Duplicate source path/);

  const chain = structuredClone(manifest);
  chain.entries[1].targetPath = chain.entries[3].sourcePath;
  chain.entries[1].destination = `https://www.signedprice.com${chain.entries[3].sourcePath}`;
  assert.throws(() => validateMigrationManifest(chain), /Redirect chain/);

  const chinese = structuredClone(manifest);
  chinese.entries[0].sourcePath = '/zh/explore/';
  assert.throws(() => validateMigrationManifest(chinese), /Chinese routes/);

  const generic = structuredClone(manifest);
  generic.entries[0].targetPath = '/';
  generic.entries[0].destination = 'https://www.signedprice.com/';
  assert.throws(() => validateMigrationManifest(generic), /generic SignedPrice home/);
});

test('committed manifest exactly matches the deterministic builder', () => {
  const installed = JSON.parse(fs.readFileSync(
    path.join(root, 'data/seo/signedprice-migration-manifest.json'),
    'utf8',
  ));
  assert.deepEqual(installed, buildMigrationManifest({ root }));
});

test('renders exact 301 rules without losing existing rewrites or unrelated redirects', () => {
  const manifest = buildMigrationManifest({ root });
  const config = {
    redirects: [{ source: '/old/', destination: '/kept/', statusCode: 302 }],
    rewrites: [{ source: '/api/example', destination: '/api/handler' }],
  };
  const rendered = renderVercelConfig(config, manifest);
  assert.equal(rendered.redirects.length, 68);
  assert.deepEqual(rendered.redirects[0], {
    source: '/',
    destination: 'https://www.signedprice.com/kr/seoul/check/',
    statusCode: 301,
  });
  assert.deepEqual(rendered.redirects.at(-1), config.redirects[0]);
  assert.deepEqual(rendered.rewrites, config.rewrites);
  assert.ok(rendered.redirects.every((entry) => !('permanent' in entry)));
});

test('removes migrated dynamic URL families from the legacy sitemap index', () => {
  const manifest = buildMigrationManifest({ root });
  const source = fs.readFileSync(path.join(root, 'sitemap.xml'), 'utf8');
  const rendered = renderRootSitemap(source, manifest);
  assert.doesNotMatch(rendered, /sitemaps\/seoul\/gangnam-gu\/apartment\//);
  assert.doesNotMatch(rendered, /sitemaps\/seoul\/yongsan-gu\/villa\//);
  assert.match(rendered, /sitemaps\/seoul\/gwanak-gu\/officetel\//);
  assert.match(rendered, /sitemaps\/seoul\/opportunities\/apartment\//);
});

test('removes only active English sources from the KoreaHomeGuide static sitemap', () => {
  const manifest = buildMigrationManifest({ root });
  const source = fs.readFileSync(path.join(root, 'sitemap-static.xml'), 'utf8');
  const rendered = renderStaticSitemap(source, manifest);
  for (const entry of manifest.entries) {
    assert.doesNotMatch(rendered, new RegExp(
      `<loc>https://koreahomeguide\\.com${entry.sourcePath.replaceAll('/', '\\/')}<\\/loc>`,
    ));
  }
  for (const retained of [
    '/zh/', '/compare/', '/buy-or-rent/', '/value-check/', '/net-proceeds/',
    '/zh/explore/', '/zh/tools/seoul-rent-check/', '/zh/rent/gangnam-gu/apartment/',
  ]) {
    assert.match(rendered, new RegExp(
      `<loc>https://koreahomeguide\\.com${retained.replaceAll('/', '\\/')}<\\/loc>`,
    ));
  }
});

test('committed Vercel and sitemap artifacts pass the deployed migration gate', () => {
  const manifest = buildMigrationManifest({ root });
  assert.equal(validateRenderedMigration({ root, manifest }), true);
});
