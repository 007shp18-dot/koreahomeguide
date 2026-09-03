import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { GuideDocument } from '@/components/guide/guide-document';
import { SiteFooter } from '@/components/site-footer';
import { SiteHeader } from '@/components/site-header';
import { getGuideBySlug, GUIDES } from '@/lib/guide/guide-content';
import { KOREA_GUIDE_FOOTER, KOREA_GUIDE_HEADER } from '@/lib/guide/guide-shell';
import { indexableMetadata } from '@/lib/public-metadata';

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
  return (
    <div id="top">
      <SiteHeader copy={KOREA_GUIDE_HEADER} />
      <GuideDocument guide={guide} />
      <SiteFooter copy={KOREA_GUIDE_FOOTER} />
    </div>
  );
}
