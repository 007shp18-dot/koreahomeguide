import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { SingaporeProjectDetail } from '@/components/singapore/singapore-project-detail';
import { buildSingaporeProjectModel } from '@/lib/singapore/route-model.server';
import {
  SINGAPORE_CORRECTION_HREF,
  SINGAPORE_UNAVAILABLE_MESSAGE,
} from '@/lib/singapore/route-types';
import { singaporeSnapshotRepositoryFromEnvironment } from '@/lib/singapore/snapshot-repository.server';

type Props = Readonly<{ params: Promise<Readonly<{ area: string; projectId: string }>> }>;

export const dynamicParams = true;
export const metadata: Metadata = {
  title: 'Singapore project sale evidence | signedprice',
  description: 'Verified URA private residential sale evidence for one Singapore project.',
  robots: { index: false, follow: true },
};

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
