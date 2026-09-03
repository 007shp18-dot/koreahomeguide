import type { Metadata } from 'next';

import { SingaporeEntry } from '@/components/singapore/singapore-entry';
import { indexableMetadata } from '@/lib/public-metadata';
import { buildSingaporeEntryModel } from '@/lib/singapore/route-model.server';
import { singaporeSnapshotRepositoryFromEnvironment } from '@/lib/singapore/snapshot-repository.server';

export const metadata: Metadata = indexableMetadata({
  path: '/sg/',
  title: 'Singapore private residential sale evidence | signedprice',
  description: 'Verified URA private residential sale evidence with publication limits shown.',
});

export default async function SingaporeEntryPage() {
  const repository = await singaporeSnapshotRepositoryFromEnvironment();
  return <SingaporeEntry model={buildSingaporeEntryModel(repository)} />;
}
