import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { SingaporeSegmentDetail } from '@/components/singapore/singapore-segment-detail';
import { indexableMetadata } from '@/lib/locale/chinese-market-metadata';
import { buildSingaporeSegmentModel } from '@/lib/singapore/route-model.server';
import {
  SINGAPORE_CORRECTION_HREF,
  SINGAPORE_UNAVAILABLE_MESSAGE,
} from '@/lib/singapore/route-types';
import { singaporeSnapshotRepositoryFromEnvironment } from '@/lib/singapore/snapshot-repository.server';

type Props = Readonly<{ params: Promise<Readonly<{ area: string }>> }>;

export const dynamicParams = false;
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { area } = await params;
  const code = area.toLowerCase();
  if (!['ccr', 'rcr', 'ocr'].includes(code)) return {
    title: '新加坡分区域住宅成交数据 | signedprice',
    robots: { index: false, follow: true },
  };
  const repository = await singaporeSnapshotRepositoryFromEnvironment();
  const model = repository === null ? null : buildSingaporeSegmentModel(repository, code);
  if (model === null || model.status !== 'ready') return {
    title: `${code.toUpperCase()} 新加坡成交数据 | signedprice`,
    robots: { index: false, follow: true },
  };
  return indexableMetadata({
    path: `/zh-cn/sg/singapore/explore/${code}/`,
    title: `${code.toUpperCase()} 新加坡私人住宅成交价格 | signedprice`,
    description: `新加坡 ${code.toUpperCase()} 经核验的 URA 私人住宅成交记录，包括新加坡元中位价、每平方英尺价格、项目覆盖范围与公开限制。`,
  });
}

export function generateStaticParams() {
  return [{ area: 'ccr' }, { area: 'rcr' }, { area: 'ocr' }];
}

export default async function SingaporeSegmentPage({ params }: Props) {
  const { area } = await params;
  if (!['ccr', 'rcr', 'ocr'].includes(area)) notFound();
  const repository = await singaporeSnapshotRepositoryFromEnvironment();
  if (repository === null) return <SingaporeSegmentDetail locale="zh-CN" model={{
    status: 'unavailable',
    message: SINGAPORE_UNAVAILABLE_MESSAGE,
    correctionHref: SINGAPORE_CORRECTION_HREF,
  }} />;
  const model = buildSingaporeSegmentModel(repository, area);
  if (model === null) notFound();
  return <SingaporeSegmentDetail locale="zh-CN" model={model} />;
}

export const revalidate = 3_600;
