import type { Metadata } from 'next';

import { GlobalProductHub } from '@/components/global-product-hub';
import { buildApprovedNewsWorkspaceModel } from '@/lib/news/naver-news.server';
import { buildNewsIndexModel } from '@/lib/news/news-route-model.server';
import { indexableMetadata } from '@/lib/public-metadata';

export const metadata: Metadata = indexableMetadata({
  path: '/news/',
  title: 'Property market news | signedprice',
  description: 'Read approved property market news with its evidence and source boundary attached.',
});

export default function NewsPage() {
  const news = buildNewsIndexModel();
  return <GlobalProductHub kind="news" newsWorkspace={buildApprovedNewsWorkspaceModel(news)} />;
}
