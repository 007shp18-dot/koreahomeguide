import 'server-only';

import { gunzipSync } from 'node:zlib';

import {
  checkedInSnapshotsAreEnabled,
} from '../snapshots/installed-snapshot-repository.server';
import {
  createKoreaEvidenceRepositoryLoader,
  koreaEvidenceRepositoriesFromEnvironment,
  type KoreaEvidenceRepositories,
} from '../public-market/korea-evidence-repositories.server';

const RENT_OBJECT_URL = 'installed://kr-rent-check-fixture';
const SALE_OBJECT_URL = 'installed://kr-sale-check-fixture';

type CheckEvidenceEnvironment = Readonly<Record<string, string | undefined>>;

let cached: Readonly<{
  registry: string;
  rent: string | undefined;
  sale: string | undefined;
  repositories: KoreaEvidenceRepositories;
}> | null = null;

function decodedArtifact(encoded: string | undefined): unknown {
  if (encoded === undefined) return undefined;
  try {
    return JSON.parse(gunzipSync(Buffer.from(encoded, 'base64')).toString('utf8'));
  } catch {
    return undefined;
  }
}

export function contractCheckEvidenceRepositoriesFromEnvironment(
  environment: CheckEvidenceEnvironment = process.env,
): KoreaEvidenceRepositories {
  const registry = environment.SIGNEDPRICE_CHECK_EVIDENCE_REGISTRY;
  if (registry === undefined) {
    return koreaEvidenceRepositoriesFromEnvironment({
      useCheckedInSnapshot: checkedInSnapshotsAreEnabled(environment),
      retainLastVerified: false,
    });
  }
  const rent = environment.SIGNEDPRICE_CHECK_RENT_EVIDENCE_ARTIFACT_GZIP_BASE64;
  const sale = environment.SIGNEDPRICE_CHECK_SALE_EVIDENCE_ARTIFACT_GZIP_BASE64;
  if (cached?.registry === registry && cached.rent === rent && cached.sale === sale) {
    return cached.repositories;
  }
  let registrySource: unknown;
  try {
    registrySource = JSON.parse(registry);
  } catch {
    registrySource = null;
  }
  const objects = new Map<string, unknown>([
    [RENT_OBJECT_URL, decodedArtifact(rent)],
    [SALE_OBJECT_URL, decodedArtifact(sale)],
  ]);
  const repositories = createKoreaEvidenceRepositoryLoader().load({
    registrySource,
    resolveObject: (objectUrl) => objects.get(objectUrl),
  });
  cached = Object.freeze({ registry, rent, sale, repositories });
  return repositories;
}
