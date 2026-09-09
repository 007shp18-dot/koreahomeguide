import { singaporeMetadata } from '@/lib/locale/singapore-copy';
import { singaporeProjectDisplayName } from '@/lib/singapore/project-display-name';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { SingaporeProjectDetail } from '@/components/singapore/singapore-project-detail';
import { getStoredPublicPhotoApproval } from '@/lib/photos/building-photo-store.server';
import { selectPublishedBuildingPhoto } from '@/lib/photos/published-photo-selection';
import { googleMapsBrowserKeyFromEnvironment } from '@/lib/maps/google-maps-browser-key.server';
import { publicEntityProjectionReaderFromEnvironment } from '@/lib/public-data/entity-location-projection.server';
import { indexableMetadata } from '@/lib/public-metadata';
import { buildSingaporeProjectModel } from '@/lib/singapore/route-model.server';
import {
  SINGAPORE_CORRECTION_HREF,
  SINGAPORE_UNAVAILABLE_MESSAGE,
} from '@/lib/singapore/route-types';
import { singaporeSnapshotRepositoryFromEnvironment } from '@/lib/singapore/snapshot-repository.server';

type Props = Readonly<{ params: Promise<Readonly<{ area: string; projectId: string }>> }>;

export const dynamicParams = true;
export const revalidate = 3_600;
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { area, projectId } = await params;
  const code = area.toLowerCase();
  if (!['ccr', 'rcr', 'ocr'].includes(code)) return {
    title: '싱가포르 단지 매매 자료 | signedprice',
    robots: { index: false, follow: true },
  };
  const repository = await singaporeSnapshotRepositoryFromEnvironment();
  const model = repository === null ? null : buildSingaporeProjectModel(repository, code, projectId);
  if (model === null || model.status !== 'ready') return {
    title: '싱가포르 단지 매매 자료 | signedprice',
    robots: { index: false, follow: true },
  };
  return singaporeMetadata(indexableMetadata({
    path: `/ko/sg/singapore/explore/${code}/${projectId}/`,
    title: `싱가포르 ${singaporeProjectDisplayName(model.identity)} 매매가격 | signedprice`,
    description: `${singaporeProjectDisplayName(model.identity)} (${model.identity.street})의 검증된 URA 매매 자료: 중위가격, PSF, 가격 범위, 표본 수 및 공개 한계를 확인하세요.`,
  }));
}

export async function generateStaticParams() {
  return [];
}

export default async function SingaporeProjectPage({ params }: Props) {
  const { area, projectId } = await params;
  if (!['ccr', 'rcr', 'ocr'].includes(area)) notFound();
  const projectionReader = publicEntityProjectionReaderFromEnvironment();
  const entityId = `sg-singapore:project:${projectId}`;
  const [repository, projections] = await Promise.all([
    singaporeSnapshotRepositoryFromEnvironment(),
    projectionReader?.listBuildings([entityId]) ?? Promise.resolve(null),
  ]);
  if (repository === null) return <SingaporeProjectDetail locale="ko" model={{
    status: 'unavailable',
    message: SINGAPORE_UNAVAILABLE_MESSAGE,
    correctionHref: SINGAPORE_CORRECTION_HREF,
  }} />;
  const model = buildSingaporeProjectModel(repository, area, projectId);
  if (model === null) notFound();
  return <SingaporeProjectDetail locale="ko"
    model={model}
    googleMapsBrowserKey={googleMapsBrowserKeyFromEnvironment()}
    media={selectPublishedBuildingPhoto(projections?.get(entityId)?.media ?? [], await getStoredPublicPhotoApproval(`sg-project:${model.identity.marketSegment}:${model.identity.project}`), `singapore:project:${projectId}`)}
    proximity={projections?.get(entityId)?.proximity ?? null}
  />;
}
