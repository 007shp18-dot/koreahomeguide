import type { MetadataRoute } from 'next';

import { publicCanonical } from '@/lib/public-metadata';
import { singaporeCheckEvidenceRepositoriesFromEnvironment, type SingaporeCheckEvidenceRepositories } from '@/lib/singapore/check-evidence-repository.server';
import { hasPublishedSingaporeCheckEvidence } from '@/lib/singapore/check-index-policy.server';
import { listPublishedHdbRouteParams } from '@/lib/singapore/hdb-index-policy.server';
import { hdbSnapshotRepositoryFromEnvironment, type HdbSnapshotRepository } from '@/lib/singapore/hdb-snapshot-repository.server';
import { singaporeSnapshotRepositoryFromEnvironment, type SingaporeSnapshotRepository } from '@/lib/singapore/snapshot-repository.server';

type SitemapEntry = MetadataRoute.Sitemap[number];

function localizedEntries(enPath: `/${string}`, koPath: `/${string}`, lastModified?: Date): readonly SitemapEntry[] {
  const en = publicCanonical(enPath);
  const ko = publicCanonical(koPath);
  const zh = publicCanonical(`/zh-cn${enPath}`);
  const alternates = { languages: { en, ko, 'zh-Hans': zh, 'x-default': en } };
  return [
    { url: en, ...(lastModified === undefined ? {} : { lastModified }), alternates },
    { url: ko, ...(lastModified === undefined ? {} : { lastModified }), alternates },
    { url: zh, ...(lastModified === undefined ? {} : { lastModified }), alternates },
  ];
}

export function buildSingaporeSitemap({
  privateRepository,
  hdbRepository,
  checkRepositories,
}: Readonly<{
  privateRepository: SingaporeSnapshotRepository | null;
  hdbRepository: HdbSnapshotRepository | null;
  checkRepositories: SingaporeCheckEvidenceRepositories | null;
}>): MetadataRoute.Sitemap {
  const entries: MetadataRoute.Sitemap = [];
  if (privateRepository !== null) {
    const lastModified = new Date(privateRepository.getContext().generatedAt);
    entries.push(...privateRepository.listProjectRouteParams().flatMap(({ area, projectId }) => (
      localizedEntries(
        `/sg/singapore/explore/${area}/${projectId}/`,
        `/ko/sg/singapore/explore/${area}/${projectId}/`,
        lastModified,
      )
    )));
  }
  if (hdbRepository !== null) {
    const lastModified = new Date(hdbRepository.getContext().generatedAt);
    const published = listPublishedHdbRouteParams(hdbRepository);
    entries.push(...published.towns.flatMap(({ town }) => localizedEntries(
      `/sg/singapore/hdb/${town}/`,
      `/ko/sg/singapore/hdb/${town}/`,
      lastModified,
    )));
    entries.push(...published.blocks.flatMap(({ town, blockId }) => localizedEntries(
      `/sg/singapore/hdb/${town}/${blockId}/`,
      `/ko/sg/singapore/hdb/${town}/${blockId}/`,
      lastModified,
    )));
  }
  if (hasPublishedSingaporeCheckEvidence(checkRepositories)) {
    const generatedAt = checkRepositories === null ? [] : [
      checkRepositories.get('ura-private-sale')?.generatedAt,
      checkRepositories.get('hdb-resale')?.generatedAt,
      checkRepositories.get('hdb-rent')?.generatedAt,
    ].filter((value): value is string => value !== undefined);
    const latest = generatedAt.sort((left, right) => right.localeCompare(left))[0];
    entries.push(...localizedEntries(
      '/sg/singapore/check/',
      '/ko/sg/singapore/check/',
      latest === undefined ? undefined : new Date(latest),
    ));
  }
  return entries;
}

// Use the same verified repository and publication policy as project metadata.
// Keep the project sitemap separate from the much larger Seoul URL set.
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [privateResult, hdbResult, checkResult] = await Promise.allSettled([
    singaporeSnapshotRepositoryFromEnvironment(),
    Promise.resolve().then(() => hdbSnapshotRepositoryFromEnvironment()),
    singaporeCheckEvidenceRepositoriesFromEnvironment(),
  ]);
  return buildSingaporeSitemap({
    privateRepository: privateResult.status === 'fulfilled' ? privateResult.value : null,
    hdbRepository: hdbResult.status === 'fulfilled' ? hdbResult.value : null,
    checkRepositories: checkResult.status === 'fulfilled' ? checkResult.value : null,
  });
}
