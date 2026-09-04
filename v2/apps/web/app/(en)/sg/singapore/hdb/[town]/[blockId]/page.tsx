import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { HdbBlockDetail } from '@/components/singapore/hdb-block-detail';
import { googleMapsBrowserKeyFromEnvironment } from '@/lib/maps/google-maps-browser-key.server';
import { buildHdbTownModel } from '@/lib/singapore/hdb-route-model.server';
import { hdbSnapshotRepositoryFromEnvironment } from '@/lib/singapore/hdb-snapshot-repository.server';

export const dynamicParams = true;
export const metadata: Metadata = {
  title: 'Singapore HDB block evidence | signedprice',
  description: 'Official HDB resale, rental, and property facts for one observed block.',
  robots: { index: false, follow: true },
};
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
  return <HdbBlockDetail
    block={block}
    town={model.town}
    townHref={`/sg/singapore/hdb/${model.townSlug}/`}
    googleMapsBrowserKey={googleMapsBrowserKeyFromEnvironment()}
  />;
}
