import type { MetadataRoute } from 'next';

import { publicCanonical } from '@/lib/public-metadata';
import { singaporeSnapshotRepositoryFromEnvironment } from '@/lib/singapore/snapshot-repository.server';

// Use the same verified repository and publication policy as project metadata.
// Keep the project sitemap separate from the much larger Seoul URL set.
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const repository = await singaporeSnapshotRepositoryFromEnvironment();
  if (repository === null) return [];
  const lastModified = new Date(repository.getContext().generatedAt);
  return repository.listProjectRouteParams().map(({ area, projectId }) => ({
    url: publicCanonical(`/sg/singapore/explore/${area}/${projectId}/`),
    lastModified,
  }));
}
