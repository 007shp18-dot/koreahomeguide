import { singaporeMetadata } from '@/lib/locale/singapore-copy';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { HdbTownDetail } from '@/components/singapore/hdb-town-detail';
import { buildHdbTownModel } from '@/lib/singapore/hdb-route-model.server';
import { hdbSnapshotRepositoryFromEnvironment } from '@/lib/singapore/hdb-snapshot-repository.server';

export const dynamicParams = true;
export async function generateMetadata({ params }: Readonly<{ params: Promise<{ town: string }> }>): Promise<Metadata> {
  const { town } = await params;
  return singaporeMetadata({
  title: 'Singapore HDB town evidence | signedprice',
  description: 'Separate HDB resale, rental, and property evidence by town and block.',
  robots: { index: false, follow: true },
  alternates: { canonical: `https://www.signedprice.com/ko/sg/singapore/hdb/${town}/` },
});
}
export function generateStaticParams() { return []; }

export default async function HdbTownPage({ params }: Readonly<{ params: Promise<{ town: string }> }>) {
  const repository = hdbSnapshotRepositoryFromEnvironment();
  if (repository === null) notFound();
  const model = buildHdbTownModel(repository, (await params).town);
  if (model === null) notFound();
  return <HdbTownDetail locale="ko" model={model} />;
}
