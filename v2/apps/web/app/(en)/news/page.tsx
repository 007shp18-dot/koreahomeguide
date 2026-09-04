import type { Metadata } from 'next';

import { GlobalProductHub } from '@/components/global-product-hub';
import { buildNewsWorkspaceModel } from '@/lib/news/naver-news.server';
import { buildNewsIndexModel } from '@/lib/news/news-route-model.server';
import { indexableMetadata } from '@/lib/public-metadata';

export const metadata: Metadata = indexableMetadata({
  path: '/news/',
  title: 'Property market news | signedprice',
  description: 'Read approved property market news with its evidence and source boundary attached.',
});

export default async function NewsPage() {
  const news = buildNewsIndexModel();
  const newsWorkspace = await buildNewsWorkspaceModel(news);
  return <GlobalProductHub kind="news" newsWorkspace={newsWorkspace} />;
}
