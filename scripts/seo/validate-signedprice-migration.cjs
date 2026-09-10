const fs = require('node:fs');
const path = require('node:path');

const SIGNEDPRICE_ORIGIN = 'https://www.signedprice.com';
const canonicalPath = /^\/(?:$|[a-z0-9][a-z0-9\-/]*\/)$/;

function validateMigrationManifest(manifest) {
  if (
    !manifest
    || manifest.schemaVersion !== 1
    || !Array.isArray(manifest.entries)
    || !Array.isArray(manifest.patterns)
    || !Array.isArray(manifest.retained)
  ) {
    throw new TypeError('Invalid migration manifest schema.');
  }
  const sourcePatterns = new Set();
  for (const pattern of manifest.patterns) {
    if (
      !/^\/seoul\/[a-z0-9-]+\/:dong\/[a-z0-9-]+\/(?:\:building\/)?$/.test(pattern.sourcePattern)
      || !canonicalPath.test(pattern.targetPath)
      || pattern.destination !== `${SIGNEDPRICE_ORIGIN}${pattern.targetPath}`
      || pattern.locale !== 'en'
      || pattern.statusCode !== 301
      || pattern.active !== true
      || pattern.cohort !== 4
      || typeof pattern.evidence !== 'string'
      || pattern.evidence.length === 0
      || sourcePatterns.has(pattern.sourcePattern)
    ) {
      throw new TypeError(`Invalid active migration pattern: ${pattern.sourcePattern}`);
    }
    sourcePatterns.add(pattern.sourcePattern);
  }
  const sources = new Set();
  const targets = new Set();
  for (const entry of manifest.entries) {
    if (!canonicalPath.test(entry.sourcePath) || entry.sourcePath.includes('//')) {
      throw new TypeError(`Invalid source path: ${entry.sourcePath}`);
    }
    if (!canonicalPath.test(entry.targetPath) || entry.targetPath.includes('//')) {
      throw new TypeError(`Invalid target path: ${entry.targetPath}`);
    }
    if (sources.has(entry.sourcePath)) {
      throw new TypeError(`Duplicate source path: ${entry.sourcePath}`);
    }
    if (targets.has(entry.targetPath)) {
      throw new TypeError(`Duplicate target path: ${entry.targetPath}`);
    }
    if (entry.sourcePath.startsWith('/zh/')) {
      throw new TypeError('Chinese routes are outside the approved migration.');
    }
    if (entry.targetPath === '/') {
      throw new TypeError('Migration entry cannot target the generic SignedPrice home.');
    }
    if (entry.destination !== `${SIGNEDPRICE_ORIGIN}${entry.targetPath}`) {
      throw new TypeError(`Destination mismatch: ${entry.sourcePath}`);
    }
    if (
      entry.locale !== 'en'
      || entry.statusCode !== 301
      || entry.active !== true
      || ![1, 2, 3].includes(entry.cohort)
      || typeof entry.evidence !== 'string'
      || entry.evidence.length === 0
    ) {
      throw new TypeError(`Invalid active migration entry: ${entry.sourcePath}`);
    }
    sources.add(entry.sourcePath);
    targets.add(entry.targetPath);
  }
  for (const entry of manifest.entries) {
    if (entry.targetPath !== entry.sourcePath && sources.has(entry.targetPath)) {
      throw new TypeError(`Redirect chain: ${entry.sourcePath} -> ${entry.targetPath}`);
    }
  }
  const retained = new Set();
  for (const entry of manifest.retained) {
    if (
      !canonicalPath.test(entry.sourcePath)
      || typeof entry.reason !== 'string'
      || entry.reason.length === 0
      || retained.has(entry.sourcePath)
      || sources.has(entry.sourcePath)
    ) {
      throw new TypeError(`Invalid retained migration entry: ${entry.sourcePath}`);
    }
    retained.add(entry.sourcePath);
  }
  for (const protectedPath of [
    '/compare/', '/buy-or-rent/', '/value-check/', '/net-proceeds/', '/zh/',
  ]) {
    if (!retained.has(protectedPath)) {
      throw new TypeError(`Missing protected retained route: ${protectedPath}`);
    }
  }
  return true;
}

function validateRenderedMigration({ root, manifest }) {
  validateMigrationManifest(manifest);
  const config = JSON.parse(fs.readFileSync(path.join(root, 'vercel.json'), 'utf8'));
  const redirects = Array.isArray(config.redirects) ? config.redirects : [];
  for (const entry of [...manifest.entries, ...manifest.patterns.map((pattern) => ({
    ...pattern,
    sourcePath: pattern.sourcePattern,
  }))]) {
    const matches = redirects.filter(({ source }) => source === entry.sourcePath);
    if (matches.length !== 1) {
      throw new TypeError(`Rendered redirect count mismatch: ${entry.sourcePath}`);
    }
    const [rendered] = matches;
    if (
      rendered.destination !== entry.destination
      || rendered.statusCode !== 301
      || Object.hasOwn(rendered, 'permanent')
    ) {
      throw new TypeError(`Rendered redirect mismatch: ${entry.sourcePath}`);
    }
  }
  const sitemap = fs.readFileSync(path.join(root, 'sitemap-static.xml'), 'utf8');
  for (const entry of manifest.entries) {
    if (sitemap.includes(`<loc>https://koreahomeguide.com${entry.sourcePath}</loc>`)) {
      throw new TypeError(`Redirected source remains in sitemap: ${entry.sourcePath}`);
    }
    if (!fs.existsSync(path.join(root, entry.sourcePath, 'index.html'))) {
      throw new TypeError(`Migration source file missing: ${entry.sourcePath}`);
    }
    const chinesePath = entry.sourcePath.startsWith('/rent/')
      ? `/zh${entry.sourcePath}`
      : entry.sourcePath === '/explore/'
        ? '/zh/explore/'
        : entry.sourcePath === '/tools/seoul-rent-check/'
          ? '/zh/tools/seoul-rent-check/'
          : null;
    const chineseSourceExists = chinesePath !== null
      && fs.existsSync(path.join(root, chinesePath, 'index.html'));
    if (
      chineseSourceExists
      && !sitemap.includes(`<loc>https://koreahomeguide.com${chinesePath}</loc>`)
    ) {
      throw new TypeError(`Chinese counterpart must remain live: ${chinesePath}`);
    }
  }
  for (const retained of manifest.retained) {
    if (
      retained.sourcePath !== '/guides/'
      && fs.existsSync(path.join(root, retained.sourcePath, 'index.html'))
      && !sitemap.includes(`<loc>https://koreahomeguide.com${retained.sourcePath}</loc>`)
    ) {
      throw new TypeError(`Retained source missing from sitemap: ${retained.sourcePath}`);
    }
  }
  const retainedSources = new Set(manifest.retained.map(({ sourcePath }) => sourcePath));
  for (const match of sitemap.matchAll(/<loc>https:\/\/koreahomeguide\.com([^<]*)<\/loc>/g)) {
    const sourcePath = match[1] || '/';
    if (!retainedSources.has(sourcePath)) {
      throw new TypeError(`Unclassified sitemap source: ${sourcePath}`);
    }
  }
  const rootSitemap = fs.readFileSync(path.join(root, 'sitemap.xml'), 'utf8');
  for (const entry of manifest.entries.filter(({ sourcePath }) => sourcePath.startsWith('/rent/'))) {
    const [, , district, propertyType] = entry.sourcePath.split('/');
    const family = `https://koreahomeguide.com/sitemaps/seoul/${district}/${propertyType}/`;
    if (rootSitemap.includes(family)) {
      throw new TypeError(`Migrated dynamic sitemap remains published: ${family}`);
    }
  }
  return true;
}

if (require.main === module) {
  const root = path.resolve(__dirname, '../..');
  const manifestPath = path.join(root, 'data/seo/signedprice-migration-manifest.json');
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  validateMigrationManifest(manifest);
  validateRenderedMigration({ root, manifest });
  process.stdout.write(`Validated ${manifest.entries.length + manifest.patterns.length} rendered SignedPrice migrations\n`);
}

module.exports = { validateMigrationManifest, validateRenderedMigration };
