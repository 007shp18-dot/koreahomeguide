const fs = require('node:fs');
const path = require('node:path');

const SIGNEDPRICE_ORIGIN = 'https://www.signedprice.com';
const publicTypeBySource = Object.freeze({
  apartment: 'apartment',
  officetel: 'officetel',
  villa_multifamily: 'villa',
});

function exactEntry({ sourcePath, targetPath, cohort, evidence }) {
  return {
    sourcePath,
    targetPath,
    destination: `${SIGNEDPRICE_ORIGIN}${targetPath}`,
    cohort,
    locale: 'en',
    statusCode: 301,
    active: true,
    evidence,
  };
}

function patternEntry({ sourcePattern, targetPath, evidence }) {
  return {
    sourcePattern,
    targetPath,
    destination: `${SIGNEDPRICE_ORIGIN}${targetPath}`,
    cohort: 4,
    locale: 'en',
    statusCode: 301,
    active: true,
    evidence,
  };
}

function readyPropertyTypeSources(root, artifact) {
  const grouped = new Map();
  for (const record of artifact.records) {
    const propertyType = publicTypeBySource[record.housingType];
    if (!propertyType || record.groups?.all?.published !== true) continue;
    const sourcePath = `/rent/${record.districtSlug}/${propertyType}/`;
    const current = grouped.get(sourcePath) || {
      retainedContracts: 0,
      publicationMinimum: 0,
    };
    current.retainedContracts += Array.isArray(record.recentContracts)
      ? record.recentContracts.length
      : 0;
    current.publicationMinimum = Math.max(
      current.publicationMinimum,
      Number(record.publicationMinimum) || 0,
    );
    grouped.set(sourcePath, current);
  }
  return [...grouped.entries()]
    .filter(([sourcePath, evidence]) => (
      evidence.publicationMinimum > 0
      && evidence.retainedContracts >= evidence.publicationMinimum
      && fs.existsSync(path.join(root, sourcePath, 'index.html'))
    ))
    .sort(([left], [right]) => left.localeCompare(right));
}

function retainedReason(sourcePath) {
  if (sourcePath.startsWith('/zh/')) return 'no-signedprice-chinese-equivalent';
  if (sourcePath.startsWith('/guides/')) return 'guide-content-equivalent-not-published';
  if (sourcePath.startsWith('/rent/')) return 'signedprice-publication-floor-not-met';
  return ({
    '/compare/': 'no-equivalent-signedprice-intent-page',
    '/buy-or-rent/': 'no-equivalent-english-intent-page',
    '/value-check/': 'no-equivalent-signedprice-intent-page',
    '/net-proceeds/': 'no-equivalent-signedprice-intent-page',
    '/tools/brokerage-fee-calculator/': 'calculator-equivalent-not-published',
    '/tools/salary-to-housing/': 'calculator-equivalent-not-published',
  })[sourcePath] ?? 'no-verified-signedprice-equivalent';
}

function retainedSitemapSources(root, activeSources) {
  const sitemap = fs.readFileSync(path.join(root, 'sitemap-static.xml'), 'utf8');
  return [...sitemap.matchAll(/<loc>https:\/\/koreahomeguide\.com([^<]*)<\/loc>/g)]
    .map((match) => match[1] || '/')
    .filter((sourcePath) => !activeSources.has(sourcePath))
    .sort((left, right) => left.localeCompare(right))
    .map((sourcePath) => ({ sourcePath, reason: retainedReason(sourcePath) }));
}

function buildMigrationManifest({ root }) {
  const artifactPath = path.join(root, 'v2/apps/web/data/public-building-summary.json');
  const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));
  if (
    artifact.artifactVersion !== 'signedprice-public-building-summary-v2'
    || !Array.isArray(artifact.records)
    || typeof artifact.sha256 !== 'string'
    || typeof artifact.generatedAt !== 'string'
  ) {
    throw new TypeError('Invalid SignedPrice building artifact for migration.');
  }
  const readySources = readyPropertyTypeSources(root, artifact);
  const entries = [
    exactEntry({
      sourcePath: '/',
      targetPath: '/kr/seoul/check/',
      cohort: 3,
      evidence: 'seoul-rent-decision-home-equivalent',
    }),
    exactEntry({
      sourcePath: '/about/',
      targetPath: '/trust/',
      cohort: 3,
      evidence: 'method-and-limitations-equivalent',
    }),
    exactEntry({
      sourcePath: '/community/',
      targetPath: '/community/',
      cohort: 3,
      evidence: 'indexable-community-equivalent',
    }),
    exactEntry({
      sourcePath: '/explore/',
      targetPath: '/kr/seoul/explore/',
      cohort: 3,
      evidence: 'seoul-explorer-equivalent',
    }),
    exactEntry({
      sourcePath: '/guides/',
      targetPath: '/guides/',
      cohort: 3,
      evidence: 'global-guide-hub-canonical',
    }),
    exactEntry({
      sourcePath: '/privacy/',
      targetPath: '/privacy/',
      cohort: 3,
      evidence: 'signedprice-privacy-equivalent',
    }),
    exactEntry({
      sourcePath: '/tools/seoul-rent-check/',
      targetPath: '/kr/seoul/tools/rent-check/',
      cohort: 1,
      evidence: 'working-rent-check-target',
    }),
    ...readySources.map(([sourcePath, evidence]) => {
      const [, , district, propertyType] = sourcePath.split('/');
      return exactEntry({
        sourcePath,
        targetPath: `/kr/seoul/explore/${district}/${propertyType}/`,
        cohort: 2,
        evidence: `retained-building-artifact:${evidence.retainedContracts}-contracts`,
      });
    }),
  ];
  const patterns = readySources.flatMap(([sourcePath, evidence]) => {
    const [, , district, propertyType] = sourcePath.split('/');
    const targetPath = `/kr/seoul/explore/${district}/${propertyType}/`;
    return [
      patternEntry({
        sourcePattern: `/seoul/${district}/:dong/${propertyType}/:building/`,
        targetPath,
        evidence: `legacy-building-family:${evidence.retainedContracts}-contracts`,
      }),
      patternEntry({
        sourcePattern: `/seoul/${district}/:dong/${propertyType}/`,
        targetPath,
        evidence: `legacy-neighborhood-family:${evidence.retainedContracts}-contracts`,
      }),
    ];
  });
  const activeSources = new Set(entries.map(({ sourcePath }) => sourcePath));
  return {
    schemaVersion: 1,
    generatedAt: artifact.generatedAt,
    generatedFrom: {
      artifactVersion: artifact.artifactVersion,
      artifactSha256: artifact.sha256,
      period: artifact.provenance?.period,
    },
    entries,
    patterns,
    retained: retainedSitemapSources(root, activeSources),
  };
}

function writeMigrationManifest({ root }) {
  const manifest = buildMigrationManifest({ root });
  const outputPath = path.join(root, 'data/seo/signedprice-migration-manifest.json');
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, `${JSON.stringify(manifest, null, 2)}\n`);
  return { manifest, outputPath };
}

if (require.main === module) {
  const root = path.resolve(__dirname, '../..');
  const { manifest, outputPath } = writeMigrationManifest({ root });
  process.stdout.write(
    `Wrote ${manifest.entries.length} active SignedPrice migrations to ${path.relative(root, outputPath)}\n`,
  );
}

module.exports = {
  buildMigrationManifest,
  readyPropertyTypeSources,
  retainedSitemapSources,
  writeMigrationManifest,
};
