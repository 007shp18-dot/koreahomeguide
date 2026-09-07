import { singaporeMetadata } from '@/lib/locale/singapore-copy';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { SingaporeSegmentDetail } from '@/components/singapore/singapore-segment-detail';
import { indexableMetadata } from '@/lib/public-metadata';
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
    title: '싱가포르 시장 권역별 매매 자료 | signedprice',
    robots: { index: false, follow: true },
  };
  const repository = await singaporeSnapshotRepositoryFromEnvironment();
  const model = repository === null ? null : buildSingaporeSegmentModel(repository, code);
  if (model === null || model.status !== 'ready') return {
    title: `싱가포르 ${code.toUpperCase()} 매매 자료 | signedprice`,
    robots: { index: false, follow: true },
  };
  return singaporeMetadata(indexableMetadata({
    path: `/ko/sg/singapore/explore/${code}/`,
    title: `싱가포르 ${code.toUpperCase()} 민간주택 매매가격 | signedprice`,
    description: `싱가포르 ${code.toUpperCase()}의 검증된 URA 민간주택 매매 자료입니다. SGD 중위가격, PSF, 단지 범위 및 공개 한계를 확인하세요.`,
  }));
}

export function generateStaticParams() {
  return [{ area: 'ccr' }, { area: 'rcr' }, { area: 'ocr' }];
}

export default async function SingaporeSegmentPage({ params }: Props) {
  const { area } = await params;
  if (!['ccr', 'rcr', 'ocr'].includes(area)) notFound();
  const repository = await singaporeSnapshotRepositoryFromEnvironment();
  if (repository === null) return <SingaporeSegmentDetail locale="ko" model={{
    status: 'unavailable',
    message: SINGAPORE_UNAVAILABLE_MESSAGE,
    correctionHref: SINGAPORE_CORRECTION_HREF,
  }} />;
  const model = buildSingaporeSegmentModel(repository, area);
  if (model === null) notFound();
  return <SingaporeSegmentDetail locale="ko" model={model} />;
}
