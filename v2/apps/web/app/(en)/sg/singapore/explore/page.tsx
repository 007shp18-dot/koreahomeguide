import type { Metadata } from 'next';

import { SingaporeExplorer } from '@/components/singapore/singapore-explorer';
import { buildSingaporeExploreModel } from '@/lib/singapore/route-model.server';
import { buildHdbExploreModel } from '@/lib/singapore/hdb-route-model.server';
import { hdbSnapshotRepositoryFromEnvironment } from '@/lib/singapore/hdb-snapshot-repository.server';
import { singaporeSnapshotRepositoryFromEnvironment } from '@/lib/singapore/snapshot-repository.server';

export const metadata: Metadata = {
  title: 'Singapore private homes and HDB Explore | signedprice',
  description: 'Compare verified URA private sales and separate HDB resale, rental, and property evidence.',
  robots: { index: false, follow: true },
};

export default async function SingaporeExplorePage() {
  const repository = await singaporeSnapshotRepositoryFromEnvironment();
  const hdbRepository = hdbSnapshotRepositoryFromEnvironment();
  const googleMapsBrowserKey = process.env.GOOGLE_MAPS_API_KEY?.trim() || null;
  return <SingaporeExplorer
    model={buildSingaporeExploreModel(repository)}
    hdbModel={buildHdbExploreModel(hdbRepository)}
    googleMapsBrowserKey={googleMapsBrowserKey}
  />;
}
