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
  const entries = [
    exactEntry({
      sourcePath: '/explore/',
      targetPath: '/kr/seoul/explore/',
      cohort: 1,
      evidence: 'cohort-0-target-ready',
    }),
    exactEntry({
      sourcePath: '/tools/seoul-rent-check/',
      targetPath: '/kr/seoul/check/',
      cohort: 1,
      evidence: 'cohort-0-target-ready',
    }),
    ...readyPropertyTypeSources(root, artifact).map(([sourcePath, evidence]) => {
      const [, , district, propertyType] = sourcePath.split('/');
      return exactEntry({
        sourcePath,
        targetPath: `/kr/seoul/explore/${district}/${propertyType}/`,
        cohort: 2,
        evidence: `retained-building-artifact:${evidence.retainedContracts}-contracts`,
      });
    }),
  ];
  return {
    schemaVersion: 1,
    generatedAt: artifact.generatedAt,
    generatedFrom: {
      artifactVersion: artifact.artifactVersion,
      artifactSha256: artifact.sha256,
      period: artifact.provenance?.period,
    },
    entries,
    retained: [
      { sourcePath: '/', reason: 'cohort-5-disabled' },
      { sourcePath: '/guides/', reason: 'guide-discovery-parity-pending' },
      { sourcePath: '/compare/', reason: 'no-equivalent-signedprice-intent-page' },
      { sourcePath: '/buy-or-rent/', reason: 'no-equivalent-signedprice-intent-page' },
      { sourcePath: '/value-check/', reason: 'no-equivalent-signedprice-intent-page' },
      { sourcePath: '/net-proceeds/', reason: 'no-equivalent-signedprice-intent-page' },
      { sourcePath: '/zh/', reason: 'chinese-migration-not-approved' },
    ],
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
  writeMigrationManifest,
};
