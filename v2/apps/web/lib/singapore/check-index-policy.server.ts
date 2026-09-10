import 'server-only';

import {
  SINGAPORE_CHECK_MARKETS,
  SINGAPORE_CHECK_PUBLICATION_MINIMUM,
} from '@signedprice/singapore-property';
import type { SingaporeCheckEvidenceRepositories } from './check-evidence-repository.server';
import type { SingaporeCheckQuery } from './check-route-model.server';

export function hasPublishedSingaporeCheckEvidence(
  repositories: SingaporeCheckEvidenceRepositories | null,
): boolean {
  return repositories !== null && SINGAPORE_CHECK_MARKETS.some((market) => {
    const artifact = repositories.get(market);
    if (artifact === null || artifact.recordCount < SINGAPORE_CHECK_PUBLICATION_MINIMUM) return false;
    const cohorts = new Map<string, number>();
    for (const record of artifact.records) {
      const key = record.market === 'ura-private-sale'
        ? `${record.marketSegment}\0${record.district}\0${record.propertyType}`
        : `${record.town}\0${record.flatType}`;
      const count = (cohorts.get(key) ?? 0) + 1;
      if (count >= SINGAPORE_CHECK_PUBLICATION_MINIMUM) return true;
      cohorts.set(key, count);
    }
    return false;
  });
}

export function isSingaporeCheckLandingIndexable(
  repositories: SingaporeCheckEvidenceRepositories | null,
  query: SingaporeCheckQuery,
): boolean {
  return Object.keys(query).length === 0 && hasPublishedSingaporeCheckEvidence(repositories);
}
