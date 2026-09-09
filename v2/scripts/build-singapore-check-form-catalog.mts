import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { singaporeCheckEvidenceRepositoriesFromEnvironment } from '../apps/web/lib/singapore/check-evidence-repository.server.ts';
import { buildSingaporeCheckRouteModel } from '../apps/web/lib/singapore/check-route-model.server.ts';
import { hasPublishedSingaporeCheckEvidence } from '../apps/web/lib/singapore/check-index-policy.server.ts';
import { singaporeCheckFormRegistryFingerprint, SINGAPORE_CHECK_FORM_CATALOG_VERSION } from '../apps/web/lib/singapore/check-form-catalog.server.ts';

const overrides = ['SIGNEDPRICE_SINGAPORE_CHECK_URA_ARTIFACT', 'SIGNEDPRICE_SINGAPORE_CHECK_HDB_RESALE_ARTIFACT', 'SIGNEDPRICE_SINGAPORE_CHECK_HDB_RENT_ARTIFACT'];
if (process.env.SIGNEDPRICE_INSTALLED_SNAPSHOT_REGISTRY !== undefined || process.env.SIGNEDPRICE_USE_CHECKED_IN_SNAPSHOTS === 'false' || overrides.some(name => process.env[name] !== undefined)) {
  if (process.argv.includes('--if-installed')) {
    console.info('Singapore Check form catalog generation skipped for overridden evidence.');
    process.exit(0);
  }
  throw new Error('Build the form catalog from checked-in releases without environment overrides.');
}
const registryPath = new URL('../apps/web/data/installed-snapshots.json', import.meta.url);
const target = new URL('../apps/web/data/singapore-check-form-catalog.json', import.meta.url);
const registryFingerprint = singaporeCheckFormRegistryFingerprint(JSON.parse(readFileSync(registryPath, 'utf8')));
if (registryFingerprint === null) throw new Error('All three Singapore Check release entries are required.');
const repositories = await singaporeCheckEvidenceRepositoriesFromEnvironment();
if (Object.values(repositories.availability()).some(available => !available)) throw new Error('All three Singapore Check artifacts must verify before generating the form catalog.');
const artifact = {
  version: SINGAPORE_CHECK_FORM_CATALOG_VERSION,
  registryFingerprint,
  catalogs: buildSingaporeCheckRouteModel(repositories, {}).catalogs,
  published: hasPublishedSingaporeCheckEvidence(repositories),
};
const serialized = `${JSON.stringify(artifact)}\n`;
if (process.argv.includes('--check')) {
  if (readFileSync(target, 'utf8') !== serialized) throw new Error('Singapore Check form catalog is stale. Regenerate it from the installed releases.');
  console.info('Singapore Check form catalog matches the verified releases.');
} else {
  writeFileSync(target, serialized);
  console.info(`Wrote ${Buffer.byteLength(serialized)} bytes to ${fileURLToPath(target)}`);
}
