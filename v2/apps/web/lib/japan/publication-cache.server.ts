import 'server-only';
import { unstable_cache } from 'next/cache';
import { readJapanCoverage, readJapanPublication, type JapanFilters } from './repository.server';
import type { JapanScope } from './source.server';

// Cache Components are not enabled in this application. Use Next's existing
// Data Cache API rather than changing the global rendering/caching model.
// Each entry is one bounded 20-row response; scope, release and every filter
// form the key. A null/error is thrown inside the cache so it is never stored.
class UnpublishedQuarter extends Error {}
export const readCachedJapanCoverage = unstable_cache(async () => readJapanCoverage(),
  ['jp-tokyo-published-coverage-v1'], { revalidate: 60 });

const cachedPublication = unstable_cache(async (scope: JapanScope, filters: JapanFilters) => {
  const data = await readJapanPublication(scope, filters);
  if (data === null) throw new UnpublishedQuarter('quarter_not_published');
  return data;
}, ['jp-tokyo-published-transactions-v1'], { revalidate: 60 });

export async function readCachedJapanPublication(scope: JapanScope, filters: JapanFilters) {
  try { return await cachedPublication(scope, filters); }
  catch (error) {
    if (error instanceof UnpublishedQuarter) return null;
    throw error;
  }
}
