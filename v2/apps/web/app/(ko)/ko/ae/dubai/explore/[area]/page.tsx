import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { DubaiAreaDetail } from '@/components/dubai/dubai-area-detail';
import { dubaiEvidenceRepositoryFromEnvironment } from '@/lib/dubai/evidence-repository.server';
import {
  buildDubaiAreaModel,
} from '@/lib/dubai/route-model.server';
import { indexableMetadata } from '@/lib/public-metadata';

type Props = Readonly<{ params: Promise<Readonly<{ area: string }>> }>;

export const dynamicParams = false;

export function generateStaticParams(): Array<{ area: string }> {
  return [...(dubaiEvidenceRepositoryFromEnvironment()?.listAreaRouteParams() ?? [])];
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { area } = await params;
  const model = buildDubaiAreaModel(dubaiEvidenceRepositoryFromEnvironment(), area);
  if (model === null) return {
    title: 'Dubai area evidence | signedprice',
    robots: { index: false, follow: true },
  };
  return indexableMetadata({
    locale: 'ko_KR', imagePath: '/og/ko/', path: `/ko/ae/dubai/explore/${model.identity.slug}/`,
    title: `${model.identity.name} 실거래가 | signedprice`,
    description: `${model.identity.name}의 주택 유형별 실거래가와 임대료를 비교하고 거래 건수와 집계 기간을 확인하세요.`,
  });
}

export default async function DubaiAreaPage({ params }: Props) {
  const { area } = await params;
  const model = buildDubaiAreaModel(dubaiEvidenceRepositoryFromEnvironment(), area);
  if (model === null) notFound();
  return <DubaiAreaDetail locale="ko" model={model} />;
}
