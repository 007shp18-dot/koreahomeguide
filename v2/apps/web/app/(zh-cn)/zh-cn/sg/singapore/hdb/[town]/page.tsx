import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { HdbTownDetail } from '@/components/singapore/hdb-town-detail';
import { indexableMetadata } from '@/lib/locale/chinese-market-metadata';
import { isPublishedHdbTown } from '@/lib/singapore/hdb-index-policy.server';
import { buildHdbTownModel } from '@/lib/singapore/hdb-route-model.server';
import { hdbSnapshotRepositoryFromEnvironment } from '@/lib/singapore/hdb-snapshot-repository.server';

export const dynamicParams = true;
export async function generateMetadata({ params }: Readonly<{ params: Promise<{ town: string }> }>): Promise<Metadata> {
  const { town } = await params;
  const repository = hdbSnapshotRepositoryFromEnvironment();
  const model = repository === null ? null : buildHdbTownModel(repository, town);
  if (repository === null || model === null || !isPublishedHdbTown(repository, town)) return {
    title: '新加坡组屋市镇数据 | signedprice',
    robots: { index: false, follow: true },
  };
  return indexableMetadata({
    path: `/zh-cn/sg/singapore/hdb/${town}/`,
    title: `${model.town} 组屋转售及租赁价格 | signedprice`,
    description: `${model.town} 已公开的组屋转售和租金中位数，包括楼栋样本、统计期间与数据限制。`,
  });
}
export function generateStaticParams() { return []; }

export default async function HdbTownPage({ params }: Readonly<{ params: Promise<{ town: string }> }>) {
  const repository = hdbSnapshotRepositoryFromEnvironment();
  if (repository === null) notFound();
  const model = buildHdbTownModel(repository, (await params).town);
  if (model === null) notFound();
  return <HdbTownDetail locale="zh-CN" model={model} />;
}
