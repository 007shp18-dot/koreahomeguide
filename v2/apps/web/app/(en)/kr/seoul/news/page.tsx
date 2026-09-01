import type { Metadata } from 'next';

import { NewsIndexPage } from '@/components/news/news-index-page';
import { buildNewsIndexModel } from '@/lib/news/news-route-model.server';
import { indexableMetadata } from '@/lib/public-metadata';

export const metadata: Metadata = indexableMetadata({
  path: '/kr/seoul/news/',
  title: 'Verified Seoul property News | signedprice',
  description: 'Read official Seoul property sources with SignedPrice data evidence and publication boundaries.',
});

export default function NewsIndexRoute() {
  return <NewsIndexPage model={buildNewsIndexModel()} />;
}
