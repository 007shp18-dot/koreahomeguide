const fs = require('node:fs');
const path = require('node:path');

const SIGNEDPRICE_ORIGIN = 'https://www.signedprice.com';
const KOREAHOMEGUIDE_ORIGIN = 'https://koreahomeguide.com';

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function renderVercelConfig(config, manifest) {
  const existing = Array.isArray(config.redirects) ? config.redirects : [];
  const unrelated = existing.filter(({ destination }) => (
    typeof destination !== 'string' || !destination.startsWith(SIGNEDPRICE_ORIGIN)
  ));
  const redirects = manifest.entries.map((entry) => ({
    source: entry.sourcePath,
    destination: entry.destination,
    statusCode: entry.statusCode,
  }));
  const { redirects: _ignored, ...rest } = config;
  return { redirects: [...redirects, ...unrelated], ...rest };
}

function renderStaticSitemap(xml, manifest) {
  let rendered = xml;
  for (const entry of manifest.entries) {
    const url = `${KOREAHOMEGUIDE_ORIGIN}${entry.sourcePath}`;
    const block = new RegExp(
      `\\s*<url>\\s*<loc>${escapeRegExp(url)}<\\/loc>[\\s\\S]*?<\\/url>\\s*`,
      'g',
    );
    rendered = rendered.replace(block, '\n');
  }
  return `${rendered.trimEnd()}\n`;
}

function renderMigrationArtifacts({ root }) {
  const manifest = JSON.parse(fs.readFileSync(
    path.join(root, 'data/seo/signedprice-migration-manifest.json'),
    'utf8',
  ));
  const vercelPath = path.join(root, 'vercel.json');
  const sitemapPath = path.join(root, 'sitemap-static.xml');
  const vercel = JSON.parse(fs.readFileSync(vercelPath, 'utf8'));
  const sitemap = fs.readFileSync(sitemapPath, 'utf8');
  const renderedVercel = renderVercelConfig(vercel, manifest);
  const renderedSitemap = renderStaticSitemap(sitemap, manifest);
  fs.writeFileSync(vercelPath, `${JSON.stringify(renderedVercel, null, 2)}\n`);
  fs.writeFileSync(sitemapPath, renderedSitemap);
  return { redirectCount: manifest.entries.length };
}

if (require.main === module) {
  const root = path.resolve(__dirname, '../..');
  const result = renderMigrationArtifacts({ root });
  process.stdout.write(`Rendered ${result.redirectCount} SignedPrice 301 redirects and sitemap exclusions\n`);
}

module.exports = {
  renderMigrationArtifacts,
  renderStaticSitemap,
  renderVercelConfig,
};
