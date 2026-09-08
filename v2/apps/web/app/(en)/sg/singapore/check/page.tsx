import type { Metadata } from 'next';

import { SingaporeCheckWorkspace } from '@/components/singapore/singapore-check-workspace';
import { indexableMetadata } from '@/lib/public-metadata';
import { singaporeCheckEvidenceRepositoriesFromEnvironment } from '@/lib/singapore/check-evidence-repository.server';
import { isSingaporeCheckLandingIndexable } from '@/lib/singapore/check-index-policy.server';
import { buildSingaporeCheckRouteModel, type SingaporeCheckQuery } from '@/lib/singapore/check-route-model.server';

const privateMetadata: Metadata = {
  title: 'Compare an asking price in Singapore | signedprice',
  description: 'Compare private-home sale prices, HDB resale prices or monthly rents with recent Singapore transactions.',
  alternates: { canonical: 'https://www.signedprice.com/sg/singapore/check/' },
  robots: { index: false, follow: false },
};

type Props = Readonly<{ searchParams?: Promise<SingaporeCheckQuery> }>;

export async function generateMetadata({ searchParams = Promise.resolve({}) }: Props = {}): Promise<Metadata> {
  const query = await searchParams;
  if (Object.keys(query).length > 0) return privateMetadata;
  let repositories = null;
  try {
    repositories = await singaporeCheckEvidenceRepositoriesFromEnvironment();
  } catch {
    return privateMetadata;
  }
  return isSingaporeCheckLandingIndexable(repositories, query)
    ? indexableMetadata({
        path: '/sg/singapore/check/',
        title: 'Compare an asking price in Singapore | signedprice',
        description: 'Compare private-home sale prices, HDB resale prices or monthly rents with recent Singapore transactions.',
      })
    : privateMetadata;
}

export default async function SingaporeCheckPage({ searchParams = Promise.resolve({}) }: Props = {}) {
  const repositories = await singaporeCheckEvidenceRepositoriesFromEnvironment();
  return <SingaporeCheckWorkspace model={buildSingaporeCheckRouteModel(repositories, await searchParams)} />;
}
