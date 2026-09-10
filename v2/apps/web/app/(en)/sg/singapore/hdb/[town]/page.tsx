import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { HdbTownDetail } from '@/components/singapore/hdb-town-detail';
import { indexableMetadata } from '@/lib/public-metadata';
import { isPublishedHdbTown } from '@/lib/singapore/hdb-index-policy.server';
import { buildHdbTownModel } from '@/lib/singapore/hdb-route-model.server';
import { hdbSnapshotRepositoryFromEnvironment } from '@/lib/singapore/hdb-snapshot-repository.server';

export const dynamicParams = true;
export async function generateMetadata({ params }: Readonly<{ params: Promise<{ town: string }> }>): Promise<Metadata> {
  const { town } = await params;
  const repository = hdbSnapshotRepositoryFromEnvironment();
  const model = repository === null ? null : buildHdbTownModel(repository, town);
  if (repository === null || model === null || !isPublishedHdbTown(repository, town)) return {
    title: 'Singapore HDB town evidence | signedprice',
    robots: { index: false, follow: true },
  };
  return indexableMetadata({
    path: `/sg/singapore/hdb/${town}/`,
    title: `${model.town} HDB resale and rent prices | signedprice`,
    description: `Published HDB resale and rental medians for ${model.town}, with block-level samples, reporting periods, and source limits.`,
  });
}
export function generateStaticParams() { return []; }

export default async function HdbTownPage({ params }: Readonly<{ params: Promise<{ town: string }> }>) {
  const repository = hdbSnapshotRepositoryFromEnvironment();
  if (repository === null) notFound();
  const model = buildHdbTownModel(repository, (await params).town);
  if (model === null) notFound();
  return <HdbTownDetail model={model} />;
}
