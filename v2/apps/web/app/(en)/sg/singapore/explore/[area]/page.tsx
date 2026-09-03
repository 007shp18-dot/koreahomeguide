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
    title: 'Singapore market-segment sale evidence | signedprice',
    robots: { index: false, follow: true },
  };
  const repository = await singaporeSnapshotRepositoryFromEnvironment();
  const model = repository === null ? null : buildSingaporeSegmentModel(repository, code);
  if (model === null || model.status !== 'ready') return {
    title: `${code.toUpperCase()} Singapore sale evidence | signedprice`,
    robots: { index: false, follow: true },
  };
  return indexableMetadata({
    path: `/sg/singapore/explore/${code}/`,
    title: `${code.toUpperCase()} Singapore private-home sale prices | signedprice`,
    description: `Verified URA private residential sales for Singapore ${code.toUpperCase()}, including median SGD price, PSF, project coverage, and publication limits.`,
  });
}

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
