import type { Metadata } from 'next';

import { GlobalProductHub } from '@/components/global-product-hub';
import { buildNewsIndexModel } from '@/lib/news/news-route-model.server';
import { indexableMetadata } from '@/lib/public-metadata';

export const metadata: Metadata = indexableMetadata({
  path: '/insights/',
  title: 'Property market insights | signedprice',
  description: 'Read approved property market briefs with their evidence and source boundary attached.',
});

export default function InsightsPage() {
  return <GlobalProductHub kind="insights" news={buildNewsIndexModel()} />;
}
