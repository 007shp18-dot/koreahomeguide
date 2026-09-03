import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { SingaporeProjectDetail } from '@/components/singapore/singapore-project-detail';
import { indexableMetadata } from '@/lib/public-metadata';
import { buildSingaporeProjectModel } from '@/lib/singapore/route-model.server';
import {
  SINGAPORE_CORRECTION_HREF,
  SINGAPORE_UNAVAILABLE_MESSAGE,
} from '@/lib/singapore/route-types';
import { singaporeSnapshotRepositoryFromEnvironment } from '@/lib/singapore/snapshot-repository.server';

type Props = Readonly<{ params: Promise<Readonly<{ area: string; projectId: string }>> }>;

export const dynamicParams = true;
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { area, projectId } = await params;
  const code = area.toLowerCase();
  if (!['ccr', 'rcr', 'ocr'].includes(code)) return {
    title: 'Singapore project sale evidence | signedprice',
    robots: { index: false, follow: true },
  };
  const repository = await singaporeSnapshotRepositoryFromEnvironment();
  const model = repository === null ? null : buildSingaporeProjectModel(repository, code, projectId);
  if (model === null || model.status !== 'ready') return {
    title: 'Singapore project sale evidence | signedprice',
    robots: { index: false, follow: true },
  };
  return indexableMetadata({
    path: `/sg/singapore/explore/${code}/${projectId}/`,
    title: `${model.identity.project} sale prices, Singapore | signedprice`,
    description: `Verified URA sale transactions for ${model.identity.project}, ${model.identity.street}: median price, PSF, range, sample, and publication limits.`,
  });
}

export async function generateStaticParams() {
  return [];
}

export default async function SingaporeProjectPage({ params }: Props) {
  const { area, projectId } = await params;
  if (!['ccr', 'rcr', 'ocr'].includes(area)) notFound();
  const repository = await singaporeSnapshotRepositoryFromEnvironment();
  if (repository === null) return <SingaporeProjectDetail model={{
    status: 'unavailable',
    message: SINGAPORE_UNAVAILABLE_MESSAGE,
    correctionHref: SINGAPORE_CORRECTION_HREF,
  }} />;
  const model = buildSingaporeProjectModel(repository, area, projectId);
  if (model === null) notFound();
  return <SingaporeProjectDetail
    model={model}
    googleMapsBrowserKey={process.env.GOOGLE_MAPS_API_KEY?.trim() || null}
  />;
}
