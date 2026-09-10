import 'server-only';
import { activeSingaporePublication, singaporePublicationRightsRevoked, type SingaporePublication } from './publication.server';

import { singaporeCheckEvidenceRepositoriesFromEnvironment } from './check-evidence-repository.server';
import { loadSingaporeCheckFormCatalog, type SingaporeCheckFormCatalog } from './check-form-catalog.server';
import { isSingaporeCheckLandingIndexable } from './check-index-policy.server';
import {
  buildSingaporeCheckRouteModel,
  singaporeCheckMarketsForQuery,
  type SingaporeCheckQuery,
} from './check-route-model.server';

const publicationCatalogs = new WeakMap<SingaporePublication, SingaporeCheckFormCatalog['catalogs']['ura-private-sale']>();

/** Form choices must not expand the three full transaction archives on a cold request. */
export async function loadActiveSingaporeCheckFormCatalog(): Promise<SingaporeCheckFormCatalog | null> {
  const prepared = loadSingaporeCheckFormCatalog();
  if (prepared === null) return null;
  const publication = await activeSingaporePublication();
  if (singaporePublicationRightsRevoked()) return {
    ...prepared,
    catalogs: { ...prepared.catalogs, 'ura-private-sale': { ...prepared.catalogs['ura-private-sale'], available: false, projects: [] } },
  };
  if (publication === null) return prepared;
  let privateCatalog = publicationCatalogs.get(publication);
  if (!privateCatalog) {
    // The active release is already verified. Derive only its small form index;
    // HDB choices remain bound to their installed release fingerprints.
    const repositories = {
      get: (market: string) => market === 'ura-private-sale' ? publication.check : null,
      availability: () => ({ 'ura-private-sale': true, 'hdb-resale': false, 'hdb-rent': false }),
    } as Parameters<typeof buildSingaporeCheckRouteModel>[0];
    privateCatalog = buildSingaporeCheckRouteModel(repositories, {}).catalogs['ura-private-sale'];
    publicationCatalogs.set(publication, privateCatalog);
  }
  return { ...prepared, catalogs: { ...prepared.catalogs, 'ura-private-sale': privateCatalog } };
}

export async function loadSingaporeCheckPageModel(query: SingaporeCheckQuery) {
  const prepared = await loadActiveSingaporeCheckFormCatalog();
  // Overrides and a changed release fall back to the existing verified loader.
  // The prepared catalog only supplies form choices, never calculation evidence.
  const repositories = await singaporeCheckEvidenceRepositoriesFromEnvironment(
    prepared === null ? undefined : singaporeCheckMarketsForQuery(query),
  );
  return buildSingaporeCheckRouteModel(repositories, query, prepared?.catalogs);
}

export async function singaporeCheckPageIsIndexable(query: SingaporeCheckQuery): Promise<boolean> {
  if (Object.keys(query).length > 0) return false;
  const prepared = await loadActiveSingaporeCheckFormCatalog();
  if (prepared !== null) return prepared.published;
  try {
    return isSingaporeCheckLandingIndexable(await singaporeCheckEvidenceRepositoriesFromEnvironment(), query);
  } catch {
    return false;
  }
}
