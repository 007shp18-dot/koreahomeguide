import type { Metadata } from 'next';

import { GlobalProductHub } from '@/components/global-product-hub';
import { indexableMetadata } from '@/lib/public-metadata';

export const metadata: Metadata = indexableMetadata({
  path: '/markets/',
  title: 'Global property markets | signedprice',
  description: 'Compare property evidence coverage across Seoul, Singapore and Dubai.',
});

export default function MarketsPage() {
  return <GlobalProductHub kind="markets" />;
}
