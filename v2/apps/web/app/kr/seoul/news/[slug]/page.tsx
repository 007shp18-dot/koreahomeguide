import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { NewsDetailPage } from '../../../../../components/news/news-detail-page';
import {
  buildNewsDetailModel,
  buildNewsIndexModel,
} from '../../../../../lib/news/news-route-model.server';
import { indexableMetadata } from '../../../../../lib/public-metadata';

type NewsPageProps = Readonly<{ params: Promise<Readonly<{ slug: string }>> }>;

export const dynamicParams = false;

export function generateStaticParams() {
  return buildNewsIndexModel().records.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({ params }: NewsPageProps): Promise<Metadata> {
  const model = buildNewsDetailModel((await params).slug);
  if (model === null) notFound();
  return indexableMetadata({
    path: `/kr/seoul/news/${model.record.slug}/`,
    title: `${model.record.title} | signedprice`,
    description: model.record.summary,
  });
}

export default async function NewsDetailRoute({ params }: NewsPageProps) {
  const model = buildNewsDetailModel((await params).slug);
  if (model === null) notFound();
  return <NewsDetailPage model={model} />;
}
