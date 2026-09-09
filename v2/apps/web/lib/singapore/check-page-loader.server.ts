import 'server-only';

import { singaporeCheckEvidenceRepositoriesFromEnvironment } from './check-evidence-repository.server';
import { loadSingaporeCheckFormCatalog } from './check-form-catalog.server';
import { isSingaporeCheckLandingIndexable } from './check-index-policy.server';
import {
  buildSingaporeCheckRouteModel,
  singaporeCheckMarketsForQuery,
  type SingaporeCheckQuery,
} from './check-route-model.server';

export async function loadSingaporeCheckPageModel(query: SingaporeCheckQuery) {
  const prepared = loadSingaporeCheckFormCatalog();
  // Overrides and a changed release fall back to the existing verified loader.
  // The prepared catalog only supplies form choices, never calculation evidence.
  const repositories = await singaporeCheckEvidenceRepositoriesFromEnvironment(
    prepared === null ? undefined : singaporeCheckMarketsForQuery(query),
  );
  return buildSingaporeCheckRouteModel(repositories, query, prepared?.catalogs);
}

export async function singaporeCheckPageIsIndexable(query: SingaporeCheckQuery): Promise<boolean> {
  if (Object.keys(query).length > 0) return false;
  const prepared = loadSingaporeCheckFormCatalog();
  if (prepared !== null) return prepared.published;
  try {
    return isSingaporeCheckLandingIndexable(await singaporeCheckEvidenceRepositoriesFromEnvironment(), query);
  } catch {
    return false;
  }
}
