import { publicContentDatabase } from '@/lib/db/postgres.server';
import { getApprovedHdbBuildingFacts } from '@/lib/data-operations/hdb-buildings.server';
import { singaporeMetadata } from '@/lib/locale/singapore-copy';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { HdbBlockDetail } from '@/components/singapore/hdb-block-detail';
import { getStoredPublicPhotoApproval } from '@/lib/photos/building-photo-store.server';
import { selectPublishedBuildingPhoto } from '@/lib/photos/published-photo-selection';
import { googleMapsBrowserKeyFromEnvironment } from '@/lib/maps/google-maps-browser-key.server';
import { indexableMetadata } from '@/lib/public-metadata';
import { isPublishedHdbBlock } from '@/lib/singapore/hdb-index-policy.server';
import { buildHdbTownModel } from '@/lib/singapore/hdb-route-model.server';
import { hdbSnapshotRepositoryFromEnvironment } from '@/lib/singapore/hdb-snapshot-repository.server';
import { publicEntityProjectionReaderFromEnvironment } from '@/lib/public-data/entity-location-projection.server';

export const dynamicParams = true;
export const revalidate = 3_600;
export async function generateMetadata({ params }: Readonly<{ params: Promise<{ town: string; blockId: string }> }>): Promise<Metadata> {
  const { town, blockId } = await params;
  const repository = hdbSnapshotRepositoryFromEnvironment();
  const model = repository === null ? null : buildHdbTownModel(repository, town);
  const block = model?.blocks.find((item) => item.blockId === blockId);
  if (repository === null || model === null || block === undefined || !isPublishedHdbBlock(repository, town, blockId)) return {
    title: '싱가포르 HDB 블록 가격 자료 | signedprice',
    robots: { index: false, follow: true },
  };
  return singaporeMetadata(indexableMetadata({
    path: `/ko/sg/singapore/hdb/${town}/${blockId}/`,
    title: `싱가포르 ${block.address} HDB 매매·임대 가격 | signedprice`,
    description: `${block.address}의 공개 HDB 매매·임대 중위가격, 표본 수, 집계 기간과 주택 정보를 확인하세요.`,
  }));
}
export function generateStaticParams() { return []; }

export default async function HdbBlockPage({ params }: Readonly<{
  params: Promise<{ town: string; blockId: string }>;
}>) {
  const { town, blockId } = await params;
  const repository = hdbSnapshotRepositoryFromEnvironment();
  if (repository === null) notFound();
  const model = buildHdbTownModel(repository, town);
  const block = model?.blocks.find((item) => item.blockId === blockId);
  if (model === null || model === undefined || block === undefined) notFound();
  const entityId = `sg-singapore:block:${blockId}`;
  const factsSql=publicContentDatabase();
  const [approvedFacts,projections]=await Promise.all([
    factsSql?getApprovedHdbBuildingFacts({query:async(s,p)=>factsSql.query(s,p)},entityId).catch(()=>null):Promise.resolve(null),
    publicEntityProjectionReaderFromEnvironment()?.listBuildings([entityId]),
  ]);
  return <HdbBlockDetail locale="ko"
    approvedFacts={approvedFacts}
    block={block}
    town={model.town}
    townHref={`/ko/sg/singapore/hdb/${model.townSlug}/`}
    googleMapsBrowserKey={googleMapsBrowserKeyFromEnvironment()}
    media={selectPublishedBuildingPhoto(projections?.get(entityId)?.media ?? [], await getStoredPublicPhotoApproval(`sg-hdb:${model.town}:${block.address}`), `singapore:block:${blockId}`)}
    proximity={projections?.get(entityId)?.proximity ?? null}
  />;
}
