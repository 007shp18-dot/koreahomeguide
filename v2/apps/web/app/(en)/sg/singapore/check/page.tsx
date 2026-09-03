import type { Metadata } from 'next';

import { SingaporeCheckWorkspace } from '@/components/singapore/singapore-check-workspace';
import { singaporeCheckEvidenceRepositoriesFromEnvironment } from '@/lib/singapore/check-evidence-repository.server';
import { buildSingaporeCheckRouteModel, type SingaporeCheckQuery } from '@/lib/singapore/check-route-model.server';

export const metadata: Metadata = {
  title: 'Singapore Check | signedprice',
  description: 'Position a private sale, HDB resale, or HDB rent offer against verified recent Singapore evidence.',
  alternates: { canonical: 'https://www.signedprice.com/sg/singapore/check/' },
  robots: { index: false, follow: false },
};

export default async function SingaporeCheckPage({ searchParams = Promise.resolve({}) }: Readonly<{
  searchParams?: Promise<SingaporeCheckQuery>;
}> = {}) {
  const repositories = await singaporeCheckEvidenceRepositoriesFromEnvironment();
  return <SingaporeCheckWorkspace model={buildSingaporeCheckRouteModel(repositories, await searchParams)} />;
}
