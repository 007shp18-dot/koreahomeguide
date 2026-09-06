import type { NewsWorkspaceModel } from './news-workspace-model';

/** One request per browser session at a time; reused across News filters/navigation. */
export function createHeadlineResource(fetcher: typeof fetch = fetch, now = Date.now) {
  let cached: NewsWorkspaceModel | null = null;
  let expires = 0;
  let pending: Promise<NewsWorkspaceModel> | null = null;
  return {
    peek: () => cached,
    load(force = false): Promise<NewsWorkspaceModel> {
      if (pending !== null) return pending;
      if (!force && cached !== null && now() < expires) return Promise.resolve(cached);
      pending = fetcher('/api/news/').then(async (response) => {
        if (!response.ok) throw new Error('Headlines unavailable');
        const model = await response.json() as NewsWorkspaceModel;
        if (!Array.isArray(model.items)) throw new Error('Invalid headlines');
        cached = model;
        expires = now() + 15 * 60 * 1000;
        return model;
      }).finally(() => { pending = null; });
      return pending;
    },
  };
}
export const headlineResource = createHeadlineResource();
