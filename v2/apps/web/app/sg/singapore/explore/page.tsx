import type { Metadata } from 'next';

import { SingaporeExplorer } from '../../../../components/singapore/singapore-explorer';
import { buildSingaporeExploreModel } from '../../../../lib/singapore/route-model.server';
import { singaporeSnapshotRepositoryFromEnvironment } from '../../../../lib/singapore/snapshot-repository.server';

export const metadata: Metadata = {
  title: 'Singapore private-sale Explore | signedprice',
  description: 'Compare verified private residential sales across CCR, RCR, and OCR.',
  robots: { index: false, follow: true },
};

export default async function SingaporeExplorePage() {
  const repository = await singaporeSnapshotRepositoryFromEnvironment();
  const googleMapsBrowserKey = process.env.GOOGLE_MAPS_API_KEY?.trim() || null;
  return <SingaporeExplorer
    model={buildSingaporeExploreModel(repository)}
    googleMapsBrowserKey={googleMapsBrowserKey}
  />;
}
