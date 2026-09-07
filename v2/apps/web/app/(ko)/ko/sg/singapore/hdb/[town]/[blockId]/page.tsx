import { singaporeMetadata } from '@/lib/locale/singapore-copy';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { HdbBlockDetail } from '@/components/singapore/hdb-block-detail';
import { googleMapsBrowserKeyFromEnvironment } from '@/lib/maps/google-maps-browser-key.server';
import { buildHdbTownModel } from '@/lib/singapore/hdb-route-model.server';
import { hdbSnapshotRepositoryFromEnvironment } from '@/lib/singapore/hdb-snapshot-repository.server';
import { publicEntityProjectionReaderFromEnvironment } from '@/lib/public-data/entity-location-projection.server';

export const dynamicParams = true;
export async function generateMetadata({ params }: Readonly<{ params: Promise<{ town: string; blockId: string }> }>): Promise<Metadata> {
  const { town, blockId } = await params;
  return singaporeMetadata({
  title: 'Singapore HDB block evidence | signedprice',
  description: 'Official HDB resale, rental, and property facts for one observed block.',
  robots: { index: false, follow: true },
  alternates: { canonical: `https://www.signedprice.com/ko/sg/singapore/hdb/${town}/${blockId}/` },
});
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
  const projections = await publicEntityProjectionReaderFromEnvironment()?.listBuildings([entityId]);
  return <HdbBlockDetail locale="ko"
    block={block}
    town={model.town}
    townHref={`/ko/sg/singapore/hdb/${model.townSlug}/`}
    googleMapsBrowserKey={googleMapsBrowserKeyFromEnvironment()}
    proximity={projections?.get(entityId)?.proximity ?? null}
  />;
}
