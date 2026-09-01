import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { GuideDocument } from '../../../../../components/guide/guide-document';
import { getGuideBySlug, GUIDES } from '../../../../../lib/guide/guide-content';
import { indexableMetadata } from '../../../../../lib/public-metadata';

type GuidePageProps = Readonly<{ params: Promise<Readonly<{ slug: string }>> }>;

export const dynamicParams = false;

export function generateStaticParams() {
  return GUIDES.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({ params }: GuidePageProps): Promise<Metadata> {
  const guide = getGuideBySlug((await params).slug);
  if (guide === null) notFound();
  return indexableMetadata({
    path: `/kr/seoul/guide/${guide.slug}/`,
    title: `${guide.title} | signedprice`,
    description: guide.summary,
  });
}

export default async function GuideDocumentPage({ params }: GuidePageProps) {
  const guide = getGuideBySlug((await params).slug);
  if (guide === null) notFound();
  return <GuideDocument guide={guide} />;
}
