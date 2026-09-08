import { singaporeMetadata } from '@/lib/locale/singapore-copy';
import type { Metadata } from 'next';

import { SingaporeCheckWorkspace } from '@/components/singapore/singapore-check-workspace';
import { singaporeCheckEvidenceRepositoriesFromEnvironment } from '@/lib/singapore/check-evidence-repository.server';
import { buildSingaporeCheckRouteModel, type SingaporeCheckQuery } from '@/lib/singapore/check-route-model.server';

export const metadata: Metadata = singaporeMetadata({
  title: 'Compare an asking price in Singapore | signedprice',
  description: 'Compare private-home sale prices, HDB resale prices or monthly rents with recent Singapore transactions.',
  alternates: { canonical: 'https://www.signedprice.com/ko/sg/singapore/check/' },
  robots: { index: false, follow: false },
});

export default async function SingaporeCheckPage({ searchParams = Promise.resolve({}) }: Readonly<{
  searchParams?: Promise<SingaporeCheckQuery>;
}> = {}) {
  const repositories = await singaporeCheckEvidenceRepositoriesFromEnvironment();
  return <SingaporeCheckWorkspace locale="ko" model={buildSingaporeCheckRouteModel(repositories, await searchParams)} />;
}
