import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { DubaiAreaDetail } from '@/components/dubai/dubai-area-detail';
import { dubaiEvidenceRepositoryFromEnvironment } from '@/lib/dubai/evidence-repository.server';
import {
  buildDubaiAreaModel,
  buildDubaiAreaSeo,
} from '@/lib/dubai/route-model.server';
import { indexableMetadata } from '@/lib/public-metadata';

type Props = Readonly<{ params: Promise<Readonly<{ area: string }>> }>;

export const dynamicParams = false;

export function generateStaticParams(): Array<{ area: string }> {
  return [...(dubaiEvidenceRepositoryFromEnvironment()?.listAreaRouteParams() ?? [])];
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { area } = await params;
  const model = buildDubaiAreaModel(dubaiEvidenceRepositoryFromEnvironment(), area);
  if (model === null) return {
    title: 'Dubai area evidence | signedprice',
    robots: { index: false, follow: true },
  };
  const seo = buildDubaiAreaSeo(model);
  return indexableMetadata({
    path: `/ae/dubai/explore/${model.identity.slug}/`,
    title: seo.title,
    description: seo.description,
  });
}

export default async function DubaiAreaPage({ params }: Props) {
  const { area } = await params;
  const model = buildDubaiAreaModel(dubaiEvidenceRepositoryFromEnvironment(), area);
  if (model === null) notFound();
  return <DubaiAreaDetail model={model} />;
}
