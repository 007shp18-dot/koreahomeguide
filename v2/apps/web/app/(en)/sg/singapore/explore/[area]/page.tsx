import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { SingaporeSegmentDetail } from '@/components/singapore/singapore-segment-detail';
import { buildSingaporeSegmentModel } from '@/lib/singapore/route-model.server';
import {
  SINGAPORE_CORRECTION_HREF,
  SINGAPORE_UNAVAILABLE_MESSAGE,
} from '@/lib/singapore/route-types';
import { singaporeSnapshotRepositoryFromEnvironment } from '@/lib/singapore/snapshot-repository.server';

type Props = Readonly<{ params: Promise<Readonly<{ area: string }>> }>;

export const dynamicParams = false;
export const metadata: Metadata = {
  title: 'Singapore market-segment sale evidence | signedprice',
  description: 'Verified URA private residential sale evidence for a native Singapore market segment.',
  robots: { index: false, follow: true },
};

export function generateStaticParams() {
  return [{ area: 'ccr' }, { area: 'rcr' }, { area: 'ocr' }];
}

export default async function SingaporeSegmentPage({ params }: Props) {
  const { area } = await params;
  if (!['ccr', 'rcr', 'ocr'].includes(area)) notFound();
  const repository = await singaporeSnapshotRepositoryFromEnvironment();
  if (repository === null) return <SingaporeSegmentDetail model={{
    status: 'unavailable',
    message: SINGAPORE_UNAVAILABLE_MESSAGE,
    correctionHref: SINGAPORE_CORRECTION_HREF,
  }} />;
  const model = buildSingaporeSegmentModel(repository, area);
  if (model === null) notFound();
  return <SingaporeSegmentDetail model={model} />;
}
