import { singaporeMetadata } from '@/lib/locale/singapore-copy';
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
    title: '싱가포르 HDB 타운 가격 자료 | signedprice',
    robots: { index: false, follow: true },
  };
  return singaporeMetadata(indexableMetadata({
    path: `/ko/sg/singapore/hdb/${town}/`,
    title: `싱가포르 ${model.town} HDB 매매·임대 가격 | signedprice`,
    description: `${model.town}의 공개 HDB 매매·임대 중위가격과 블록별 표본 수, 집계 기간, 자료 공개 기준을 확인하세요.`,
  }));
}
export function generateStaticParams() { return []; }

export default async function HdbTownPage({ params }: Readonly<{ params: Promise<{ town: string }> }>) {
  const repository = hdbSnapshotRepositoryFromEnvironment();
  if (repository === null) notFound();
  const model = buildHdbTownModel(repository, (await params).town);
  if (model === null) notFound();
  return <HdbTownDetail locale="ko" model={model} />;
}
