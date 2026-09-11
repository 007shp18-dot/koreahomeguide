import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { DubaiAreaDetail } from '@/components/dubai/dubai-area-detail';
import { dubaiEvidenceRepositoryFromEnvironment } from '@/lib/dubai/evidence-repository.server';
import {
  buildDubaiAreaModel,
} from '@/lib/dubai/route-model.server';
import { indexableMetadata } from '@/lib/locale/chinese-market-metadata';

type Props = Readonly<{ params: Promise<Readonly<{ area: string }>> }>;

export const dynamicParams = false;

export function generateStaticParams(): Array<{ area: string }> {
  return [...(dubaiEvidenceRepositoryFromEnvironment()?.listAreaRouteParams() ?? [])];
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { area } = await params;
  const model = buildDubaiAreaModel(dubaiEvidenceRepositoryFromEnvironment(), area);
  if (model === null) return {
    title: '迪拜区域成交数据 | signedprice',
    robots: { index: false, follow: true },
  };
  const housing = model.segments.length === 1 ? (model.segments[0]!.housing === 'villa' ? '别墅' : '公寓') : '住宅';
  const hasReady = model.segments.some(({ sales }) => sales.ready !== null);
  const hasOffPlan = model.segments.some(({ sales }) => sales.offPlan !== null);
  const hasYield = model.segments.some(({ readyGrossYieldPct }) => readyGrossYieldPct !== null);
  const stage = hasReady && hasOffPlan ? '现房和期房' : hasReady ? '现房' : '期房';
  return indexableMetadata({
    path: `/zh-cn/ae/dubai/explore/${model.identity.slug}/`,
    title: `${model.identity.name} ${hasReady ? '' : '期房'}${housing}成交价格${hasReady && hasYield ? '与租赁数据' : ''} ${model.context.asOfDate.slice(0, 4)} | signedprice`,
    description: `${model.identity.name} ${stage}${housing}价格数据，包括每平方米迪拉姆价格、登记样本数量，数据截至 ${model.context.asOfDate}。`,
  });
}

export default async function DubaiAreaPage({ params }: Props) {
  const { area } = await params;
  const model = buildDubaiAreaModel(dubaiEvidenceRepositoryFromEnvironment(), area);
  if (model === null) notFound();
  return <DubaiAreaDetail locale="zh-CN" model={model} />;
}
